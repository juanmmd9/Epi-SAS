export interface HojaVidaDatos {
  marca?: string;
  modelo?: string;
  serial?: string;
  /** Solo área Moldes */
  peso?: string;
  /** Solo área Moldes */
  medidas?: string;
  ubicacion?: string;
  fechaBaja?: string;
  motivoBaja?: string;
  /** Equipo que se verifica para medición (báscula, balanza, cinta métrica). */
  esMedicion?: boolean;
  verificaciones?: VerificacionMedicion[];
}

export interface VerificacionMedicion {
  id: string;
  fecha: string;
  proxima: string;
  patron: string;
  puntos: string;
  resultado: "Apto" | "No apto" | "";
  responsable: string;
  observacion: string;
}

export interface HojaVida {
  id: string;
  codigo: string | null;
  nombre: string;
  area: string;
  frecuencia_pm_meses: number | null;
  primer_pm: string | null;
  activa: boolean;
  foto_url: string | null;
  datos: HojaVidaDatos;
  creado_en: string;
  actualizado_en: string;
}

export interface HojaVidaInput {
  nombre: string;
  codigo: string;
  area: string;
  frecuencia_pm_meses: number;
  primer_pm: string | null;
  datos: HojaVidaDatos;
}
