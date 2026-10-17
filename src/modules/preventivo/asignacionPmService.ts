import { supabase } from "../../services/supabase";
import type { Persona } from "../personal/types";
import type { UsuarioPortal } from "../auth/roles";
import type { AsignacionPm, AsignacionPmInput, OperarioAsignable } from "./asignacionPmTypes";

const TABLA = "preventivo_asignaciones";

export async function existeTablaAsignacionesPm(): Promise<boolean> {
  const { error } = await supabase.from(TABLA).select("id").limit(1);
  if (!error) return true;
  if (/does not exist|relation|schema cache/i.test(error.message)) return false;
  throw new Error(error.message);
}

/** Asignaciones del año (por fecha programada). Puede haber varias filas por cita. */
export async function listarAsignacionesPm(anio: number): Promise<AsignacionPm[]> {
  const desde = `${anio}-01-01`;
  const hasta = `${anio}-12-31`;
  const { data, error } = await supabase
    .from(TABLA)
    .select("*")
    .gte("fecha_programada", desde)
    .lte("fecha_programada", hasta)
    .order("fecha_programada");
  if (error) throw new Error(error.message);
  return (data ?? []) as AsignacionPm[];
}

/** @deprecated Preferir guardarAsignacionesPm (varios operarios). */
export async function guardarAsignacionPm(input: AsignacionPmInput): Promise<AsignacionPm> {
  const lista = await guardarAsignacionesPm(
    input.hoja_id,
    input.area,
    input.fecha_programada,
    [input.personal_id],
  );
  return lista[0];
}

/**
 * Sincroniza los operarios de una cita: inserta los nuevos, quita los que salieron.
 * Cada INSERT dispara push al operario correspondiente.
 */
export async function guardarAsignacionesPm(
  hojaId: string,
  area: string,
  fechaProgramada: string,
  personalIds: string[],
): Promise<AsignacionPm[]> {
  const idsUnicos = [...new Set(personalIds.filter(Boolean))];
  const ahora = new Date().toISOString();

  const { data: actuales, error: errList } = await supabase
    .from(TABLA)
    .select("*")
    .eq("hoja_id", hojaId)
    .eq("fecha_programada", fechaProgramada);
  if (errList) throw new Error(errList.message);

  const existentes = (actuales ?? []) as AsignacionPm[];
  const idsActuales = new Set(existentes.map((a) => a.personal_id));
  const idsDeseados = new Set(idsUnicos);

  const aQuitar = existentes
    .filter((a) => !idsDeseados.has(a.personal_id))
    .map((a) => a.id);
  if (aQuitar.length) {
    const { error } = await supabase.from(TABLA).delete().in("id", aQuitar);
    if (error) throw new Error(error.message);
  }

  const aInsertar = idsUnicos.filter((id) => !idsActuales.has(id));
  if (aInsertar.length) {
    const { error } = await supabase.from(TABLA).insert(
      aInsertar.map((personal_id) => ({
        hoja_id: hojaId,
        area,
        fecha_programada: fechaProgramada,
        personal_id,
        actualizado_en: ahora,
      })),
    );
    if (error) throw new Error(error.message);
  }

  const { data: finales, error: errFinal } = await supabase
    .from(TABLA)
    .select("*")
    .eq("hoja_id", hojaId)
    .eq("fecha_programada", fechaProgramada);
  if (errFinal) throw new Error(errFinal.message);
  return (finales ?? []) as AsignacionPm[];
}

export async function quitarAsignacionPm(hojaId: string, fechaProgramada: string): Promise<void> {
  const { error } = await supabase
    .from(TABLA)
    .delete()
    .eq("hoja_id", hojaId)
    .eq("fecha_programada", fechaProgramada);
  if (error) throw new Error(error.message);
}

/** Operarios del portal con técnico vinculado (para el selector de asignación). */
export function operariosAsignables(
  usuarios: UsuarioPortal[],
  personal: Persona[],
): OperarioAsignable[] {
  const mapaPersonal = new Map(personal.map((p) => [p.id, p]));
  const vistos = new Set<string>();
  const lista: OperarioAsignable[] = [];
  for (const u of usuarios) {
    if (!u.activo || !u.personal_id) continue;
    if (u.rol !== "operador" && u.rol !== "admin") continue;
    if (vistos.has(u.personal_id)) continue;
    vistos.add(u.personal_id);
    lista.push({
      personalId: u.personal_id,
      nombre: mapaPersonal.get(u.personal_id)?.nombre ?? u.nombre,
      usuario: u.usuario || u.email,
    });
  }
  return lista.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}
