// Formulas de indicadores extraidas de la version vanilla (js/indicadores.js).
// G = tiempo de respuesta (min), H = tiempo de mantenimiento (min), I = G + H.

import { AREAS_CON_PM, coincideArea } from "../../lib/areas";
import { aFechaIso, diasEnMes, parseFechaIso } from "../../lib/fechas";
import { maquinaActivaEnFecha, mapaCitasDelAnio } from "../cronograma/cronogramaCalculo";
import type { ExcepcionCronograma } from "../cronograma/types";
import { hojaEstaActiva } from "../hojas/hojasFiltro";
import type { HojaVida } from "../hojas/types";
import {
  indicesPmCompletado,
  pmCompletado,
  vincularPreventivoConHojas,
} from "../preventivo/pmCompletado";
import type { RegistroPreventivo } from "../preventivo/types";
import type { RegistroCorrectivo } from "../correctivo/types";
import {
  horasLaborablesEntre,
  horasLaborablesMes,
  minutosTopeEsperaRepuestos,
} from "../permisos/horasLaborables";
import type { Festivo, HorarioLaboral } from "../permisos/types";
import { periodoDe, type HorasProgramadas } from "./horasService";

/** Días calendario de la solicitud (inicio → cierre) a partir de los cuales aplica tope. */
export const DIAS_ESPERA_TOPE_HORAS_PERDIDAS = 3;
/** Máximo de días calendario que cuentan hacia el % de horas perdidas cuando hay espera larga (repuestos, etc.). */
export const DIAS_MAX_HORAS_PERDIDAS_INDICADOR = 2;
/** Respaldo si no hay horario cargado: 2 × 8 h. */
export const MINUTOS_MAX_HORAS_PERDIDAS_INDICADOR = DIAS_MAX_HORAS_PERDIDAS_INDICADOR * 8 * 60;

export interface TiemposCorrectivo {
  g: number | null;
  h: number | null;
  i: number | null;
  valido: boolean;
  advertencia?: boolean;
}

export interface FilaCorrectivo {
  registro: RegistroCorrectivo;
  tiempos: TiemposCorrectivo;
}

export interface ResumenCorrectivo {
  totalG: number;
  totalH: number;
  totalI: number;
  totalIIndicador: number;
  cantidad: number;
  promedioG: number;
  promedioH: number;
  promedioI: number;
  horas: number;
  horasIndicador: number;
}

