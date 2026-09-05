import { supabase } from "../../services/supabase";
import { festivosColombiaAnio } from "./festivosDefaults";
import { horarioEstandarAnio } from "./horarioDefaults";
import { faltaTablaPermisos } from "./permisosSetup";
import type { Festivo, HorarioLaboral, HorarioLaboralInput } from "./types";

const TABLA_HORARIO = "horario_laboral";
const TABLA_FESTIVOS = "festivos";

function normalizarHora(valor: string): string {
  return valor.slice(0, 5);
}

function mapHorario(fila: HorarioLaboral): HorarioLaboral {
  return {
    ...fila,
    hora_inicio: normalizarHora(fila.hora_inicio),
    hora_fin: normalizarHora(fila.hora_fin),
  };
}

export async function existeTablaHorario(): Promise<boolean> {
  const { error } = await supabase.from(TABLA_HORARIO).select("id").limit(1);
  if (!error) return true;
  if (faltaTablaPermisos(error.message)) return false;
  throw new Error(error.message);
}

export async function listarHorarioAnio(anio: number): Promise<HorarioLaboral[]> {
  const { data, error } = await supabase
    .from(TABLA_HORARIO)
    .select("*")
    .eq("anio", anio)
    .order("dia_semana")
    .order("turno");
  if (error) throw new Error(error.message);
  return (data ?? []).map((fila) => mapHorario(fila as HorarioLaboral));
}

export async function guardarHorario(fila: HorarioLaboralInput & { id?: string }): Promise<HorarioLaboral> {
  const payload = {
    anio: fila.anio,
    dia_semana: fila.dia_semana,
    turno: fila.turno,
    hora_inicio: fila.hora_inicio,
    hora_fin: fila.hora_fin,
    activo: fila.activo,
  };

  if (fila.id) {
    const { data, error } = await supabase
      .from(TABLA_HORARIO)
      .update(payload)
      .eq("id", fila.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapHorario(data as HorarioLaboral);
  }

  const { data, error } = await supabase
    .from(TABLA_HORARIO)
    .upsert(payload, { onConflict: "anio,dia_semana,turno" })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapHorario(data as HorarioLaboral);
}

export async function inicializarHorarioEstandar(anio: number): Promise<number> {
  const existentes = await listarHorarioAnio(anio);
  if (existentes.length > 0) return existentes.length;

  const filas = horarioEstandarAnio(anio);
  const { error } = await supabase.from(TABLA_HORARIO).insert(filas);
  if (error) throw new Error(error.message);
  return filas.length;
}

export async function listarFestivosAnio(anio: number): Promise<Festivo[]> {
  const { data, error } = await supabase
    .from(TABLA_FESTIVOS)
    .select("*")
    .eq("anio", anio)
    .order("fecha");
  if (error) {
    if (faltaTablaPermisos(error.message)) return [];
    throw new Error(error.message);
  }
  return (data ?? []) as Festivo[];
}

export async function crearFestivo(
  anio: number,
  fecha: string,
  descripcion: string,
): Promise<Festivo> {
  const { data, error } = await supabase
    .from(TABLA_FESTIVOS)
    .upsert(
      { anio, fecha, descripcion: descripcion.trim() || null },
      { onConflict: "anio,fecha" },
    )
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Festivo;
}

export async function eliminarFestivo(id: string): Promise<void> {
  const { error } = await supabase.from(TABLA_FESTIVOS).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function inicializarFestivosColombia(anio: number): Promise<number> {
  const existentes = await listarFestivosAnio(anio);
  const fechasExistentes = new Set(existentes.map((f) => f.fecha.slice(0, 10)));
  const catalogo = festivosColombiaAnio(anio).filter((f) => !fechasExistentes.has(f.fecha));

  if (catalogo.length === 0) return 0;

  const filas = catalogo.map((f) => ({
    anio,
    fecha: f.fecha,
    descripcion: f.descripcion,
  }));

  const { error } = await supabase.from(TABLA_FESTIVOS).insert(filas);
  if (error) throw new Error(error.message);
  return filas.length;
}
