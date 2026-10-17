import { areaTienePreventivo, coincideArea, normalizarArea } from "../../lib/areas";
import type { HojaVida } from "./types";

export function hojaEstaActiva(hoja: HojaVida): boolean {
  return hoja.activa !== false;
}

/** Texto legible del estado de circulación. */
export function etiquetaCirculacion(hoja: HojaVida): string {
  if (hojaEstaActiva(hoja)) return "En circulación";
  if (hoja.datos.fechaBaja) {
    return `Fuera de circulación desde ${hoja.datos.fechaBaja}`;
  }
  return "Fuera de circulación";
}

export function filtrarHojasPorArea(hojas: HojaVida[], area: string): HojaVida[] {
  if (!area) return [];
  return hojas.filter((h) => coincideArea(h.area, area));
}

/** Máquinas disponibles al registrar PM en un área. */
export function filtrarHojasParaPreventivo(
  hojas: HojaVida[],
  area: string,
  maquinaSeleccionadaId = "",
): HojaVida[] {
  return filtrarHojasPorArea(hojas, area)
    .filter((h) => areaTienePreventivo(h.area))
    .filter((h) => h.id === maquinaSeleccionadaId || hojaEstaActiva(h))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export function normalizarHojaDesdeDb(hoja: HojaVida): HojaVida {
  let datos: HojaVida["datos"] = hoja.datos ?? {};
  if (typeof datos === "string") {
    try {
      datos = JSON.parse(datos) as HojaVida["datos"];
    } catch {
      datos = {};
    }
  }

  const activa = hoja.activa === undefined || hoja.activa === null ? true : Boolean(hoja.activa);

  // Si está activa, ignorar fecha de baja residual (p. ej. tras reactivar)
  if (activa && (datos.fechaBaja || datos.motivoBaja)) {
    datos = { ...datos };
    delete datos.fechaBaja;
    delete datos.motivoBaja;
  }

  return {
    ...hoja,
    area: normalizarArea(hoja.area) || hoja.area,
    activa,
    datos,
  };
}
