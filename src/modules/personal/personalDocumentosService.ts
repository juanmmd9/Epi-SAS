import { supabase } from "../../services/supabase";
import {
  esTipoDocumentoPersonal,
  type DocumentoPersonal,
  type TipoDocumentoPersonal,
} from "./personalDocumentos";

const TABLA = "personal_documentos";
const BUCKET = "adjuntos-preventivo";
const CARPETA = "personal-documentos";
const TAMANO_MAXIMO = 20 * 1024 * 1024;

export function faltaTablaDocumentosPersonal(mensaje: string): boolean {
  return /personal_documentos|schema cache|relation.*does not exist/i.test(mensaje);
}

function extensionDe(archivo: File): string {
  const desdeNombre = archivo.name.split(".").pop()?.toLowerCase().replace(/[^\w]/g, "") ?? "";
  return desdeNombre || "bin";
}

function rutaDesdeUrl(url: string): string | null {
  const marca = `/${BUCKET}/`;
  const indice = url.indexOf(marca);
  if (indice < 0) return null;
  return decodeURIComponent(url.slice(indice + marca.length).split("?")[0] ?? "");
}

export async function listarDocumentosPersonal(personalId: string): Promise<DocumentoPersonal[]> {
  const { data, error } = await supabase
    .from(TABLA)
    .select("*")
    .eq("personal_id", personalId)
    .order("subido_en", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as DocumentoPersonal[]).filter((doc) => esTipoDocumentoPersonal(doc.tipo));
}

export async function subirDocumentoPersonal(
  personalId: string,
  tipo: TipoDocumentoPersonal,
  archivo: File,
): Promise<DocumentoPersonal> {
  if (archivo.size > TAMANO_MAXIMO) {
    throw new Error(`"${archivo.name}" supera 20 MB.`);
  }
  const ruta = `${CARPETA}/${personalId}/${tipo}/${crypto.randomUUID()}.${extensionDe(archivo)}`;
  const { error: errorArchivo } = await supabase.storage.from(BUCKET).upload(ruta, archivo, {
    cacheControl: "3600",
    upsert: false,
    contentType: archivo.type || undefined,
  });
  if (errorArchivo) {
    if (/bucket not found/i.test(errorArchivo.message)) {
      throw new Error("No existe el almacén de archivos en Supabase.");
    }
    throw new Error(errorArchivo.message);
  }
  const url = supabase.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl;
  const { data, error } = await supabase
    .from(TABLA)
    .insert({
      personal_id: personalId,
      tipo,
      nombre: archivo.name,
      url,
    })
    .select()
    .single();
  if (error) {
    await supabase.storage.from(BUCKET).remove([ruta]);
    throw new Error(error.message);
  }
  return data as DocumentoPersonal;
}

export async function eliminarDocumentoPersonal(documento: DocumentoPersonal): Promise<void> {
  const ruta = rutaDesdeUrl(documento.url);
  if (ruta) {
    await supabase.storage.from(BUCKET).remove([ruta]);
  }
  const { error } = await supabase.from(TABLA).delete().eq("id", documento.id);
  if (error) throw new Error(error.message);
}
