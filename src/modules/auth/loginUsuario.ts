/** Dominio interno de Auth; el usuario nunca lo ve ni lo escribe. */
export const DOMINIO_AUTH_INTERNO = "epi.local";

const RE_USUARIO = /^[a-z0-9][a-z0-9._-]{1,62}$/;

/** Normaliza el login: minúsculas, sin espacios. */
export function normalizarUsuario(valor: string): string {
  return valor.trim().toLowerCase();
}

export function esUsuarioValido(valor: string): boolean {
  return RE_USUARIO.test(normalizarUsuario(valor));
}

/** Email sintético que Supabase Auth exige por debajo. */
export function emailAuthDesdeUsuario(usuario: string): string {
  return `${normalizarUsuario(usuario)}@${DOMINIO_AUTH_INTERNO}`;
}

/** Extrae el usuario de un email Auth interno; si no coincide, null. */
export function usuarioDesdeEmailAuth(email: string): string | null {
  const correo = email.trim().toLowerCase();
  const sufijo = `@${DOMINIO_AUTH_INTERNO}`;
  if (!correo.endsWith(sufijo)) return null;
  const usuario = correo.slice(0, -sufijo.length);
  return esUsuarioValido(usuario) ? usuario : null;
}
