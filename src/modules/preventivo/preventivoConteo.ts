import { AREAS_CON_PM } from "../../lib/areas";
import { clasificarCitasPreventivas } from "../indicadores/indicadoresCalculo";
import type { ExcepcionCronograma } from "../cronograma/types";
import type { HojaVida } from "../hojas/types";
import type { RegistroPreventivo } from "./types";

export interface ConteoPreventivoMes {
  total: number;
  /** PM del cronograma ya realizados en el mes */
  cerradas: number;
  /** PM del cronograma aún pendientes en el mes */
  abiertas: number;
  reprogramadas: number;
  porArea: { area: string; cantidad: number; abiertas: number; cerradas: number }[];
}

export function contarPreventivoMes(
  maquinas: HojaVida[],
  excepciones: ExcepcionCronograma[],
  preventivo: RegistroPreventivo[],
  anio: number,
  mes: number,
  areaFiltro = "",
): ConteoPreventivoMes {
  const areas = areaFiltro
    ? AREAS_CON_PM.filter((a) => a === areaFiltro)
    : [...AREAS_CON_PM];

  const meses = mes === 0 ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] : [mes];

  let total = 0;
  let cerradas = 0;
  let abiertas = 0;
  let reprogramadas = 0;
  const mapaArea = new Map<string, { cantidad: number; abiertas: number; cerradas: number }>();

  for (const area of areas) {
    let areaCantidad = 0;
    let areaAbiertas = 0;
    let areaCerradas = 0;
    for (const m of meses) {
      const datos = clasificarCitasPreventivas(
        maquinas,
        excepciones,
        preventivo,
        area,
        anio,
        m,
      );
      total += datos.total;
      cerradas += datos.cumplidas.length;
      abiertas += datos.pendientes.length;
      reprogramadas += datos.reprogramadas.length;
      areaCantidad += datos.total;
      areaAbiertas += datos.pendientes.length;
      areaCerradas += datos.cumplidas.length;
    }
    if (areaCantidad > 0) {
      mapaArea.set(area, {
        cantidad: areaCantidad,
        abiertas: areaAbiertas,
        cerradas: areaCerradas,
      });
    }
  }

  const porArea = [...mapaArea.entries()]
    .map(([area, datos]) => ({ area, ...datos }))
    .sort((a, b) => b.cantidad - a.cantidad || a.area.localeCompare(b.area));

  return { total, cerradas, abiertas, reprogramadas, porArea };
}
