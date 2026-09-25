import { NOMBRES_MESES } from "../../lib/fechas";
import type { RegistroCorrectivo } from "./types";

export type CriterioFechaCorrectivo = "solicitud" | "cierre";

export interface ConteoCorrectivoMes {
  total: number;
  cerradas: number;
  abiertas: number;
  enEsperaRepuesto: number;
  porArea: { area: string; cantidad: number }[];
  porTipo: { tipo: string; cantidad: number }[];
}

function enMes(fechaTexto: string | null | undefined, anio: number, mes: number): boolean {
  /** mes = 0 → todos los meses del año indicado. */
  if (!fechaTexto) return false;
  const partes = fechaTexto.slice(0, 10).split("-");
  if (partes.length < 2) return false;
  if (Number.parseInt(partes[0], 10) !== anio) return false;
  if (mes === 0) return true;
  return Number.parseInt(partes[1], 10) === mes;
}

function fechaConteo(registro: RegistroCorrectivo, criterio: CriterioFechaCorrectivo): string {
  if (criterio === "cierre") return registro.datos.fechaCierre || "";
  return registro.fecha;
}

export function contarCorrectivosMes(
  registros: RegistroCorrectivo[],
  anio: number,
  mes: number,
  criterio: CriterioFechaCorrectivo,
  areaFiltro = "",
): ConteoCorrectivoMes {
  const base = filtrarCorrectivosMes(registros, anio, mes, criterio, "todas", areaFiltro);

  const mapaArea = new Map<string, number>();
  const mapaTipo = new Map<string, number>();
  let cerradas = 0;
  let abiertas = 0;
  let enEsperaRepuesto = 0;

  for (const r of base) {
    mapaArea.set(r.area, (mapaArea.get(r.area) ?? 0) + 1);
    for (const tipo of r.datos.tiposSolicitud) {
      mapaTipo.set(tipo, (mapaTipo.get(tipo) ?? 0) + 1);
    }
    if (r.datos.fechaCierre) cerradas += 1;
    else {
      abiertas += 1;
      if (r.datos.esperaRepuesto) enEsperaRepuesto += 1;
    }
  }

  const porArea = [...mapaArea.entries()]
    .map(([area, cantidad]) => ({ area, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad || a.area.localeCompare(b.area));

  const porTipo = [...mapaTipo.entries()]
    .map(([tipo, cantidad]) => ({ tipo, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad || a.tipo.localeCompare(b.tipo));

  return {
    total: base.length,
    cerradas,
    abiertas,
    enEsperaRepuesto,
    porArea,
    porTipo,
  };
}

export type FiltroEstadoCorrectivoMes = "todas" | "abiertas" | "cerradas" | "espera";

/** Filtra registros del mes (mes = 0 = todos) y opcionalmente por estado. */
export function filtrarCorrectivosMes(
  registros: RegistroCorrectivo[],
  anio: number,
  mes: number,
  criterio: CriterioFechaCorrectivo,
  estado: FiltroEstadoCorrectivoMes = "todas",
  areaFiltro = "",
): RegistroCorrectivo[] {
  return registros.filter((r) => {
    if (areaFiltro && r.area !== areaFiltro) return false;
    const fecha = fechaConteo(r, criterio);
    if (mes === 0) {
      if (criterio === "cierre" && !fecha.trim()) return false;
      if (!enMes(fecha, anio, 0)) return false;
    } else if (!enMes(fecha, anio, mes)) {
      return false;
    }
    const abierta = !r.datos.fechaCierre?.trim();
    if (estado === "abiertas") return abierta;
    if (estado === "cerradas") return !abierta;
    if (estado === "espera") return abierta && Boolean(r.datos.esperaRepuesto);
    return true;
  });
}

export function etiquetaMesAnio(anio: number, mes: number): string {
  return `${NOMBRES_MESES[mes - 1]} ${anio}`;
}
