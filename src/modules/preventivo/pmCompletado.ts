import { aFechaIso, parseFechaIso } from "../../lib/fechas";
import { ocurrenciasEnAnio } from "../cronograma/cronogramaCalculo";
import type { HojaVida } from "../hojas/types";
import { pmCuentaParaCronograma } from "./aprobacionPm";
import type { RegistroPreventivo } from "./types";

/** Preferencia corta: PM hecho unos días antes/después de la cita. */
export const VENTANA_DIAS_PM = 21;

export interface IndicesPmCompletado {
  exactas: Set<string>;
  porMes: Set<string>;
  /** Fechas ISO de ejecución por máquina (años vecinos para bordes de año). */
  fechasPorMaquina: Map<string, string[]>;
}

/** Asocia registros PM antiguos a la hoja de vida por código o nombre. */
export function vincularPreventivoConHojas(
  registros: RegistroPreventivo[],
  maquinas: HojaVida[],
): RegistroPreventivo[] {
  const porCodigo = new Map<string, string>();
  const porNombre = new Map<string, string>();
  for (const maquina of maquinas) {
    const codigo = (maquina.codigo ?? "").trim().toLowerCase();
    const nombre = maquina.nombre.trim().toLowerCase();
    if (codigo) porCodigo.set(codigo, maquina.id);
    if (nombre) porNombre.set(nombre, maquina.id);
  }

  return registros.map((registro) => {
    if (registro.hoja_id) return registro;
    const codigo = (registro.datos.codigo ?? "").trim().toLowerCase();
    const equipo = (registro.datos.equipo ?? "").trim().toLowerCase();
    const hoja_id =
      (codigo && porCodigo.get(codigo)) ||
      (equipo && porNombre.get(equipo)) ||
      null;
    return hoja_id ? { ...registro, hoja_id } : registro;
  });
}

function diasEntreIso(desde: string, hasta: string): number | null {
  const a = parseFechaIso(desde);
  const b = parseFechaIso(hasta);
  if (!a || !b) return null;
  const msA = Date.UTC(a.anio, a.mes - 1, a.dia);
  const msB = Date.UTC(b.anio, b.mes - 1, b.dia);
  return Math.round((msB - msA) / 86_400_000);
}

function registrarClave(
  exactas: Set<string>,
  porMes: Set<string>,
  hojaId: string,
  fechaIso: string,
): void {
  const fecha = fechaIso.slice(0, 10);
  if (fecha.length < 10) return;
  exactas.add(`${hojaId}|${fecha}`);
  porMes.add(`${hojaId}|${fecha.slice(0, 7)}`);
}

function candidatasProgramadas(maquina: HojaVida, anioCentro: number): string[] {
  const candidatas: string[] = [];
  for (const anio of [anioCentro - 1, anioCentro, anioCentro + 1]) {
    for (const o of ocurrenciasEnAnio(maquina, anio)) {
      candidatas.push(aFechaIso(o.anio, o.mes, o.dia));
    }
  }
  return candidatas;
}

/**
 * Busca la cita del cronograma (primer_pm + frecuencia) a enlazar con un PM ejecutado.
 * No modifica primer_pm. Siempre intenta devolver la cita más cercana del mismo año.
 */
