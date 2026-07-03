import type { UsuarioPortal } from "../modules/auth/roles";
import { coincideArea, esAreaValida, normalizarArea } from "./areas";

/** Área asignada al usuario (catálogo del sistema). */
export function areaUsuario(perfil: UsuarioPortal | null | undefined): string | null {
  const area = perfil?.area?.trim();
  if (!area) return null;
  const canonica = normalizarArea(area);
  return esAreaValida(canonica) ? canonica : null;
}

/** Admin y mantenimiento ven todas las áreas; solicitante solo la suya. */
export function usuarioVeTodasLasAreas(perfil: UsuarioPortal | null | undefined): boolean {
  if (!perfil) return false;
  return perfil.rol !== "solicitante";
}

export function usuarioPuedeAccederArea(
  perfil: UsuarioPortal | null | undefined,
  area: string,
): boolean {
  if (!perfil) return false;
  if (usuarioVeTodasLasAreas(perfil)) return true;
  const asignada = areaUsuario(perfil);
  return asignada !== null && coincideArea(asignada, area);
}

export function rutaSolicitudesArea(area: string): string {
  return `/solicitudes/area/${encodeURIComponent(area)}`;
}
