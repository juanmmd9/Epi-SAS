import type { Mtre045Datos } from "../formatos/mtre045Types";

export interface PreventivoDatos {
  equipo?: string;
  codigo?: string;
  marca?: string;
  serial?: string;
  /** @deprecated ya no se suben archivos a la nube */
  adjuntoNombre?: string;
  /** Ruta o ubicación del soporte impreso en carpeta física */
  soporteFisico?: string;
  /** Número secuencial del reporte MT-RE-045 (área + mes) */
  numeroReporte?: string;
  /** Reporte MT-RE-045 vinculado */
  mtre045?: Mtre045Datos;
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
