/**
 * Series adicionales para intervenciones por máquina.
 * No modifica serieCorrectivosAnual / seriePreventivoAnual.
 */
import { coincideArea } from "../../lib/areas";
import type { RegistroCorrectivo } from "../correctivo/types";
import type { HojaVida } from "../hojas/types";
import type { RegistroPreventivo } from "../preventivo/types";
import { registroEnMes } from "./indicadoresCalculo";

const TOP_N = 10;

export interface IntervencionMaquina {
  clave: string;
  maquinaId: string;
  nombre: string;
  codigo: string;
  preventivo: number;
  correctivo: number;
  total: number;
}

export interface MixIntervenciones {
  preventivo: number;
  correctivo: number;
  correctivoAbiertas: number;
  total: number;
}

function coincideTipo(
  registro: RegistroCorrectivo,
  tipoMantenimiento: string,
): boolean {
  if (!tipoMantenimiento) return true;
  return registro.datos.tiposSolicitud.some((tipo) =>
    tipo.toUpperCase().includes(tipoMantenimiento.toUpperCase()),
  );
}

function claveYEtiquetaCorrectivo(
  registro: RegistroCorrectivo,
  maquinasPorId: Map<string, HojaVida>,
): { clave: string; nombre: string; codigo: string; maquinaId: string } {
  const id = (registro.datos.maquinaId || "").trim();
  if (id) {
    const hoja = maquinasPorId.get(id);
    return {
      clave: `id:${id}`,
      maquinaId: id,
      nombre: hoja?.nombre || registro.datos.maquinaEquipoLocacion || "Máquina",
      codigo: hoja?.codigo || registro.datos.codigoMaquina || "",
    };
  }
  const codigo = (registro.datos.codigoMaquina || "").trim();
  if (codigo) {
    return {
      clave: `cod:${codigo.toUpperCase()}`,
      maquinaId: "",
      nombre: registro.datos.maquinaEquipoLocacion || codigo,
      codigo,
    };
  }
  const nombre = (registro.datos.maquinaEquipoLocacion || "Sin máquina").trim();
  return {
    clave: `nom:${nombre.toLowerCase()}`,
    maquinaId: "",
    nombre,
    codigo: "",
  };
}

function claveYEtiquetaPreventivo(
  registro: RegistroPreventivo,
  maquinasPorId: Map<string, HojaVida>,
): { clave: string; nombre: string; codigo: string; maquinaId: string } {
  const id = (registro.hoja_id || "").trim();
  if (id) {
    const hoja = maquinasPorId.get(id);
    return {
      clave: `id:${id}`,
      maquinaId: id,
      nombre: hoja?.nombre || registro.datos.equipo || "Máquina",
      codigo: hoja?.codigo || registro.datos.codigo || "",
    };
  }
  const codigo = (registro.datos.codigo || "").trim();
  if (codigo) {
    return {
      clave: `cod:${codigo.toUpperCase()}`,
      maquinaId: "",
      nombre: registro.datos.equipo || codigo,
      codigo,
    };
  }
  const nombre = (registro.datos.equipo || "Sin máquina").trim();
  return {
    clave: `nom:${nombre.toLowerCase()}`,
    maquinaId: "",
    nombre,
    codigo: "",
  };
}

/** Ranking Top N de intervenciones (preventivo + correctivo) en el mes. */
export function rankingIntervencionesPorMaquina(
  maquinas: HojaVida[],
  preventivo: RegistroPreventivo[],
  correctivos: RegistroCorrectivo[],
  anio: number,
  mes: number,
  area: string,
  tipoMantenimiento = "",
  topN = TOP_N,
): IntervencionMaquina[] {
  const maquinasPorId = new Map(maquinas.map((m) => [m.id, m]));
  const mapa = new Map<string, IntervencionMaquina>();

  function asegurar(meta: {
    clave: string;
    maquinaId: string;
    nombre: string;
    codigo: string;
  }): IntervencionMaquina {
    let fila = mapa.get(meta.clave);
    if (!fila) {
      fila = {
        clave: meta.clave,
        maquinaId: meta.maquinaId,
        nombre: meta.nombre,
        codigo: meta.codigo,
        preventivo: 0,
        correctivo: 0,
        total: 0,
      };
      mapa.set(meta.clave, fila);
    }
    return fila;
  }

  for (const registro of preventivo) {
    if (!registroEnMes(registro.fecha, anio, mes)) continue;
    if (area && !coincideArea(registro.area, area)) continue;
    const meta = claveYEtiquetaPreventivo(registro, maquinasPorId);
    const fila = asegurar(meta);
    fila.preventivo += 1;
    fila.total += 1;
  }

  for (const registro of correctivos) {
    if (!registroEnMes(registro.fecha, anio, mes)) continue;
    if (area && registro.area !== area) continue;
    if (!coincideTipo(registro, tipoMantenimiento)) continue;
    const meta = claveYEtiquetaCorrectivo(registro, maquinasPorId);
    const fila = asegurar(meta);
    fila.correctivo += 1;
    fila.total += 1;
  }

  const ordenadas = [...mapa.values()].sort(
    (a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre),
  );

  if (ordenadas.length <= topN) return ordenadas;

  const top = ordenadas.slice(0, topN);
  const resto = ordenadas.slice(topN);
  const otras: IntervencionMaquina = {
    clave: "otras",
    maquinaId: "",
    nombre: `Otras (${resto.length} máquinas)`,
    codigo: "",
    preventivo: resto.reduce((s, r) => s + r.preventivo, 0),
    correctivo: resto.reduce((s, r) => s + r.correctivo, 0),
    total: resto.reduce((s, r) => s + r.total, 0),
  };
  return [...top, otras];
}

/** Mix del mes preventivo vs correctivo (y abiertas correctivo). */
export function mixIntervencionesMes(
  preventivo: RegistroPreventivo[],
  correctivos: RegistroCorrectivo[],
  anio: number,
  mes: number,
  area: string,
  tipoMantenimiento = "",
): MixIntervenciones {
  let nPrev = 0;
  let nCorr = 0;
  let nAbiertas = 0;

  for (const registro of preventivo) {
    if (!registroEnMes(registro.fecha, anio, mes)) continue;
    if (area && !coincideArea(registro.area, area)) continue;
    nPrev += 1;
  }

  for (const registro of correctivos) {
    if (!registroEnMes(registro.fecha, anio, mes)) continue;
    if (area && registro.area !== area) continue;
    if (!coincideTipo(registro, tipoMantenimiento)) continue;
    nCorr += 1;
    if (!(registro.datos.fechaCierre || "").trim()) nAbiertas += 1;
  }

  return {
    preventivo: nPrev,
    correctivo: nCorr,
    correctivoAbiertas: nAbiertas,
    total: nPrev + nCorr,
  };
}
