export type IdLineaDisenoIso = "alturas" | "plasticos" | "ingenieria";

export type EstadoFormatoIso = "Pendiente" | "En Elaboración" | "Aprobado";

export type TipoProyectoIso =
  | "Nuevo Producto"
  | "Modificación de Diseño"
  | "Optimización de Molde/Matriz";

export interface EtapaIso {
  id: string;
  name: string;
  /** Peso del proyecto (0–1). */
  weight: number;
}

export interface FormatoMaestroIso {
  code: string;
  name: string;
  stage: string;
  /** Peso absoluto en el proyecto (0–1). Si falta, se reparte el peso de la etapa. */
  weight?: number;
}

export interface DocumentoIso {
  id: string;
  nombre: string;
  url: string;
  fecha: string;
}

export interface ProyectoIso {
  id: string;
  code: string;
  name: string;
  type: TipoProyectoIso;
  /** Nombre visible del encargado (del equipo o perfil ejemplo). */
  lead: string;
  /** Id de usuarios_portal o del perfil ejemplo. */
  leadId?: string;
  startDate: string;
  targetDate: string;
  status: string;
}

/** Perfil demo cuando aún no hay auxiliares registrados en Equipo. */
export const ENCARGADO_EJEMPLO = {
  id: "ejemplo-auxiliar-diseno",
  nombre: "Auxiliar ejemplo (demo)",
} as const;

export interface RegistroFormatoIso {
  id: string;
  projectId: string;
  formatCode: string;
  version: string;
  status: EstadoFormatoIso;
  filledBy: string;
  date: string;
  approvedBy: string;
  approvalDate: string;
  evidence: string;
  notes: string;
  documents?: DocumentoIso[];
}

export interface EstadoAppIso {
  selectedProjectId: string;
  currentStageTab: string;
  projects: ProyectoIso[];
  records: RegistroFormatoIso[];
}

/**
 * Ponderación del numeral 8.3:
 * Planificación 10%, Entradas 15%, Diseño (concepto 10% + preliminar 20% + detalle 20%),
 * Verificación 10%, Validación 10%, Salidas 5%.
 */
export const ISO_STAGES: EtapaIso[] = [
  { id: "8.3.2", name: "Planificación", weight: 0.1 },
  { id: "8.3.3", name: "Entradas", weight: 0.15 },
  { id: "8.3.4_DES", name: "Diseño y Desarrollo", weight: 0.5 },
  { id: "8.3.4_VERIF", name: "Verificación", weight: 0.1 },
  { id: "8.3.4_VALID", name: "Validación", weight: 0.1 },
  { id: "8.3.5", name: "Salidas y Cierre", weight: 0.05 },
];

export const MASTER_FORMATS: FormatoMaestroIso[] = [
  { code: "F-DIS-01", name: "Plan de Diseño y Cronograma Técnico", stage: "8.3.2" },
  { code: "F-DIS-02", name: "Matriz de Gestión del Riesgo del Producto", stage: "8.3.2" },
  { code: "F-DIS-03", name: "Ficha de Requisitos y Entradas Normativas", stage: "8.3.3" },
  { code: "F-DIS-04", name: "Lista Preliminar de Materiales (BOM)", stage: "8.3.3" },
  { code: "F-DIS-12", name: "Diseño conceptual", stage: "8.3.4_DES", weight: 0.1 },
  { code: "F-DIS-13", name: "Diseño preliminar", stage: "8.3.4_DES", weight: 0.2 },
  { code: "F-DIS-14", name: "Diseño detalle", stage: "8.3.4_DES", weight: 0.2 },
  {
    code: "F-DIS-05",
    name: "Protocolo de Ensayos y Cálculos de Verificación",
    stage: "8.3.4_VERIF",
  },
  {
    code: "F-DIS-06",
    name: "Reporte Dimensional y Ajuste de Prototipo",
    stage: "8.3.4_VERIF",
  },
  {
    code: "F-DIS-07",
    name: "Validación de Desempeño y Pruebas Destructivas",
    stage: "8.3.4_VALID",
  },
  {
    code: "F-DIS-08",
    name: "Aprobación de Lote Piloto / Muestra Inicial",
    stage: "8.3.4_VALID",
  },
  { code: "F-DIS-09", name: "Ficha Técnica Definitiva y Planos Aprobados", stage: "8.3.5" },
  { code: "F-DIS-10", name: "Acta de Cierre y Transferencia a Producción", stage: "8.3.5" },
  { code: "F-DIS-11", name: "Solicitud y Evaluación de Control de Cambios", stage: "8.3.5" },
];

export const TIPOS_PROYECTO_ISO: TipoProyectoIso[] = [
  "Nuevo Producto",
  "Modificación de Diseño",
  "Optimización de Molde/Matriz",
];

function scoreEstado(status: EstadoFormatoIso | undefined): number {
  if (status === "Aprobado") return 1;
  if (status === "En Elaboración") return 0.5;
  return 0;
}

