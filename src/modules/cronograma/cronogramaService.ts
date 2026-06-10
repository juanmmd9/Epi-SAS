import { supabase } from "../../services/supabase";
import { aFechaIso } from "../../lib/fechas";
import type { ExcepcionCronograma, ExcepcionDatos } from "./types";

const TABLA = "cronograma_excepciones";

export async function listarExcepciones(): Promise<ExcepcionCronograma[]> {
  const { data, error } = await supabase.from(TABLA).select("*");
  if (error) throw new Error(error.message);
  return (data ?? []) as ExcepcionCronograma[];
}

export async function crearExcepcion(
  datos: ExcepcionDatos,
  motivo?: string,
): Promise<ExcepcionCronograma> {
  const { data, error } = await supabase
    .from(TABLA)
    .insert({
      fecha: aFechaIso(datos.anio, datos.mes, datos.dia),
      motivo: motivo ?? null,
      datos,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ExcepcionCronograma;
}

export async function eliminarExcepcion(id: string): Promise<void> {
  const { error } = await supabase.from(TABLA).delete().eq("id", id);
  if (error) throw new Error(error.message);
}
