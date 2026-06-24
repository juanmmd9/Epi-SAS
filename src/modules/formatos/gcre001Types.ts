import { filaPlanVacia, type FilaPlanAccion } from "./types";

export const ORIGENES_MEJORA = [
  { clave: "indicadores", etiqueta: "Indicadores de Gestión" },
  { clave: "riesgos", etiqueta: "Riesgos y Oportunidades" },
  { clave: "auditoria_interna", etiqueta: "Auditoría Interna" },
  { clave: "auditoria_externa", etiqueta: "Auditoría Externa" },
  { clave: "revision_direccion", etiqueta: "Revisión por la Dirección" },
  { clave: "sugerencia", etiqueta: "Sugerencia del Personal" },
  { clave: "cliente", etiqueta: "Cliente" },
  { clave: "otro", etiqueta: "Otro" },
] as const;

export type OrigenMejora = (typeof ORIGENES_MEJORA)[number]["clave"];

export interface OrigenRiesgoRef {
  proceso: string;
  descripcion: string;
  probabilidad: number;
  consecuencia: number;
  valor: number;
  nivel: string;
  tratamiento: string;
  consecuencias: string;
}

export interface RegistroAmDatos {
  fechaRegistro: string;
  proceso: string;
  responsableProceso: string;
  reportadoPor: string;
  reportadoCargo: string;
  origen: OrigenMejora;
  origenOtro: string;
  descripcion: string;
  beneficioEsperado: string;
  recursosHumanos: boolean;
  recursosTecnologicos: boolean;
  recursosInfraestructura: boolean;
  recursosEconomicos: boolean;
  recursosOtros: boolean;
  recursosDescripcion: string;
  alineacionObjetivos: string;
  evaluacion: "" | "aprobada" | "no_aprobada";
  evaluacionJustificacion: string;
  planAccion: FilaPlanAccion[];
  aprobacionResponsable: string;
  aprobacionResponsableFecha: string;
  aprobacionLiderSgc: string;
  aprobacionLiderSgcFecha: string;
  origenRiesgo: OrigenRiesgoRef | null;
}

export interface RegistroAm {
  id: string;
  numero: number;
  pdf_url: string | null;
  datos: RegistroAmDatos;
  creado_en: string;
}

/** Datos enviados desde matriz de riesgos u otro módulo. */
export interface PrefillDesdeRiesgo {
  proceso: string;
  descripcion: string;
  probabilidad: number;
  consecuencia: number;
  valor: number;
  nivel: string;
  tratamiento: string;
  consecuencias: string;
  responsableProceso?: string;
  reportadoPor?: string;
  reportadoCargo?: string;
  alineacionObjetivos?: string;
  planAccion?: FilaPlanAccion[];
}

export function formularioAmVacio(): RegistroAmDatos {
  return {
    fechaRegistro: new Date().toISOString().slice(0, 10),
    proceso: "Mantenimiento",
    responsableProceso: "",
    reportadoPor: "",
    reportadoCargo: "",
    origen: "riesgos",
    origenOtro: "",
    descripcion: "",
    beneficioEsperado: "",
    recursosHumanos: true,
    recursosTecnologicos: true,
    recursosInfraestructura: true,
    recursosEconomicos: false,
    recursosOtros: false,
    recursosDescripcion: "",
    alineacionObjetivos: "",
    evaluacion: "aprobada",
    evaluacionJustificacion: "",
    planAccion: [filaPlanVacia(), filaPlanVacia(), filaPlanVacia(), filaPlanVacia()],
    aprobacionResponsable: "",
    aprobacionResponsableFecha: "",
    aprobacionLiderSgc: "",
    aprobacionLiderSgcFecha: "",
    origenRiesgo: null,
  };
}

export function normalizarDatosAm(parcial: Partial<RegistroAmDatos>): RegistroAmDatos {
  const base = formularioAmVacio();
  return {
    ...base,
    ...parcial,
    planAccion: parcial.planAccion?.length ? parcial.planAccion : base.planAccion,
  };
}