function construirDateTime(fecha: string, hora: string): Date | null {
  if (!fecha || !hora) return null;
  const horaNormalizada = hora.length >= 5 ? hora.slice(0, 5) : hora;
  const dt = new Date(`${fecha}T${horaNormalizada}:00`);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function calcularTiemposCorrectivo(registro: RegistroCorrectivo): TiemposCorrectivo {
  const d = registro.datos;
  const solicitudDT = construirDateTime(registro.fecha, d.horaSolicitud);
  const respuestaDT = construirDateTime(registro.fecha, d.horaRespuesta);
  const entregaDT = construirDateTime(d.fechaCierre, d.horaCierre);

  if (!solicitudDT || !respuestaDT || !entregaDT) {
    return { g: null, h: null, i: null, valido: false };
  }

  const g = (respuestaDT.getTime() - solicitudDT.getTime()) / 60000;
  const h = (entregaDT.getTime() - respuestaDT.getTime()) / 60000;

  if (g < 0 || h < 0) {
    return { g, h, i: null, valido: false, advertencia: true };
  }

  return { g, h, i: g + h, valido: true };
}

/** Días calendario entre la fecha de solicitud y la de cierre (ambas inclusive en el conteo). */
export function diasCalendarioSolicitud(registro: RegistroCorrectivo): number | null {
  const inicio = parseFechaIso(registro.fecha);
  const fin = parseFechaIso(registro.datos.fechaCierre);
  if (!inicio || !fin) return null;

  const dtInicio = new Date(inicio.anio, inicio.mes - 1, inicio.dia);
  const dtFin = new Date(fin.anio, fin.mes - 1, fin.dia);
  const diffMs = dtFin.getTime() - dtInicio.getTime();
  if (diffMs < 0) return null;

  return Math.floor(diffMs / 86_400_000) + 1;
}

/**
 * Minutos que cuentan para el % de horas perdidas.
 * Si la solicitud abarca más de 3 días calendario (espera de repuestos, etc.),
 * solo se contabilizan como máximo 2 jornadas laborales (según horario y festivos).
 */
export function minutosEfectivosHorasPerdidas(
  fila: FilaCorrectivo,
  horarios: HorarioLaboral[] = [],
  festivos: Festivo[] = [],
): number {
  const { registro, tiempos } = fila;
  if (!tiempos.valido || tiempos.i === null) return 0;

  const dias = diasCalendarioSolicitud(registro);
  if (dias !== null && dias > DIAS_ESPERA_TOPE_HORAS_PERDIDAS) {
    const topeJornadas =
      horarios.length > 0
        ? minutosTopeEsperaRepuestos(horarios)
        : MINUTOS_MAX_HORAS_PERDIDAS_INDICADOR;
    const horasLaborables = horasLaborablesEntre(
      registro.fecha,
      registro.datos.fechaCierre,
      horarios,
      festivos,
    );
    const topePorCalendarioLaboral = Math.round(horasLaborables * 60);
    const tope = Math.min(topeJornadas, topePorCalendarioLaboral || topeJornadas);
    return Math.min(tiempos.i, tope);
  }

  return tiempos.i;
}

export function solicitudConTopeHorasPerdidas(registro: RegistroCorrectivo): boolean {
  const dias = diasCalendarioSolicitud(registro);
  return dias !== null && dias > DIAS_ESPERA_TOPE_HORAS_PERDIDAS;
}

export function registroEnMes(fechaTexto: string | null, anio: number, mes: number): boolean {
  if (!fechaTexto) return false;
  const partes = fechaTexto.slice(0, 10).split("-");
  if (partes.length < 2) return false;
  return Number.parseInt(partes[0], 10) === anio && Number.parseInt(partes[1], 10) === mes;
}

export function filtrarCorrectivos(
  registros: RegistroCorrectivo[],
  area: string,
  anio: number,
  mes: number,
  tipoMantenimiento: string,
): RegistroCorrectivo[] {
  return registros
    .filter((registro) => {
      if (area && registro.area !== area) return false;
      if (!registroEnMes(registro.fecha, anio, mes)) return false;
      if (!tipoMantenimiento) return true;
      return registro.datos.tiposSolicitud.some((tipo) =>
        tipo.toUpperCase().includes(tipoMantenimiento.toUpperCase()),
      );
    })
    .sort((a, b) => (a.datos.numeroSolicitud || 0) - (b.datos.numeroSolicitud || 0));
}

export function calcularResumenCorrectivo(
  filas: FilaCorrectivo[],
  horarios: HorarioLaboral[] = [],
  festivos: Festivo[] = [],
): ResumenCorrectivo {
  const validas = filas.filter((fila) => fila.tiempos.valido);
  const totalG = validas.reduce((suma, fila) => suma + (fila.tiempos.g ?? 0), 0);
  const totalH = validas.reduce((suma, fila) => suma + (fila.tiempos.h ?? 0), 0);
  const totalI = validas.reduce((suma, fila) => suma + (fila.tiempos.i ?? 0), 0);
  const totalIIndicador = validas.reduce(
    (suma, fila) => suma + minutosEfectivosHorasPerdidas(fila, horarios, festivos),
    0,
  );
  const cantidad = validas.length;

  return {
    totalG,
    totalH,
    totalI,
    totalIIndicador,
    cantidad,
    promedioG: cantidad > 0 ? totalG / cantidad : 0,
    promedioH: cantidad > 0 ? totalH / cantidad : 0,
    promedioI: cantidad > 0 ? totalI / cantidad : 0,
    horas: totalI / 60,
    horasIndicador: totalIIndicador / 60,
  };
}

// ----- Preventivo: cumplimiento del cronograma -----

export interface CitaClasificada {
  maquinaId: string;
  nombre: string;
  codigo: string;
  dia: number;
  fechaPm?: string;
  destino?: { anio: number; mes: number; dia: number };
}

export interface ClasificacionPreventivo {
  cumplidas: CitaClasificada[];
  reprogramadas: CitaClasificada[];
  pendientes: CitaClasificada[];
  total: number;
  porcentaje: number;
}

function mesSiguiente(anio: number, mes: number): { anio: number; mes: number } {
  return mes >= 12 ? { anio: anio + 1, mes: 1 } : { anio, mes: mes + 1 };
}

/** True si la máquina estuvo en circulación al menos un día del mes. */
function maquinaEnCirculacionEnMes(maquina: HojaVida, anio: number, mes: number): boolean {
  for (let dia = 1; dia <= diasEnMes(anio, mes); dia++) {
    if (maquinaActivaEnFecha(maquina, anio, mes, dia)) return true;
  }
  return false;
}

function maquinasEnCirculacionParaMes(
  maquinas: HojaVida[],
  anio: number,
  mes: number,
): HojaVida[] {
  return maquinas.filter((m) => maquinaEnCirculacionEnMes(m, anio, mes));
}

export function clasificarCitasPreventivas(
  maquinas: HojaVida[],
  excepciones: ExcepcionCronograma[],
  preventivo: RegistroPreventivo[],
  area: string,
  anio: number,
  mes: number,
): ClasificacionPreventivo {
  const preventivoVinculado = vincularPreventivoConHojas(preventivo, maquinas);
  const indicesPm = indicesPmCompletado(preventivoVinculado, anio);
  const maquinasVigentes = maquinas.filter(hojaEstaActiva);
  const maquinasPorId = new Map(maquinasVigentes.map((m) => [m.id, m]));
  const maquinasMes = maquinasEnCirculacionParaMes(maquinasVigentes, anio, mes);
  const mapa = mapaCitasDelAnio(maquinasMes, excepciones, area, anio);

  const cumplidas: CitaClasificada[] = [];
  const reprogramadas: CitaClasificada[] = [];
  const pendientes: CitaClasificada[] = [];

  function buscarPmEnMes(maquinaId: string): RegistroPreventivo | undefined {
    return preventivoVinculado.find(
      (r) => r.hoja_id === maquinaId && registroEnMes(r.fecha, anio, mes),
    );
  }

  for (const [clave, citas] of mapa) {
    const [mesClave, diaClave] = clave.split("|").map(Number);
    if (mesClave !== mes) continue;
    for (const cita of citas) {
      const maquina = maquinasPorId.get(cita.maquinaId);
      if (!maquina || !hojaEstaActiva(maquina)) continue;
      if (!maquinaActivaEnFecha(maquina, anio, mes, diaClave)) continue;

      const base: CitaClasificada = {
        maquinaId: cita.maquinaId,
        nombre: cita.nombre,
        codigo: cita.codigo,
        dia: diaClave,
      };
      const fechaCita = aFechaIso(anio, mes, diaClave);
      if (pmCompletado(cita.maquinaId, fechaCita, indicesPm)) {
        const pm = buscarPmEnMes(cita.maquinaId);
        cumplidas.push({ ...base, fechaPm: pm?.fecha });
      } else {
        pendientes.push(base);
      }
    }
  }

  const yaContadas = new Set([
    ...cumplidas.map((c) => c.maquinaId),
    ...pendientes.map((c) => c.maquinaId),
  ]);
  for (const maquina of maquinasMes) {
    if (area && !coincideArea(maquina.area, area)) continue;
    if (yaContadas.has(maquina.id)) continue;
    const pm = buscarPmEnMes(maquina.id);
    if (!pm) continue;
    const diaPm = Number.parseInt(pm.fecha.slice(8, 10), 10) || 1;
    cumplidas.push({
      maquinaId: maquina.id,
      nombre: maquina.nombre,
      codigo: maquina.codigo ?? "",
      dia: diaPm,
      fechaPm: pm.fecha,
    });
  }

  // Citas excluidas este mes que reaparecen el mes siguiente = reprogramadas
  const siguiente = mesSiguiente(anio, mes);
  const maquinasMesSiguiente = maquinasEnCirculacionParaMes(maquinasVigentes, siguiente.anio, siguiente.mes);
  const mapaSiguiente = mapaCitasDelAnio(maquinasMesSiguiente, excepciones, area, siguiente.anio);
  for (const excepcion of excepciones) {
    const d = excepcion.datos;
    if (d.tipo !== "excluir" || !coincideArea(d.area, area) || d.anio !== anio || d.mes !== mes) {
      continue;
    }
    const maquina = maquinasVigentes.find((m) => m.id === d.maquinaId);
    if (!maquina || !hojaEstaActiva(maquina)) continue;
    if (!maquinaActivaEnFecha(maquina, anio, mes, d.dia)) continue;

    let destino: CitaClasificada["destino"];
    for (const [clave, citas] of mapaSiguiente) {
      const [mesClave, diaClave] = clave.split("|").map(Number);
      if (mesClave !== siguiente.mes) continue;
      if (citas.some((c) => c.maquinaId === d.maquinaId)) {
        destino = { anio: siguiente.anio, mes: siguiente.mes, dia: diaClave };
        break;
      }
    }
    if (destino) {
      const pm = buscarPmEnMes(maquina.id);
      const baseReprogramada: CitaClasificada = {
        maquinaId: maquina.id,
        nombre: maquina.nombre,
        codigo: maquina.codigo ?? "",
        dia: d.dia,
        destino,
      };
      if (pm) {
        if (!cumplidas.some((c) => c.maquinaId === maquina.id)) {
          const diaPm = Number.parseInt(pm.fecha.slice(8, 10), 10) || d.dia;
          cumplidas.push({ ...baseReprogramada, dia: diaPm, fechaPm: pm.fecha });
        }
      } else {
        reprogramadas.push(baseReprogramada);
      }
    }
  }

  // Solo citas del mes con PM pendiente cuentan contra el %; reprogramadas son informativas.
  const total = cumplidas.length + pendientes.length;
  const porcentaje = total > 0 ? Math.round((cumplidas.length / total) * 100) : 0;

  return { cumplidas, reprogramadas, pendientes, total, porcentaje };
}

export function formatearNumero(valor: number | null | undefined, decimales = 2): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  return Number(valor).toFixed(decimales);
}

