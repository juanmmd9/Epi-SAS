import type { UsuarioPortal } from "../modules/auth/roles";
import { esAreaValida, normalizarArea } from "./areas";

/** Área asignada al usuario (catálogo del sistema). Opcional / informativa. */
export function areaUsuario(perfil: UsuarioPortal | null | undefined): string | null {
  const area = perfil?.area?.trim();
  if (!area) return null;
  const canonica = normalizarArea(area);
  return esAreaValida(canonica) ? canonica : null;
}

/** Todos los roles autenticados ven el tablero de áreas. */
export function usuarioVeTodasLasAreas(perfil: UsuarioPortal | null | undefined): boolean {
  return Boolean(perfil);
}

/** Puede entrar al detalle de un área. */
export function usuarioPuedeAccederArea(
  perfil: UsuarioPortal | null | undefined,
  _area: string,
): boolean {
  return Boolean(perfil);
}

/**
 * Puede crear/editar solicitudes o repuestos en esa área.
 * Solicitante, admin y operador: cualquier área (un perfil puede atender todas).
 */
export function usuarioPuedeEscribirEnArea(
  perfil: UsuarioPortal | null | undefined,
  _area: string,
): boolean {
  if (!perfil) return false;
  return perfil.rol === "admin" || perfil.rol === "operador" || perfil.rol === "solicitante";
}

export function rutaSolicitudesArea(area: string): string {
  return `/solicitudes/area/${encodeURIComponent(area)}`;
}
