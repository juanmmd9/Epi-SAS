import { coincideArea } from "../../lib/areas";
import type { RolPortal } from "../auth/roles";

export type ResultadoControl = "" | "OK" | "NC" | "NA";
export type AreaTrabajoReporte = "Trenzadora" | "Telares";

export type FilaLiberacion = {
  maquina: string;
  medida1: string;
  medida2: string;
  referencia: string;
  lote: string;
  productoLimpio: ResultadoControl;
  cantidadAlmas: ResultadoControl;
  sinDespiste: ResultadoControl;
  sinDeshilache: ResultadoControl;
  productoUniforme: ResultadoControl;
  cantidadProducida: string;
};

export type FilaParada = {
  horaInicial: string;
  horaFinal: string;
  maquina: string;
  codigo: string;
  inspeccion: string;
};

export type FilaCantidad = {
  referencia: string;
  cantidad: string;
  causa: string;
};

export type ReporteProduccionDatos = {
  fecha: string;
  turno: string;
  operario: string;
  supervisor: string;
  areaTrabajo: AreaTrabajoReporte;
  filas: FilaLiberacion[];
  observaciones: string;
  firmaOperario: string | null;
  firmaSupervisor: string | null;
  paradas: FilaParada[];
  desperdicios: FilaCantidad[];
  noConformes: FilaCantidad[];
};

export const CODIGO_FORMATO = "TJ-RE-004";
export const VERSION_FORMATO = "7";

export const MAQUINAS_TRENZADORA = ["C02", "C03", "C04", "C05", "C06", "C07", "C08"] as const;
export const MAQUINAS_TELARES = ["T01", "T03", "T04", "T05", "T06"] as const;

export const CAUSAS_PARADA: { codigo: string; texto: string }[] = [
  { codigo: "1", texto: "Inducción, capacitación o reunión" },
  { codigo: "2", texto: "Refrigerio o almuerzo" },
  { codigo: "3", texto: "Falta de urdimbre" },
  { codigo: "4", texto: "Cambio de urdimbre" },
  { codigo: "5", texto: "Falta de carretos" },
  { codigo: "6", texto: "Empate" },
  { codigo: "7", texto: "Falta de materia prima" },
  { codigo: "8", texto: "Encarretada" },
  { codigo: "9", texto: "Falla mecánica" },
  { codigo: "10", texto: "Falla eléctrica" },
  { codigo: "11", texto: "Falla neumática" },
  { codigo: "12", texto: "Falta de energía" },
  { codigo: "13", texto: "Muestras y ensayos" },
  { codigo: "14", texto: "Aseo y limpieza de máquina" },
  { codigo: "15", texto: "Cuadre o ajuste de máquina" },
  { codigo: "16", texto: "Apoyo a otras áreas" },
  { codigo: "17", texto: "Cambio de carretos" },
  { codigo: "18", texto: "Atención a otra máquina" },
  { codigo: "19", texto: "Falta de repuestos" },
  { codigo: "20", texto: "Finalización de producción" },
  { codigo: "21", texto: "Cambio de referencia" },
];

export const CAUSAS_NO_CONFORME: { codigo: string; texto: string }[] = [
  { codigo: "1", texto: "Manchada o sucia" },
  { codigo: "2", texto: "Deshilachada y peluda" },
  { codigo: "3", texto: "Falta de hilo en la reata" },
  { codigo: "4", texto: "Falta de hilo en la funda" },
  { codigo: "5", texto: "Falta de alma" },
  { codigo: "6", texto: "Cuerda deforme" },
  { codigo: "7", texto: "Nudo en la cuerda" },
  { codigo: "8", texto: "Nudo en la reata" },
  { codigo: "9", texto: "Medida de la reata" },
  { codigo: "10", texto: "Despiste de la reata" },
  { codigo: "11", texto: "Empate" },
  { codigo: "12", texto: "Hilo flojo" },
];

export function puedeUsarFormatosTejidos(
  rol: RolPortal | null | undefined,
  area: string | null | undefined,
): boolean {
  if (rol === "admin") return true;
  return Boolean(area && coincideArea(area, "Tejidos"));
}

export function maquinasDe(area: AreaTrabajoReporte): readonly string[] {
  return area === "Telares" ? MAQUINAS_TELARES : MAQUINAS_TRENZADORA;
}

function filaVacia(maquina: string): FilaLiberacion {
  return {
    maquina,
    medida1: "",
    medida2: "",
    referencia: "",
    lote: "",
    productoLimpio: "",
    cantidadAlmas: "",
    sinDespiste: "",
    sinDeshilache: "",
    productoUniforme: "",
    cantidadProducida: "",
  };
}

function paradaVacia(): FilaParada {
  return { horaInicial: "", horaFinal: "", maquina: "", codigo: "", inspeccion: "" };
}

function cantidadVacia(): FilaCantidad {
  return { referencia: "", cantidad: "", causa: "" };
}

export function hoyIso(): string {
  const fecha = new Date();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

export function reporteVacio(area: AreaTrabajoReporte = "Trenzadora"): ReporteProduccionDatos {
  return {
    fecha: hoyIso(),
    turno: "",
    operario: "",
    supervisor: "",
    areaTrabajo: area,
    filas: maquinasDe(area).map(filaVacia),
    observaciones: "",
    firmaOperario: null,
    firmaSupervisor: null,
    paradas: [paradaVacia(), paradaVacia(), paradaVacia()],
    desperdicios: [cantidadVacia(), cantidadVacia(), cantidadVacia()],
    noConformes: [cantidadVacia(), cantidadVacia(), cantidadVacia()],
  };
}

export function cambiarAreaTrabajo(
  actual: ReporteProduccionDatos,
  area: AreaTrabajoReporte,
): ReporteProduccionDatos {
  if (actual.areaTrabajo === area) return actual;
  return { ...actual, areaTrabajo: area, filas: maquinasDe(area).map(filaVacia) };
}

export function duracionParada(horaInicial: string, horaFinal: string): string {
  if (!horaInicial || !horaFinal) return "";
  const [h1, m1] = horaInicial.split(":").map(Number);
  const [h2, m2] = horaFinal.split(":").map(Number);
  if (![h1, m1, h2, m2].every((n) => Number.isFinite(n))) return "";
  let minutos = h2 * 60 + m2 - (h1 * 60 + m1);
  if (minutos < 0) minutos += 24 * 60;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return `${horas}:${String(resto).padStart(2, "0")}`;
}

export function textoCausaParada(codigo: string): string {
  return CAUSAS_PARADA.find((c) => c.codigo === codigo)?.texto ?? codigo;
}

export function textoCausaNoConforme(codigo: string): string {
  return CAUSAS_NO_CONFORME.find((c) => c.codigo === codigo)?.texto ?? codigo;
}
