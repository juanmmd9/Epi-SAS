import { supabase } from "../../services/supabase";
import type { AreaTrabajoReporte, ReporteProduccionDatos } from "./reporteProduccionDatos";

const TABLA = "reportes_produccion_tejidos";

export type RegistroReporteProduccion = {
  id: string;
  creado_en: string;
  fecha: string;
  area_trabajo: AreaTrabajoReporte;
  datos: ReporteProduccionDatos;
};

export async function listarReportesProduccion(): Promise<RegistroReporteProduccion[]> {
  const { data, error } = await supabase
    .from(TABLA)
    .select("*")
    .order("fecha", { ascending: false })
    .order("creado_en", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as RegistroReporteProduccion[];
}

export async function guardarReporteProduccion(
  datos: ReporteProduccionDatos,
  editandoId: string | null,
): Promise<RegistroReporteProduccion> {
  const payload = {
    fecha: datos.fecha,
    area_trabajo: datos.areaTrabajo,
    datos,
  };
  if (editandoId) {
    const { data, error } = await supabase
      .from(TABLA)
      .update(payload)
      .eq("id", editandoId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as RegistroReporteProduccion;
  }
  const { data, error } = await supabase.from(TABLA).insert(payload).select().single();
  if (error) throw new Error(error.message);
  return data as RegistroReporteProduccion;
}

export async function eliminarReporteProduccion(id: string): Promise<void> {
  const { error } = await supabase.from(TABLA).delete().eq("id", id);
  if (error) throw new Error(error.message);
}
