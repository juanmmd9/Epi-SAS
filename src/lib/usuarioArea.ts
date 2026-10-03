import type { UsuarioPortal } from "../modules/auth/roles";
import { coincideArea, esAreaValida, normalizarArea } from "./areas";

/** El nombre «Portal Mantenimiento» queda para Mantenimiento y el resto del equipo. Diseño no lo ve. */
export function muestraPortalMantenimiento(perfil: UsuarioPortal | null | undefined): boolean {
  if (!perfil) return true;
  const area = areaUsuario(perfil);
  if (
    area &&
    coincideArea(area, "Diseno y Desarrollo") &&
    (perfil.rol === "lider" || perfil.rol === "solicitante")
  ) {
    return false;
  }
  if (perfil.rol !== "lider") return true;
  return coincideArea(area ?? "", "Mantenimiento");
}
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
 * Solicitante, líder, admin y operador: cualquier área (un perfil puede atender todas).
 */
export function usuarioPuedeEscribirEnArea(
  perfil: UsuarioPortal | null | undefined,
  _area: string,
): boolean {
  if (!perfil) return false;
  return (
    perfil.rol === "admin" ||
    perfil.rol === "operador" ||
    perfil.rol === "solicitante" ||
    perfil.rol === "lider"
  );
}

/** Roles de planta que reportan fallas (avisos locales en solicitudes). */
export function esRolReportaSolicitudes(
  perfil: UsuarioPortal | null | undefined,
): boolean {
  return perfil?.rol === "solicitante" || perfil?.rol === "lider";
}

export function rutaSolicitudesArea(area: string): string {
  return `/solicitudes/area/${encodeURIComponent(area)}`;
}
