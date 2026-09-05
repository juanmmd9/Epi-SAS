export const ESTADOS_PERMISO = [
  { clave: "borrador", etiqueta: "Borrador" },
  { clave: "solicitado", etiqueta: "Solicitado" },
  { clave: "autorizado", etiqueta: "Aprobado" },
  { clave: "rechazado", etiqueta: "Rechazado" },
  { clave: "cancelado", etiqueta: "Cancelado" },
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

/** Fecha local YYYY-MM-DD (evita desfase UTC de toISOString). */
export function fechaLocalHoy(): string {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, "0");
  const d = String(n.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Hora local HH:MM. */
export function horaLocalAhora(): string {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
}

export interface PermisoDatos {
  nombreTrabajador: string;
  cedula: string;
  fechaElaboracion: string;
  /** Hora de elaboración automática (HH:MM); no la edita el operario. */
  horaElaboracion: string;
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
  /** True cuando el administrador ya asignó remunerado/motivo. */
  tipoDefinidoPorAdmin?: boolean;
  /** Usuario portal que registró la solicitud. */
  solicitadoPorId?: string;
  solicitadoPorNombre?: string;
  /** Usuario portal que aprobó o rechazó. */
  decisionPorId?: string;
  decisionPorNombre?: string;
  decisionEn?: string;
  motivoRechazo?: string;
  /** Cuando el operador cancela su propia solicitud pendiente. */
  canceladoPorId?: string;
  canceladoPorNombre?: string;
  canceladoEn?: string;
  motivoCancelacion?: string;
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
  const hoy = fechaLocalHoy();
  return {
    nombreTrabajador: "",
    cedula: "",
    fechaElaboracion: hoy,
    horaElaboracion: horaLocalAhora(),
    fechaDesde: hoy,
    fechaHasta: hoy,
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
  return {
    ...formularioPermisoVacio(),
    ...parcial,
    // Registros viejos pueden no traer hora; no inventar la hora actual al abrirlos.
    horaElaboracion: parcial.horaElaboracion ?? "",
  };
}

export function permisoPuedeImprimirse(estado: EstadoPermiso): boolean {
  return estado === "autorizado" || estado === "en_permiso" || estado === "cerrado";
}

/** Solo se puede cancelar una solicitud aún pendiente de aprobación. */
export function permisoPuedeCancelarse(estado: EstadoPermiso): boolean {
  return estado === "solicitado";
}
