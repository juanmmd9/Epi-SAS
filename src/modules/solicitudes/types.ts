export const ESTADOS_REPUESTO = [
  "solicitado",
  "pedido",
  "recibido",
  "instalado",
  "cancelado",
] as const;

export type EstadoRepuesto = (typeof ESTADOS_REPUESTO)[number];

export const ETIQUETAS_ESTADO_REPUESTO: Record<EstadoRepuesto, string> = {
  solicitado: "Solicitado",
  pedido: "Pedido",
  recibido: "Recibido",
  instalado: "Instalado",
  cancelado: "Cancelado",
};

export interface RepuestoSolicitud {
  id: string;
  area: string;
  hoja_id: string | null;
  correctivo_id: string | null;
  codigo: string;
  descripcion: string;
  cantidad: number;
  estado: EstadoRepuesto;
  fecha_necesaria: string | null;
  notas: string;
  creado_en: string;
  actualizado_en: string;
}

export interface RepuestoInput {
  area: string;
  hoja_id?: string | null;
  correctivo_id?: string | null;
  codigo: string;
  descripcion: string;
  cantidad: number;
  estado: EstadoRepuesto;
  fecha_necesaria?: string | null;
  notas?: string;
}

export interface ResumenAreaSolicitudes {
  area: string;
  abiertas: number;
  esperaRepuesto: number;
  cerradasMes: number;
  repuestosPendientes: number;
}
