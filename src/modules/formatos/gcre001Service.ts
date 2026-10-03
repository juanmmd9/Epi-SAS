import { supabase } from "../../services/supabase";
import type { RegistroAm, RegistroAmDatos } from "./gcre001Types";

const TABLA = "acciones_mejora";

export async function listarAccionesMejora(): Promise<RegistroAm[]> {
  const { data, error } = await supabase
    .from(TABLA)
    .select("*")
    .order("numero", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as RegistroAm[];
}

export async function guardarAccionMejora(
  datos: RegistroAmDatos,
  editandoId: string | null,
): Promise<RegistroAm> {
  if (editandoId) {
    const { data, error } = await supabase
      .from(TABLA)
      .update({ datos })
      .eq("id", editandoId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as RegistroAm;
  }

  const { data, error } = await supabase.from(TABLA).insert({ datos }).select().single();
  if (error) throw new Error(error.message);
  return data as RegistroAm;
}

export async function eliminarAccionMejora(id: string): Promise<void> {
  const { error } = await supabase.from(TABLA).delete().eq("id", id);
  if (error) throw new Error(error.message);
}
