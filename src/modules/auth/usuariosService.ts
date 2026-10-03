import { supabase } from "../../services/supabase";
import { emailAuthDesdeUsuario, esUsuarioValido, normalizarUsuario } from "./loginUsuario";
import type { RolPortal, UsuarioPortal } from "./roles";

const TABLA = "usuarios_portal";

function mensajeErrorFuncion(data: unknown, error: { message: string } | null): string | null {
  if (data && typeof data === "object" && "error" in data) {
    const msg = String((data as { error: unknown }).error ?? "").trim();
    if (msg) return msg;
  }
  if (error?.message) return error.message;
  return null;
}

export async function listarUsuariosPortal(): Promise<UsuarioPortal[]> {
  const { data, error } = await supabase
    .from(TABLA)
    .select("id, usuario, email, nombre, rol, personal_id, area, activo")
    .order("nombre");

  if (error) throw new Error(error.message);
  return (data ?? []).map((fila) => ({
    ...(fila as UsuarioPortal),
    usuario: (fila as UsuarioPortal).usuario ?? "",
    area: (fila as UsuarioPortal).area ?? null,
  }));
}

export interface NuevoUsuarioPortalInput {
  usuario: string;
  password: string;
  nombre: string;
  rol: RolPortal;
  personal_id?: string | null;
  area?: string | null;
}

/** Crea Auth + perfil vía Edge Function (solo admin). */
export async function crearUsuarioPortalCompleto(
  input: NuevoUsuarioPortalInput,
): Promise<{ id: string; usuario: string }> {
  const usuario = normalizarUsuario(input.usuario);
  if (!esUsuarioValido(usuario)) {
    throw new Error(
      "Usuario inválido. Usa 2–63 caracteres: letras minúsculas, números, punto, guion o guion bajo.",
    );
  }
  if (input.password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres.");
  }

  let data: unknown = null;
  let error: { message: string } | null = null;
  try {
    // Nombre real en Supabase Dashboard (slug de la función desplegada)
    const res = await supabase.functions.invoke("bright-api", {
      body: {
        usuario,
        password: input.password,
        nombre: input.nombre.trim(),
        rol: input.rol,
        personal_id: input.personal_id || null,
        area: input.area?.trim() || null,
      },
    });
    data = res.data;
    error = res.error;
  } catch (e) {
    throw new Error(
      "No se pudo contactar la Edge Function (bright-api). " +
        "Revisa en Supabase → Edge Functions que esté desplegada. " +
        "Detalle: " +
        (e as Error).message,
    );
  }

  const mensajeError = mensajeErrorFuncion(data, error);
  if (mensajeError) {
    if (/failed to send a request to the edge function/i.test(mensajeError)) {
      throw new Error(
        "La función bright-api no responde. Revisa Edge Functions en Supabase " +
          "y que el slug coincida con el del portal.",
      );
    }
    throw new Error(mensajeError);
  }

  return {
    id: String((data as { id: string }).id),
    usuario: String((data as { usuario: string }).usuario ?? usuario),
  };
}

/** @deprecated Preferir crearUsuarioPortalCompleto. Solo perfil si Auth ya existe. */
export interface NuevoPerfilInput {
  id: string;
  usuario: string;
  email?: string;
  nombre: string;
  rol: RolPortal;
  personal_id?: string | null;
  area?: string | null;
}

export async function crearPerfilUsuario(input: NuevoPerfilInput): Promise<void> {
  const usuario = normalizarUsuario(input.usuario);
  const { error } = await supabase.from(TABLA).insert({
    id: input.id.trim(),
    usuario,
    email: input.email?.trim() || emailAuthDesdeUsuario(usuario),
    nombre: input.nombre.trim(),
    rol: input.rol,
    personal_id: input.personal_id || null,
    area: input.area?.trim() || null,
    activo: true,
  });

  if (error) throw new Error(error.message);
}

export interface ActualizarPerfilInput {
  nombre: string;
  rol: RolPortal;
  personal_id: string | null;
  area: string | null;
  activo: boolean;
}

export async function actualizarPerfilUsuario(
  id: string,
  input: ActualizarPerfilInput,
): Promise<void> {
  const { error } = await supabase
    .from(TABLA)
    .update({
      nombre: input.nombre.trim(),
      rol: input.rol,
      personal_id: input.personal_id,
      area: input.area?.trim() || null,
      activo: input.activo,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export function esUuidValido(valor: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    valor.trim(),
  );
}