/** Peso de cada formato dentro del proyecto. */
export function pesoFormato(fmt: FormatoMaestroIso): number {
  if (typeof fmt.weight === "number") return fmt.weight;
  const stage = ISO_STAGES.find((s) => s.id === fmt.stage);
  if (!stage) return 0;
  const delStage = MASTER_FORMATS.filter((f) => f.stage === fmt.stage);
  const conPesoPropio = delStage.filter((f) => typeof f.weight === "number");
  const pesoAsignado = conPesoPropio.reduce((acc, f) => acc + (f.weight ?? 0), 0);
  const sinPeso = delStage.filter((f) => typeof f.weight !== "number");
  if (sinPeso.length === 0) return 0;
  return Math.max(0, stage.weight - pesoAsignado) / sinPeso.length;
}

export function calculateProjectProgress(
  projectId: string,
  records: RegistroFormatoIso[],
): number {
  let total = 0;
  for (const fmt of MASTER_FORMATS) {
    const rec = records.find((r) => r.projectId === projectId && r.formatCode === fmt.code);
    total += scoreEstado(rec?.status) * pesoFormato(fmt);
  }
  return Math.round(total * 100);
}

export function calculateStageProgress(
  projectId: string,
  stageId: string,
  records: RegistroFormatoIso[],
): number {
  const formats = MASTER_FORMATS.filter((f) => f.stage === stageId);
  if (formats.length === 0) return 0;
  const pesoTotal = formats.reduce((acc, f) => acc + pesoFormato(f), 0);
  if (pesoTotal <= 0) return 0;
  let score = 0;
  for (const fmt of formats) {
    const rec = records.find((r) => r.projectId === projectId && r.formatCode === fmt.code);
    score += scoreEstado(rec?.status) * pesoFormato(fmt);
  }
  return Math.round((score / pesoTotal) * 100);
}

export function documentosDe(registro: RegistroFormatoIso | null | undefined): DocumentoIso[] {
  return registro?.documents ?? [];
}

export function tieneEvidenciaVisible(registro: RegistroFormatoIso | null | undefined): boolean {
  if (!registro) return false;
  if (documentosDe(registro).length > 0) return true;
  return Boolean(registro.evidence?.trim());
}

/** Documento subido (archivo), no solo ruta de texto. */
export function tieneDocumentoSubido(registro: RegistroFormatoIso | null | undefined): boolean {
  return documentosDe(registro).length > 0;
}

/** Formato liberado: aprobado + al menos un documento cargado. */
export function formatoLiberado(registro: RegistroFormatoIso | null | undefined): boolean {
  return registro?.status === "Aprobado" && tieneDocumentoSubido(registro);
}

export function registroDeFormato(
  projectId: string,
  formatCode: string,
  records: RegistroFormatoIso[],
): RegistroFormatoIso | undefined {
  return records.find((r) => r.projectId === projectId && r.formatCode === formatCode);
}

/** Todos los formatos de la etapa están aprobados con documentación. */
export function etapaCompleta(
  projectId: string,
  stageId: string,
  records: RegistroFormatoIso[],
): boolean {
  const formats = MASTER_FORMATS.filter((f) => f.stage === stageId);
  if (formats.length === 0) return false;
  return formats.every((fmt) => formatoLiberado(registroDeFormato(projectId, fmt.code, records)));
}

/**
 * Una etapa está desbloqueada si es la primera o todas las anteriores están completas.
 * Así el proceso avanza por tapas.
 */
export function etapaDesbloqueada(
  projectId: string,
  stageId: string,
  records: RegistroFormatoIso[],
): boolean {
  const indice = ISO_STAGES.findIndex((s) => s.id === stageId);
  if (indice <= 0) return true;
  for (let i = 0; i < indice; i++) {
    if (!etapaCompleta(projectId, ISO_STAGES[i].id, records)) return false;
  }
  return true;
}

/**
 * Dentro de una etapa, cada formato se libera en orden (tapa a tapa).
 * El primero siempre está disponible; el resto exige que el anterior esté liberado.
 */
export function formatoDesbloqueadoEnEtapa(
  projectId: string,
  formatCode: string,
  records: RegistroFormatoIso[],
): boolean {
  const fmt = MASTER_FORMATS.find((f) => f.code === formatCode);
  if (!fmt) return false;
  const delStage = MASTER_FORMATS.filter((f) => f.stage === fmt.stage);
  const indice = delStage.findIndex((f) => f.code === formatCode);
  if (indice <= 0) return true;
  for (let i = 0; i < indice; i++) {
    if (!formatoLiberado(registroDeFormato(projectId, delStage[i].code, records))) return false;
  }
  return true;
}

export function crearRegistrosIniciales(projectId: string): RegistroFormatoIso[] {
  return MASTER_FORMATS.map((fmt) => ({
    id: `REC-${crypto.randomUUID()}`,
    projectId,
    formatCode: fmt.code,
    version: "01",
    status: "Pendiente" as const,
    filledBy: "",
    date: "",
    approvedBy: "",
    approvalDate: "",
    evidence: "",
    notes: "",
    documents: [],
  }));
}
