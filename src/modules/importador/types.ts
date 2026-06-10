/** Formato de respaldo general exportado desde la version vanilla (version 2). */
export interface RespaldoV2 {
  version?: number;
  exportadoEn?: string;
  data: DatosRespaldoV2;
}

export interface DatosRespaldoV2 {
  preventivo?: PreventivoVanilla[];
  hojasDeVida?: HojaVanilla[];
  correctivo?: CorrectivoVanilla[];
  cronogramaPreventivo?: CronogramaManualVanilla[];
  excepcionesCronograma?: ExcepcionVanilla[];
  indicadores?: { horasProgramadas?: Record<string, number> };
  noConformidades?: NoConformidadVanilla[];
}

export interface HojaVanilla {
  id: string;
  nombre: string;
  codigo?: string;
  area: string;
  frecuenciaPreventivoMeses?: number;
  fechaPrimerPreventivo?: string;
  activa?: boolean;
  fechaBajaCirculacion?: string;
  motivoBaja?: string;
  marca?: string;
  modelo?: string;
  serial?: string;
  ubicacion?: string;
  foto?: string;
}

export interface PreventivoVanilla {
  id?: string;
  area?: string;
  maquinaId?: string;
  equipo?: string;
  fecha?: string;
  descripcion?: string;
  actividad?: string;
  archivo?: string;
  archivoNombre?: string;
  archivoTipo?: string;
  archivoEnIdb?: boolean;
}

export interface CorrectivoVanilla {
  id?: string;
  proceso?: string;
  area?: string;
  fechaSolicitud?: string;
  fecha?: string;
  numeroSolicitud?: number | string;
  horaSolicitud?: string;
  nombreSolicitante?: string;
  horaRespuesta?: string;
  tiempoRespuesta?: string;
  horaInicioSolicitud?: string;
  horaFinSolicitud?: string;
  maquinaEquipoLocacion?: string;
  equipo?: string;
  falla?: string;
  codigoMaquina?: string;
  maquinaId?: string;
  estadoMaquina?: string;
  tiposSolicitud?: string[];
  tipoSolicitud?: string;
  descripcionSolicitud?: string;
  actividad?: string;
  solucionSolicitud?: string;
  fechaCierre?: string;
  horaCierre?: string;
  quienRevisa?: string;
  creadoEn?: string;
}

export interface ExcepcionVanilla {
  id?: string;
  tipo: "excluir" | "agregar";
  area: string;
  anio: number;
  mes: number;
  dia: number;
  maquinaId: string;
}

export interface CronogramaManualVanilla {
  id?: string;
  area: string;
  maquinaId: string;
  anioBase: number;
  mes: number;
  dia: number;
  frecuenciaMeses?: number;
}

export interface NoConformidadVanilla {
  id?: string;
  numero?: number | string;
  area?: string;
  fechaDeteccion?: string;
  origen?: string;
  origenIndicador?: unknown;
  descripcion?: string;
  detectadaPorNombre?: string;
  detectadaPorCargo?: string;
  tratamientoInmediato?: string;
  tratamientoInmediatoPor?: string;
  tratamientoInmediatoFecha?: string;
  herramientaCausa?: string;
  resumenCausa?: string;
  analisisPor?: string;
  analisisFecha?: string;
  requiereAccionFormal?: string;
  planAccion?: unknown[];
  seguimientoCumplimiento?: string;
  seguimientoEficacia?: string;
  seguimientoFilas?: unknown[];
  verificadoPorNombre?: string;
  verificadoPorCargo?: string;
  tratamientoEficaz?: string;
  tratamientoEficazPorque?: string;
}

export interface ConteoRespaldo {
  preventivo: number;
  hojas: number;
  correctivo: number;
  excepciones: number;
  cronogramaManual: number;
  horasProgramadas: number;
  noConformidades: number;
}

export interface ResultadoImportacion {
  conteo: ConteoRespaldo;
  advertencias: string[];
}

export interface OpcionesImportacion {
  /** Borra todos los datos actuales en Supabase antes de importar. */
  vaciarAntes: boolean;
}
