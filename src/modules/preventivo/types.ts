export interface PreventivoDatos {
  equipo?: string;
  adjuntoNombre?: string;
  personalIds?: string[];
  personalNombres?: string[];
  /** @deprecated usar personalIds */
  personalId?: string;
  /** @deprecated usar personalNombres */
  personalNombre?: string;
}

export interface RegistroPreventivo {
  id: string;
  hoja_id: string | null;
  personal_id: string | null;
  area: string;
  fecha: string;
  descripcion: string | null;
  adjunto_url: string | null;
  datos: PreventivoDatos;
  creado_en: string;
}

export interface PreventivoInput {
  hoja_id: string;
  personal_id?: string | null;
  area: string;
  fecha: string;
  descripcion: string;
  datos: PreventivoDatos;
}
