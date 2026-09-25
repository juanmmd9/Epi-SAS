import { coincideArea } from "../../lib/areas";
import { aFechaIso, valorFecha } from "../../lib/fechas";
import { hojaEstaActiva } from "../hojas/hojasFiltro";
import type { HojaVida } from "../hojas/types";
import type { IndicesPmCompletado } from "../preventivo/pmCompletado";
import { pmCompletado } from "../preventivo/pmCompletado";
import { maquinaActivaEnFecha } from "./cronogramaCalculo";
import type { ExcepcionCronograma, EstadoCitaPm, FechaCita } from "./types";

export interface ResultadoEstadoCita {
  estado: EstadoCitaPm;
  reprogramadoA: FechaCita | null;
}

function coincideSlot(
  datos: ExcepcionCronograma["datos"],
  tipo: ExcepcionCronograma["datos"]["tipo"],
  area: string,
  maquinaId: string,
  anio: number,
  mes: number,
  dia: number,
): boolean {
  return (
    datos.tipo === tipo &&
    coincideArea(datos.area, area) &&
    datos.maquinaId === maquinaId &&
    datos.anio === anio &&
    datos.mes === mes &&
    datos.dia === dia
  );
}

export function tieneNoRealizado(
  excepciones: ExcepcionCronograma[],
  area: string,
  maquinaId: string,
  anio: number,
  mes: number,
  dia: number,
): boolean {
  return excepciones.some((e) =>
    coincideSlot(e.datos, "no_realizado", area, maquinaId, anio, mes, dia),
  );
}

export function buscarAgregarReprogramado(
  excepciones: ExcepcionCronograma[],
  area: string,
  maquinaId: string,
  anio: number,
  mes: number,
  dia: number,
): ExcepcionCronograma | undefined {
  return excepciones.find(
    (e) =>
      coincideSlot(e.datos, "agregar", area, maquinaId, anio, mes, dia) &&
      Boolean(e.datos.reprogramadoDesde),
  );
}

export function destinoReprogramacion(
  excepciones: ExcepcionCronograma[],
  area: string,
  maquinaId: string,
  origen: FechaCita,
): FechaCita | null {
  for (const excepcion of excepciones) {
    const d = excepcion.datos;
    if (d.tipo !== "agregar" || d.maquinaId !== maquinaId || !coincideArea(d.area, area)) {
      continue;
    }
    const desde = d.reprogramadoDesde;
    if (
      desde &&
      desde.anio === origen.anio &&
      desde.mes === origen.mes &&
      desde.dia === origen.dia
    ) {
      return { anio: d.anio, mes: d.mes, dia: d.dia };
    }
  }
  return null;
}

export function evaluarEstadoCitaPm(
  maquinaId: string,
  area: string,
  anio: number,
  mes: number,
  dia: number,
  _origen: "automatica" | "manual",
  excepciones: ExcepcionCronograma[],
  indices: IndicesPmCompletado,
  valorHoy: number,
  maquina?: HojaVida | null,
): ResultadoEstadoCita {
  const fechaIso = aFechaIso(anio, mes, dia);
  const valorCita = valorFecha(anio, mes, dia);
  const hecho = pmCompletado(maquinaId, fechaIso, indices);
  const origenFecha: FechaCita = { anio, mes, dia };
  const destino = destinoReprogramacion(excepciones, area, maquinaId, origenFecha);

  if (hecho) {
    return { estado: "completada", reprogramadoA: destino };
  }

  const fueraDeCirculacion =
    maquina &&
    (!hojaEstaActiva(maquina) || !maquinaActivaEnFecha(maquina, anio, mes, dia));
  if (fueraDeCirculacion) {
    return { estado: "de_baja", reprogramadoA: destino };
  }

  const esAgregarReprog = Boolean(
    buscarAgregarReprogramado(excepciones, area, maquinaId, anio, mes, dia),
  );
  if (esAgregarReprog) {
    return { estado: "reprogramada", reprogramadoA: null };
  }

  if (tieneNoRealizado(excepciones, area, maquinaId, anio, mes, dia)) {
    return { estado: "no_realizado", reprogramadoA: destino };
  }

  if (valorCita < valorHoy) {
    return { estado: "vencida", reprogramadoA: null };
  }

  return { estado: "programada", reprogramadoA: null };
}

export type { EstadoCitaPm, FechaCita } from "./types";

export function etiquetaEstadoCita(estado: EstadoCitaPm): string {
  switch (estado) {
    case "completada":
      return "Completado";
    case "programada":
      return "Programado";
    case "no_realizado":
      return "No realizado";
    case "reprogramada":
      return "Reprogramado";
    case "vencida":
      return "Vencido — PM no hecho a tiempo";
    case "de_baja":
      return "De baja — fuera de circulación";
    default:
      return "";
  }
}
