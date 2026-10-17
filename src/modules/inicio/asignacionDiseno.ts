import { supabase } from "../../services/supabase";
import { PASOS_CASCO } from "../diseno/disenoPasos";
import { PROYECTOS_DISENO, type IdProyectoDiseno } from "../diseno/proyectosDiseno";

const IDS = new Set<string>(PROYECTOS_DISENO.map((proyecto) => proyecto.id));
const ETAPAS = new Set<string>(PASOS_CASCO.map((paso) => paso.id));

export const ETAPA_INICIAL_DISENO = "planificacion";

export type AsignacionesDiseno = Record<string, IdProyectoDiseno[]>;
export type EtapasPorUsuario = Record<string, Partial<Record<IdProyectoDiseno, string>>>;

export type MapaAsignacionDiseno = {
  proyectos: AsignacionesDiseno;
  etapas: EtapasPorUsuario;
};

function proyectosValidos(valor: unknown): IdProyectoDiseno[] {
  if (!Array.isArray(valor)) return [];
  return PROYECTOS_DISENO.map((proyecto) => proyecto.id).filter((id) =>
    valor.some((item) => item === id),
  );
}

function etapasValidas(valor: unknown): Partial<Record<IdProyectoDiseno, string>> {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return {};
  const origen = valor as Record<string, unknown>;
  const salida: Partial<Record<IdProyectoDiseno, string>> = {};
  for (const proyecto of PROYECTOS_DISENO) {
    const etapa = origen[proyecto.id];
    if (typeof etapa === "string" && ETAPAS.has(etapa)) salida[proyecto.id] = etapa;
  }
  return salida;
}

export function etapaDeProyecto(
  etapas: Partial<Record<IdProyectoDiseno, string>> | undefined,
  proyectoId: IdProyectoDiseno,
): string {
  return etapas?.[proyectoId] || ETAPA_INICIAL_DISENO;
}

export async function listarAsignacionesDiseno(): Promise<MapaAsignacionDiseno> {
  const { data, error } = await supabase
    .from("diseno_asignaciones")
    .select("usuario_id, proyectos, etapas");

  if (error) throw new Error(error.message);

  const proyectos: AsignacionesDiseno = {};
  const etapas: EtapasPorUsuario = {};
  for (const fila of data ?? []) {
    const id = String(fila.usuario_id ?? "");
    if (!id) continue;
    proyectos[id] = proyectosValidos(fila.proyectos);
    etapas[id] = etapasValidas(fila.etapas);
  }
  return { proyectos, etapas };
}

export async function guardarAsignacionDiseno(
  usuarioId: string,
  proyectos: IdProyectoDiseno[],
): Promise<void> {
  const limpios = PROYECTOS_DISENO.map((proyecto) => proyecto.id).filter((id) =>
    proyectos.includes(id),
  );
  if (limpios.some((id) => !IDS.has(id))) {
    throw new Error("Hay un proyecto que no existe.");
  }

  const { error } = await supabase.from("diseno_asignaciones").upsert({
    usuario_id: usuarioId,
    proyectos: limpios,
    actualizado_en: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);
}

export async function guardarEtapaDiseno(
  usuarioId: string,
  proyectoId: IdProyectoDiseno,
  etapaId: string,
): Promise<void> {
  if (!IDS.has(proyectoId) || !ETAPAS.has(etapaId)) {
    throw new Error("Esa etapa no está en el flujograma.");
  }

  const { data, error } = await supabase
    .from("diseno_asignaciones")
    .select("proyectos, etapas")
    .eq("usuario_id", usuarioId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  const asignados = proyectosValidos(data?.proyectos);
  if (!asignados.includes(proyectoId)) {
    throw new Error("Este auxiliar no está asignado a ese proyecto.");
  }

  const etapas = {
    ...etapasValidas(data?.etapas),
    [proyectoId]: etapaId,
  };

  const { error: guardado } = await supabase
    .from("diseno_asignaciones")
    .update({ etapas, actualizado_en: new Date().toISOString() })
    .eq("usuario_id", usuarioId);

  if (guardado) throw new Error(guardado.message);
}
