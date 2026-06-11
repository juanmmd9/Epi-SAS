import { supabase } from "../../services/supabase";
import type { PreventivoInput, RegistroPreventivo } from "./types";

const TABLA = "preventivo";
const BUCKET = "adjuntos-preventivo";

export const EXTENSIONES_ADJUNTO = [".pdf", ".doc", ".docx"];
export const MAX_ADJUNTO_BYTES = 5 * 1024 * 1024;

export function esAdjuntoValido(archivo: File): boolean {
  const nombre = archivo.name.toLowerCase();
  return EXTENSIONES_ADJUNTO.some((ext) => nombre.endsWith(ext));
}

export async function listarPreventivo(): Promise<RegistroPreventivo[]> {
  const { data, error } = await supabase
    .from(TABLA)
    .select("*")
    .order("fecha", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as RegistroPreventivo[];
}

export async function subirAdjunto(archivo: File): Promise<string> {
  const extension = archivo.name.split(".").pop() || "pdf";
  const ruta = `adjuntos/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(BUCKET).upload(ruta, archivo);
  if (error) throw new Error(error.message);
  return supabase.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl;
}

export async function crearPreventivo(
  input: PreventivoInput,
  adjuntoUrl: string,
): Promise<RegistroPreventivo> {
  const { personal_id, ...resto } = input;
  const payload: Record<string, unknown> = { ...resto, adjunto_url: adjuntoUrl };
  if (personal_id) payload.personal_id = personal_id;

  let { data, error } = await supabase.from(TABLA).insert(payload).select().single();
  if (error && personal_id && /personal_id|personal/i.test(error.message)) {
    ({ data, error } = await supabase
      .from(TABLA)
      .insert({ ...resto, adjunto_url: adjuntoUrl })
      .select()
      .single());
  }
  if (error) throw new Error(error.message);
  return data as RegistroPreventivo;
}

export async function actualizarPreventivo(
  id: string,
  cambios: Partial<PreventivoInput> & { adjunto_url?: string },
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
