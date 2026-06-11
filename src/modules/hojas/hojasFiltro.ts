import { areaTienePreventivo, coincideArea, normalizarArea } from "../../lib/areas";
import type { HojaVida } from "./types";

export function hojaEstaActiva(hoja: HojaVida): boolean {
  return hoja.activa !== false;
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
  return {
    ...hoja,
    area: normalizarArea(hoja.area) || hoja.area,
    activa: hoja.activa !== false,
    datos: hoja.datos ?? {},
  };
}
