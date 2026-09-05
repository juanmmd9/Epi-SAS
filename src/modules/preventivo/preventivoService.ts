import { supabase } from "../../services/supabase";
import type { PreventivoInput, RegistroPreventivo } from "./types";

const TABLA = "preventivo";

function numeroReporteOrden(registro: RegistroPreventivo): number {
  const texto = registro.datos.numeroReporte ?? registro.datos.mtre045?.numeroReporte ?? "";
  const n = Number.parseInt(texto, 10);
  return Number.isFinite(n) ? n : 0;
}

/** Más recientes primero: fecha ↓, número de reporte ↓, creado_en ↓. */
export function ordenarRegistrosPreventivo(
  registros: RegistroPreventivo[],
): RegistroPreventivo[] {
  return [...registros].sort((a, b) => {
    const porFecha = b.fecha.localeCompare(a.fecha);
    if (porFecha !== 0) return porFecha;
    const porNumero = numeroReporteOrden(b) - numeroReporteOrden(a);
    if (porNumero !== 0) return porNumero;
    return (b.creado_en ?? "").localeCompare(a.creado_en ?? "");
  });
}

export async function listarPreventivo(): Promise<RegistroPreventivo[]> {
  const { data, error } = await supabase
    .from(TABLA)
    .select("*")
    .order("fecha", { ascending: false })
    .order("creado_en", { ascending: false });
  if (error) throw new Error(error.message);
  return ordenarRegistrosPreventivo((data ?? []) as RegistroPreventivo[]);
}

export async function crearPreventivo(input: PreventivoInput): Promise<RegistroPreventivo> {
  const { personal_id, ...resto } = input;
  const payload: Record<string, unknown> = { ...resto, adjunto_url: null };
  if (personal_id) payload.personal_id = personal_id;

  let { data, error } = await supabase.from(TABLA).insert(payload).select().single();
  if (error && personal_id && /personal_id|personal/i.test(error.message)) {
    ({ data, error } = await supabase
      .from(TABLA)
      .insert({ ...resto, adjunto_url: null })
      .select()
      .single());
  }
  if (error) throw new Error(error.message);
  return data as RegistroPreventivo;
}

export async function actualizarPreventivo(
  id: string,
  cambios: Partial<PreventivoInput>,
): Promise<RegistroPreventivo> {
  const { data, error } = await supabase
    .from(TABLA)
    .update(cambios)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as RegistroPreventivo;
}

export async function eliminarPreventivo(id: string): Promise<void> {
  const { error } = await supabase.from(TABLA).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

type FirmaAprobacion = {
  usuarioId: string;
  nombre: string;
  /** PNG data URL de la firma manuscrita. */
  imagenFirma: string;
};

/** Envía / reenvía el PM al líder (pendiente de firma). */
export function datosEnviarAprobacion(
  datos: RegistroPreventivo["datos"],
): RegistroPreventivo["datos"] {
  const ahora = new Date().toISOString();
  const mtre045 = datos.mtre045
    ? {
        ...datos.mtre045,
        // Conserva firma del operador; limpia la del líder al reenviar.
        firmaVerificacion: undefined,
      }
    : datos.mtre045;
  return {
    ...datos,
    mtre045,
    estadoAprobacion: "pendiente_aprobacion",
    enviadoAprobacionEn: ahora,
    motivoRechazo: undefined,
    rechazadoPorId: undefined,
    rechazadoPorNombre: undefined,
    rechazadoEn: undefined,
    aprobadoPorId: undefined,
    aprobadoPorNombre: undefined,
    aprobadoEn: undefined,
    firmaAprobacion: undefined,
  };
}

export async function aprobarPreventivo(
  registro: RegistroPreventivo,
  firma: FirmaAprobacion,
): Promise<RegistroPreventivo> {
  const ahora = new Date().toISOString();
  const mtre045 = registro.datos.mtre045
    ? {
        ...registro.datos.mtre045,
        responsableVerificacion:
          registro.datos.mtre045.responsableVerificacion?.trim() || firma.nombre,
        firmaVerificacion: firma.imagenFirma,
      }
    : registro.datos.mtre045;
  return actualizarPreventivo(registro.id, {
    datos: {
      ...registro.datos,
      mtre045,
      estadoAprobacion: "aprobado",
      aprobadoPorId: firma.usuarioId,
      aprobadoPorNombre: firma.nombre,
      aprobadoEn: ahora,
      firmaAprobacion: firma.imagenFirma,
      motivoRechazo: undefined,
      rechazadoPorId: undefined,
      rechazadoPorNombre: undefined,
      rechazadoEn: undefined,
    },
  });
}

export async function rechazarPreventivo(
  registro: RegistroPreventivo,
  firma: FirmaAprobacion,
  motivo: string,
): Promise<RegistroPreventivo> {
  const ahora = new Date().toISOString();
  return actualizarPreventivo(registro.id, {
    datos: {
      ...registro.datos,
      estadoAprobacion: "rechazado",
      rechazadoPorId: firma.usuarioId,
      rechazadoPorNombre: firma.nombre,
      rechazadoEn: ahora,
      motivoRechazo: motivo.trim(),
      aprobadoPorId: undefined,
      aprobadoPorNombre: undefined,
      aprobadoEn: undefined,
    },
  });
}
