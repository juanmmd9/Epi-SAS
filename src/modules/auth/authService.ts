import { supabase } from "../../services/supabase";
import { emailAuthDesdeUsuario, esUsuarioValido, normalizarUsuario } from "./loginUsuario";
import type { UsuarioPortal } from "./roles";

const TABLA = "usuarios_portal";

export async function obtenerPerfilUsuario(userId: string): Promise<UsuarioPortal | null> {
  const { data, error } = await supabase
    .from(TABLA)
    .select("id, usuario, email, nombre, rol, personal_id, area, activo")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }

  if (!data || !data.activo) return null;
  return {
    ...(data as UsuarioPortal),
    usuario: (data as UsuarioPortal).usuario ?? "",
    area: (data as UsuarioPortal).area ?? null,
  };
}

/**
 * Resuelve el email de Auth: correo tal cual, o usuario → email en BD
 * (Gmail de admins, o usuario@epi.local de operarios nuevos).
 */
async function resolverEmailAuth(loginRaw: string): Promise<string> {
  const login = loginRaw.trim().toLowerCase();
  if (!login) throw new Error("Escribe tu usuario o correo.");

  // Correo completo (cuentas actuales con Gmail / @epi.com)
  if (login.includes("@")) return login;

  const { data, error } = await supabase.rpc("email_auth_por_login", { p_login: login });
  if (!error && typeof data === "string" && data.trim()) {
    return data.trim().toLowerCase();
  }

  // Operario nuevo aún no visible en caché: convenio sintético
  if (esUsuarioValido(normalizarUsuario(login))) {
    return emailAuthDesdeUsuario(login);
  }

  throw new Error("Usuario o correo no válido.");
}

export async function iniciarSesion(usuarioOCorreo: string, password: string): Promise<void> {
  const email = await resolverEmailAuth(usuarioOCorreo);

  await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

export async function cerrarSesion(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) throw new Error(error.message);
}

export async function existeTablaUsuarios(): Promise<boolean> {
  const { error } = await supabase.from(TABLA).select("id").limit(1);
  if (!error) return true;
  if (/usuarios_portal|schema cache|does not exist/i.test(error.message)) return false;
  throw new Error(error.message);
}
