import { coincideArea } from "../../lib/areas";
import { aFechaIso, ajustarDiaPorMes, sumarMeses, valorFecha } from "../../lib/fechas";
import type { IndicesPmCompletado } from "../preventivo/pmCompletado";
import { pmCompletado } from "../preventivo/pmCompletado";
import type { ExcepcionCronograma } from "./types";

export type EstadoCitaPm =
  | "completada"
  | "pendiente"
  | "vencida"
  | "no_realizado"
  | "reprogramada"
  | "reprogramada_hecha";

export interface DestinoReprogramacion {
  anio: number;
  mes: number;
  dia: number;
}

export interface ResultadoEstadoCita {
  estado: EstadoCitaPm;
  reprogramadoA: DestinoReprogramacion | null;
  excepcionNoRealizadoId: string | null;
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

export function buscarExcepcionNoRealizado(
  excepciones: ExcepcionCronograma[],
  area: string,
  maquinaId: string,
  anio: number,
  mes: number,
  dia: number,
): ExcepcionCronograma | undefined {
  return excepciones.find((e) => coincideSlot(e.datos, "no_realizado", area, maquinaId, anio, mes, dia));
}

/** Destino manual (excepción agregar) posterior a la cita original. */
export function buscarDestinoReprogramacion(
  excepciones: ExcepcionCronograma[],
  area: string,
  maquinaId: string,
  despuesDe: number,
): DestinoReprogramacion | null {
  let mejor: DestinoReprogramacion | null = null;
  let mejorValor = Number.MAX_SAFE_INTEGER;

  for (const excepcion of excepciones) {
    const d = excepcion.datos;
    if (d.tipo !== "agregar" || d.maquinaId !== maquinaId || !coincideArea(d.area, area)) {
      continue;
    }
    const valor = valorFecha(d.anio, d.mes, d.dia);
    if (valor <= despuesDe || valor >= mejorValor) continue;
    mejorValor = valor;
    mejor = { anio: d.anio, mes: d.mes, dia: d.dia };
  }

  return mejor;
}

export function pmCompletadoEnMes(
  maquinaId: string,
  anio: number,
  mes: number,
  indices: IndicesPmCompletado,
): boolean {
  return indices.porMes.has(`${maquinaId}|${anio}-${String(mes).padStart(2, "0")}`);
}

export function evaluarEstadoCitaPm(
  maquinaId: string,
  area: string,
  anio: number,
  mes: number,
  dia: number,
  excepciones: ExcepcionCronograma[],
  indices: IndicesPmCompletado,
  valorHoy: number,
): ResultadoEstadoCita {
  const fechaIso = aFechaIso(anio, mes, dia);
  const valorCita = valorFecha(anio, mes, dia);
  const hecho = pmCompletado(maquinaId, fechaIso, indices);
  const marca = buscarExcepcionNoRealizado(excepciones, area, maquinaId, anio, mes, dia);
  const destino = buscarDestinoReprogramacion(excepciones, area, maquinaId, valorCita);

  if (hecho && !marca) {
    return { estado: "completada", reprogramadoA: null, excepcionNoRealizadoId: null };
  }

  if (marca) {
    if (hecho) {
      return {
        estado: "completada",
        reprogramadoA: destino,
        excepcionNoRealizadoId: marca.id,
      };
    }
    if (destino) {
      const hechoEnDestino = pmCompletadoEnMes(maquinaId, destino.anio, destino.mes, indices);
      if (hechoEnDestino) {
        return {
          estado: "reprogramada_hecha",
          reprogramadoA: destino,
          excepcionNoRealizadoId: marca.id,
        };
      }
      return {
        estado: "reprogramada",
        reprogramadoA: destino,
        excepcionNoRealizadoId: marca.id,
      };
    }
    const hechoMesPosterior =
      valorCita < valorHoy &&
      [...indices.porMes].some((clave) => {
        const [id, ym] = clave.split("|");
        if (id !== maquinaId) return false;
        const partes = ym.split("-");
        const valorMesPm = Number.parseInt(partes[0], 10) * 100 + Number.parseInt(partes[1], 10);
        return valorMesPm > anio * 100 + mes;
      });
    if (hechoMesPosterior) {
      return {
        estado: "reprogramada_hecha",
        reprogramadoA: destino,
        excepcionNoRealizadoId: marca.id,
      };
    }
    return {
      estado: "no_realizado",
      reprogramadoA: null,
      excepcionNoRealizadoId: marca.id,
    };
  }

  if (valorCita < valorHoy && !hecho) {
    return { estado: "vencida", reprogramadoA: null, excepcionNoRealizadoId: null };
  }

  return { estado: "pendiente", reprogramadoA: null, excepcionNoRealizadoId: null };
}

/** Fecha sugerida: mismo día del mes siguiente (ajustado al calendario). */
export function destinoMesSiguiente(anio: number, mes: number, dia: number): DestinoReprogramacion {
  const siguiente = sumarMeses(anio, mes, dia, 1);
  return {
    anio: siguiente.anio,
    mes: siguiente.mes,
    dia: ajustarDiaPorMes(dia, siguiente.mes, siguiente.anio),
  };
}

export function etiquetaEstadoCita(estado: EstadoCitaPm): string {
  switch (estado) {
    case "completada":
      return "PM registrado";
    case "pendiente":
      return "Pendiente";
    case "vencida":
      return "Vencido — no se hizo en la fecha";
    case "no_realizado":
      return "No se pudo en la fecha programada";
    case "reprogramada":
      return "Reprogramado — pendiente en nueva fecha";
    case "reprogramada_hecha":
      return "Hecho en mes posterior";
    default:
      return "";
  }
}
