export interface Persona {
  id: string;
  nombre: string;
  cargo: string | null;
  area: string | null;
  activo: boolean;
  creado_en: string;
}

export interface PersonaInput {
  nombre: string;
  cargo: string | null;
  area: string | null;
}

export interface EstadisticasPersona {
  persona: Persona;
  preventivos: number;
  correctivos: number;
  totalRegistros: number;
  maquinasDistintas: number;
}
