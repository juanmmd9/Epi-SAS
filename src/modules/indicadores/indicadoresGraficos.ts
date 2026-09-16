import { areaTienePreventivo, AREAS_CON_PM } from "../../lib/areas";
import { NOMBRES_MESES } from "../../lib/fechas";
import type { RegistroCorrectivo } from "../correctivo/types";
import type { ExcepcionCronograma } from "../cronograma/types";
import type { HojaVida } from "../hojas/types";
import type { RegistroPreventivo } from "../preventivo/types";
import {
  clasificarCitasPreventivas,
  cumplimientoPreventivoArea,
  cumplimientoPreventivoGlobal,
  filtrarCorrectivos,
} from "./indicadoresCalculo";

const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export interface DatoBarraMes {
  mes: number;
  etiqueta: string;
  valor: number | null;
  detalle: string;
  futuro: boolean;
}

export interface SerieBarrasAnual {
  titulo: string;
  subtitulo: string;
  unidad: string;
  meta?: number;
  metaEtiqueta?: string;
  puntos: DatoBarraMes[];
  maxEscala: number;
  tipo: "cantidad" | "porcentaje";
  sinDatos?: boolean;
  aviso?: string;
}

function esMesFuturo(anio: number, mes: number, referencia = new Date()): boolean {
  const anioRef = referencia.getFullYear();
  const mesRef = referencia.getMonth() + 1;
  return anio > anioRef || (anio === anioRef && mes > mesRef);
}

export function serieCorrectivosAnual(
  correctivos: RegistroCorrectivo[],
  anio: number,
  area: string,
  tipoMantenimiento: string,
): SerieBarrasAnual {
  const puntos: DatoBarraMes[] = [];
  let maxValor = 0;

  for (let mes = 1; mes <= 12; mes++) {
    const futuro = esMesFuturo(anio, mes);
    const cantidad = futuro
      ? null
      : filtrarCorrectivos(correctivos, area, anio, mes, tipoMantenimiento).length;
    if (cantidad !== null) maxValor = Math.max(maxValor, cantidad);
    const areaTexto = area || "todas las áreas";
    puntos.push({
      mes,
      etiqueta: MESES_CORTOS[mes - 1],
      valor: cantidad,
      futuro,
      detalle: futuro
        ? "Mes futuro"
        : `${cantidad} solicitud(es) — ${NOMBRES_MESES[mes - 1]} ${anio} (${areaTexto})`,
    });
  }

  return {
    titulo: "Correctivo — solicitudes por mes",
    subtitulo: area
      ? `${area} · ${anio}${tipoMantenimiento ? ` · ${tipoMantenimiento}` : ""}`
      : `Todas las áreas · ${anio}${tipoMantenimiento ? ` · ${tipoMantenimiento}` : ""}`,
    unidad: "solicitudes",
    puntos,
    maxEscala: Math.max(maxValor, 1),
    tipo: "cantidad",
  };
}

export function seriePreventivoAnual(
  maquinas: HojaVida[],
  excepciones: ExcepcionCronograma[],
  preventivo: RegistroPreventivo[],
  anio: number,
  area: string,
): SerieBarrasAnual {
  if (area && !areaTienePreventivo(area)) {
    return {
      titulo: "Preventivo — cumplimiento PM por mes",
      subtitulo: `${area} no tiene cronograma preventivo`,
      unidad: "%",
      meta: 100,
      metaEtiqueta: "Meta 100%",
      puntos: MESES_CORTOS.map((etiqueta, i) => ({
        mes: i + 1,
        etiqueta,
        valor: null,
        futuro: esMesFuturo(anio, i + 1),
        detalle: "Sin PM en esta área",
      })),
      maxEscala: 100,
      tipo: "porcentaje",
      sinDatos: true,
      aviso: "Selecciona un área con preventivo o deja «Todas» para el consolidado.",
    };
  }

  const puntos: DatoBarraMes[] = [];
  let tieneAlguno = false;

  for (let mes = 1; mes <= 12; mes++) {
    const futuro = esMesFuturo(anio, mes);
    let porcentaje: number | null = null;
    let detalle = "Sin citas PM en el mes";

    if (!futuro) {
      if (area) {
        porcentaje = cumplimientoPreventivoArea(maquinas, excepciones, preventivo, area, anio, mes);
        const datos = clasificarCitasPreventivas(maquinas, excepciones, preventivo, area, anio, mes);
        if (datos.total > 0) {
          tieneAlguno = true;
          detalle = `${datos.cumplidas.length}/${datos.total} citas (${porcentaje}%) — ${area}`;
        }
      } else {
        porcentaje = cumplimientoPreventivoGlobal(maquinas, excepciones, preventivo, anio, mes);
        if (porcentaje !== null) {
          tieneAlguno = true;
          let cumplidas = 0;
          let total = 0;
          for (const a of AREAS_CON_PM) {
            const datos = clasificarCitasPreventivas(maquinas, excepciones, preventivo, a, anio, mes);
            cumplidas += datos.cumplidas.length;
            total += datos.total;
          }
          detalle = `${cumplidas}/${total} citas (${porcentaje}%) — todas las áreas PM`;
        }
      }
    } else {
      detalle = "Mes futuro";
    }

    puntos.push({
      mes,
      etiqueta: MESES_CORTOS[mes - 1],
      valor: porcentaje,
      futuro,
      detalle,
    });
  }

  return {
    titulo: "Preventivo — cumplimiento PM por mes",
    subtitulo: area ? `${area} · ${anio}` : `Todas las áreas con PM · ${anio}`,
    unidad: "%",
    meta: 100,
    metaEtiqueta: "Meta 100%",
    puntos,
    maxEscala: 100,
    tipo: "porcentaje",
    sinDatos: !tieneAlguno,
  };
}
