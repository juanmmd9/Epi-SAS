import { supabase } from "../../services/supabase";
import { calcularProximoPm, compararCodigoPc } from "./computadoresUtil";
import type {
  Computador,
  ComputadorDatos,
  ComputadorInput,
  ComputadorPieza,
  ComputadorPiezaInput,
  ComputadorPm,
  ComputadorPmInput,
  MotivoPieza,
  TipoComputador,
} from "./types";

const TABLA = "computadores";
const TABLA_PM = "computadores_pm";
const TABLA_PIEZAS = "computadores_piezas";

function normalizarDatos(raw: unknown): ComputadorDatos {
  if (!raw || typeof raw !== "object") return {};
  return raw as ComputadorDatos;
}

function normalizarComputador(fila: Record<string, unknown>): Computador {
  const tipo = String(fila.tipo ?? "escritorio") as TipoComputador;
  return {
    id: String(fila.id),
    codigo: String(fila.codigo ?? ""),
    ubicacion: String(fila.ubicacion ?? ""),
    tipo: tipo === "portatil" || tipo === "otro" ? tipo : "escritorio",
    usuario_asignado: String(fila.usuario_asignado ?? ""),
    frecuencia_pm_meses: Number(fila.frecuencia_pm_meses) || 6,
    ultimo_pm: fila.ultimo_pm ? String(fila.ultimo_pm).slice(0, 10) : null,
    proximo_pm: fila.proximo_pm ? String(fila.proximo_pm).slice(0, 10) : null,
    activa: fila.activa !== false,
    datos: normalizarDatos(fila.datos),
    creado_en: String(fila.creado_en ?? ""),
    actualizado_en: String(fila.actualizado_en ?? ""),
  };
}

function payloadComputador(input: ComputadorInput) {
  const ultimo = input.ultimo_pm?.trim() || null;
  const proximo =
    input.proximo_pm?.trim() ||
    calcularProximoPm(ultimo, input.frecuencia_pm_meses);
  return {
    codigo: input.codigo.trim(),
    ubicacion: input.ubicacion.trim(),
    tipo: input.tipo,
    usuario_asignado: input.usuario_asignado.trim(),
    frecuencia_pm_meses: input.frecuencia_pm_meses,
    ultimo_pm: ultimo,
    proximo_pm: proximo,
    datos: input.datos ?? {},
    actualizado_en: new Date().toISOString(),
  };
}

export async function listarComputadores(): Promise<Computador[]> {
  const { data, error } = await supabase.from(TABLA).select("*");
  if (error) throw new Error(error.message);
  return (data ?? [])
    .map((f) => normalizarComputador(f as Record<string, unknown>))
    .sort((a, b) => compararCodigoPc(a.codigo, b.codigo));
}

export async function obtenerComputador(id: string): Promise<Computador | null> {
  const { data, error } = await supabase.from(TABLA).select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalizarComputador(data as Record<string, unknown>) : null;
}

export async function crearComputador(input: ComputadorInput): Promise<Computador> {
  const { data, error } = await supabase
    .from(TABLA)
    .insert(payloadComputador(input))
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return normalizarComputador(data as Record<string, unknown>);
}

export async function actualizarComputador(
  id: string,
  input: ComputadorInput,
): Promise<Computador> {
  const { data, error } = await supabase
    .from(TABLA)
    .update(payloadComputador(input))
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return normalizarComputador(data as Record<string, unknown>);
}

