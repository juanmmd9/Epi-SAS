import { aFechaIso, diasEnMes, parseFechaIso } from "../../lib/fechas";
import { construirSetFestivos } from "./festivosDefaults";
import { horarioEstandarAnio } from "./horarioDefaults";
import { diaSemanaDesdeFecha, esFestivo, minutosDesdeHora } from "./permisosCalculo";
import type { Festivo, HorarioLaboral } from "./types";

/** Horario del año en BD o, si no hay, el estándar EPI (lun–vie 8 h, sáb 4 h). */
export function resolverHorariosAnio(anio: number, horariosDb: HorarioLaboral[]): HorarioLaboral[] {
  const delAnio = horariosDb.filter((h) => h.anio === anio);
  if (delAnio.length > 0) return delAnio;

  return horarioEstandarAnio(anio).map((h, indice) => ({
    ...h,
    id: `horario-default-${anio}-${indice}`,
  }));
}

/** Minutos laborables de un día según turnos activos (0 si es festivo o sin jornada). */
export function minutosLaborablesDia(
  fechaIso: string,
  horarios: HorarioLaboral[],
  festivos: Festivo[] | Set<string>,
): number {
  if (esFestivo(festivos, fechaIso)) return 0;

  const dia = diaSemanaDesdeFecha(fechaIso);
  return horarios
    .filter((h) => h.dia_semana === dia && h.activo)
    .reduce((suma, turno) => {
      const inicio = minutosDesdeHora(turno.hora_inicio.slice(0, 5));
      const fin = minutosDesdeHora(turno.hora_fin.slice(0, 5));
      const bloque = fin - inicio;
      return suma + (bloque > 0 ? bloque : 0);
    }, 0);
}

/** Total de horas laborables de un mes (sin festivos ni domingos sin turno). */
export function horasLaborablesMes(
  anio: number,
  mes: number,
  horarios: HorarioLaboral[],
  festivos: Festivo[] = [],
): number {
  const setFestivos = construirSetFestivos(festivos);
  let minutos = 0;

  for (let dia = 1; dia <= diasEnMes(anio, mes); dia++) {
    minutos += minutosLaborablesDia(aFechaIso(anio, mes, dia), horarios, setFestivos);
  }

  return Math.round((minutos / 60) * 100) / 100;
}

function fechaSolo(iso: string): string {
  return iso.slice(0, 10);
}

function horariosParaFecha(fechaIso: string, horarios: HorarioLaboral[]): HorarioLaboral[] {
  const partes = parseFechaIso(fechaSolo(fechaIso));
  if (!partes) return horarios;
  const delAnio = horarios.filter((h) => h.anio === partes.anio);
  return resolverHorariosAnio(partes.anio, delAnio);
}

function iterarDiasEntre(inicioIso: string, finIso: string): string[] {
  const inicio = parseFechaIso(inicioIso);
  const fin = parseFechaIso(finIso);
  if (!inicio || !fin) return [];

  const dt = new Date(inicio.anio, inicio.mes - 1, inicio.dia);
  const dtFin = new Date(fin.anio, fin.mes - 1, fin.dia);
  if (dtFin.getTime() < dt.getTime()) return [];

  const dias: string[] = [];
  while (dt.getTime() <= dtFin.getTime()) {
    dias.push(
      aFechaIso(dt.getFullYear(), dt.getMonth() + 1, dt.getDate()),
    );
    dt.setDate(dt.getDate() + 1);
  }
  return dias;
}

/** Horas laborables entre dos fechas (inclusive), descontando festivos y días sin turno. */
export function horasLaborablesEntre(
  fechaInicio: string,
  fechaFin: string,
  horarios: HorarioLaboral[],
  festivos: Festivo[] = [],
): number {
  const setFestivos = construirSetFestivos(festivos);
  let minutos = 0;

  for (const fecha of iterarDiasEntre(fechaInicio, fechaFin)) {
    minutos += minutosLaborablesDia(fecha, horarios, setFestivos);
  }

  return minutos / 60;
}

/** Promedio de minutos laborables lun–vie (jornada de referencia). */
export function minutosJornadaReferencia(horarios: HorarioLaboral[]): number {
  let total = 0;
  let diasConTurno = 0;

  for (let dia = 1; dia <= 5; dia++) {
    const mins = horarios
      .filter((h) => h.dia_semana === dia && h.activo)
      .reduce((suma, turno) => {
        const bloque =
          minutosDesdeHora(turno.hora_fin.slice(0, 5)) -
          minutosDesdeHora(turno.hora_inicio.slice(0, 5));
        return suma + (bloque > 0 ? bloque : 0);
      }, 0);
    if (mins > 0) {
      total += mins;
      diasConTurno += 1;
    }
  }

  if (diasConTurno === 0) return 8 * 60;
  return Math.round(total / diasConTurno);
}

/** Tope de espera por repuestos: 1 jornada laboral de referencia. */
export function minutosTopeEsperaRepuestos(horarios: HorarioLaboral[]): number {
  return minutosJornadaReferencia(horarios);
}

/**
 * Minutos dentro del horario laboral entre dos fecha/hora (solo turnos activos; sin noches ni festivos).
 */
export function minutosLaborablesEntreMomentos(
  fechaInicio: string,
  horaInicio: string,
  fechaFin: string,
  horaFin: string,
  horarios: HorarioLaboral[],
  festivos: Festivo[] = [],
): number {
  if (!fechaInicio || !fechaFin || !horaInicio || !horaFin) return 0;

  const inicioIso = fechaSolo(fechaInicio);
  const finIso = fechaSolo(fechaFin);
  const inicioReloj = new Date(`${inicioIso}T${horaInicio.slice(0, 5)}:00`);
  const finReloj = new Date(`${finIso}T${horaFin.slice(0, 5)}:00`);
  if (Number.isNaN(inicioReloj.getTime()) || Number.isNaN(finReloj.getTime())) return 0;
  if (finReloj.getTime() <= inicioReloj.getTime()) return 0;

  const inicioMin = minutosDesdeHora(horaInicio.slice(0, 5));
  const finMin = minutosDesdeHora(horaFin.slice(0, 5));
  const setFestivos = construirSetFestivos(festivos);
  let total = 0;

  for (const fecha of iterarDiasEntre(inicioIso, finIso)) {
    if (esFestivo(setFestivos, fecha)) continue;

    const horariosDia = horariosParaFecha(fecha, horarios);
    const dia = diaSemanaDesdeFecha(fecha);
    const turnos = horariosDia.filter((h) => h.dia_semana === dia && h.activo);
    if (turnos.length === 0) continue;

    const rangoInicio = fecha === inicioIso ? inicioMin : 0;
    const rangoFin = fecha === finIso ? finMin : 24 * 60;

    for (const turno of turnos) {
      const turnoInicio = minutosDesdeHora(turno.hora_inicio.slice(0, 5));
      const turnoFin = minutosDesdeHora(turno.hora_fin.slice(0, 5));
      const solape = Math.max(0, Math.min(rangoFin, turnoFin) - Math.max(rangoInicio, turnoInicio));
      total += solape;
    }
  }

  return total;
}
