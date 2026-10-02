import { coincideArea } from "../../lib/areas";
import { supabase } from "../../services/supabase";
import type { UsuarioPortal } from "../auth/roles";

/** Perfiles activos del área, sin la cuenta del director. */
export async function listarRegistradosDelArea(
  area: string,
  excluirId: string,
): Promise<UsuarioPortal[]> {
  const { data, error } = await supabase
    .from("usuarios_portal")
    .select("id, usuario, email, nombre, rol, personal_id, area, activo")
    .eq("activo", true)
    .order("nombre");

  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((fila) => ({
      ...(fila as UsuarioPortal),
      usuario: (fila as UsuarioPortal).usuario ?? "",
      area: (fila as UsuarioPortal).area ?? null,
    }))
    .filter(
      (persona) =>
        persona.id !== excluirId && coincideArea(persona.area ?? "", area),
    );
}
