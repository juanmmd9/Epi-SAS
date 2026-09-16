import { supabase } from "../../services/supabase";
import type { RepuestoInput, RepuestoSolicitud } from "./types";

const TABLA = "solicitudes_repuestos";

export async function listarRepuestos(): Promise<RepuestoSolicitud[]> {
  const { data, error } = await supabase
    .from(TABLA)
    .select("*")
    .order("creado_en", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as RepuestoSolicitud[];
}

export async function crearRepuesto(input: RepuestoInput): Promise<RepuestoSolicitud> {
  const { data, error } = await supabase.from(TABLA).insert(input).select().single();
  if (error) throw new Error(error.message);
  return data as RepuestoSolicitud;
}

export async function actualizarRepuesto(
  id: string,
  input: RepuestoInput,
): Promise<RepuestoSolicitud> {
  const { data, error } = await supabase
    .from(TABLA)
    .update({ ...input, actualizado_en: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as RepuestoSolicitud;
}

export async function eliminarRepuesto(id: string): Promise<void> {
  const { error } = await supabase.from(TABLA).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function existeTablaRepuestos(): Promise<boolean> {
  const { error } = await supabase.from(TABLA).select("id").limit(1);
  if (!error) return true;
  if (/relation|does not exist|schema cache/i.test(error.message)) return false;
  throw new Error(error.message);
}
