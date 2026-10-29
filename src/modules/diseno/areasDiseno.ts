import { AREAS_MAPA_PROCESOS } from "../../lib/areas";

/** Áreas que ve Diseño en el menú. La propia no va: ya entra con ese usuario. */
export const AREAS_MENU_DISENO = AREAS_MAPA_PROCESOS.filter(
  (area) => area !== "Diseno y Desarrollo",
);

export function rutaMenuArea(area: string): string {
  return `/diseno/areas/${encodeURIComponent(area)}`;
}
