// Formulas de indicadores extraidas de la version vanilla (js/indicadores.js).
// G = tiempo de respuesta (min), H = tiempo de mantenimiento (min), I = G + H.

import { mapaCitasDelAnio } from "../cronograma/cronogramaCalculo";
import type { ExcepcionCronograma } from "../cronograma/types";
import type { HojaVida } from "../hojas/types";
import type { RegistroPreventivo } from "../preventivo/types";
import type { RegistroCorrectivo } from "../correctivo/types";

export interface TiemposCorrectivo {
  g: number | null;
  h: number | null;
  i: number | null;
  valido: boolean;
  advertencia?: boolean;
}

export interface FilaCorrectivo {
  registro: RegistroCorrectivo;
  tiempos: TiemposCorrectivo;
}

export interface ResumenCorrectivo {
  totalG: number;
  totalH: number;
  totalI: number;
  cantidad: number;
  promedioG: number;
  promedioH: number;
  promedioI: number;
  horas: number;
}

function construirDateTime(fecha: string, hora: string): Date | null {
  if (!fecha || !hora) return null;
  const horaNormalizada = hora.length >= 5 ? hora.slice(0, 5) : hora;
  const dt = new Date(`${fecha}T${horaNormalizada}:00`);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function calcularTiemposCorrectivo(registro: RegistroCorrectivo): TiemposCorrectivo {
  const d = registro.datos;
  const solicitudDT = construirDateTime(registro.fecha, d.horaSolicitud);
  const respuestaDT = construirDateTime(registro.fecha, d.horaRespuesta);
  const entregaDT = construirDateTime(d.fechaCierre, d.horaCierre);

  if (!solicitudDT || !respuestaDT || !entregaDT) {
    return { g: null, h: null, i: null, valido: false };
  }

  const g = (respuestaDT.getTime() - solicitudDT.getTime()) / 60000;
  const h = (entregaDT.getTime() - respuestaDT.getTime()) / 60000;

  if (g < 0 || h < 0) {
    return { g, h, i: null, valido: false, advertencia: true };
  }

  return { g, h, i: g + h, valido: true };
}

export function registroEnMes(fechaTexto: string | null, anio: number, mes: number): boolean {
  if (!fechaTexto) return false;
  const partes = fechaTexto.slice(0, 10).split("-");
  if (partes.length < 2) return false;
  return Number.parseInt(partes[0], 10) === anio && Number.parseInt(partes[1], 10) === mes;
}

export function filtrarCorrectivos(
  registros: RegistroCorrectivo[],
  area: string,
  anio: number,
  mes: number,
  tipoMantenimiento: string,
): RegistroCorrectivo[] {
  return registros
    .filter((registro) => {
      if (area && registro.area !== area) return false;
      if (!registroEnMes(registro.fecha, anio, mes)) return false;
      if (!tipoMantenimiento) return true;
      return registro.datos.tiposSolicitud.some((tipo) =>
        tipo.toUpperCase().includes(tipoMantenimiento.toUpperCase()),
      );
    })
    .sort((a, b) => (a.datos.numeroSolicitud || 0) - (b.datos.numeroSolicitud || 0));
}

export function calcularResumenCorrectivo(filas: FilaCorrectivo[]): ResumenCorrectivo {
  const validas = filas.filter((fila) => fila.tiempos.valido);
  const totalG = validas.reduce((suma, fila) => suma + (fila.tiempos.g ?? 0), 0);
  const totalH = validas.reduce((suma, fila) => suma + (fila.tiempos.h ?? 0), 0);
  const totalI = validas.reduce((suma, fila) => suma + (fila.tiempos.i ?? 0), 0);
  const cantidad = validas.length;

  return {
    totalG,
    totalH,
    totalI,
    cantidad,
    promedioG: cantidad > 0 ? totalG / cantidad : 0,
    promedioH: cantidad > 0 ? totalH / cantidad : 0,
    promedioI: cantidad > 0 ? totalI / cantidad : 0,
    horas: totalI / 60,
  };
}

// ----- Preventivo: cumplimiento del cronograma -----

export interface CitaClasificada {
  maquinaId: string;
  nombre: string;
  codigo: string;
  dia: number;
  fechaPm?: string;
  destino?: { anio: number; mes: number; dia: number };
}

export interface ClasificacionPreventivo {
  cumplidas: CitaClasificada[];
  reprogramadas: CitaClasificada[];
  pendientes: CitaClasificada[];
  total: number;
  porcentaje: number;
}

function mesSiguiente(anio: number, mes: number): { anio: number; mes: number } {
  return mes >= 12 ? { anio: anio + 1, mes: 1 } : { anio, mes: mes + 1 };
}

export function clasificarCitasPreventivas(
  maquinas: HojaVida[],
  excepciones: ExcepcionCronograma[],
  preventivo: RegistroPreventivo[],
  area: string,
  anio: number,
  mes: number,
): ClasificacionPreventivo {
  const mapa = mapaCitasDelAnio(maquinas, excepciones, area, anio);

  const cumplidas: CitaClasificada[] = [];
  const reprogramadas: CitaClasificada[] = [];
  const pendientes: CitaClasificada[] = [];

  function pmEjecutado(maquinaId: string): RegistroPreventivo | undefined {
    return preventivo.find(
      (r) => r.hoja_id === maquinaId && registroEnMes(r.fecha, anio, mes),
    );
  }

  for (const [clave, citas] of mapa) {
    const [mesClave, diaClave] = clave.split("|").map(Number);
    if (mesClave !== mes) continue;
    for (const cita of citas) {
      const base: CitaClasificada = {
        maquinaId: cita.maquinaId,
        nombre: cita.nombre,
        codigo: cita.codigo,
        dia: diaClave,
      };
      const pm = pmEjecutado(cita.maquinaId);
      if (pm) {
        cumplidas.push({ ...base, fechaPm: pm.fecha });
      } else {
        pendientes.push(base);
      }
    }
  }

  // Citas excluidas este mes que reaparecen el mes siguiente = reprogramadas
  const siguiente = mesSiguiente(anio, mes);
  const mapaSiguiente = mapaCitasDelAnio(maquinas, excepciones, area, siguiente.anio);
  for (const excepcion of excepciones) {
    const d = excepcion.datos;
    if (d.tipo !== "excluir" || d.area !== area || d.anio !== anio || d.mes !== mes) continue;
    const maquina = maquinas.find((m) => m.id === d.maquinaId);
    if (!maquina) continue;

    let destino: CitaClasificada["destino"];
    for (const [clave, citas] of mapaSiguiente) {
      const [mesClave, diaClave] = clave.split("|").map(Number);
      if (mesClave !== siguiente.mes) continue;
      if (citas.some((c) => c.maquinaId === d.maquinaId)) {
        destino = { anio: siguiente.anio, mes: siguiente.mes, dia: diaClave };
        break;
      }
    }
    if (destino) {
      reprogramadas.push({
        maquinaId: maquina.id,
        nombre: maquina.nombre,
        codigo: maquina.codigo ?? "",
        dia: d.dia,
        destino,
      });
    }
  }

  const total = cumplidas.length + pendientes.length + reprogramadas.length;
  const porcentaje = total > 0 ? Math.round((cumplidas.length / total) * 100) : 0;

  return { cumplidas, reprogramadas, pendientes, total, porcentaje };
}

export function formatearNumero(valor: number | null | undefined, decimales = 2): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  return Number(valor).toFixed(decimales);
}
