import { supabase } from "../../services/supabase";
import { documentoInicial, normalizarDocumento, type DocumentoMatriz } from "./matrizRiesgos";

const TABLA = "matriz_riesgos_portal";
const ID = "mantenimiento";
const LOCAL = "gc-do-007-mantenimiento";

function leerLocal(): DocumentoMatriz | null {
  try {
    const texto = localStorage.getItem(LOCAL);
    if (!texto) return null;
    return normalizarDocumento(JSON.parse(texto));
  } catch {
    return null;
  }
}

function guardarLocal(doc: DocumentoMatriz) {
  localStorage.setItem(LOCAL, JSON.stringify(doc));
}

function faltaTabla(mensaje: string): boolean {
  return /matriz_riesgos_portal|schema cache|relation.*does not exist/i.test(mensaje);
}

export async function cargarMatriz(): Promise<DocumentoMatriz> {
  const { data, error } = await supabase
    .from(TABLA)
    .select("datos")
    .eq("id", ID)
    .maybeSingle();

  if (error) {
    if (faltaTabla(error.message)) return leerLocal() ?? documentoInicial();
    const local = leerLocal();
    if (local) return local;
    throw new Error(error.message);
  }

  const guardado = normalizarDocumento(data?.datos);
  if (guardado && guardado.filas.length > 0) {
    guardarLocal(guardado);
    return guardado;
  }

  const inicial = leerLocal() ?? documentoInicial();
  await guardarMatriz(inicial);
  return inicial;
}

export async function guardarMatriz(doc: DocumentoMatriz): Promise<void> {
  guardarLocal(doc);
  const { error } = await supabase.from(TABLA).upsert({
    id: ID,
    datos: doc,
    actualizado_en: new Date().toISOString(),
  });
  if (error && !faltaTabla(error.message)) throw new Error(error.message);
}
