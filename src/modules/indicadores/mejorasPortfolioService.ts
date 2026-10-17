import { supabase } from "../../services/supabase";
import type { MejoraPortfolio, MejoraPortfolioInput } from "./mejorasPortfolioTypes";
import { normalizarDatosMejora } from "./mejorasPortfolioTypes";

const TABLA = "mejoras_portfolio";
const BUCKET = "adjuntos-preventivo";
const CARPETA = "fotos-mejoras";

function normalizarFila(item: MejoraPortfolio): MejoraPortfolio {
  return {
    ...item,
    datos: normalizarDatosMejora(item.datos ?? {}),
  };
}

export async function listarMejorasPortfolio(): Promise<MejoraPortfolio[]> {
  const { data, error } = await supabase
    .from(TABLA)
    .select("*")
    .order("fecha", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((item) => normalizarFila(item as MejoraPortfolio));
}

export async function crearMejoraPortfolio(input: MejoraPortfolioInput): Promise<MejoraPortfolio> {
  const { data, error } = await supabase
    .from(TABLA)
    .insert({
      titulo: input.titulo,
      area: input.area,
      fecha: input.fecha,
      datos: input.datos,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return normalizarFila(data as MejoraPortfolio);
}

export async function actualizarMejoraPortfolio(
  id: string,
  input: MejoraPortfolioInput,
): Promise<MejoraPortfolio> {
  const { data, error } = await supabase
    .from(TABLA)
    .update({
      titulo: input.titulo,
      area: input.area,
      fecha: input.fecha,
      datos: input.datos,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return normalizarFila(data as MejoraPortfolio);
}

export async function eliminarMejoraPortfolio(id: string): Promise<void> {
  const { error } = await supabase.from(TABLA).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function subirFotoMejora(archivo: File): Promise<string> {
  const extension = archivo.name.split(".").pop() || "jpg";
  const ruta = `${CARPETA}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(BUCKET).upload(ruta, archivo);
  if (error) throw new Error(error.message);
  return supabase.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl;
}
