export type IdLineaDisenoIso = "alturas" | "plasticos" | "ingenieria";

export type EstadoFormatoIso = "Pendiente" | "En Elaboración" | "Aprobado";

export type TipoProyectoIso =
  | "Nuevo Producto"
  | "Modificación de Diseño"
  | "Optimización de Molde/Matriz";

export interface EtapaIso {
  id: string;
  name: string;
  weight: number;
}

export interface FormatoMaestroIso {
  code: string;
  name: string;
  stage: string;
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
}

export interface EstadoAppIso {
  selectedProjectId: string;
  currentStageTab: string;
  projects: ProyectoIso[];
  records: RegistroFormatoIso[];
}

export const ISO_STAGES: EtapaIso[] = [
  { id: "8.3.2", name: "Planificación", weight: 0.15 },
  { id: "8.3.3", name: "Entradas", weight: 0.2 },
  { id: "8.3.4_VERIF", name: "Verificación", weight: 0.25 },
  { id: "8.3.4_VALID", name: "Validación", weight: 0.25 },
  { id: "8.3.5", name: "Salidas y Cierre", weight: 0.15 },
];

export const MASTER_FORMATS: FormatoMaestroIso[] = [
  { code: "F-DIS-01", name: "Plan de Diseño y Cronograma Técnico", stage: "8.3.2" },
  { code: "F-DIS-02", name: "Matriz de Gestión del Riesgo del Producto", stage: "8.3.2" },
  { code: "F-DIS-03", name: "Ficha de Requisitos y Entradas Normativas", stage: "8.3.3" },
  { code: "F-DIS-04", name: "Lista Preliminar de Materiales (BOM)", stage: "8.3.3" },
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

export function calculateProjectProgress(
  projectId: string,
  records: RegistroFormatoIso[],
): number {
  let total = 0;
  for (const stage of ISO_STAGES) {
    const formats = MASTER_FORMATS.filter((f) => f.stage === stage.id);
    if (formats.length === 0) continue;
    let score = 0;
    for (const fmt of formats) {
      const rec = records.find((r) => r.projectId === projectId && r.formatCode === fmt.code);
      score += scoreEstado(rec?.status);
    }
    total += (score / formats.length) * stage.weight;
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
  let score = 0;
  for (const fmt of formats) {
    const rec = records.find((r) => r.projectId === projectId && r.formatCode === fmt.code);
    score += scoreEstado(rec?.status);
  }
  return Math.round((score / formats.length) * 100);
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
  }));
}
