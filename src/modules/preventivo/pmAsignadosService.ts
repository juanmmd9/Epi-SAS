import { listarExcepciones } from "../cronograma/cronogramaService";
import { listarHojas } from "../hojas/hojasService";
import { listarPersonalActivo } from "../personal/personalService";
import {
  existeTablaAsignacionesPm,
  listarAsignacionesPm,
} from "../preventivo/asignacionPmService";
import { listarPreventivo } from "../preventivo/preventivoService";
import { construirDatosTodasAreas } from "../inicio/inicioDatosArea";
import { listarMisPmPendientes, type MisPmItem } from "../inicio/inicioMisPm";

/** PM asignados al operario que aún no están registrados/completados. */
export async function obtenerMisPmPendientes(
  personalId: string,
  anio = new Date().getFullYear(),
): Promise<MisPmItem[]> {
  const ok = await existeTablaAsignacionesPm().catch(() => false);
  if (!ok) return [];

  const [maquinas, excepciones, preventivo, asignaciones, personal] = await Promise.all([
    listarHojas(),
    listarExcepciones(),
    listarPreventivo(),
    listarAsignacionesPm(anio),
    listarPersonalActivo(),
  ]);

  const datosPorArea = construirDatosTodasAreas(anio, maquinas, excepciones, preventivo);
  const mapaNombres = new Map(personal.map((p) => [p.id, p.nombre]));

  return listarMisPmPendientes(
    datosPorArea,
    anio,
    personalId,
    asignaciones,
    mapaNombres,
  );
}

export async function contarMisPmPendientes(
  personalId: string,
  anio = new Date().getFullYear(),
): Promise<number> {
  const lista = await obtenerMisPmPendientes(personalId, anio);
  return lista.length;
}

export function resumirMisPm(items: MisPmItem[]): {
  total: number;
  vencidos: number;
  hoy: number;
  proximos: number;
} {
  const hoyIso = new Date().toISOString().slice(0, 10);
  let vencidos = 0;
  let hoy = 0;
  let proximos = 0;
  for (const item of items) {
    if (item.estado === "vencida" || item.estado === "no_realizado") vencidos += 1;
    else if (item.fechaProgramada === hoyIso) hoy += 1;
    else proximos += 1;
  }
  return { total: items.length, vencidos, hoy, proximos };
}
