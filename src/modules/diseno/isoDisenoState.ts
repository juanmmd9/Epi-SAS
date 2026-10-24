import {
  crearRegistrosIniciales,
  type EstadoAppIso,
  type IdLineaDisenoIso,
} from "./isoDisenoCatalogo";

function claveLinea(lineaId: IdLineaDisenoIso): string {
  return `ISO_DESIGN_APP_STATE_${lineaId}`;
}

export function estadoVacioIso(): EstadoAppIso {
  return {
    selectedProjectId: "",
    currentStageTab: "8.3.2",
    projects: [],
    records: [],
  };
}

/** Datos de ejemplo distintos por línea de diseño. */
export function datosDemoIso(lineaId: IdLineaDisenoIso): EstadoAppIso {
  if (lineaId === "plasticos") {
    const projectId = "PRJ-PL-01";
    return {
      selectedProjectId: projectId,
      currentStageTab: "8.3.2",
      projects: [
        {
          id: projectId,
          code: "PRJ-2026-PL-01",
          name: "Casco de Seguridad Persa Tipo II",
          type: "Optimización de Molde/Matriz",
          lead: "Ingeniería de Diseño",
          startDate: "2026-09-01",
          targetDate: "2026-11-30",
          status: "En progreso",
        },
      ],
      records: [
        {
          id: "REC-PL-1",
          projectId,
          formatCode: "F-DIS-01",
          version: "01",
          status: "Aprobado",
          filledBy: "J. Ramírez",
          date: "2026-09-05",
          approvedBy: "Director Diseño",
          approvalDate: "2026-09-07",
          evidence: "//Servidor/Diseno/Plasticos/Cronograma.pdf",
          notes: "Cronograma aprobado sin desviaciones.",
        },
        {
          id: "REC-PL-2",
          projectId,
          formatCode: "F-DIS-02",
          version: "01",
          status: "Aprobado",
          filledBy: "F. Rosales",
          date: "2026-09-08",
          approvedBy: "Director Diseño",
          approvalDate: "2026-09-10",
          evidence: "//Servidor/Diseno/Plasticos/Riesgos.xlsx",
          notes: "Riesgos identificados y mitigados.",
        },
        {
          id: "REC-PL-5",
          projectId,
          formatCode: "F-DIS-05",
          version: "01",
          status: "En Elaboración",
          filledBy: "B. Realpe",
          date: "2026-10-02",
          approvedBy: "",
          approvalDate: "",
          evidence: "Ensayos en máquina de impacto",
          notes: "Pendiente reporte final de aceleración.",
        },
        ...crearRegistrosIniciales(projectId).filter(
          (r) => !["F-DIS-01", "F-DIS-02", "F-DIS-05"].includes(r.formatCode),
        ),
      ],
    };
  }

  if (lineaId === "alturas") {
    const projectId = "PRJ-AL-01";
    return {
      selectedProjectId: projectId,
      currentStageTab: "8.3.2",
      projects: [
        {
          id: projectId,
          code: "PRJ-2026-AL-01",
          name: "Hebillas Dieléctricas de Liberación Rápida",
          type: "Nuevo Producto",
          lead: "Diseño y Calidad",
          startDate: "2026-08-15",
          targetDate: "2026-12-15",
          status: "En progreso",
        },
      ],
      records: [
        {
          id: "REC-AL-1",
          projectId,
          formatCode: "F-DIS-01",
          version: "01",
          status: "Aprobado",
          filledBy: "J. Ramírez",
          date: "2026-08-20",
          approvedBy: "Director Diseño",
          approvalDate: "2026-08-22",
          evidence: "//Servidor/Diseno/Alturas/Plan.pdf",
          notes: "Plan aprobado.",
        },
        {
          id: "REC-AL-3",
          projectId,
          formatCode: "F-DIS-03",
          version: "01",
          status: "En Elaboración",
          filledBy: "G. Giraldo",
          date: "2026-09-01",
          approvedBy: "",
          approvalDate: "",
          evidence: "Norma ANSI Z359",
          notes: "Definiendo rigidez dieléctrica.",
        },
        ...crearRegistrosIniciales(projectId).filter(
          (r) => !["F-DIS-01", "F-DIS-03"].includes(r.formatCode),
        ),
      ],
    };
  }

  // ingeniería: arranca vacío para crear proyectos propios
  return estadoVacioIso();
}

export function cargarEstadoIso(lineaId: IdLineaDisenoIso): EstadoAppIso {
  try {
    const raw = localStorage.getItem(claveLinea(lineaId));
    if (!raw) return datosDemoIso(lineaId);
    const parsed = JSON.parse(raw) as EstadoAppIso;
    if (!parsed || !Array.isArray(parsed.projects) || !Array.isArray(parsed.records)) {
      return datosDemoIso(lineaId);
    }
    return {
      selectedProjectId: parsed.selectedProjectId || parsed.projects[0]?.id || "",
      currentStageTab: parsed.currentStageTab || "8.3.2",
      projects: parsed.projects,
      records: parsed.records,
    };
  } catch {
    return datosDemoIso(lineaId);
  }
}

export function guardarEstadoIso(lineaId: IdLineaDisenoIso, estado: EstadoAppIso): void {
  localStorage.setItem(claveLinea(lineaId), JSON.stringify(estado));
}

export function restablecerEstadoIso(lineaId: IdLineaDisenoIso): EstadoAppIso {
  localStorage.removeItem(claveLinea(lineaId));
  const fresco = datosDemoIso(lineaId);
  guardarEstadoIso(lineaId, fresco);
  return fresco;
}