/** Formatea con hasta N decimales, sin ceros finales innecesarios. */
export function formatearNumeroMax(
  valor: number | null | undefined,
  maxDecimales = 3,
): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  const factor = 10 ** maxDecimales;
  const redondeado = Math.round(valor * factor) / factor;
  return redondeado.toFixed(maxDecimales).replace(/\.?0+$/, "") || "0";
}

// ----- Tabla anual de indicadores y metas -----

/** Areas con indicadores correctivos en la tabla anual (igual que vanilla). */
export const AREAS_CORRECTIVO_TABLA = ["Confeccion", "Plasticos", "Tejidos"];

export type EstadoMeta = "ok" | "alerta" | "fail" | "sin-dato";

export function estadoMetaPreventivo(valor: number | null): EstadoMeta {
  if (valor === null || Number.isNaN(valor)) return "sin-dato";
  return valor >= 100 ? "ok" : "fail";
}

export function estadoMetaTiempoRespuesta(valor: number | null): EstadoMeta {
  if (valor === null || Number.isNaN(valor)) return "sin-dato";
  if (valor <= 10) return "ok";
  if (valor <= 15) return "alerta";
  return "fail";
}

export function estadoMetaHorasPerdidas(valor: number | null): EstadoMeta {
  if (valor === null || Number.isNaN(valor)) return "sin-dato";
  if (valor <= 1) return "ok";
  if (valor <= 2) return "alerta";
  return "fail";
}

