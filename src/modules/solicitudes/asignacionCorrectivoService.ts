import { supabase } from "../../services/supabase";
import type { Persona } from "../personal/types";
import type { UsuarioPortal } from "../auth/roles";
import { actualizarDatosCorrectivo, obtenerCorrectivo } from "../correctivo/correctivoService";
import type {
  AsignacionCorrectivo,
  AsignacionCorrectivoInput,
} from "./asignacionCorrectivoTypes";
import {
  iniciarCronometro,
  leerCronometro,
} from "./cronometroSolicitud";
import { pausarCronometroLaboral } from "./cronometroLaboral";
import { coincideArea } from "../../lib/areas";

const TABLA = "correctivo_asignaciones";

export async function existeTablaAsignacionesCorrectivo(): Promise<boolean> {
  const { error } = await supabase.from(TABLA).select("id").limit(1);
  if (!error) return true;
  if (/does not exist|relation|schema cache/i.test(error.message)) return false;
  throw new Error(error.message);
}

export async function listarAsignacionesCorrectivo(): Promise<AsignacionCorrectivo[]> {
  const { data, error } = await supabase.from(TABLA).select("*").order("creado_en", {
    ascending: false,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as AsignacionCorrectivo[];
}

export async function listarAsignacionesDeCorrectivo(
  correctivoId: string,
): Promise<AsignacionCorrectivo[]> {
  const { data, error } = await supabase
    .from(TABLA)
    .select("*")
    .eq("correctivo_id", correctivoId);
  if (error) throw new Error(error.message);
  return (data ?? []) as AsignacionCorrectivo[];
}

export async function listarAsignacionesPorPersonal(
  personalId: string,
): Promise<AsignacionCorrectivo[]> {
  const { data, error } = await supabase
    .from(TABLA)
    .select("*")
    .eq("personal_id", personalId);
  if (error) throw new Error(error.message);
  return (data ?? []) as AsignacionCorrectivo[];
}

/** Reemplaza los asignados de una solicitud (admin). Inicia cronómetro si pasa a tener dueño. */
export async function guardarAsignacionesCorrectivo(
  correctivoId: string,
  area: string,
  personalIds: string[],
): Promise<AsignacionCorrectivo[]> {
  const ids = [...new Set(personalIds.filter(Boolean))];

  const { data: actuales, error: errList } = await supabase
    .from(TABLA)
    .select("*")
    .eq("correctivo_id", correctivoId);
  if (errList) throw new Error(errList.message);

  const existentes = (actuales ?? []) as AsignacionCorrectivo[];
  const idsActuales = new Set(existentes.map((a) => a.personal_id));
  const idsDeseados = new Set(ids);

  const aQuitar = existentes.filter((a) => !idsDeseados.has(a.personal_id)).map((a) => a.id);
  if (aQuitar.length) {
    const { error } = await supabase.from(TABLA).delete().in("id", aQuitar);
    if (error) throw new Error(error.message);
  }

  const aInsertar = ids.filter((id) => !idsActuales.has(id));
  if (aInsertar.length) {
    const filas: AsignacionCorrectivoInput[] = aInsertar.map((personal_id) => ({
      correctivo_id: correctivoId,
      area,
      personal_id,
      origen: "manual",
    }));
    const { error } = await supabase.from(TABLA).insert(filas);
    if (error) throw new Error(error.message);
  }

  const reg = await obtenerCorrectivo(correctivoId);
  if (reg && !reg.datos.fechaCierre?.trim()) {
    const cron = leerCronometro(reg.datos);
    if (ids.length === 0) {
      const next =
        cron.estado === "running"
          ? await pausarCronometroLaboral(cron)
          : { ...cron, segmentoInicio: null };
      await actualizarDatosCorrectivo(correctivoId, {
        cronometro:
          next.acumuladoSeg > 0 || cron.estado !== "idle"
            ? { ...next, estado: "paused" }
            : { estado: "idle", segmentoInicio: null, acumuladoSeg: 0 },
      });
    } else if (cron.estado === "idle") {
      await actualizarDatosCorrectivo(correctivoId, {
        cronometro: reg.datos.esperaRepuesto
          ? { estado: "paused", segmentoInicio: null, acumuladoSeg: 0 }
          : iniciarCronometro(cron),
      });
    } else if (cron.estado === "paused" && !reg.datos.esperaRepuesto) {
      await actualizarDatosCorrectivo(correctivoId, { cronometro: iniciarCronometro(cron) });
    }
  }

  return listarAsignacionesDeCorrectivo(correctivoId);
}

/**
 * Operario toma una solicitud libre (bandeja).
 * Falla si ya tiene asignados.
 */
export async function tomarSolicitud(
  correctivoId: string,
  personalId: string,
): Promise<{ asignaciones: AsignacionCorrectivo[]; registroId: string }> {
  const reg = await obtenerCorrectivo(correctivoId);
  if (!reg) throw new Error("Solicitud no encontrada.");
  if (reg.datos.fechaCierre?.trim()) throw new Error("La solicitud ya está cerrada.");

  const actuales = await listarAsignacionesDeCorrectivo(correctivoId);
  if (actuales.length > 0) {
    if (actuales.some((a) => a.personal_id === personalId)) {
      return { asignaciones: actuales, registroId: correctivoId };
    }
    throw new Error("Otro técnico ya tomó esta solicitud.");
  }

  const { error } = await supabase.from(TABLA).insert({
    correctivo_id: correctivoId,
    area: reg.area,
    personal_id: personalId,
    origen: "claim",
  } satisfies AsignacionCorrectivoInput);
  if (error) {
    if (/duplicate|unique/i.test(error.message)) {
      throw new Error("Otro técnico ya tomó esta solicitud.");
    }
    throw new Error(error.message);
  }

  const cron = leerCronometro(reg.datos);
  const next = reg.datos.esperaRepuesto
    ? { ...iniciarCronometro(cron), estado: "paused" as const, segmentoInicio: null }
    : iniciarCronometro(cron);
  // Si espera repuesto al tomar: acumulado 0 paused
  const cronFinal = reg.datos.esperaRepuesto
    ? { estado: "paused" as const, segmentoInicio: null, acumuladoSeg: cron.acumuladoSeg }
    : next;

  await actualizarDatosCorrectivo(correctivoId, { cronometro: cronFinal });

  return {
    asignaciones: await listarAsignacionesDeCorrectivo(correctivoId),
    registroId: correctivoId,
  };
}

/** Devuelve la solicitud a la bandeja (quita asignaciones). Pausa el cronómetro. */
export async function devolverSolicitud(correctivoId: string): Promise<void> {
  const reg = await obtenerCorrectivo(correctivoId);
  if (!reg) throw new Error("Solicitud no encontrada.");

  const { error } = await supabase.from(TABLA).delete().eq("correctivo_id", correctivoId);
  if (error) throw new Error(error.message);

  if (!reg.datos.fechaCierre?.trim()) {
    const cron = leerCronometro(reg.datos);
    const pausado =
      cron.estado === "running"
        ? await pausarCronometroLaboral(cron)
        : { ...cron, estado: "paused" as const };
    await actualizarDatosCorrectivo(correctivoId, {
      cronometro:
        pausado.acumuladoSeg > 0 || cron.estado !== "idle"
          ? { ...pausado, estado: "paused" }
          : { estado: "idle", segmentoInicio: null, acumuladoSeg: 0 },
    });
  }
}

export function mapaAsignacionesPorCorrectivo(
  asignaciones: AsignacionCorrectivo[],
): Map<string, AsignacionCorrectivo[]> {
  const map = new Map<string, AsignacionCorrectivo[]>();
  for (const a of asignaciones) {
    const lista = map.get(a.correctivo_id);
    if (lista) lista.push(a);
    else map.set(a.correctivo_id, [a]);
  }
  return map;
}

export function nombresAsignados(
  asignaciones: AsignacionCorrectivo[] | undefined,
  mapaNombres: Map<string, string>,
): string[] {
  if (!asignaciones?.length) return [];
  return asignaciones
    .map((a) => mapaNombres.get(a.personal_id) || "Técnico")
    .sort((a, b) => a.localeCompare(b, "es"));
}

export function solicitudSinDueño(
  correctivoId: string,
  mapa: Map<string, AsignacionCorrectivo[]>,
): boolean {
  return !(mapa.get(correctivoId)?.length);
}

/** Operarios con personal_id (para selector admin). */
export function operariosParaAsignarSolicitud(
  usuarios: UsuarioPortal[],
  personal: Persona[],
): Array<{ personalId: string; nombre: string; area: string | null }> {
  const mapaPersonal = new Map(personal.map((p) => [p.id, p]));
  const vistos = new Set<string>();
  const lista: Array<{ personalId: string; nombre: string; area: string | null }> = [];
  for (const u of usuarios) {
    if (!u.activo || !u.personal_id) continue;
    if (u.rol !== "operador" && u.rol !== "admin") continue;
    if (vistos.has(u.personal_id)) continue;
    vistos.add(u.personal_id);
    const p = mapaPersonal.get(u.personal_id);
    lista.push({
      personalId: u.personal_id,
      nombre: p?.nombre ?? u.nombre,
      area: u.area || p?.area || null,
    });
  }
  return lista.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export function operarioCoincideArea(
  areaSolicitud: string,
  areaUsuario: string | null | undefined,
  areaPersonal: string | null | undefined,
): boolean {
  if (areaUsuario && coincideArea(areaUsuario, areaSolicitud)) return true;
  if (areaPersonal && coincideArea(areaPersonal, areaSolicitud)) return true;
  return false;
}
