import type { RegistroPreventivo } from "./types";

/** Estados de trazabilidad / firma del líder sobre el MT-RE-045. */
export type EstadoAprobacionPm =
  | "pendiente_aprobacion"
  | "aprobado"
  | "rechazado";

export const ETIQUETAS_ESTADO_APROBACION_PM: Record<EstadoAprobacionPm, string> = {
  pendiente_aprobacion: "Pendiente de aprobación",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
};

/**
 * Registros antiguos sin campo = ya cerrados (compatibilidad).
 * Nuevos registros nacen en pendiente_aprobacion.
 */
export function estadoAprobacionPm(registro: RegistroPreventivo): EstadoAprobacionPm {
  const estado = registro.datos.estadoAprobacion;
  if (estado === "pendiente_aprobacion" || estado === "aprobado" || estado === "rechazado") {
    return estado;
  }
  return "aprobado";
}

/** Solo PM aprobado cuenta para cronograma / indicadores de cumplimiento. */
export function pmCuentaParaCronograma(registro: RegistroPreventivo): boolean {
  return estadoAprobacionPm(registro) === "aprobado";
}

export function esPendienteAprobacionPm(registro: RegistroPreventivo): boolean {
  return estadoAprobacionPm(registro) === "pendiente_aprobacion";
}

export function puedeReeditarPmTrasRechazo(registro: RegistroPreventivo): boolean {
  return estadoAprobacionPm(registro) === "rechazado";
}
