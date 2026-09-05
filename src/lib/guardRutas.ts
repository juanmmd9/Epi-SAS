import type { Permiso } from "../modules/auth/roles";

/** Permiso mínimo para acceder a una ruta del portal. */
export function permisoParaRuta(pathname: string): Permiso | null {
  if (pathname === "/" || pathname === "") return "ver.inicio";
  if (pathname.startsWith("/solicitudes")) return "ver.solicitudes";
  if (pathname.startsWith("/preventivo")) return "ver.preventivo";
  if (pathname.startsWith("/correctivo")) return "ver.correctivo";
  if (pathname.startsWith("/hojas-de-vida")) return "ver.hojas";
  if (pathname.startsWith("/computadores")) return "ver.computadores";
  if (pathname.startsWith("/indicadores")) return "ver.indicadores";
  if (pathname.startsWith("/formatos/gh-re-030")) return "crear.permisos";
  if (pathname.startsWith("/formatos")) return "ver.formatos";
  if (pathname === "/personal/usuarios") return "gestionar.usuarios";
  if (pathname.startsWith("/personal/permisos")) return "ver.permisos";
  if (pathname.startsWith("/personal/matriz")) return "ver.matriz";
  if (pathname.startsWith("/personal/horario")) return "ver.horario";
  if (pathname.startsWith("/personal")) return "ver.personal";
  return null;
}
