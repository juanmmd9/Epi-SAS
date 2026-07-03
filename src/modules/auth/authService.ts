import { supabase } from "../../services/supabase";
import type { UsuarioPortal } from "./roles";

const TABLA = "usuarios_portal";

export async function obtenerPerfilUsuario(userId: string): Promise<UsuarioPortal | null> {
  const { data, error } = await supabase
    .from(TABLA)
    .select("id, email, nombre, rol, personal_id, area, activo")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }

  if (!data || !data.activo) return null;
  return { ...(data as UsuarioPortal), area: (data as UsuarioPortal).area ?? null };
}

export async function iniciarSesion(email: string, password: string): Promise<void> {
  // Cierra cualquier sesión previa en este navegador antes de entrar con otra cuenta.
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
