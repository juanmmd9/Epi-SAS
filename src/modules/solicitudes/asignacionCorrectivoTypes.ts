export interface AsignacionCorrectivo {
  id: string;
  correctivo_id: string;
  area: string;
  personal_id: string;
  asignado_por: string | null;
  origen: "auto_area" | "manual" | "claim";
  creado_en: string;
}

export interface AsignacionCorrectivoInput {
  correctivo_id: string;
  area: string;
  personal_id: string;
  origen?: "auto_area" | "manual" | "claim";
}
