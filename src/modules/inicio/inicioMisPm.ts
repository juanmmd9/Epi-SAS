import { aFechaIso } from "../../lib/fechas";
import type { EstadoCitaPm } from "../cronograma/types";
import { claveAsignacionPm } from "../preventivo/asignacionPmClave";
import type { AsignacionPm } from "../preventivo/asignacionPmTypes";

export interface CitaPmVista {
  maquinaId: string;
  nombre: string;
  codigo: string;
  frecuencia: number;
  origen: "automatica" | "manual";
  dia: number;
  mes: number;
  estado: EstadoCitaPm;
  reprogramadoA: { anio: number; mes: number; dia: number } | null;
  fechaProgramada: string;
  claveAsignacion: string;
}

export interface MisPmItem extends CitaPmVista {
  area: string;
  anio: number;
  personalId: string;
  personalNombre: string;
}

export function fechaProgramadaDeCita(
  anio: number,
  mes: number,
  dia: number,
  reprogramadoA: { anio: number; mes: number; dia: number } | null,
): string {
  if (reprogramadoA) {
    return aFechaIso(reprogramadoA.anio, reprogramadoA.mes, reprogramadoA.dia);
  }
  return aFechaIso(anio, mes, dia);
}

export function listarMisPmPendientes(
  datosPorArea: Array<{
    area: string;
    porMes: Array<{
      mes: number;
      citas: Array<{
        maquinaId: string;
        nombre: string;
        codigo: string;
        frecuencia: number;
        origen: "automatica" | "manual";
        dia: number;
        estado: EstadoCitaPm;
        reprogramadoA: { anio: number; mes: number; dia: number } | null;
      }>;
    }>;
  }>,
  anio: number,
  personalId: string,
  asignaciones: AsignacionPm[],
  mapaNombres: Map<string, string>,
): MisPmItem[] {
  const asignadas = asignaciones.filter((a) => a.personal_id === personalId);
  const clavesAsignadas = new Set(
    asignadas.map((a) => claveAsignacionPm(a.hoja_id, a.fecha_programada)),
  );
  const lista: MisPmItem[] = [];

  for (const datos of datosPorArea) {
    for (const bloque of datos.porMes) {
      for (const cita of bloque.citas) {
        const fechaProgramada = fechaProgramadaDeCita(
          anio,
          bloque.mes,
          cita.dia,
          cita.reprogramadoA,
        );
        const clave = claveAsignacionPm(cita.maquinaId, fechaProgramada);
        if (!clavesAsignadas.has(clave)) continue;
        if (cita.estado === "completada" || cita.estado === "de_baja") continue;

        lista.push({
          ...cita,
          mes: bloque.mes,
          area: datos.area,
          anio,
          fechaProgramada,
          claveAsignacion: clave,
          personalId,
          personalNombre: mapaNombres.get(personalId) ?? "Operario",
        });
      }
    }
  }

  lista.sort((a, b) => a.fechaProgramada.localeCompare(b.fechaProgramada));
  return lista;
}

export function contarPmSinAsignar(
  datosPorArea: Array<{
    porMes: Array<{
      mes: number;
      citas: Array<{
        maquinaId: string;
        dia: number;
        estado: EstadoCitaPm;
        reprogramadoA: { anio: number; mes: number; dia: number } | null;
      }>;
    }>;
  }>,
  anio: number,
  asignaciones: AsignacionPm[],
): number {
  const claves = new Set(
    asignaciones.map((a) => claveAsignacionPm(a.hoja_id, a.fecha_programada)),
  );
  let n = 0;
  for (const datos of datosPorArea) {
    for (const bloque of datos.porMes) {
      for (const cita of bloque.citas) {
        if (cita.estado === "completada" || cita.estado === "de_baja") continue;
        const fecha = fechaProgramadaDeCita(anio, bloque.mes, cita.dia, cita.reprogramadoA);
        const clave = claveAsignacionPm(cita.maquinaId, fecha);
        if (!claves.has(clave)) n += 1;
      }
    }
  }
  return n;
}
