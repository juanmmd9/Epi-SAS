import { normalizarArea } from "../../lib/areas";
import type { RegistroCorrectivo } from "../correctivo/types";
import type { RepuestoSolicitud, ResumenAreaSolicitudes } from "./types";

export function solicitudAbierta(registro: RegistroCorrectivo): boolean {
  return !registro.datos.fechaCierre?.trim();
}

export function solicitudEsperaRepuesto(registro: RegistroCorrectivo): boolean {
  return solicitudAbierta(registro) && Boolean(registro.datos.esperaRepuesto);
}

export function solicitudCerradaEnMes(
  registro: RegistroCorrectivo,
  anio: number,
  mes: number,
): boolean {
  const cierre = registro.datos.fechaCierre?.slice(0, 10);
  if (!cierre) return false;
  const partes = cierre.split("-");
  if (partes.length < 2) return false;
  return Number.parseInt(partes[0], 10) === anio && Number.parseInt(partes[1], 10) === mes;
}

export function repuestoPendiente(repuesto: RepuestoSolicitud): boolean {
  return repuesto.estado !== "instalado" && repuesto.estado !== "cancelado";
}

export function resumenArea(
  area: string,
  correctivos: RegistroCorrectivo[],
  repuestos: RepuestoSolicitud[],
  referencia = new Date(),
): ResumenAreaSolicitudes {
  const anio = referencia.getFullYear();
  const mes = referencia.getMonth() + 1;
  const areaNorm = normalizarArea(area);

  const corrArea = correctivos.filter((r) => normalizarArea(r.area) === areaNorm);
  const repArea = repuestos.filter((r) => normalizarArea(r.area) === areaNorm);

  return {
    area,
    abiertas: corrArea.filter(solicitudAbierta).length,
    esperaRepuesto: corrArea.filter(solicitudEsperaRepuesto).length,
    cerradasMes: corrArea.filter((r) => solicitudCerradaEnMes(r, anio, mes)).length,
    repuestosPendientes: repArea.filter(repuestoPendiente).length,
  };
}

export function resumenesTodasAreas(
  areas: readonly string[],
  correctivos: RegistroCorrectivo[],
  repuestos: RepuestoSolicitud[],
  referencia = new Date(),
): ResumenAreaSolicitudes[] {
  return areas.map((area) => resumenArea(area, correctivos, repuestos, referencia));
}

export function diasAbierta(registro: RegistroCorrectivo, referencia = new Date()): number | null {
  if (!solicitudAbierta(registro)) return null;
  const inicio = new Date(`${registro.fecha.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(inicio.getTime())) return null;
  const diff = referencia.getTime() - inicio.getTime();
  return Math.max(0, Math.floor(diff / 86_400_000));
}

/** Quién(es) cerró/atendió la solicitud (técnicos o quien revisa). */
export function quienCerroSolicitud(registro: RegistroCorrectivo): string {
  const nombres = (registro.datos.personalNombres ?? [])
    .map((n) => n.trim())
    .filter(Boolean);
  if (nombres.length > 0) return nombres.join(", ");

  const revisa = registro.datos.quienRevisa?.trim();
  if (revisa) return revisa;

  const legacy = registro.datos.personalNombre?.trim();
  if (legacy) return legacy;

  return "Sin registrar";
}
