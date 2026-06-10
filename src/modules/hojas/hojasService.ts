import { supabase } from "../../services/supabase";
import type { HojaVida, HojaVidaDatos, HojaVidaInput } from "./types";

const TABLA = "hojas_vida";
const BUCKET = "adjuntos-preventivo";
const CARPETA_FOTOS = "fotos-hojas";

export async function listarHojas(): Promise<HojaVida[]> {
  const { data, error } = await supabase
    .from(TABLA)
    .select("*")
    .order("creado_en", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as HojaVida[];
}

export async function subirFotoMaquina(archivo: File): Promise<string> {
  const extension = archivo.name.split(".").pop() || "jpg";
  const ruta = `${CARPETA_FOTOS}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(BUCKET).upload(ruta, archivo);
  if (error) throw new Error(error.message);
  return supabase.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl;
}

export async function crearHoja(
  input: HojaVidaInput,
  fotoUrl: string | null,
): Promise<HojaVida> {
  const { data, error } = await supabase
    .from(TABLA)
    .insert({ ...input, foto_url: fotoUrl, activa: true })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as HojaVida;
}

export async function actualizarHoja(
  id: string,
  cambios: Partial<HojaVidaInput> & { foto_url?: string | null },
): Promise<HojaVida> {
  const { data, error } = await supabase
    .from(TABLA)
    .update({ ...cambios, actualizado_en: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as HojaVida;
}

export async function cambiarEstadoHoja(
  hoja: HojaVida,
  activa: boolean,
  motivoBaja?: string,
): Promise<HojaVida> {
  const datos: HojaVidaDatos = { ...hoja.datos };
  if (activa) {
    delete datos.fechaBaja;
    delete datos.motivoBaja;
  } else {
    datos.fechaBaja = new Date().toISOString().slice(0, 10);
    datos.motivoBaja = motivoBaja ?? "";
  }
  const { data, error } = await supabase
    .from(TABLA)
    .update({ activa, datos, actualizado_en: new Date().toISOString() })
    .eq("id", hoja.id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as HojaVida;
}

export async function eliminarHoja(id: string): Promise<void> {
  const { error } = await supabase.from(TABLA).delete().eq("id", id);
  if (error) throw new Error(error.message);
}
