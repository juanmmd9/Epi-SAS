export interface FechaCita {
  anio: number;
  mes: number;
  dia: number;
}

export interface ExcepcionDatos {
  tipo: "excluir" | "agregar" | "no_realizado";
  area: string;
  maquinaId: string;
  anio: number;
  mes: number;
  dia: number;
  /** Si es agregar por reprogramación, guarda la fecha original programada. */
  reprogramadoDesde?: FechaCita;
}

export interface ExcepcionCronograma {
  id: string;
  fecha: string;
  motivo: string | null;
  datos: ExcepcionDatos;
  creado_en: string;
}

export interface OcurrenciaPm {
  anio: number;
  mes: number;
  dia: number;
}

export interface CitaCronograma {
  maquinaId: string;
  nombre: string;
  codigo: string;
  frecuencia: number;
  origen: "automatica" | "manual";
}

export type EstadoCitaPm =
  | "completada"
  | "programada"
  | "no_realizado"
  | "reprogramada"
  | "vencida"
  | "de_baja";
