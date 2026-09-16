import { supabase } from "../../services/supabase";
import type { RegistroNc, RegistroNcDatos } from "./types";

const TABLA = "no_conformidades";

export async function listarNoConformidades(): Promise<RegistroNc[]> {
  const { data, error } = await supabase
    .from(TABLA)
    .select("*")
    .order("numero", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as RegistroNc[];
}

export async function guardarNoConformidad(
  datos: RegistroNcDatos,
  editandoId: string | null,
): Promise<RegistroNc> {
  if (editandoId) {
    const { data, error } = await supabase
      .from(TABLA)
      .update({ datos })
      .eq("id", editandoId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as RegistroNc;
  }

  const { data, error } = await supabase.from(TABLA).insert({ datos }).select().single();
  if (error) throw new Error(error.message);
  return data as RegistroNc;
}

export async function eliminarNoConformidad(id: string): Promise<void> {
  const { error } = await supabase.from(TABLA).delete().eq("id", id);
  if (error) throw new Error(error.message);
}
