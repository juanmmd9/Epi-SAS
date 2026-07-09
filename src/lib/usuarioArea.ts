import type { UsuarioPortal } from "../modules/auth/roles";
import { coincideArea, esAreaValida, normalizarArea } from "./areas";

/** Área asignada al usuario (catálogo del sistema). */
export function areaUsuario(perfil: UsuarioPortal | null | undefined): string | null {
  const area = perfil?.area?.trim();
  if (!area) return null;
  const canonica = normalizarArea(area);
  return esAreaValida(canonica) ? canonica : null;
}

/** Admin y mantenimiento ven todas las áreas; solicitante también ve el tablero, pero solo escribe en la suya. */
export function usuarioVeTodasLasAreas(perfil: UsuarioPortal | null | undefined): boolean {
  return Boolean(perfil);
}

/** Puede entrar a ver el detalle de un área (solicitante: todas; escritura solo en la suya). */
export function usuarioPuedeAccederArea(
  perfil: UsuarioPortal | null | undefined,
  _area: string,
): boolean {
  return Boolean(perfil);
}

/** Puede crear/editar solicitudes o repuestos en esa área. */
export function usuarioPuedeEscribirEnArea(
  perfil: UsuarioPortal | null | undefined,
  area: string,
): boolean {
  if (!perfil) return false;
  if (perfil.rol !== "solicitante") return true;
  const asignada = areaUsuario(perfil);
  return asignada !== null && coincideArea(asignada, area);
}

export function rutaSolicitudesArea(area: string): string {
  return `/solicitudes/area/${encodeURIComponent(area)}`;
}
