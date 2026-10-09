import { supabase } from "../../services/supabase";
import { normalizarDatosNc, type RegistroNc, type RegistroNcDatos } from "./types";

const TABLA = "no_conformidades";
const BUCKET = "adjuntos-preventivo";
const CARPETA = "evidencias-nc";

function normalizarRegistro(fila: RegistroNc): RegistroNc {
  return { ...fila, datos: normalizarDatosNc(fila.datos ?? {}) };
}

export async function listarNoConformidades(): Promise<RegistroNc[]> {
  const { data, error } = await supabase
    .from(TABLA)
    .select("*")
    .order("numero", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((fila) => normalizarRegistro(fila as RegistroNc));
}

export async function subirEvidenciaNc(archivo: File): Promise<string> {
  const extension = archivo.name.split(".").pop()?.toLowerCase().replace(/[^\w]/g, "") || "bin";
  const ruta = `${CARPETA}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(BUCKET).upload(ruta, archivo, {
    cacheControl: "3600",
    upsert: false,
    contentType: archivo.type || undefined,
  });
  if (error) {
    if (/bucket not found/i.test(error.message)) {
      throw new Error(
        "No existe el almacén de archivos. Ejecuta la migración de Storage en Supabase.",
      );
    }
    if (/row-level security|policy|permission/i.test(error.message)) {
      throw new Error("Sin permiso para subir la evidencia.");
    }
    throw new Error(error.message);
  }
  return supabase.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl;
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
    return normalizarRegistro(data as RegistroNc);
  }

  const { data, error } = await supabase.from(TABLA).insert({ datos }).select().single();
  if (error) throw new Error(error.message);
  return normalizarRegistro(data as RegistroNc);
}

export async function eliminarNoConformidad(id: string): Promise<void> {
  const { error } = await supabase.from(TABLA).delete().eq("id", id);
  if (error) throw new Error(error.message);
}
