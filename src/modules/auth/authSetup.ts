import sqlAuth from "../../../supabase/migrations/auth_usuarios.sql?raw";

/** Script completo para aplicar RLS por roles en Supabase SQL Editor. */
export const SQL_MIGRACION_AUTH = sqlAuth;

export function faltaTablaUsuarios(mensaje: string): boolean {
  return /usuarios_portal|schema cache|does not exist/i.test(mensaje);
}
