export interface ExcepcionDatos {
  tipo: "excluir" | "agregar";
  area: string;
  maquinaId: string;
  anio: number;
  mes: number;
  dia: number;
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
