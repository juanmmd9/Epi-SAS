export const TABLEROS_GERENCIA = [
  { id: "por_clasificar", etiqueta: "Por clasificar" },
  { id: "lucro_cesante", etiqueta: "Lucro cesante" },
  { id: "china", etiqueta: "China proceso" },
  { id: "compras_cali", etiqueta: "Compras Cali" },
  { id: "impo", etiqueta: "IMPO" },
  { id: "safety", etiqueta: "Safety" },
  { id: "gerencia", etiqueta: "Gerencia" },
  { id: "ventas", etiqueta: "Ventas" },
] as const;

/** Id de columna del tablero (incluye columnas creadas por Gerencia). */
export type TableroGerencia = string;

export interface ColumnaGerencia {
  id: string;
  etiqueta: string;
  orden: number;
}

export const TIPOS_GERENCIA = [
  { id: "proyecto", etiqueta: "Proyecto" },
  { id: "compra_internacional", etiqueta: "Compra internacional" },
  { id: "compra_local", etiqueta: "Compra local" },
  { id: "maquina", etiqueta: "Máquina" },
  { id: "otro", etiqueta: "Otro" },
] as const;

export type TipoGerencia = (typeof TIPOS_GERENCIA)[number]["id"];

export const ESTADOS_GERENCIA = [
  { id: "pendiente", etiqueta: "Pendiente" },
  { id: "en_proceso", etiqueta: "En proceso" },
  { id: "hecho", etiqueta: "Hecho" },
  { id: "pausado", etiqueta: "Pausado" },
  { id: "eliminado", etiqueta: "Eliminado" },
] as const;

export type EstadoGerencia = (typeof ESTADOS_GERENCIA)[number]["id"];

export const URGENCIAS_GERENCIA = [
  { id: "baja", etiqueta: "Baja" },
  { id: "media", etiqueta: "Media" },
  { id: "alta", etiqueta: "Alta" },
] as const;

export type UrgenciaGerencia = (typeof URGENCIAS_GERENCIA)[number]["id"];

export const IMPACTOS_GERENCIA = [
  { id: "bajo", etiqueta: "Bajo" },
  { id: "medio", etiqueta: "Medio" },
  { id: "alto", etiqueta: "Alto" },
] as const;

export type ImpactoGerencia = (typeof IMPACTOS_GERENCIA)[number]["id"];

export type SemaforoGerencia = "verde" | "amarillo" | "rojo";

export interface ItemGerencia {
  id: string;
  tablero: TableroGerencia;
  titulo: string;
  tipo: TipoGerencia;
  area: string | null;
  solicitante_id: string | null;
  solicitante_nombre: string | null;
  estado: EstadoGerencia;
  orden: number;
  urgencia: UrgenciaGerencia;
  impacto: ImpactoGerencia;
  monto: number | null;
  proveedor: string | null;
  notas: string | null;
  origen: "solicitud" | "gerencia";
  fecha_compromiso: string | null;
  responsable_nombre: string | null;
  cerrado_en: string | null;
  confirmado_area: boolean;
  motivo_eliminacion: string | null;
  eliminado_en: string | null;
  eliminado_por_nombre: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface ItemGerenciaInput {
  titulo: string;
  tipo: TipoGerencia;
  area?: string | null;
  urgencia?: UrgenciaGerencia;
  impacto?: ImpactoGerencia;
  monto?: number | null;
  notas?: string | null;
  tablero?: TableroGerencia;
  estado?: EstadoGerencia;
  orden?: number;
  proveedor?: string | null;
  origen?: "solicitud" | "gerencia";
  solicitante_id?: string | null;
  solicitante_nombre?: string | null;
  fecha_compromiso?: string | null;
  responsable_nombre?: string | null;
  confirmado_area?: boolean;
}

export interface HistorialGerencia {
  id: string;
  item_id: string;
  tipo: string;
  detalle: string | null;
  autor_id: string | null;
  autor_nombre: string | null;
  creado_en: string;
}

export interface ComentarioGerencia {
  id: string;
  item_id: string;
  mensaje: string;
  autor_id: string | null;
  autor_nombre: string | null;
  creado_en: string;
}

export interface CotizacionGerencia {
  id: string;
  item_id: string;
  proveedor: string;
  monto: number | null;
  moneda: string;
  vigencia: string | null;
  archivo_url: string | null;
  archivo_nombre: string | null;
  elegida: boolean;
  notas: string | null;
  autor_id: string | null;
  autor_nombre: string | null;
  creado_en: string;
}

export interface DashboardGerencia {
  total: number;
  porClasificar: number;
  enProceso: number;
  hechos: number;
  vencidas: number;
  enRojo: number;
  montoAbierto: number;
}

export function etiquetaTablero(
  id: string,
  catalogo?: ReadonlyArray<{ id: string; etiqueta: string }>,
): string {
  const enCatalogo = catalogo?.find((t) => t.id === id)?.etiqueta;
  if (enCatalogo) return enCatalogo;
  return TABLEROS_GERENCIA.find((t) => t.id === id)?.etiqueta ?? id;
}

export function etiquetaTipo(id: string): string {
  return TIPOS_GERENCIA.find((t) => t.id === id)?.etiqueta ?? id;
}

export function etiquetaEstado(id: string): string {
  return ESTADOS_GERENCIA.find((t) => t.id === id)?.etiqueta ?? id;
}

export function etiquetaImpacto(id: string): string {
  return IMPACTOS_GERENCIA.find((t) => t.id === id)?.etiqueta ?? id;
}
