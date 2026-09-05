import { supabase } from "../../services/supabase";
import { faltaTablaPersonal } from "./personalSetup";
import type { Persona, PersonaInput } from "./types";

const TABLA = "personal";

export async function existeTablaPersonal(): Promise<boolean> {
  const { error } = await supabase.from(TABLA).select("id").limit(1);
  if (!error) return true;
  if (faltaTablaPersonal(error.message)) return false;
  throw new Error(error.message);
}

export async function listarPersonal(): Promise<Persona[]> {
  const { data, error } = await supabase
    .from(TABLA)
    .select("*")
    .order("nombre", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Persona[];
}

export async function listarPersonalActivo(): Promise<Persona[]> {
  const { data, error } = await supabase
    .from(TABLA)
    .select("*")
    .eq("activo", true)
    .order("nombre", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Persona[];
}

export async function crearPersona(input: PersonaInput): Promise<Persona> {
  const { data, error } = await supabase
    .from(TABLA)
    .insert({ ...input, activo: true })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Persona;
}

export async function actualizarPersona(
  id: string,
  cambios: Partial<PersonaInput> & { activo?: boolean },
): Promise<Persona> {
  const { data, error } = await supabase
    .from(TABLA)
    .update(cambios)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Persona;
}

export async function eliminarPersona(id: string): Promise<void> {
  const { error } = await supabase.from(TABLA).delete().eq("id", id);
  if (error) throw new Error(error.message);
}
