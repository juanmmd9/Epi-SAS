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