export function horasProgramadasDe(
  horas: HorasProgramadas[],
  anio: number,
  mes: number,
  area: string,
): number | null {
  const registro = horas.find((h) => h.periodo === periodoDe(anio, mes) && h.area === area);
  return registro && registro.horas > 0 ? registro.horas : null;
}

/** Horas del mes: valor guardado por área o, si no hay, horas laborables del calendario. */
export function horasProgramadasEfectivas(
  horas: HorasProgramadas[],
  anio: number,
  mes: number,
  area: string,
  horarios: HorarioLaboral[],
  festivos: Festivo[],
): number | null {
  const manual = horasProgramadasDe(horas, anio, mes, area);
  if (manual !== null) return manual;
  const calculadas = horasLaborablesMes(anio, mes, horarios, festivos);
  return calculadas > 0 ? calculadas : null;
}

/** % de cumplimiento PM de todas las areas con preventivo en un mes. */
export function cumplimientoPreventivoGlobal(
  maquinas: HojaVida[],
  excepciones: ExcepcionCronograma[],
  preventivo: RegistroPreventivo[],
  anio: number,
  mes: number,
  referencia = new Date(),
): number | null {
  const anioRef = referencia.getFullYear();
  const mesRef = referencia.getMonth() + 1;
  if (anio > anioRef || (anio === anioRef && mes > mesRef)) return null;

  let totalCitas = 0;
  let totalCumplidas = 0;
  for (const area of AREAS_CON_PM) {
    const datos = clasificarCitasPreventivas(maquinas, excepciones, preventivo, area, anio, mes);
    totalCitas += datos.total;
    totalCumplidas += datos.cumplidas.length;
  }
  if (totalCitas === 0) return null;
  return Math.round((totalCumplidas / totalCitas) * 100);
}

