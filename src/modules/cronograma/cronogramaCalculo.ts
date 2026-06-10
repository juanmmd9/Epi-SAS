// Logica pura del cronograma preventivo, extraida de la version vanilla.
// Calcula las fechas de PM de cada maquina a partir de su primer PM y
// frecuencia en meses, aplicando excepciones (dias excluidos o agregados).

import { areaTienePreventivo } from "../../lib/areas";
import {
  ajustarDiaPorMes,
  parseFechaIso,
  sumarMeses,
  valorFecha,
} from "../../lib/fechas";
import type { HojaVida } from "../hojas/types";
import type { CitaCronograma, ExcepcionCronograma, OcurrenciaPm } from "./types";

function maquinaActivaEnFecha(
  maquina: HojaVida,
  anio: number,
  mes: number,
  dia: number,
): boolean {
  const fechaBaja = parseFechaIso(maquina.datos.fechaBaja);
  if (!maquina.activa && !fechaBaja) return false;
  if (!fechaBaja) return maquina.activa;
  return valorFecha(anio, mes, dia) < valorFecha(fechaBaja.anio, fechaBaja.mes, fechaBaja.dia);
}

/** Fechas de PM automaticas de una maquina dentro de un anio. */
export function ocurrenciasEnAnio(maquina: HojaVida, anioVista: number): OcurrenciaPm[] {
  if (!areaTienePreventivo(maquina.area)) return [];
  const base = parseFechaIso(maquina.primer_pm);
  if (!base) return [];

  const frecuencia = maquina.frecuencia_pm_meses || 12;
  const diaBase = base.dia;
  const ocurrencias: OcurrenciaPm[] = [];
  const inicioAnio = valorFecha(anioVista, 1, 1);
  const finAnio = valorFecha(anioVista, 12, 31);

  let anio = base.anio;
  let mes = base.mes;
  let iteraciones = 0;
  let valorAnterior = -1;

  while (iteraciones < 600) {
    const diaAjustado = ajustarDiaPorMes(diaBase, mes, anio);
    const valor = valorFecha(anio, mes, diaAjustado);

    if (valor > finAnio) break;

    if (valor >= inicioAnio && valor !== valorAnterior) {
      if (maquinaActivaEnFecha(maquina, anio, mes, diaAjustado)) {
        ocurrencias.push({ anio, mes, dia: diaAjustado });
      }
    }

    valorAnterior = valor;
    const siguiente = sumarMeses(anio, mes, diaBase, frecuencia);
    if (
      siguiente.anio === anio &&
      siguiente.mes === mes &&
      valorFecha(siguiente.anio, siguiente.mes, siguiente.dia) === valor
    ) {
      break;
    }
    anio = siguiente.anio;
    mes = siguiente.mes;
    iteraciones += 1;
  }

  return ocurrencias;
}

function claveDia(mes: number, dia: number): string {
  return `${mes}|${dia}`;
}

function coincideExcepcion(
  excepcion: ExcepcionCronograma,
  tipo: "excluir" | "agregar",
  area: string,
  maquinaId: string,
  anio: number,
  mes: number,
  dia: number,
): boolean {
  const d = excepcion.datos;
  return (
    d.tipo === tipo &&
    d.area === area &&
    d.maquinaId === maquinaId &&
    d.anio === anio &&
    d.mes === mes &&
    d.dia === dia
  );
}

/**
 * Mapa "mes|dia" -> citas del area en el anio, combinando las fechas
 * automaticas (primer PM + frecuencia) con las excepciones manuales.
 */
export function mapaCitasDelAnio(
  maquinas: HojaVida[],
  excepciones: ExcepcionCronograma[],
  area: string,
  anioVista: number,
): Map<string, CitaCronograma[]> {
  const mapa = new Map<string, CitaCronograma[]>();

  function agregar(mes: number, dia: number, cita: CitaCronograma) {
    const clave = claveDia(mes, dia);
    const lista = mapa.get(clave) ?? [];
    if (!lista.some((c) => c.maquinaId === cita.maquinaId)) {
      lista.push(cita);
      mapa.set(clave, lista);
    }
  }

  const maquinasArea = maquinas.filter((m) => m.area === area);

  for (const maquina of maquinasArea) {
    for (const ocurrencia of ocurrenciasEnAnio(maquina, anioVista)) {
      const excluida = excepciones.some((e) =>
        coincideExcepcion(
          e,
          "excluir",
          area,
          maquina.id,
          ocurrencia.anio,
          ocurrencia.mes,
          ocurrencia.dia,
        ),
      );
      if (excluida) continue;
      agregar(ocurrencia.mes, ocurrencia.dia, {
        maquinaId: maquina.id,
        nombre: maquina.nombre,
        codigo: maquina.codigo ?? "",
        frecuencia: maquina.frecuencia_pm_meses || 12,
        origen: "automatica",
      });
    }
  }

  for (const excepcion of excepciones) {
    const d = excepcion.datos;
    if (d.tipo !== "agregar" || d.area !== area || d.anio !== anioVista) continue;
    const maquina = maquinasArea.find((m) => m.id === d.maquinaId);
    if (!maquina) continue;
    agregar(d.mes, d.dia, {
      maquinaId: maquina.id,
      nombre: maquina.nombre,
      codigo: maquina.codigo ?? "",
      frecuencia: maquina.frecuencia_pm_meses || 12,
      origen: "manual",
    });
  }

  return mapa;
}
