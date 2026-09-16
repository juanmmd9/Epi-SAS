export type HojaMatriz = "MECANICO";

export interface CompetenciaMatriz {
  id: string;
  hoja: string;
  orden: number;
  numero: number | null;
  categoria: string;
  descripcion: string;
  meta_d: number;
  experto: string | null;
  herramienta: string | null;
  estado_capacitacion: string | null;
  activa: boolean;
}

export interface ValorMatrizCelda {
  id?: string;
  personal_id: string;
  competencia_id: string;
  nivel_i: number;
  nivel_d: number;
  nivel_h: number;
  actualizado_en?: string;
}

export interface CompetenciaCatalogoInput {
  orden: number;
  numero: number;
  categoria: string;
  descripcion: string;
  meta_d: number;
  experto?: string;
  herramienta?: string;
  estado_capacitacion?: string;
}

export const NIVELES_MATRIZ = [
  { valor: 0, etiqueta: "No sabe" },
  { valor: 1, etiqueta: "Sabe" },
  { valor: 2, etiqueta: "Aplica" },
  { valor: 3, etiqueta: "Enseña" },
  { valor: 4, etiqueta: "Mejora" },
] as const;