export function prefillDesdeProyectoPortal(): RegistroAmDatos {
  return normalizarDatosAm({
    fechaRegistro: new Date().toISOString().slice(0, 10),
    proceso: "Mantenimiento",
    responsableProceso: "Juan Manuel Moncayo",
    reportadoPor: "César Taibel",
    reportadoCargo: "Coordinador de Mantenimiento",
    origen: "indicadores",
    descripcion:
      "SITUACIÓN IDENTIFICADA: El área de Mantenimiento gestiona la información en múltiples archivos dispersos (Excel, Word, carpetas locales): cronogramas preventivos, hojas de vida, indicadores y formatos del SGC. Esto dificulta el seguimiento en tiempo real y el cumplimiento de metas.\n\n" +
      "OPORTUNIDAD DE MEJORA — PROYECTO DESARROLLADO: Se desarrolló el «Portal de Mantenimiento EPI», aplicación web que integra panel de PM por área, mantenimiento preventivo y correctivo, hojas de vida, indicadores, formatos SGC (GC-RE-009, GC-RE-001, MT-RE-045, GH-RE-030), personal, matriz de conocimientos y control de acceso por roles con respaldo en nube (Supabase). Fase piloto funcional lista para demostración a la dirección.",
    beneficioEsperado:
      "Centralizar la información; mejorar cumplimiento de PM; reducir tiempos de respuesta al correctivo; generar formatos SGC desde el navegador; visibilidad en tiempo real para jefes; fortalecer gestión de competencias y contribuir a mejora continua y seguridad.",
    recursosHumanos: true,
    recursosTecnologicos: true,
    recursosInfraestructura: true,
    recursosEconomicos: true,
    recursosDescripcion:
      "Equipo de mantenimiento para piloto y capacitación; computadores con navegador; plataforma Supabase; conexión a internet en planta.",
    alineacionObjetivos:
      "Cumplimiento PM (>=95%); tiempo respuesta correctivo (10 min); acciones de mejora SGC (>=3 semestrales); cero accidentes; mejora continua.",
    evaluacion: "aprobada",
    evaluacionJustificacion:
      "El portal responde a necesidades reales del área. Inversión baja (desarrollo realizado) y alto retorno en trazabilidad, cumplimiento SGC y visibilidad para la dirección. Se recomienda aprobar fase piloto.",
    planAccion: [
      {
        actividad:
          "Presentar el Portal de Mantenimiento EPI a Dirección y Líder SGC con demostración en vivo.",
        responsable: "Coordinador de Mantenimiento",
        fechaEntrega: "2026-07-15",
        evidencia: "Acta de reunión / presentación realizada",
      },
      {
        actividad: "Ejecutar fase piloto 4 semanas en Plásticos y Confección.",
        responsable: "Juan Manuel Moncayo",
        fechaEntrega: "2026-08-15",
        evidencia: "Registros en sistema + informe piloto",
      },
      {
        actividad: "Capacitar al 100% del personal de mantenimiento en el portal.",
        responsable: "Coordinador de Mantenimiento",
        fechaEntrega: "2026-08-30",
        evidencia: "Listas de asistencia",
      },
      {
        actividad: "Desplegar en todas las áreas y oficializar como herramienta del SGC.",
        responsable: "Coordinador de Mantenimiento / Líder SGC",
        fechaEntrega: "2026-10-31",
        evidencia: "Portal en producción + acta de cierre",
      },
      {
        actividad: "Evaluar eficacia a 3 meses e informar impacto en indicadores.",
        responsable: "Líder SGC / Dirección de Producción",
        fechaEntrega: "2026-12-31",
        evidencia: "Informe de eficacia",
      },
    ],
    origenRiesgo: null,
  });
}

export function prefillDesdeRiesgo(datos: PrefillDesdeRiesgo): RegistroAmDatos {
  const origenRiesgo: OrigenRiesgoRef = {
    proceso: datos.proceso,
    descripcion: datos.descripcion,
    probabilidad: datos.probabilidad,
    consecuencia: datos.consecuencia,
    valor: datos.valor,
    nivel: datos.nivel,
    tratamiento: datos.tratamiento,
    consecuencias: datos.consecuencias,
  };

  const descripcion =
    `Riesgo identificado en la matriz de riesgos y oportunidades del proceso de ${datos.proceso}: ` +
    `"${datos.descripcion}". Clasificado con probabilidad ${datos.probabilidad}, consecuencia ` +
    `${datos.consecuencia} y nivel de riesgo ${datos.valor} (${datos.nivel}). ` +
    `Tratamiento definido: ${datos.tratamiento}.\n\n` +
    `Consecuencias potenciales: ${datos.consecuencias}.`;

  const beneficio =
    `Reducir la probabilidad de materialización del riesgo, proteger al personal, ` +
    `minimizar daños materiales y cumplir los objetivos de calidad del SGC.`;

  return normalizarDatosAm({
    origen: "riesgos",
    proceso: datos.proceso,
    responsableProceso: datos.responsableProceso ?? "",
    reportadoPor: datos.reportadoPor ?? "",
    reportadoCargo: datos.reportadoCargo ?? "",
    descripcion,
    beneficioEsperado: beneficio,
    alineacionObjetivos:
      datos.alineacionObjetivos ?? "Cero accidentes de trabajo — indicador de gestión del SGC.",
    evaluacion: "aprobada",
    evaluacionJustificacion:
      `El riesgo presenta nivel ${datos.nivel} (${datos.valor}) y requiere acciones de control. ` +
      `Las actividades propuestas son viables con los recursos del área.`,
    planAccion: datos.planAccion?.length ? datos.planAccion : undefined,
    origenRiesgo,
  });
}
