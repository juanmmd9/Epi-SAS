import { normalizarArea } from "../../lib/areas";
import { actualizarPreventivo } from "./preventivoService";
import type { PreventivoDatos, RegistroPreventivo } from "./types";

/** Año-mes ISO (YYYY-MM) a partir de una fecha YYYY-MM-DD. */
export function mesAnioDeFecha(fecha: string): string {
  return fecha.length >= 7 ? fecha.slice(0, 7) : "";
}

export function claveGrupoAreaMes(area: string, fecha: string): string {
  return `${normalizarArea(area)}|${mesAnioDeFecha(fecha)}`;
}

export function clavesGrupoAfectadas(
  registroAnterior: Pick<RegistroPreventivo, "area" | "fecha"> | null | undefined,
  areaNueva: string,
  fechaNueva: string,
): string[] {
  const claves = [claveGrupoAreaMes(areaNueva, fechaNueva)];
  if (registroAnterior) {
    const anterior = claveGrupoAreaMes(registroAnterior.area, registroAnterior.fecha);
    if (!claves.includes(anterior)) claves.push(anterior);
  }
  return claves;
}

function compararRegistrosPm(a: RegistroPreventivo, b: RegistroPreventivo): number {
  const porFecha = a.fecha.localeCompare(b.fecha);
  if (porFecha !== 0) return porFecha;
  return (a.creado_en ?? "").localeCompare(b.creado_en ?? "");
}

/**
 * Número de reporte (1, 2, 3…) por área y mes calendario.
 * El primer mantenimiento del mes en el área es 1, el siguiente 2, etc.
 */
export function calcularMapaNumerosReporte(registros: RegistroPreventivo[]): Map<string, number> {
  const mapa = new Map<string, number>();
  const grupos = new Map<string, RegistroPreventivo[]>();

  for (const registro of registros) {
    const clave = claveGrupoAreaMes(registro.area, registro.fecha);
    const lista = grupos.get(clave) ?? [];
    lista.push(registro);
    grupos.set(clave, lista);
  }

  for (const grupo of grupos.values()) {
    grupo.sort(compararRegistrosPm);
    grupo.forEach((registro, indice) => mapa.set(registro.id, indice + 1));
  }

  return mapa;
}

export function numeroReporteParaRegistro(
  registros: RegistroPreventivo[],
  registro: Pick<RegistroPreventivo, "id" | "area" | "fecha" | "creado_en">,
): number {
  const mapa = calcularMapaNumerosReporte(registros);
  return mapa.get(registro.id) ?? 1;
}

export function formatearNumeroReporte(numero: number): string {
  return String(numero);
}

/** Número guardado o calculado en memoria para mostrar / imprimir. */
export function numeroReporteDeRegistro(
  registro: RegistroPreventivo,
  mapa?: Map<string, number>,
): string {
  const calculado = mapa?.get(registro.id);
  if (calculado) return formatearNumeroReporte(calculado);
  return registro.datos.numeroReporte ?? registro.datos.mtre045?.numeroReporte ?? "";
}

export function datosConNumeroReporte(
  datos: PreventivoDatos,
  numero: string,
): PreventivoDatos {
  const actualizado: PreventivoDatos = { ...datos, numeroReporte: numero };
  if (actualizado.mtre045) {
    actualizado.mtre045 = { ...actualizado.mtre045, numeroReporte: numero };
  }
  return actualizado;
}

function numeroAlmacenado(registro: RegistroPreventivo): string {
  return registro.datos.numeroReporte ?? registro.datos.mtre045?.numeroReporte ?? "";
}

function grupoTieneNumerosDuplicados(grupo: RegistroPreventivo[]): boolean {
  const numeros = grupo.map((r) => numeroAlmacenado(r)).filter(Boolean);
  return numeros.length > 1 && new Set(numeros).size !== numeros.length;
}

/** Actualiza en Supabase los números de reporte que cambiaron en los grupos indicados. */
export async function sincronizarNumerosReporteEnGrupos(
  registros: RegistroPreventivo[],
  clavesGrupo: string[],
  mapaPrecalculado?: Map<string, number>,
): Promise<RegistroPreventivo[]> {
  const claves = new Set(clavesGrupo);
  const mapa = mapaPrecalculado ?? calcularMapaNumerosReporte(registros);
  const resultado = [...registros];
  const indicePorId = new Map(resultado.map((r, i) => [r.id, i]));

  for (const registro of registros) {
    const clave = claveGrupoAreaMes(registro.area, registro.fecha);
    if (!claves.has(clave)) continue;

    const numero = formatearNumeroReporte(mapa.get(registro.id) ?? 0);
    if (!numero || numero === "0") continue;

    const actual = numeroAlmacenado(registro);
    if (actual === numero) continue;

    const actualizado = await actualizarPreventivo(registro.id, {
      datos: datosConNumeroReporte(registro.datos, numero),
    });
    resultado[indicePorId.get(registro.id)!] = actualizado;
  }

  return resultado;
}

/** Corrige números desactualizados o duplicados al cargar la página. */
export async function sincronizarNumerosReportePendientes(
  registros: RegistroPreventivo[],
): Promise<RegistroPreventivo[]> {
  const mapa = calcularMapaNumerosReporte(registros);
  const claves = new Set<string>();
  const grupos = new Map<string, RegistroPreventivo[]>();

  for (const registro of registros) {
    const clave = claveGrupoAreaMes(registro.area, registro.fecha);
    const lista = grupos.get(clave) ?? [];
    lista.push(registro);
    grupos.set(clave, lista);
  }

  for (const [clave, grupo] of grupos) {
    if (grupoTieneNumerosDuplicados(grupo)) {
      claves.add(clave);
      continue;
    }
    for (const registro of grupo) {
      const esperado = formatearNumeroReporte(mapa.get(registro.id) ?? 0);
      if (numeroAlmacenado(registro) !== esperado) {
        claves.add(clave);
        break;
      }
    }
  }

  if (claves.size === 0) return registros;
  return sincronizarNumerosReporteEnGrupos(registros, [...claves], mapa);
}
