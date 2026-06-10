import { supabase } from "../../services/supabase";
import { generarPdfGcRe009, nombreArchivoPdf, pdfBytesABlob } from "./gcre009Pdf";
import type { RegistroNc, RegistroNcDatos } from "./types";

const TABLA = "no_conformidades";
const BUCKET = "pdfs-nc";

export async function listarNoConformidades(): Promise<RegistroNc[]> {
  const { data, error } = await supabase
    .from(TABLA)
    .select("*")
    .order("numero", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as RegistroNc[];
}

async function subirPdf(id: string, numero: number, pdfBytes: Uint8Array): Promise<string> {
  const ruta = `${id}/${nombreArchivoPdf(numero)}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(ruta, pdfBytesABlob(pdfBytes), { contentType: "application/pdf", upsert: true });
  if (error) throw new Error(error.message);
  return supabase.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl;
}

export async function guardarNoConformidad(
  datos: RegistroNcDatos,
  editandoId: string | null,
): Promise<{ registro: RegistroNc; pdfBytes: Uint8Array }> {
  let registro: RegistroNc;

  if (editandoId) {
    const { data, error } = await supabase
      .from(TABLA)
      .update({ datos })
      .eq("id", editandoId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    registro = data as RegistroNc;
  } else {
    const { data, error } = await supabase
      .from(TABLA)
      .insert({ datos })
      .select()
      .single();
    if (error) throw new Error(error.message);
    registro = data as RegistroNc;
  }

  const pdfBytes = await generarPdfGcRe009(datos, registro.numero);
  const pdfUrl = await subirPdf(registro.id, registro.numero, pdfBytes);

  const { data: actualizado, error: errorUpdate } = await supabase
    .from(TABLA)
    .update({ pdf_url: pdfUrl })
    .eq("id", registro.id)
    .select()
    .single();
  if (errorUpdate) throw new Error(errorUpdate.message);

  return { registro: actualizado as RegistroNc, pdfBytes };
}

export async function eliminarNoConformidad(id: string, pdfUrl: string | null): Promise<void> {
  if (pdfUrl) {
    const ruta = pdfUrl.split(`${BUCKET}/`)[1];
    if (ruta) await supabase.storage.from(BUCKET).remove([ruta]);
  }
  const { error } = await supabase.from(TABLA).delete().eq("id", id);
  if (error) throw new Error(error.message);
}
