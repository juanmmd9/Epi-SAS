import { supabase } from "../../services/supabase";
import type { RolPortal, UsuarioPortal } from "./roles";

const TABLA = "usuarios_portal";

export async function listarUsuariosPortal(): Promise<UsuarioPortal[]> {
  const { data, error } = await supabase
    .from(TABLA)
    .select("id, email, nombre, rol, personal_id, area, activo")
    .order("nombre");

  if (error) throw new Error(error.message);
  return (data ?? []).map((fila) => ({
    ...(fila as UsuarioPortal),
    area: (fila as UsuarioPortal).area ?? null,
  }));
}

export interface NuevoPerfilInput {
  id: string;
  email: string;
  nombre: string;
  rol: RolPortal;
  personal_id?: string | null;
  area?: string | null;
}

export async function crearPerfilUsuario(input: NuevoPerfilInput): Promise<void> {
  const { error } = await supabase.from(TABLA).insert({
    id: input.id.trim(),
    email: input.email.trim(),
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
