export type TipoMatriz = "Riesgo" | "Oportunidad";
export type Probabilidad = 3 | 7 | 10 | "";
export type Consecuencia = 1 | 2 | 3 | 4 | 5 | "";

export interface FilaMatriz {
  id: string;
  proceso: string;
  riesgo: string;
  tipo: TipoMatriz;
  p: Probabilidad;
  c: Consecuencia;
  tratamiento: string;
  acciones: string;
  responsable: string;
  indicador: string;
  monitoreo: string;
  fechaSeguimiento: string;
  pNueva: Probabilidad;
  cNueva: Consecuencia;
  eficacia: string;
  evaluador: string;
  observacion: string;
}

export interface DocumentoMatriz {
  fechaRevision: string;
  anio: number;
  filas: FilaMatriz[];
}

export const CODIGO_MATRIZ = "GC-DO-007";
export const VERSION_MATRIZ = "6";
export const PROBABILIDADES = [3, 7, 10] as const;
export const CONSECUENCIAS = [1, 2, 3, 4, 5] as const;
export const TRATAMIENTOS = [
  "Asumir",
  "Eliminar",
  "Evitar",
  "Transferir",
  "Controlar",
  "Evaluar",
  "Formular",
  "Analizar",
  "Considerar",
] as const;
export const ESTADOS_MONITOREO = [
  "En gestión",
  "Mitigación activa",
  "Seguimiento activado",
  "Resuelto (Riesgo u oportunidad sin prioridad)",
  "Asumido",
  "Mitigación finalizada",
  "Seguimiento finalizado",
  "Mitigación no satisfactoria",
  "Seguimiento no satisfatorio",
] as const;
export const EFICACIAS = [
  "Eficaz",
  "Aceptable",
  "Regular",
  "No se ha gestionado",
  "No eficaz",
] as const;

export function valorDe(p: Probabilidad, c: Consecuencia): number | null {
  if (p === "" || c === "") return null;
  return p * c;
}

/** Escala GC-DO-007: hasta 15 Bajo, hasta 28 Moderado, hasta 40 Alto, de 41 Extremo o Alcanzable. */
export function nivelDe(valor: number | null, tipo: TipoMatriz): string {
  if (valor == null) return "";
  if (valor <= 15) return "Bajo";
  if (valor <= 28) return "Moderado";
  if (valor <= 40) return "Alto";
  return tipo === "Oportunidad" ? "Alcanzable" : "Extremo";
}

export function claseNivel(valor: number | null): string {
  if (valor == null) return "";
  if (valor <= 15) return "matriz-riesgo__valor--bajo";
  if (valor <= 28) return "matriz-riesgo__valor--medio";
  return "matriz-riesgo__valor--alto";
}

export function filaVacia(): FilaMatriz {
  return {
    id: crypto.randomUUID(),
    proceso: "Mantenimiento",
    riesgo: "",
    tipo: "Riesgo",
    p: "",
    c: "",
    tratamiento: "",
    acciones: "",
    responsable: "",
    indicador: "",
    monitoreo: "",
    fechaSeguimiento: "",
    pNueva: "",
    cNueva: "",
    eficacia: "",
    evaluador: "",
    observacion: "",
  };
}

function fila(
  parcial: Omit<FilaMatriz, "id"> & { id?: string },
): FilaMatriz {
  return { id: parcial.id ?? crypto.randomUUID(), ...parcial };
}

