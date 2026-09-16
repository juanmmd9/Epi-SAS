import type { CorrectivoDatos } from "../correctivo/types";

export type CronometroEstado = "idle" | "running" | "paused" | "stopped";

export interface CronometroSolicitud {
  estado: CronometroEstado;
  /** ISO del inicio del segmento en curso (solo si running). */
  segmentoInicio: string | null;
  /** Segundos activos acumulados (sin el segmento actual). */
  acumuladoSeg: number;
}

export function cronometroVacio(): CronometroSolicitud {
  return { estado: "idle", segmentoInicio: null, acumuladoSeg: 0 };
}

export function leerCronometro(datos: CorrectivoDatos | undefined): CronometroSolicitud {
  const c = datos?.cronometro;
  if (!c || typeof c !== "object") return cronometroVacio();
  return {
    estado: c.estado ?? "idle",
    segmentoInicio: c.segmentoInicio ?? null,
    acumuladoSeg: Number.isFinite(c.acumuladoSeg) ? Math.max(0, c.acumuladoSeg) : 0,
  };
}

export function segundosActivosAhora(
  cron: CronometroSolicitud,
  ahora = Date.now(),
): number {
  let total = cron.acumuladoSeg;
  if (cron.estado === "running" && cron.segmentoInicio) {
    const t0 = Date.parse(cron.segmentoInicio);
    if (!Number.isNaN(t0)) {
      total += Math.max(0, Math.floor((ahora - t0) / 1000));
    }
  }
  return total;
}

export function formatearDuracion(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const seg = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(seg).padStart(2, "0")}`;
  }
  return `${m}:${String(seg).padStart(2, "0")}`;
}

export function etiquetaEstadoCronometro(estado: CronometroEstado): string {
  switch (estado) {
    case "running":
      return "En curso";
    case "paused":
      return "Pausado (repuesto)";
    case "stopped":
      return "Finalizado";
    default:
      return "Sin iniciar";
  }
}

function congelarSegmento(cron: CronometroSolicitud, ahoraIso: string): CronometroSolicitud {
  if (cron.estado !== "running" || !cron.segmentoInicio) {
    return { ...cron, segmentoInicio: null };
  }
  const extra = segundosActivosAhora(cron, Date.parse(ahoraIso)) - cron.acumuladoSeg;
  return {
    estado: cron.estado,
    segmentoInicio: null,
    acumuladoSeg: cron.acumuladoSeg + Math.max(0, extra),
  };
}

export function iniciarCronometro(
  cron: CronometroSolicitud,
  ahora = new Date(),
): CronometroSolicitud {
  if (cron.estado === "stopped") return cron;
  if (cron.estado === "running") return cron;
  return {
    estado: "running",
    segmentoInicio: ahora.toISOString(),
    acumuladoSeg: cron.acumuladoSeg,
  };
}

export function pausarCronometro(
  cron: CronometroSolicitud,
  ahora = new Date(),
): CronometroSolicitud {
  if (cron.estado !== "running") {
    return { ...cron, estado: cron.estado === "stopped" ? "stopped" : "paused", segmentoInicio: null };
  }
  const frozen = congelarSegmento(cron, ahora.toISOString());
  return { ...frozen, estado: "paused" };
}

export function reanudarCronometro(
  cron: CronometroSolicitud,
  ahora = new Date(),
): CronometroSolicitud {
  if (cron.estado === "stopped") return cron;
  if (cron.estado === "running") return cron;
  return {
    estado: "running",
    segmentoInicio: ahora.toISOString(),
    acumuladoSeg: cron.acumuladoSeg,
  };
}

export function detenerCronometro(
  cron: CronometroSolicitud,
  ahora = new Date(),
): CronometroSolicitud {
  if (cron.estado === "stopped") {
    return { estado: "stopped", segmentoInicio: null, acumuladoSeg: cron.acumuladoSeg };
  }
  if (cron.estado === "running") {
    const frozen = congelarSegmento(cron, ahora.toISOString());
    return { estado: "stopped", segmentoInicio: null, acumuladoSeg: frozen.acumuladoSeg };
  }
  return { estado: "stopped", segmentoInicio: null, acumuladoSeg: cron.acumuladoSeg };
}

/** Ajusta el cronómetro al guardar esperaRepuesto / cierre. */
export function sincronizarCronometroAlGuardar(
  cron: CronometroSolicitud,
  opts: { esperaRepuesto: boolean; cerrada: boolean; habiaAsignado?: boolean },
): CronometroSolicitud {
  if (opts.cerrada) return detenerCronometro(cron);
  if (opts.esperaRepuesto) {
    if (cron.estado === "running") return pausarCronometro(cron);
    if (cron.estado === "idle" && opts.habiaAsignado) {
      return { ...cron, estado: "paused" };
    }
    return cron.estado === "idle" ? cron : { ...cron, estado: "paused", segmentoInicio: null };
  }
  // Sin espera: si estaba pausado, reanudar; si idle con asignación, iniciar
  if (cron.estado === "paused") return reanudarCronometro(cron);
  if (cron.estado === "idle" && opts.habiaAsignado) return iniciarCronometro(cron);
  return cron;
}
