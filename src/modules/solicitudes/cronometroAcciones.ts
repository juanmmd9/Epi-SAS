import {
  actualizarDatosCorrectivo,
  obtenerCorrectivo,
} from "../correctivo/correctivoService";
import type { RegistroCorrectivo } from "../correctivo/types";
import {
  detenerCronometroLaboral,
  pausarCronometroLaboral,
} from "./cronometroLaboral";
import {
  iniciarCronometro,
  leerCronometro,
  reanudarCronometro,
  type CronometroSolicitud,
} from "./cronometroSolicitud";

/**
 * Al atender una solicitud: inicia o reanuda el cronómetro.
 * No arranca si está cerrada o en espera de repuesto.
 */
export async function iniciarCronometroAlAtender(
  correctivoId: string,
): Promise<RegistroCorrectivo> {
  const reg = await obtenerCorrectivo(correctivoId);
  if (!reg) throw new Error("Solicitud no encontrada.");
  if (reg.datos.fechaCierre?.trim()) return reg;
  if (reg.datos.esperaRepuesto) return reg;

  const cron = leerCronometro(reg.datos);
  if (cron.estado === "running") return reg;
  if (cron.estado === "stopped") return reg;

  const next =
    cron.estado === "paused" ? reanudarCronometro(cron) : iniciarCronometro(cron);

  return actualizarDatosCorrectivo(correctivoId, { cronometro: next });
}

/** Marca espera de repuesto y pausa el tiempo (solo suma jornada laboral). */
export async function marcarEsperaYPausarCronometro(
  correctivoId: string,
): Promise<RegistroCorrectivo> {
  const reg = await obtenerCorrectivo(correctivoId);
  if (!reg) throw new Error("Solicitud no encontrada.");
  if (reg.datos.fechaCierre?.trim()) {
    throw new Error("La solicitud ya está cerrada.");
  }

  const cron = leerCronometro(reg.datos);
  let next: CronometroSolicitud;
  if (cron.estado === "running") {
    next = await pausarCronometroLaboral(cron);
  } else if (cron.estado === "stopped") {
    next = cron;
  } else {
    next = {
      estado: "paused",
      segmentoInicio: null,
      acumuladoSeg: cron.acumuladoSeg,
    };
  }

  return actualizarDatosCorrectivo(correctivoId, {
    esperaRepuesto: true,
    cronometro: next,
  });
}

/** Quita espera de repuesto y reanuda el cronómetro. */
export async function quitarEsperaYReanudarCronometro(
  correctivoId: string,
): Promise<RegistroCorrectivo> {
  const reg = await obtenerCorrectivo(correctivoId);
  if (!reg) throw new Error("Solicitud no encontrada.");
  if (reg.datos.fechaCierre?.trim()) {
    throw new Error("La solicitud ya está cerrada.");
  }

  const cron = leerCronometro(reg.datos);
  const next =
    cron.estado === "paused" || cron.estado === "idle"
      ? reanudarCronometro({ ...cron, estado: cron.estado === "idle" ? "paused" : cron.estado })
      : cron;

  return actualizarDatosCorrectivo(correctivoId, {
    esperaRepuesto: false,
    cronometro: next.estado === "running" ? next : reanudarCronometro(cron),
  });
}

/** Al cerrar: congela tiempo solo de jornada laboral. */
export async function detenerCronometroAlCerrar(
  correctivoId: string,
): Promise<RegistroCorrectivo> {
  const reg = await obtenerCorrectivo(correctivoId);
  if (!reg) throw new Error("Solicitud no encontrada.");
  const cron = leerCronometro(reg.datos);
  const next = await detenerCronometroLaboral(cron);
  return actualizarDatosCorrectivo(correctivoId, { cronometro: next });
}
