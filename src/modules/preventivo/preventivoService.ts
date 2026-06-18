import { supabase } from "../../services/supabase";
import type { PreventivoInput, RegistroPreventivo } from "./types";

const TABLA = "preventivo";

export async function listarPreventivo(): Promise<RegistroPreventivo[]> {
  const { data, error } = await supabase
    .from(TABLA)
    .select("*")
    .order("fecha", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as RegistroPreventivo[];
}

export async function crearPreventivo(input: PreventivoInput): Promise<RegistroPreventivo> {
  const { personal_id, ...resto } = input;
  const payload: Record<string, unknown> = { ...resto, adjunto_url: null };
  if (personal_id) payload.personal_id = personal_id;

  let { data, error } = await supabase.from(TABLA).insert(payload).select().single();
  if (error && personal_id && /personal_id|personal/i.test(error.message)) {
    ({ data, error } = await supabase
      .from(TABLA)
      .insert({ ...resto, adjunto_url: null })
      .select()
      .single());
  }
  if (error) throw new Error(error.message);
  return data as RegistroPreventivo;
}

export async function actualizarPreventivo(
  id: string,
  cambios: Partial<PreventivoInput>,
): Promise<RegistroPreventivo> {
  const { data, error } = await supabase
    .from(TABLA)
    .update(cambios)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as RegistroPreventivo;
}

export async function eliminarPreventivo(id: string): Promise<void> {
  const { error } = await supabase.from(TABLA).delete().eq("id", id);
  if (error) throw new Error(error.message);
}
