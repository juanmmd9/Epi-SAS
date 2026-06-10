export const TIPOS_SOLICITUD = [
  "MECANICA",
  "NEUMATICA",
  "CORRECTIVO",
  "APOYO PRODUCCION",
  "HIDRAULICA",
  "LOCATIVO",
  "PROYECTOS",
  "ELECTRICA",
] as const;

export const ESTADOS_MAQUINA = [
  "Operando",
  "Parada",
  "En reparacion",
  "Fuera de servicio",
] as const;

export interface CorrectivoDatos {
  numeroSolicitud: number;
  horaSolicitud: string;
  nombreSolicitante: string;
  horaRespuesta: string;
  tiempoRespuesta: string;
  horaInicioSolicitud: string;
  horaFinSolicitud: string;
  maquinaEquipoLocacion: string;
  codigoMaquina: string;
  maquinaId: string;
  estadoMaquina: string;
  tiposSolicitud: string[];
  descripcionSolicitud: string;
  solucionSolicitud: string;
  fechaCierre: string;
  horaCierre: string;
  quienRevisa: string;
}

export interface RegistroCorrectivo {
  id: string;
  area: string;
  fecha: string;
  datos: CorrectivoDatos;
  creado_en: string;
}

export interface CorrectivoInput {
  area: string;
  fecha: string;
  datos: CorrectivoDatos;
}
