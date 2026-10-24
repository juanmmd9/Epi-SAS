import { supabase } from "../../services/supabase";

const TABLA = "horas_programadas";

export interface HorasProgramadas {
  id: string;
  periodo: string; // YYYY-MM
  area: string;
  horas: number;
}

export function periodoDe(anio: number, mes: number): string {
  return `${anio}-${String(mes).padStart(2, "0")}`;
}

export async function listarHorasProgramadas(): Promise<HorasProgramadas[]> {
  const { data, error } = await supabase.from(TABLA).select("*");
  if (error) throw new Error(error.message);
  return (data ?? []) as HorasProgramadas[];
}

export async function guardarHorasProgramadas(
  anio: number,
  mes: number,
  area: string,
  horas: number,
): Promise<HorasProgramadas> {
  const { data, error } = await supabase
    .from(TABLA)
    .upsert(
      { periodo: periodoDe(anio, mes), area, horas },
      { onConflict: "periodo,area" },
    )
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as HorasProgramadas;
}