export function documentoInicial(): DocumentoMatriz {
  return {
    fechaRevision: "6 de mayo de 2026",
    anio: 2026,
    filas: [
      fila({
        proceso: "Mantenimiento",
        riesgo: "Falla crítica de equipos por ausencia o deficiencia del mantenimiento preventivo",
        tipo: "Riesgo",
        p: 7,
        c: 5,
        tratamiento: "Evitar",
        acciones:
          "Ejecutar el cronograma de mantenimiento preventivo y registrar cada intervención en el reporte MT-RE-045. Atender primero los equipos críticos vencidos.",
        responsable: "COORDINADOR MANTENIMIENTO",
        indicador: "Disponibilidad = (Horas disponibles / Horas programadas) x 100. Meta: mayor a 95%.",
        monitoreo: "Seguimiento activado",
        fechaSeguimiento: "2026-10-20",
        pNueva: 3,
        cNueva: 4,
        eficacia: "Eficaz",
        evaluador: "Coordinador de Mantenimiento",
        observacion:
          "De enero a septiembre de 2026 el cumplimiento del preventivo fue 100%. Al 20 de octubre el mes sigue abierto (9%). Los 109 preventivos del año tienen reporte MT-RE-045.",
      }),
      fila({
        proceso: "Mantenimiento",
        riesgo: "Accidentes laborales asociados a fallas o condiciones inseguras de equipos",
        tipo: "Riesgo",
        p: 7,
        c: 5,
        tratamiento: "Controlar",
        acciones:
          "Inspeccionar condiciones inseguras antes de intervenir, aplicar bloqueo de energías y reportar a SST todo evento asociado a falla de equipo.",
        responsable: "SST",
        indicador: "Número de accidentes asociados a falla o condición insegura de equipo. Meta: 0.",
        monitoreo: "En gestión",
        fechaSeguimiento: "2026-10-20",
        pNueva: 7,
        cNueva: 5,
        eficacia: "No se ha gestionado",
        evaluador: "Coordinador de Mantenimiento",
        observacion:
          "El portal de mantenimiento no registra accidentes de trabajo. La meta de cero accidentes sigue a cargo de SST, por eso no se baja la calificación.",
      }),
      fila({
        proceso: "Mantenimiento",
        riesgo: "Reincidencia de fallas por falta de análisis de causa raíz",
        tipo: "Riesgo",
        p: 7,
        c: 4,
        tratamiento: "Evitar",
        acciones:
          "Aplicar análisis de causa raíz a toda falla repetida y cerrar la acción antes de dar por terminada la intervención.",
        responsable: "COORDINADOR MANTENIMIENTO",
        indicador: "MTBF = Tiempo total de operación / Número de fallas. Meta: aumentar frente al periodo anterior.",
        monitoreo: "En gestión",
        fechaSeguimiento: "2026-10-20",
        pNueva: 7,
        cNueva: 4,
        eficacia: "Regular",
        evaluador: "Coordinador de Mantenimiento",
        observacion:
          "Sigue habiendo análisis de causa, pero las horas perdidas por correctivo pasan la meta del 1%. En tejidos agosto cerró en 7,42% y septiembre en 10,24%.",
      }),
      fila({
        proceso: "Mantenimiento",
        riesgo:
          "Incumplimiento del programa de mantenimiento preventivo por falta de recursos o programación",
        tipo: "Riesgo",
        p: 3,
        c: 3,
        tratamiento: "Evitar",
        acciones:
          "Programar el preventivo con repuestos y personal disponibles. Reprogramar solo con aprobación y medir el cumplimiento sobre lo programado.",
        responsable: "COORDINADOR MANTENIMIENTO",
        indicador: "Cumplimiento = (Preventivos realizados / Preventivos programados) x 100. Meta: 100%.",
        monitoreo: "Seguimiento activado",
        fechaSeguimiento: "2026-10-20",
        pNueva: 3,
        cNueva: 2,
        eficacia: "Eficaz",
        evaluador: "Coordinador de Mantenimiento",
        observacion:
          "Enero a septiembre de 2026 cerraron en 100% de cumplimiento del programa. Octubre sigue en curso y no se toma como incumplimiento.",
      }),
      fila({
        proceso: "Mantenimiento",
        riesgo: "Pérdida de trazabilidad por registros incompletos o inexistentes",
        tipo: "Riesgo",
        p: 3,
        c: 4,
        tratamiento: "Evitar",
        acciones:
          "Diligenciar la hoja de vida y el reporte de mantenimiento en cada intervención. No cerrar la tarea sin registro.",
        responsable: "COORDINADOR MANTENIMIENTO",
        indicador:
          "Trazabilidad = (Intervenciones con registro completo / Intervenciones realizadas) x 100. Meta: 100%.",
        monitoreo: "Seguimiento activado",
        fechaSeguimiento: "2026-10-20",
        pNueva: 3,
        cNueva: 2,
        eficacia: "Eficaz",
        evaluador: "Coordinador de Mantenimiento",
        observacion: "Los 109 preventivos de 2026 tienen reporte MT-RE-045. Hay 200 hojas de vida en el sistema.",
      }),
      fila({
        proceso: "Mantenimiento",
        riesgo: "Digitalización del mantenimiento",
        tipo: "Oportunidad",
        p: 7,
        c: 3,
        tratamiento: "Considerar",
        acciones:
          "Pasar hojas de vida, cronograma y reportes al sistema, empezando por los equipos críticos.",
        responsable: "COORDINADOR MANTENIMIENTO",
        indicador: "Activos digitalizados = (Activos con hoja de vida en el sistema / Total de activos) x 100.",
        monitoreo: "Seguimiento activado",
        fechaSeguimiento: "2026-10-20",
        pNueva: 10,
        cNueva: 4,
        eficacia: "Eficaz",
        evaluador: "Coordinador de Mantenimiento",
        observacion:
          "El mantenimiento ya se lleva en el portal: hojas de vida, cronograma, preventivos y reportes. Algunos registros todavía guardan soporte físico.",
      }),
      fila({
        proceso: "Mantenimiento",
        riesgo: "Capacitación técnica interna",
        tipo: "Oportunidad",
        p: 10,
        c: 3,
        tratamiento: "Considerar",
        acciones: "Programar la formación técnica interna por área y registrar asistencia y horas ejecutadas.",
        responsable: "RRHH",
        indicador: "Cumplimiento de formación = (Horas ejecutadas / Horas programadas) x 100.",
        monitoreo: "En gestión",
        fechaSeguimiento: "2026-10-20",
        pNueva: 10,
        cNueva: 3,
        eficacia: "No se ha gestionado",
        evaluador: "Coordinador de Mantenimiento",
        observacion:
          "No hay en el portal un registro de horas de formación ejecutadas contra las programadas. La oportunidad sigue abierta.",
      }),
      fila({
        proceso: "Mantenimiento",
        riesgo: "Renovación de equipos críticos",
        tipo: "Oportunidad",
        p: 7,
        c: 5,
        tratamiento: "Considerar",
        acciones:
          "Identificar los equipos críticos obsoletos, priorizarlos por falla e impacto y presentar el plan de renovación a gerencia.",
        responsable: "GERENCIA",
        indicador: "Renovación = (Equipos críticos renovados / Equipos críticos priorizados) x 100.",
        monitoreo: "En gestión",
        fechaSeguimiento: "2026-10-20",
        pNueva: 7,
        cNueva: 3,
        eficacia: "Regular",
        evaluador: "Coordinador de Mantenimiento",
        observacion:
          "Hay renovaciones puntuales, como el sistema de enfriamiento de plásticos. Tejidos sigue con horas perdidas altas, así que la renovación de equipos críticos no está cerrada.",
      }),
    ],
  };
}

