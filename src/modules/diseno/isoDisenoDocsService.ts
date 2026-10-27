import { supabase } from "../../services/supabase";

const BUCKET = "adjuntos-preventivo";
const CARPETA = "evidencias-diseno-iso";
const TAMANO_MAX = 20 * 1024 * 1024;

/** Sube un documento de evidencia del gestor ISO 8.3. */
export async function subirDocumentoIsoDiseno(
  lineaId: string,
  projectId: string,
  formatCode: string,
  archivo: File,
): Promise<string> {
  if (archivo.size > TAMANO_MAX) {
    throw new Error(`"${archivo.name}" supera 20 MB.`);
  }
  const extension = archivo.name.split(".").pop()?.toLowerCase().replace(/[^\w]/g, "") || "bin";
  const seguro = archivo.name.replace(/[^\w.\-()+ ]/g, "_").slice(0, 80);
  const ruta = `${CARPETA}/${lineaId}/${projectId}/${formatCode}/${crypto.randomUUID()}-${seguro || `doc.${extension}`}`;
  const { error } = await supabase.storage.from(BUCKET).upload(ruta, archivo, {
    cacheControl: "3600",
    upsert: false,
    contentType: archivo.type || undefined,
  });
  if (error) {
    if (/bucket not found/i.test(error.message)) {
      throw new Error("No existe el almacén de archivos en Supabase.");
    }
    if (/row-level security|policy|permission/i.test(error.message)) {
      throw new Error("Sin permiso para subir el documento de diseño.");
    }
    throw new Error(error.message);
  }
  return supabase.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl;
}