/** Promedio mensual del tiempo de respuesta G (min) de un area. */
export function promedioRespuestaArea(
  correctivos: RegistroCorrectivo[],
  anio: number,
  mes: number,
  area: string,
  tipoMantenimiento: string,
): number | null {
  const filas = filtrarCorrectivos(correctivos, area, anio, mes, tipoMantenimiento).map(
    (registro) => ({ registro, tiempos: calcularTiemposCorrectivo(registro) }),
  );
  const resumen = calcularResumenCorrectivo(filas);
  if (resumen.cantidad === 0) return null;
  return resumen.promedioG;
}

/** % de horas perdidas por correctivo respecto a las horas programadas. */
export function porcentajeHorasPerdidasArea(
  correctivos: RegistroCorrectivo[],
  horas: HorasProgramadas[],
  anio: number,
  mes: number,
  area: string,
  tipoMantenimiento: string,
  horarios: HorarioLaboral[] = [],
  festivos: Festivo[] = [],
): number | null {
  const filas = filtrarCorrectivos(correctivos, area, anio, mes, tipoMantenimiento).map(
    (registro) => ({ registro, tiempos: calcularTiemposCorrectivo(registro) }),
  );
  const resumen = calcularResumenCorrectivo(filas, horarios, festivos);
  const horasProgramadas = horasProgramadasEfectivas(
    horas,
    anio,
    mes,
    area,
    horarios,
    festivos,
  );
  if (!horasProgramadas || resumen.cantidad === 0) return null;
  return (resumen.horasIndicador / horasProgramadas) * 100;
}

export function promedioValoresMensuales(valores: (number | null)[]): number | null {
  const validos = valores.filter((v): v is number => v !== null && !Number.isNaN(v));
  if (validos.length === 0) return null;
  const promedio = validos.reduce((suma, v) => suma + v, 0) / validos.length;
  return Math.round(promedio * 1000) / 1000;
}

export interface MetaIncumplida {
  area: string;
  indicador: string;
  meta: string;
  valor: string;
  mes: number;
  anio: number;
  severidad: EstadoMeta;
}

export function metasIncumplidasMes(
  maquinas: HojaVida[],
  excepciones: ExcepcionCronograma[],
  preventivo: RegistroPreventivo[],
  correctivos: RegistroCorrectivo[],
  horas: HorasProgramadas[],
  anio: number,
  mes: number,
  tipoMantenimiento: string,
  areaFiltro = "",
  horarios: HorarioLaboral[] = [],
  festivos: Festivo[] = [],
): MetaIncumplida[] {
  const incumplidas: MetaIncumplida[] = [];

  const pm = cumplimientoPreventivoGlobal(maquinas, excepciones, preventivo, anio, mes);
  if (estadoMetaPreventivo(pm) !== "ok" && pm !== null) {
    incumplidas.push({
      area: "Todas las areas PM",
      indicador: "CUMPLIMIENTO A MANTENIMIENTOS PREVENTIVOS",
      meta: "100%",
      valor: `${pm}%`,
      mes,
      anio,
      severidad: estadoMetaPreventivo(pm),
    });
  }

  const areas = areaFiltro
    ? AREAS_CORRECTIVO_TABLA.includes(areaFiltro)
      ? [areaFiltro]
      : []
    : AREAS_CORRECTIVO_TABLA;

  for (const area of areas) {
    const respuesta = promedioRespuestaArea(correctivos, anio, mes, area, tipoMantenimiento);
    if (estadoMetaTiempoRespuesta(respuesta) !== "ok" && respuesta !== null) {
      incumplidas.push({
        area,
        indicador: `TIEMPO DE RESPUESTA PROMEDIO DEL SERVICIO DE MANTENIMIENTO CORRECTIVO (${area.toUpperCase()})`,
        meta: "10 MINUTOS",
        valor: `${formatearNumero(respuesta)} min`,
        mes,
        anio,
        severidad: estadoMetaTiempoRespuesta(respuesta),
      });
    }

    const horasPerdidas = porcentajeHorasPerdidasArea(
      correctivos, horas, anio, mes, area, tipoMantenimiento, horarios, festivos,
    );
    if (estadoMetaHorasPerdidas(horasPerdidas) !== "ok" && horasPerdidas !== null) {
      incumplidas.push({
        area,
        indicador: `PORCENTAJE DE HORAS PERDIDAS POR MANTENIMIENTO CORRECTIVO (${area.toUpperCase()})`,
        meta: "1%",
        valor: `${formatearNumero(horasPerdidas)}%`,
        mes,
        anio,
        severidad: estadoMetaHorasPerdidas(horasPerdidas),
      });
    }
  }

  return incumplidas;
}
