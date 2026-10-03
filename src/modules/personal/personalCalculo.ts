import { NOMBRES_MESES, parseFechaIso } from "../../lib/fechas";
import type { RegistroCorrectivo } from "../correctivo/types";
import type { RegistroPreventivo } from "../preventivo/types";
import {
  idsPersonalDeCorrectivo,
  idsPersonalDePreventivo,
} from "./personalVinculo";
import type { EstadisticasPersona, Persona } from "./types";

export type AlcancePeriodo = "todo" | "anio" | "mes";

export interface FiltroPeriodoPersonal {
  alcance: AlcancePeriodo;
  anio: number;
  mes: number;
}

export function registroEnPeriodo(
  fecha: string,
  filtro: FiltroPeriodoPersonal,
): boolean {
  if (filtro.alcance === "todo") return true;
  const parsed = parseFechaIso(fecha);
  if (!parsed) return false;
  if (filtro.alcance === "anio") return parsed.anio === filtro.anio;
  return parsed.anio === filtro.anio && parsed.mes === filtro.mes;
}

export function filtrarPreventivoPorPeriodo(
  registros: RegistroPreventivo[],
  filtro: FiltroPeriodoPersonal,
): RegistroPreventivo[] {
  if (filtro.alcance === "todo") return registros;
  return registros.filter((r) => registroEnPeriodo(r.fecha, filtro));
}

export function filtrarCorrectivoPorPeriodo(
  registros: RegistroCorrectivo[],
  filtro: FiltroPeriodoPersonal,
): RegistroCorrectivo[] {
  if (filtro.alcance === "todo") return registros;
  return registros.filter((r) => registroEnPeriodo(r.fecha, filtro));
}

export function etiquetaPeriodo(filtro: FiltroPeriodoPersonal): string {
  if (filtro.alcance === "todo") return "todo el historial";
  if (filtro.alcance === "anio") return `el año ${filtro.anio}`;
  return `${NOMBRES_MESES[filtro.mes - 1]} ${filtro.anio}`;
}

function claveMaquinaCorrectivo(registro: RegistroCorrectivo): string | null {
  if (registro.datos.maquinaId) return registro.datos.maquinaId;
  const nombre = registro.datos.maquinaEquipoLocacion?.trim();
  const codigo = registro.datos.codigoMaquina?.trim();
  if (!nombre && !codigo) return null;
  return `${codigo ?? ""}|${nombre ?? ""}`;
}

export function calcularEstadisticasPersonal(
  personas: Persona[],
  preventivo: RegistroPreventivo[],
  correctivo: RegistroCorrectivo[],
): EstadisticasPersona[] {
  const mapa = new Map<
    string,
    { preventivos: number; correctivos: number; maquinas: Set<string> }
  >();

  for (const registro of preventivo) {
    const ids = idsPersonalDePreventivo(registro);
    if (ids.length === 0) continue;
    for (const personalId of ids) {
      const actual = mapa.get(personalId) ?? {
        preventivos: 0,
        correctivos: 0,
        maquinas: new Set<string>(),
      };
      actual.preventivos += 1;
      if (registro.hoja_id) actual.maquinas.add(registro.hoja_id);
      mapa.set(personalId, actual);
    }
  }

  for (const registro of correctivo) {
    const ids = idsPersonalDeCorrectivo(registro);
    if (ids.length === 0) continue;
    for (const personalId of ids) {
      const actual = mapa.get(personalId) ?? {
        preventivos: 0,
        correctivos: 0,
        maquinas: new Set<string>(),
      };
      actual.correctivos += 1;
      const clave = claveMaquinaCorrectivo(registro);
      if (clave) actual.maquinas.add(clave);
      mapa.set(personalId, actual);
    }
  }

  return personas.map((persona) => {
    const datos = mapa.get(persona.id) ?? {
      preventivos: 0,
      correctivos: 0,
      maquinas: new Set<string>(),
    };
    return {
      persona,
      preventivos: datos.preventivos,
      correctivos: datos.correctivos,
      totalRegistros: datos.preventivos + datos.correctivos,
      maquinasDistintas: datos.maquinas.size,
    };
  });
}
