import { registroPerteneceAlArea } from "../../lib/usuarioArea";
import { supabase } from "../../services/supabase";
import type { RegistroAm, RegistroAmDatos } from "./gcre001Types";

const TABLA = "acciones_mejora";

export async function listarAccionesMejora(area: string | null): Promise<RegistroAm[]> {
  if (!area) return [];
  const { data, error } = await supabase
    .from(TABLA)
    .select("*")
    .order("numero", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as RegistroAm[]).filter((registro) =>
    registroPerteneceAlArea(registro.datos?.areaPortal, area),
  );
}

export async function guardarAccionMejora(
  datos: RegistroAmDatos,
  editandoId: string | null,
  areaPortal: string,
): Promise<RegistroAm> {
  const conArea = { ...datos, areaPortal };
  if (editandoId) {
    const { data, error } = await supabase
      .from(TABLA)
      .update({ datos: conArea })
      .eq("id", editandoId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as RegistroAm;
  }

  const { data, error } = await supabase.from(TABLA).insert({ datos: conArea }).select().single();
  if (error) throw new Error(error.message);
  return data as RegistroAm;
}

export async function eliminarAccionMejora(id: string): Promise<void> {
  const { error } = await supabase.from(TABLA).delete().eq("id", id);
  if (error) throw new Error(error.message);
}
