import { supabase } from "../../services/supabase";
import { normalizarArea } from "../../lib/areas";
import type { RegistroCorrectivo } from "../correctivo/types";
import type { RegistroPreventivo } from "../preventivo/types";
import type { HojaVida, HojaVidaDatos, HojaVidaInput } from "./types";
import { normalizarHojaDesdeDb } from "./hojasFiltro";

const TABLA = "hojas_vida";
const BUCKET = "adjuntos-preventivo";
const CARPETA_FOTOS = "fotos-hojas";

function normalizarInput(input: HojaVidaInput): HojaVidaInput {
  return {
    ...input,
    area: normalizarArea(input.area) || input.area,
  };
}

export async function listarHojas(): Promise<HojaVida[]> {
  const { data, error } = await supabase
    .from(TABLA)
    .select("*")
    .order("creado_en", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((item) => normalizarHojaDesdeDb(item as HojaVida));
}

export async function obtenerHojaPorId(id: string): Promise<HojaVida | null> {
  const { data, error } = await supabase.from(TABLA).select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalizarHojaDesdeDb(data as HojaVida) : null;
}

export interface HistorialMaquina {
  preventivos: RegistroPreventivo[];
  correctivos: RegistroCorrectivo[];
}

function coincideCorrectivoConHoja(hoja: HojaVida, registro: RegistroCorrectivo): boolean {
  const datos = registro.datos;
  if (datos.maquinaId === hoja.id) return true;
  const codigoHoja = (hoja.codigo || "").trim().toLowerCase();
  const codigoRegistro = (datos.codigoMaquina || "").trim().toLowerCase();
  if (codigoHoja && codigoRegistro === codigoHoja) return true;
  const nombreHoja = hoja.nombre.trim().toLowerCase();
  const nombreRegistro = (datos.maquinaEquipoLocacion || "").trim().toLowerCase();
  return Boolean(nombreHoja && nombreRegistro === nombreHoja);
}

export async function obtenerHistorialMaquina(hoja: HojaVida): Promise<HistorialMaquina> {
  const [preventivoRes, correctivoRes] = await Promise.all([
    supabase
      .from("preventivo")
      .select("*")
      .eq("hoja_id", hoja.id)
      .order("fecha", { ascending: false }),
    supabase.from("correctivo").select("*").order("fecha", { ascending: false }),
  ]);

  if (preventivoRes.error) throw new Error(preventivoRes.error.message);
  if (correctivoRes.error) throw new Error(correctivoRes.error.message);

  const correctivos = ((correctivoRes.data ?? []) as RegistroCorrectivo[]).filter((registro) =>
    coincideCorrectivoConHoja(hoja, registro),
  );

  return {
    preventivos: (preventivoRes.data ?? []) as RegistroPreventivo[],
    correctivos,
  };
}

export async function subirFotoMaquina(archivo: File): Promise<string> {
  const extension = archivo.name.split(".").pop()?.toLowerCase() || "jpg";
  const ruta = `${CARPETA_FOTOS}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(BUCKET).upload(ruta, archivo, {
    cacheControl: "3600",
    upsert: false,
    contentType: archivo.type || `image/${extension === "jpg" ? "jpeg" : extension}`,
  });
  if (error) {
    if (/bucket not found/i.test(error.message)) {
      throw new Error(
        "No existe el bucket de archivos en Supabase. Ejecuta la migración hojas_vida_fotos_storage.sql en SQL Editor.",
      );
    }
    if (/row-level security|policy|permission/i.test(error.message)) {
      throw new Error(
        "Sin permiso para subir archivos. Ejecuta hojas_vida_fotos_storage.sql en Supabase (Storage + RLS).",
      );
    }
    throw new Error(error.message);
  }
  return supabase.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl;
}

export async function crearHoja(
  input: HojaVidaInput,
  fotoUrl: string | null,
): Promise<HojaVida> {
  const payload = normalizarInput(input);
  const { data, error } = await supabase
    .from(TABLA)
    .insert({ ...payload, foto_url: fotoUrl, activa: true })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return normalizarHojaDesdeDb(data as HojaVida);
}

export async function actualizarHoja(
  id: string,
  cambios: Partial<HojaVidaInput> & { foto_url?: string | null },
): Promise<HojaVida> {
  const payload = cambios.area
    ? { ...cambios, area: normalizarArea(cambios.area) || cambios.area }
    : cambios;
  const { data, error } = await supabase
    .from(TABLA)
    .update({ ...payload, actualizado_en: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return normalizarHojaDesdeDb(data as HojaVida);
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
  return normalizarHojaDesdeDb(data as HojaVida);
}

export async function eliminarHoja(id: string): Promise<void> {
  const { error } = await supabase.from(TABLA).delete().eq("id", id);
  if (error) throw new Error(error.message);
}
