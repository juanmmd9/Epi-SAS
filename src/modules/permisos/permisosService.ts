import { supabase } from "../../services/supabase";
import { recalcularDatosPermiso } from "./permisosCalculo";
import { faltaTablaPermisos } from "./permisosSetup";
import type { EstadoPermiso, PermisoDatos, RegistroPermiso } from "./types";

const TABLA = "permisos_personal";

export async function existeTablaPermisos(): Promise<boolean> {
  const { error } = await supabase.from(TABLA).select("id").limit(1);
  if (!error) return true;
  if (faltaTablaPermisos(error.message)) return false;
  throw new Error(error.message);
}

export async function listarPermisos(): Promise<RegistroPermiso[]> {
  const { data, error } = await supabase
    .from(TABLA)
    .select("*")
    .order("creado_en", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as RegistroPermiso[];
}

export async function listarPermisosPorPersonal(personalId: string): Promise<RegistroPermiso[]> {
  const { data, error } = await supabase
    .from(TABLA)
    .select("*")
    .eq("personal_id", personalId)
    .order("creado_en", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as RegistroPermiso[];
}

export async function guardarPermiso(
  personalId: string,
  datos: PermisoDatos,
  estado: EstadoPermiso,
  editandoId: string | null,
): Promise<RegistroPermiso> {
  const datosFinales = recalcularDatosPermiso(datos);

  if (editandoId) {
    const { data, error } = await supabase
      .from(TABLA)
      .update({ datos: datosFinales, estado, personal_id: personalId })
      .eq("id", editandoId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as RegistroPermiso;
  }

  const { data, error } = await supabase
    .from(TABLA)
    .insert({ personal_id: personalId, datos: datosFinales, estado })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as RegistroPermiso;
}

export async function actualizarEstadoPermiso(
  id: string,
  estado: EstadoPermiso,
): Promise<RegistroPermiso> {
  const { data, error } = await supabase
    .from(TABLA)
    .update({ estado })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as RegistroPermiso;
}

export async function eliminarPermiso(id: string): Promise<void> {
  const { error } = await supabase.from(TABLA).delete().eq("id", id);
  if (error) throw new Error(error.message);
}
