// Formulas de indicadores extraidas de la version vanilla (js/indicadores.js).
// G = tiempo de respuesta (min), H = tiempo de mantenimiento (min), I = G + H.

import { AREAS_CON_PM } from "../../lib/areas";
import { mapaCitasDelAnio } from "../cronograma/cronogramaCalculo";
import type { ExcepcionCronograma } from "../cronograma/types";
import type { HojaVida } from "../hojas/types";
import type { RegistroPreventivo } from "../preventivo/types";
import type { RegistroCorrectivo } from "../correctivo/types";
import { periodoDe, type HorasProgramadas } from "./horasService";

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
  cantidad: number;
  promedioG: number;
  promedioH: number;
  promedioI: number;
  horas: number;
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

export function calcularResumenCorrectivo(filas: FilaCorrectivo[]): ResumenCorrectivo {
  const validas = filas.filter((fila) => fila.tiempos.valido);
  const totalG = validas.reduce((suma, fila) => suma + (fila.tiempos.g ?? 0), 0);
  const totalH = validas.reduce((suma, fila) => suma + (fila.tiempos.h ?? 0), 0);
  const totalI = validas.reduce((suma, fila) => suma + (fila.tiempos.i ?? 0), 0);
  const cantidad = validas.length;

  return {
    totalG,
    totalH,
    totalI,
    cantidad,
    promedioG: cantidad > 0 ? totalG / cantidad : 0,
    promedioH: cantidad > 0 ? totalH / cantidad : 0,
    promedioI: cantidad > 0 ? totalI / cantidad : 0,
    horas: totalI / 60,
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

export function clasificarCitasPreventivas(
  maquinas: HojaVida[],
  excepciones: ExcepcionCronograma[],
  preventivo: RegistroPreventivo[],
  area: string,
  anio: number,
  mes: number,
): ClasificacionPreventivo {
  const mapa = mapaCitasDelAnio(maquinas, excepciones, area, anio);

  const cumplidas: CitaClasificada[] = [];
  const reprogramadas: CitaClasificada[] = [];
  const pendientes: CitaClasificada[] = [];

  function pmEjecutado(maquinaId: string): RegistroPreventivo | undefined {
    return preventivo.find(
      (r) => r.hoja_id === maquinaId && registroEnMes(r.fecha, anio, mes),
    );
  }

  for (const [clave, citas] of mapa) {
    const [mesClave, diaClave] = clave.split("|").map(Number);
    if (mesClave !== mes) continue;
    for (const cita of citas) {
      const base: CitaClasificada = {
        maquinaId: cita.maquinaId,
        nombre: cita.nombre,
        codigo: cita.codigo,
        dia: diaClave,
      };
      const pm = pmEjecutado(cita.maquinaId);
      if (pm) {
        cumplidas.push({ ...base, fechaPm: pm.fecha });
      } else {
        pendientes.push(base);
      }
    }
  }

  // Citas excluidas este mes que reaparecen el mes siguiente = reprogramadas
  const siguiente = mesSiguiente(anio, mes);
  const mapaSiguiente = mapaCitasDelAnio(maquinas, excepciones, area, siguiente.anio);
  for (const excepcion of excepciones) {
    const d = excepcion.datos;
    if (d.tipo !== "excluir" || d.area !== area || d.anio !== anio || d.mes !== mes) continue;
    const maquina = maquinas.find((m) => m.id === d.maquinaId);
    if (!maquina) continue;

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
      reprogramadas.push({
        maquinaId: maquina.id,
        nombre: maquina.nombre,
        codigo: maquina.codigo ?? "",
        dia: d.dia,
        destino,
      });
    }
  }

  const total = cumplidas.length + pendientes.length + reprogramadas.length;
  const porcentaje = total > 0 ? Math.round((cumplidas.length / total) * 100) : 0;

  return { cumplidas, reprogramadas, pendientes, total, porcentaje };
}

export function formatearNumero(valor: number | null | undefined, decimales = 2): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  return Number(valor).toFixed(decimales);
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

/** % de cumplimiento PM de todas las areas con preventivo en un mes. */
export function cumplimientoPreventivoGlobal(
  maquinas: HojaVida[],
  excepciones: ExcepcionCronograma[],
  preventivo: RegistroPreventivo[],
  anio: number,
  mes: number,
): number | null {
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
): number | null {
  const filas = filtrarCorrectivos(correctivos, area, anio, mes, tipoMantenimiento).map(
    (registro) => ({ registro, tiempos: calcularTiemposCorrectivo(registro) }),
  );
  const resumen = calcularResumenCorrectivo(filas);
  const horasProgramadas = horasProgramadasDe(horas, anio, mes, area);
  if (!horasProgramadas || resumen.cantidad === 0) return null;
  return (resumen.horas / horasProgramadas) * 100;
}

export function promedioValoresMensuales(valores: (number | null)[]): number | null {
  const validos = valores.filter((v): v is number => v !== null && !Number.isNaN(v));
  if (validos.length === 0) return null;
  return validos.reduce((suma, v) => suma + v, 0) / validos.length;
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
      correctivos, horas, anio, mes, area, tipoMantenimiento,
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
