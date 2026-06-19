import type { CompetenciaMatriz, ValorMatrizCelda } from "./types";

export interface ResumenFilaMatriz {
  sumaI: number;
  sumaD: number;
  sumaH: number;
  semaforo: number | null;
  claseSemaforo: "ok" | "alerta" | "fail" | "";
}

export function claveCeldaMatriz(personalId: string, competenciaId: string): string {
  return `${personalId}:${competenciaId}`;
}

export function construirMapaValores(valores: ValorMatrizCelda[]): Map<string, ValorMatrizCelda> {
  const mapa = new Map<string, ValorMatrizCelda>();
  valores.forEach((valor) => {
    mapa.set(claveCeldaMatriz(valor.personal_id, valor.competencia_id), valor);
  });
  return mapa;
}

export function obtenerValorCelda(
  mapa: Map<string, ValorMatrizCelda>,
  personalId: string,
  competencia: CompetenciaMatriz,
): ValorMatrizCelda {
  const guardado = mapa.get(claveCeldaMatriz(personalId, competencia.id));
  if (guardado) return guardado;
  return {
    personal_id: personalId,
    competencia_id: competencia.id,
    nivel_i: 1,
    nivel_d: competencia.meta_d,
    nivel_h: 0,
  };
}

export function porcentajeHsobreD(nivelH: number, nivelD: number): number | null {
  if (nivelD === 0) return null;
  return nivelH / nivelD;
}

export function formatearPorcentajeMatriz(ratio: number | null): string {
  if (ratio === null || Number.isNaN(ratio)) return "—";
  return `${Math.round(ratio * 100)}%`;
}

export function claseSemaforoRatio(ratio: number | null): ResumenFilaMatriz["claseSemaforo"] {
  if (ratio === null || Number.isNaN(ratio)) return "";
  if (ratio >= 1) return "ok";
  if (ratio >= 0.75) return "alerta";
  return "fail";
}

export function calcularResumenPersona(
  personalId: string,
  competencias: CompetenciaMatriz[],
  mapa: Map<string, ValorMatrizCelda>,
): ResumenFilaMatriz {
  let sumaI = 0;
  let sumaD = 0;
  let sumaH = 0;

  competencias.forEach((competencia) => {
    const celda = obtenerValorCelda(mapa, personalId, competencia);
    sumaI += celda.nivel_i;
    sumaD += celda.nivel_d;
    sumaH += celda.nivel_h;
  });

  if (sumaD === 0) {
    return { sumaI, sumaD, sumaH, semaforo: null, claseSemaforo: "" };
  }

  const semaforo = sumaH / sumaD;
  return { sumaI, sumaD, sumaH, semaforo, claseSemaforo: claseSemaforoRatio(semaforo) };
}

export function calcularResumenFila(
  competencia: CompetenciaMatriz,
  personalIds: string[],
  mapa: Map<string, ValorMatrizCelda>,
): ResumenFilaMatriz {
  let sumaI = 0;
  let sumaD = 0;
  let sumaH = 0;

  personalIds.forEach((personalId) => {
    const celda = obtenerValorCelda(mapa, personalId, competencia);
    sumaI += celda.nivel_i;
    sumaD += celda.nivel_d;
    sumaH += celda.nivel_h;
  });

  if (sumaD === 0) {
    return { sumaI, sumaD, sumaH, semaforo: null, claseSemaforo: "" };
  }

  const semaforo = sumaH / sumaD;
  return { sumaI, sumaD, sumaH, semaforo, claseSemaforo: claseSemaforoRatio(semaforo) };
}

export function claseNivelH(nivelH: number, nivelD: number): string {
  if (nivelH < nivelD) return "matriz-celda--bajo-meta";
  if (nivelH === 0) return "matriz-celda--nivel-0";
  if (nivelH === 1) return "matriz-celda--nivel-1";
  if (nivelH === 2) return "matriz-celda--nivel-2";
  if (nivelH === 3) return "matriz-celda--nivel-3";
  return "matriz-celda--nivel-4";
}

export function agruparPorCategoria(
  competencias: CompetenciaMatriz[],
): { categoria: string; items: CompetenciaMatriz[] }[] {
  const grupos: { categoria: string; items: CompetenciaMatriz[] }[] = [];
  competencias.forEach((item) => {
    const ultimo = grupos[grupos.length - 1];
    if (!ultimo || ultimo.categoria !== item.categoria) {
      grupos.push({ categoria: item.categoria, items: [item] });
    } else {
      ultimo.items.push(item);
    }
  });
  return grupos;
}
