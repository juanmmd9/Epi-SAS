export interface AsignacionPm {
  id: string;
  hoja_id: string;
  area: string;
  fecha_programada: string;
  personal_id: string;
  asignado_por: string | null;
  notas: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface AsignacionPmInput {
  hoja_id: string;
  area: string;
  fecha_programada: string;
  personal_id: string;
}

export interface OperarioAsignable {
  personalId: string;
  nombre: string;
  usuario: string;
}
