export const ORIGENES_NC = [
  { clave: "auditoria", etiqueta: "Auditoría" },
  { clave: "queja", etiqueta: "Queja de cliente" },
  { clave: "producto", etiqueta: "Producto no conforme" },
  { clave: "indicador", etiqueta: "Indicador" },
  { clave: "proceso", etiqueta: "Proceso interno" },
] as const;

export type OrigenNc = (typeof ORIGENES_NC)[number]["clave"];

export interface FilaPlanAccion {
  actividad: string;
  responsable: string;
  fechaEntrega: string;
  evidencia: string;
}

export interface FilaSeguimiento {
  actividad: string;
  cumplido: "" | "si" | "no";
  fueEficaz: "" | "si" | "no";
  porque: string;
}

export interface OrigenIndicadorRef {
  anio: number;
  mes: number;
  area: string;
  indicador: string;
  meta: string;
  valor: string;
}

export interface RegistroNcDatos {
  area: string;
  fechaDeteccion: string;
  origen: OrigenNc;
  origenIndicador: OrigenIndicadorRef | null;
  descripcion: string;
  detectadaPorNombre: string;
  detectadaPorCargo: string;
  tratamientoInmediato: string;
  tratamientoInmediatoPor: string;
  tratamientoInmediatoFecha: string;
  herramientaCausa: string;
  resumenCausa: string;
  analisisPor: string;
  analisisFecha: string;
  requiereAccionFormal: "" | "si" | "no";
  planAccion: FilaPlanAccion[];
  seguimientoCumplimiento: string;
  seguimientoEficacia: string;
  seguimientoFilas: FilaSeguimiento[];
  verificadoPorNombre: string;
  verificadoPorCargo: string;
  tratamientoEficaz: "" | "si" | "no";
  tratamientoEficazPorque: string;
}

export interface RegistroNc {
  id: string;
  numero: number;
  pdf_url: string | null;
  datos: RegistroNcDatos;
  creado_en: string;
}

/** Datos que envían Indicadores al abrir GC-RE-009. */
export interface PrefillDesdeIndicador {
  area: string;
  indicador: string;
  meta: string;
  valor: string;
  mes: number;
  anio: number;
  descripcion: string;
}

export function filaPlanVacia(): FilaPlanAccion {
  return { actividad: "", responsable: "", fechaEntrega: "", evidencia: "" };
}

export function filaSeguimientoVacia(): FilaSeguimiento {
  return { actividad: "", cumplido: "", fueEficaz: "", porque: "" };
}

export function formularioNcVacio(): RegistroNcDatos {
  return {
    area: "",
    fechaDeteccion: new Date().toISOString().slice(0, 10),
    origen: "indicador",
    origenIndicador: null,
    descripcion: "",
    detectadaPorNombre: "",
    detectadaPorCargo: "",
    tratamientoInmediato: "",
    tratamientoInmediatoPor: "",
    tratamientoInmediatoFecha: "",
    herramientaCausa: "",
    resumenCausa: "",
    analisisPor: "",
    analisisFecha: "",
    requiereAccionFormal: "",
    planAccion: [filaPlanVacia(), filaPlanVacia()],
    seguimientoCumplimiento: "",
    seguimientoEficacia: "",
    seguimientoFilas: [filaSeguimientoVacia(), filaSeguimientoVacia()],
    verificadoPorNombre: "",
    verificadoPorCargo: "",
    tratamientoEficaz: "",
    tratamientoEficazPorque: "",
  };
}

export function normalizarDatosNc(parcial: Partial<RegistroNcDatos>): RegistroNcDatos {
  const base = formularioNcVacio();
  return {
    ...base,
    ...parcial,
    planAccion:
      parcial.planAccion?.length ? parcial.planAccion : base.planAccion,
    seguimientoFilas:
      parcial.seguimientoFilas?.length ? parcial.seguimientoFilas : base.seguimientoFilas,
  };
}

export function prefillDesdeIndicador(datos: PrefillDesdeIndicador): RegistroNcDatos {
  return normalizarDatosNc({
    origen: "indicador",
    area: datos.area || "",
    fechaDeteccion: new Date().toISOString().slice(0, 10),
    descripcion:
      datos.descripcion ||
      `Indicador "${datos.indicador}" no cumple la meta (${datos.meta}). Valor obtenido: ${datos.valor}. Periodo: ${datos.mes}/${datos.anio}.`,
    origenIndicador: {
      anio: datos.anio,
      mes: datos.mes,
      area: datos.area,
      indicador: datos.indicador,
      meta: datos.meta,
      valor: datos.valor,
    },
  });
}
