import { aFechaIso } from "../../lib/fechas";
import { construirSetFestivos } from "../permisos/festivosDefaults";
import { listarFestivosAnio, listarHorarioAnio } from "../permisos/horarioService";
import { resolverHorariosAnio } from "../permisos/horasLaborables";
import { esFestivo, minutosDesdeHora } from "../permisos/permisosCalculo";
import type { Festivo, HorarioLaboral } from "../permisos/types";
import type { CronometroSolicitud } from "./cronometroSolicitud";

export interface ContextoHorarioCronometro {
  horarios: HorarioLaboral[];
  festivos: Festivo[];
  /** true si al menos un año vino de la tabla horario_laboral (no solo estándar). */
  desdeBd: boolean;
}

/** Carga horario + festivos de los años tocados por el rango (prioridad: BD). */
export async function cargarContextoHorarioParaRango(
  desdeMs: number,
  hastaMs: number,
): Promise<ContextoHorarioCronometro> {
  const a0 = new Date(Math.min(desdeMs, hastaMs)).getFullYear();
  const a1 = new Date(Math.max(desdeMs, hastaMs)).getFullYear();
  // Incluir siempre el año actual: el turno de hoy manda aunque el segmento sea viejo.
  const anioHoy = new Date().getFullYear();
  const anios = new Set<number>();
  for (let anio = a0; anio <= a1; anio++) anios.add(anio);
  anios.add(anioHoy);

  const horarios: HorarioLaboral[] = [];
  const festivos: Festivo[] = [];
  let desdeBd = false;

  for (const anio of [...anios].sort((a, b) => a - b)) {
    const [hDb, fDb] = await Promise.all([
      listarHorarioAnio(anio).catch(() => [] as HorarioLaboral[]),
      listarFestivosAnio(anio).catch(() => [] as Festivo[]),
    ]);
    if (hDb.length > 0) desdeBd = true;
    horarios.push(...resolverHorariosAnio(anio, hDb));
    festivos.push(...fDb);
  }

  return { horarios, festivos, desdeBd };
}

/**
 * Segundos de jornada laboral entre dos instantes
 * (solo turnos activos; excluye almuerzo, noches, domingos sin turno y festivos).
 */
export function segundosLaborablesEntre(
  inicioMs: number,
  finMs: number,
  horarios: HorarioLaboral[],
  festivos: Festivo[] = [],
): number {
  if (!(finMs > inicioMs) || !Number.isFinite(inicioMs) || !Number.isFinite(finMs)) {
    return 0;
  }

  const setFestivos = construirSetFestivos(festivos);
  let total = 0;

  const cursor = new Date(inicioMs);
  cursor.setHours(0, 0, 0, 0);
  const ultimo = new Date(finMs);
  ultimo.setHours(0, 0, 0, 0);

  while (cursor.getTime() <= ultimo.getTime()) {
    const anio = cursor.getFullYear();
    const mes = cursor.getMonth() + 1;
    const dia = cursor.getDate();
    const fechaIso = aFechaIso(anio, mes, dia);

    if (!esFestivo(setFestivos, fechaIso)) {
      const diaSemana = cursor.getDay();
      const delAnio = horarios.filter((h) => h.anio === anio);
      const jornada = resolverHorariosAnio(anio, delAnio).filter(
        (h) => h.dia_semana === diaSemana && h.activo,
      );

      for (const turno of jornada) {
        const hi = minutosDesdeHora(turno.hora_inicio.slice(0, 5));
        const hf = minutosDesdeHora(turno.hora_fin.slice(0, 5));
        if (!(hf > hi)) continue;

        const tStart = new Date(anio, mes - 1, dia, Math.floor(hi / 60), hi % 60, 0, 0).getTime();
        const tEnd = new Date(anio, mes - 1, dia, Math.floor(hf / 60), hf % 60, 0, 0).getTime();
        const solapeIni = Math.max(inicioMs, tStart);
        const solapeFin = Math.min(finMs, tEnd);
        if (solapeFin > solapeIni) {
          total += Math.floor((solapeFin - solapeIni) / 1000);
        }
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return total;
}

/** ¿Está el instante dentro de un turno laboral activo? */
export function estaEnJornadaLaboral(
  cuandoMs: number,
  horarios: HorarioLaboral[],
  festivos: Festivo[] = [],
): boolean {
  const d = new Date(cuandoMs);
  const fechaIso = aFechaIso(d.getFullYear(), d.getMonth() + 1, d.getDate());
  if (esFestivo(festivos, fechaIso)) return false;

  const mins = d.getHours() * 60 + d.getMinutes();
  const delAnio = horarios.filter((h) => h.anio === d.getFullYear());
  const jornada = resolverHorariosAnio(d.getFullYear(), delAnio).filter(
    (h) => h.dia_semana === d.getDay() && h.activo,
  );

  return jornada.some((turno) => {
    const hi = minutosDesdeHora(turno.hora_inicio.slice(0, 5));
    const hf = minutosDesdeHora(turno.hora_fin.slice(0, 5));
    return mins >= hi && mins < hf;
  });
}

export function segundosActivosLaborales(
  cron: CronometroSolicitud,
  ctx: ContextoHorarioCronometro | null,
  ahora = Date.now(),
): number {
  let total = cron.acumuladoSeg;
  if (cron.estado === "running" && cron.segmentoInicio) {
    const t0 = Date.parse(cron.segmentoInicio);
    if (!Number.isNaN(t0) && ctx) {
      total += segundosLaborablesEntre(t0, ahora, ctx.horarios, ctx.festivos);
    }
    // Sin ctx: no sumar reloj continuo (evita inflar fuera de jornada mientras carga).
  }
  return total;
}

export async function pausarCronometroLaboral(
  cron: CronometroSolicitud,
  ahora = new Date(),
): Promise<CronometroSolicitud> {
  if (cron.estado !== "running" || !cron.segmentoInicio) {
    return {
      ...cron,
      estado: cron.estado === "stopped" ? "stopped" : "paused",
      segmentoInicio: null,
    };
  }
  const t0 = Date.parse(cron.segmentoInicio);
  const ctx = await cargarContextoHorarioParaRango(t0, ahora.getTime());
  const extra = Number.isNaN(t0)
    ? 0
    : segundosLaborablesEntre(t0, ahora.getTime(), ctx.horarios, ctx.festivos);
  return {
    estado: "paused",
    segmentoInicio: null,
    acumuladoSeg: cron.acumuladoSeg + Math.max(0, extra),
  };
}

export async function detenerCronometroLaboral(
  cron: CronometroSolicitud,
  ahora = new Date(),
): Promise<CronometroSolicitud> {
  if (cron.estado === "stopped") {
    return { estado: "stopped", segmentoInicio: null, acumuladoSeg: cron.acumuladoSeg };
  }
  if (cron.estado === "running" && cron.segmentoInicio) {
    const pausado = await pausarCronometroLaboral(cron, ahora);
    return { ...pausado, estado: "stopped" };
  }
  return { estado: "stopped", segmentoInicio: null, acumuladoSeg: cron.acumuladoSeg };
}
