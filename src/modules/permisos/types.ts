export const ESTADOS_PERMISO = [
  { clave: "borrador", etiqueta: "Borrador" },
  { clave: "solicitado", etiqueta: "Solicitado" },
  { clave: "autorizado", etiqueta: "Autorizado" },
  { clave: "en_permiso", etiqueta: "En permiso" },
  { clave: "cerrado", etiqueta: "Cerrado" },
] as const;

export type EstadoPermiso = (typeof ESTADOS_PERMISO)[number]["clave"];

export const TIPOS_REMUNERACION = [
  { clave: "remunerado", etiqueta: "Permiso remunerado" },
  { clave: "no_remunerado", etiqueta: "No remunerado" },
] as const;

export type TipoRemuneracion = (typeof TIPOS_REMUNERACION)[number]["clave"];

export const MOTIVOS_PERMISO = [
  { clave: "personal", etiqueta: "Permiso personal" },
  { clave: "salida_laboral", etiqueta: "Salida laboral" },
] as const;

export type MotivoPermiso = (typeof MOTIVOS_PERMISO)[number]["clave"];

export const DIAS_SEMANA = [
  { valor: 1, etiqueta: "Lunes" },
  { valor: 2, etiqueta: "Martes" },
  { valor: 3, etiqueta: "Miércoles" },
  { valor: 4, etiqueta: "Jueves" },
  { valor: 5, etiqueta: "Viernes" },
  { valor: 6, etiqueta: "Sábado" },
  { valor: 0, etiqueta: "Domingo" },
] as const;

export interface PermisoDatos {
  nombreTrabajador: string;
  cedula: string;
  fechaElaboracion: string;
  fechaDesde: string;
  fechaHasta: string;
  horaDesde: string;
  horaHasta: string;
  tiempoConcedidoMinutos: number;
  horaSalidaGh: string;
  horaLlegadaGh: string;
  remunerado: TipoRemuneracion;
  motivo: MotivoPermiso;
  descripcion: string;
  observaciones: string;
}

export interface RegistroPermiso {
  id: string;
  numero: number;
  personal_id: string;
  estado: EstadoPermiso;
  pdf_url: string | null;
  datos: PermisoDatos;
  creado_en: string;
}

export interface HorarioLaboral {
  id: string;
  anio: number;
  dia_semana: number;
  turno: number;
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
}

export interface HorarioLaboralInput {
  anio: number;
  dia_semana: number;
  turno: number;
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
}

export interface Festivo {
  id: string;
  anio: number;
  fecha: string;
  descripcion: string | null;
}

export interface PrefillDesdePersonal {
  personalId: string;
  nombre: string;
  cedula: string;
}

export function formularioPermisoVacio(): PermisoDatos {
  return {
    nombreTrabajador: "",
    cedula: "",
    fechaElaboracion: new Date().toISOString().slice(0, 10),
    fechaDesde: new Date().toISOString().slice(0, 10),
    fechaHasta: new Date().toISOString().slice(0, 10),
    horaDesde: "07:30",
    horaHasta: "12:00",
    tiempoConcedidoMinutos: 0,
    horaSalidaGh: "",
    horaLlegadaGh: "",
    remunerado: "remunerado",
    motivo: "personal",
    descripcion: "",
    observaciones: "",
  };
}

export function prefillDesdePersonal(datos: PrefillDesdePersonal): PermisoDatos {
  return {
    ...formularioPermisoVacio(),
    nombreTrabajador: datos.nombre,
    cedula: datos.cedula,
  };
}

export function normalizarDatosPermiso(parcial: Partial<PermisoDatos>): PermisoDatos {
  return { ...formularioPermisoVacio(), ...parcial };
}