function esProbabilidad(valor: unknown): valor is Probabilidad {
  return valor === "" || valor === 3 || valor === 7 || valor === 10;
}

function esConsecuencia(valor: unknown): valor is Consecuencia {
  return valor === "" || valor === 1 || valor === 2 || valor === 3 || valor === 4 || valor === 5;
}

function numeroOVacio(valor: unknown, validar: (n: number) => boolean): number | "" {
  if (valor === "" || valor == null) return "";
  const n = typeof valor === "number" ? valor : Number(valor);
  return validar(n) ? n : "";
}

export function normalizarDocumento(valor: unknown): DocumentoMatriz | null {
  if (!valor || typeof valor !== "object") return null;
  const doc = valor as Partial<DocumentoMatriz>;
  if (!Array.isArray(doc.filas)) return null;
  const filas = doc.filas
    .filter((fila) => fila && typeof fila === "object")
    .map((cruda) => {
      const f = cruda as Partial<FilaMatriz>;
      return {
        id: typeof f.id === "string" && f.id ? f.id : crypto.randomUUID(),
        proceso: String(f.proceso ?? "Mantenimiento"),
        riesgo: String(f.riesgo ?? ""),
        tipo: f.tipo === "Oportunidad" ? "Oportunidad" : "Riesgo",
        p: numeroOVacio(f.p, (n) => esProbabilidad(n)) as Probabilidad,
        c: numeroOVacio(f.c, (n) => esConsecuencia(n)) as Consecuencia,
        tratamiento: String(f.tratamiento ?? ""),
        acciones: String(f.acciones ?? ""),
        responsable: String(f.responsable ?? ""),
        indicador: String(f.indicador ?? ""),
        monitoreo: String(f.monitoreo ?? ""),
        fechaSeguimiento: String(f.fechaSeguimiento ?? ""),
        pNueva: numeroOVacio(f.pNueva, (n) => esProbabilidad(n)) as Probabilidad,
        cNueva: numeroOVacio(f.cNueva, (n) => esConsecuencia(n)) as Consecuencia,
        eficacia: String(f.eficacia ?? ""),
        evaluador: String(f.evaluador ?? ""),
        observacion: String(f.observacion ?? ""),
      } satisfies FilaMatriz;
    });
  return {
    fechaRevision: String(doc.fechaRevision ?? "6 de mayo de 2026"),
    anio: typeof doc.anio === "number" ? doc.anio : 2026,
    filas,
  };
}