export function resolverFechaProgramadaCercana(
  maquina: HojaVida,
  fechaEjecucion: string,
  ventanaDias = VENTANA_DIAS_PM,
): string | null {
  const partes = parseFechaIso(fechaEjecucion);
  if (!partes) return null;

  const candidatas = candidatasProgramadas(maquina, partes.anio);
  if (candidatas.length === 0) return null;

  const mesEjecucion = fechaEjecucion.slice(0, 7);
  const anioEjecucion = String(partes.anio);

  type Candidato = { fecha: string; abs: number; dias: number; mismoMes: boolean; mismoAnio: boolean };
  const evaluadas: Candidato[] = [];

  for (const programada of candidatas) {
    const dias = diasEntreIso(programada, fechaEjecucion);
    if (dias == null) continue;
    evaluadas.push({
      fecha: programada,
      abs: Math.abs(dias),
      dias,
      mismoMes: programada.slice(0, 7) === mesEjecucion,
      mismoAnio: programada.startsWith(anioEjecucion),
    });
  }

  if (evaluadas.length === 0) return null;

  // 1) Preferir mismo mes o dentro de la ventana corta
  const cercanas = evaluadas.filter((c) => c.mismoMes || c.abs <= ventanaDias);
  const pool = cercanas.length > 0 ? cercanas : evaluadas.filter((c) => c.mismoAnio);
  const final = pool.length > 0 ? pool : evaluadas;

  // Preferir cita ya vencida/ejecutada (dias >= 0) y luego la más cercana
  final.sort((a, b) => {
    const aPasada = a.dias >= 0 ? 0 : 1;
    const bPasada = b.dias >= 0 ? 0 : 1;
    if (aPasada !== bPasada) return aPasada - bPasada;
    if (a.abs !== b.abs) return a.abs - b.abs;
    return a.fecha.localeCompare(b.fecha);
  });

  return final[0]?.fecha ?? null;
}

/** Índices de PM registrados. Con `maquinas`, enlaza citas aunque el registro no traiga fechaProgramada. */
export function indicesPmCompletado(
  preventivo: RegistroPreventivo[],
  anio: number,
  maquinas: HojaVida[] = [],
): IndicesPmCompletado {
  const exactas = new Set<string>();
  const porMes = new Set<string>();
  const fechasPorMaquina = new Map<string, string[]>();
  const prefijoAnio = String(anio);
  const porId = new Map(maquinas.map((m) => [m.id, m]));

  for (const registro of preventivo) {
    if (!registro.hoja_id || !registro.fecha) continue;
    // Pendiente o rechazado: el cronograma no lo cuenta como cumplido.
    if (!pmCuentaParaCronograma(registro)) continue;
    const fechaEjec = registro.fecha.slice(0, 10);
    const anioReg = Number(fechaEjec.slice(0, 4));
    if (Number.isNaN(anioReg) || anioReg < anio - 1 || anioReg > anio + 1) continue;

    const lista = fechasPorMaquina.get(registro.hoja_id) ?? [];
    lista.push(fechaEjec);
    fechasPorMaquina.set(registro.hoja_id, lista);

    if (fechaEjec.startsWith(prefijoAnio)) {
      registrarClave(exactas, porMes, registro.hoja_id, fechaEjec);
    }

    let programada = (registro.datos.fechaProgramada ?? "").slice(0, 10);
    if (programada.length < 10) {
      const maquina = porId.get(registro.hoja_id);
      if (maquina) {
        programada = resolverFechaProgramadaCercana(maquina, fechaEjec)?.slice(0, 10) ?? "";
      }
    }

    if (programada.length >= 10 && programada.startsWith(prefijoAnio)) {
      registrarClave(exactas, porMes, registro.hoja_id, programada);
    }
  }

  return { exactas, porMes, fechasPorMaquina };
}

/** True si ya hay registro PM para esa máquina en la fecha, mismo mes, cita enlazada o ventana. */
export function pmCompletado(
  maquinaId: string,
  fechaIso: string,
  indices: IndicesPmCompletado,
): boolean {
  if (
    indices.exactas.has(`${maquinaId}|${fechaIso}`) ||
    indices.porMes.has(`${maquinaId}|${fechaIso.slice(0, 7)}`)
  ) {
    return true;
  }

  const fechas = indices.fechasPorMaquina.get(maquinaId) ?? [];
  for (const fecha of fechas) {
    const dias = diasEntreIso(fechaIso, fecha);
    if (dias != null && Math.abs(dias) <= VENTANA_DIAS_PM) return true;
  }

  return false;
}