export async function cambiarEstadoComputador(
  computador: Computador,
  activa: boolean,
  motivo = "",
): Promise<Computador> {
  const datos: ComputadorDatos = { ...computador.datos };
  if (!activa) {
    datos.fechaBaja = new Date().toISOString().slice(0, 10);
    datos.motivoBaja = motivo.trim();
  } else {
    delete datos.fechaBaja;
    delete datos.motivoBaja;
  }
  const { data, error } = await supabase
    .from(TABLA)
    .update({
      activa,
      datos,
      actualizado_en: new Date().toISOString(),
    })
    .eq("id", computador.id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return normalizarComputador(data as Record<string, unknown>);
}

export async function eliminarComputador(id: string): Promise<void> {
  const { error } = await supabase.from(TABLA).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function importarComputadores(
  items: ComputadorInput[],
): Promise<{ creados: number }> {
  if (items.length === 0) return { creados: 0 };
  const filas = items.map((item) => ({
    ...payloadComputador(item),
    activa: true,
  }));
  const { data, error } = await supabase.from(TABLA).insert(filas).select("id");
  if (error) throw new Error(error.message);
  return { creados: data?.length ?? filas.length };
}

function normalizarPm(fila: Record<string, unknown>): ComputadorPm {
  return {
    id: String(fila.id),
    computador_id: String(fila.computador_id),
    fecha: String(fila.fecha).slice(0, 10),
    tecnico: String(fila.tecnico ?? ""),
    actividades: String(fila.actividades ?? ""),
    observaciones: String(fila.observaciones ?? ""),
    creado_en: String(fila.creado_en ?? ""),
  };
}

export async function listarPmComputador(computadorId: string): Promise<ComputadorPm[]> {
  const { data, error } = await supabase
    .from(TABLA_PM)
    .select("*")
    .eq("computador_id", computadorId)
    .order("fecha", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((f) => normalizarPm(f as Record<string, unknown>));
}

export async function crearPmComputador(
  computadorId: string,
  input: ComputadorPmInput,
  frecuenciaMeses: number,
): Promise<{ pm: ComputadorPm; computador: Computador }> {
  const fecha = input.fecha.slice(0, 10);
  const { data, error } = await supabase
    .from(TABLA_PM)
    .insert({
      computador_id: computadorId,
      fecha,
      tecnico: input.tecnico.trim(),
      actividades: input.actividades.trim(),
      observaciones: input.observaciones.trim(),
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  const proximo = calcularProximoPm(fecha, frecuenciaMeses);
  const { data: pc, error: errorPc } = await supabase
    .from(TABLA)
    .update({
      ultimo_pm: fecha,
      proximo_pm: proximo,
      actualizado_en: new Date().toISOString(),
    })
    .eq("id", computadorId)
    .select("*")
    .single();
  if (errorPc) throw new Error(errorPc.message);

  return {
    pm: normalizarPm(data as Record<string, unknown>),
    computador: normalizarComputador(pc as Record<string, unknown>),
  };
}

export async function eliminarPmComputador(id: string): Promise<void> {
  const { error } = await supabase.from(TABLA_PM).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

function normalizarPieza(fila: Record<string, unknown>): ComputadorPieza {
  const motivo = String(fila.motivo ?? "falla") as MotivoPieza;
  return {
    id: String(fila.id),
    computador_id: String(fila.computador_id),
    fecha: String(fila.fecha).slice(0, 10),
    tipo_pieza: String(fila.tipo_pieza ?? ""),
    detalle: String(fila.detalle ?? ""),
    serial: String(fila.serial ?? ""),
    motivo:
      motivo === "upgrade" || motivo === "preventivo" || motivo === "otro" ? motivo : "falla",
    tecnico: String(fila.tecnico ?? ""),
    notas: String(fila.notas ?? ""),
    creado_en: String(fila.creado_en ?? ""),
  };
}

export async function listarPiezasComputador(
  computadorId: string,
): Promise<ComputadorPieza[]> {
  const { data, error } = await supabase
    .from(TABLA_PIEZAS)
    .select("*")
    .eq("computador_id", computadorId)
    .order("fecha", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((f) => normalizarPieza(f as Record<string, unknown>));
}

export async function listarPiezasTodas(): Promise<ComputadorPieza[]> {
  const { data, error } = await supabase
    .from(TABLA_PIEZAS)
    .select("*")
    .order("fecha", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((f) => normalizarPieza(f as Record<string, unknown>));
}

export async function crearPiezaComputador(
  computadorId: string,
  input: ComputadorPiezaInput,
): Promise<ComputadorPieza> {
  const { data, error } = await supabase
    .from(TABLA_PIEZAS)
    .insert({
      computador_id: computadorId,
      fecha: input.fecha.slice(0, 10),
      tipo_pieza: input.tipo_pieza.trim(),
      detalle: input.detalle.trim(),
      serial: input.serial.trim(),
      motivo: input.motivo,
      tecnico: input.tecnico.trim(),
      notas: input.notas.trim(),
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return normalizarPieza(data as Record<string, unknown>);
}

export async function eliminarPiezaComputador(id: string): Promise<void> {
  const { error } = await supabase.from(TABLA_PIEZAS).delete().eq("id", id);
  if (error) throw new Error(error.message);
}
