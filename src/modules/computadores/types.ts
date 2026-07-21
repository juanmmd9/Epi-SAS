export const TIPOS_COMPUTADOR = ["escritorio", "portatil", "otro"] as const;
export type TipoComputador = (typeof TIPOS_COMPUTADOR)[number];

export const ETIQUETAS_TIPO_COMPUTADOR: Record<TipoComputador, string> = {
  escritorio: "Escritorio",
  portatil: "Portátil",
  otro: "Otro",
};

export const TIPOS_PIEZA = [
  "SSD",
  "HDD",
  "RAM",
  "Fuente",
  "Teclado",
  "Mouse",
  "Bateria",
  "Cargador",
  "Pantalla",
  "Placa",
  "Ventilador",
  "Otro",
] as const;

export type TipoPieza = (typeof TIPOS_PIEZA)[number];

export const MOTIVOS_PIEZA = ["falla", "upgrade", "preventivo", "otro"] as const;
export type MotivoPieza = (typeof MOTIVOS_PIEZA)[number];

export const ETIQUETAS_MOTIVO_PIEZA: Record<MotivoPieza, string> = {
  falla: "Falla",
  upgrade: "Upgrade",
  preventivo: "Preventivo",
  otro: "Otro",
};

export interface ComputadorDatos {
  marca?: string;
  modelo?: string;
  serial?: string;
  sistemaOperativo?: string;
  ip?: string;
  observaciones?: string;
  fechaBaja?: string;
  motivoBaja?: string;
  /** SI/NO según columna SIESA del Excel. */
  siesa?: string;
  compra?: string;
  /** Texto original del tipo en Excel (MESA, PORTATIL ACCER…). */
  tipoDetalle?: string;
}

export interface Computador {
  id: string;
  codigo: string;
  ubicacion: string;
  tipo: TipoComputador;
  usuario_asignado: string;
  frecuencia_pm_meses: number;
  ultimo_pm: string | null;
  proximo_pm: string | null;
  activa: boolean;
  datos: ComputadorDatos;
  creado_en: string;
  actualizado_en: string;
}

export interface ComputadorInput {
  codigo: string;
  ubicacion: string;
  tipo: TipoComputador;
  usuario_asignado: string;
  frecuencia_pm_meses: number;
  ultimo_pm: string | null;
  proximo_pm: string | null;
  datos: ComputadorDatos;
}

export interface ComputadorPm {
  id: string;
  computador_id: string;
  fecha: string;
  tecnico: string;
  actividades: string;
  observaciones: string;
  creado_en: string;
}

export interface ComputadorPmInput {
  fecha: string;
  tecnico: string;
  actividades: string;
  observaciones: string;
}

export interface ComputadorPieza {
  id: string;
  computador_id: string;
  fecha: string;
  tipo_pieza: string;
  detalle: string;
  serial: string;
  motivo: MotivoPieza;
  tecnico: string;
  notas: string;
  creado_en: string;
}

export interface ComputadorPiezaInput {
  fecha: string;
  tipo_pieza: string;
  detalle: string;
  serial: string;
  motivo: MotivoPieza;
  tecnico: string;
  notas: string;
}
