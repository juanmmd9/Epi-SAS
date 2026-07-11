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

  let total = 0;
  let cerradas = 0;
  let abiertas = 0;
  let reprogramadas = 0;
  const porArea: ConteoPreventivoMes["porArea"] = [];

  for (const area of areas) {
    const datos = clasificarCitasPreventivas(
      maquinas,
      excepciones,
      preventivo,
      area,
      anio,
      mes,
    );
    total += datos.total;
    cerradas += datos.cumplidas.length;
    abiertas += datos.pendientes.length;
    reprogramadas += datos.reprogramadas.length;
    if (datos.total > 0) {
      porArea.push({
        area,
        cantidad: datos.total,
        abiertas: datos.pendientes.length,
        cerradas: datos.cumplidas.length,
      });
    }
  }

  porArea.sort((a, b) => b.cantidad - a.cantidad || a.area.localeCompare(b.area));

  return { total, cerradas, abiertas, reprogramadas, porArea };
}
