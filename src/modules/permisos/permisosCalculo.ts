import type { Festivo, HorarioLaboral, PermisoDatos } from "./types";
import { DIAS_SEMANA } from "./types";
import { construirSetFestivos } from "./festivosDefaults";

export interface JornadaEsperada {
  entrada: string;
  salida: string;
  esFestivo: boolean;
  nombreFestivo: string | null;
}

export function minutosDesdeHora(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

export function horaDesdeMinutos(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function calcularTiempoConcedidoMinutos(
  fechaDesde: string,
  fechaHasta: string,
  horaDesde: string,
  horaHasta: string,
): number {
  if (!fechaDesde || !fechaHasta || !horaDesde || !horaHasta) return 0;

  const inicio = new Date(`${fechaDesde}T${horaDesde}:00`);
  const fin = new Date(`${fechaHasta}T${horaHasta}:00`);
  const diff = Math.round((fin.getTime() - inicio.getTime()) / 60000);
  return diff > 0 ? diff : 0;
}

export function formatearTiempoConcedido(minutos: number): string {
  if (minutos <= 0) return "0 min";
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export function nombreDiaSemana(fechaIso: string): string {
  const fecha = new Date(`${fechaIso}T12:00:00`);
  const js = fecha.getDay();
  const item = DIAS_SEMANA.find((d) => d.valor === js);
  return item?.etiqueta ?? "—";
}

export function diaSemanaDesdeFecha(fechaIso: string): number {
  return new Date(`${fechaIso}T12:00:00`).getDay();
}

export function esFestivo(festivos: Festivo[] | Set<string>, fechaIso: string): boolean {
  const set = festivos instanceof Set ? festivos : construirSetFestivos(festivos);
  return set.has(fechaIso.slice(0, 10));
}

export function obtenerFestivo(festivos: Festivo[], fechaIso: string): Festivo | null {
  const fecha = fechaIso.slice(0, 10);
  return festivos.find((f) => f.fecha.slice(0, 10) === fecha) ?? null;
}

export function obtenerJornadaEsperada(
  horarios: HorarioLaboral[],
  fechaIso: string,
  festivos: Festivo[] = [],
): JornadaEsperada | null {
  const festivo = obtenerFestivo(festivos, fechaIso);
  if (festivo) {
    return {
      entrada: "—",
      salida: "—",
      esFestivo: true,
      nombreFestivo: festivo.descripcion ?? "Festivo",
    };
  }

  const dia = diaSemanaDesdeFecha(fechaIso);
  const turnos = horarios
    .filter((h) => h.dia_semana === dia && h.activo)
    .sort((a, b) => a.turno - b.turno);
  if (turnos.length === 0) return null;
  return {
    entrada: turnos[0].hora_inicio.slice(0, 5),
    salida: turnos[turnos.length - 1].hora_fin.slice(0, 5),
    esFestivo: false,
    nombreFestivo: null,
  };
}

export function etiquetaEstadoPermiso(estado: string): string {
  const mapa: Record<string, string> = {
    borrador: "Borrador",
    solicitado: "Solicitado",
    autorizado: "Autorizado",
    en_permiso: "En permiso",
    cerrado: "Cerrado",
  };
  return mapa[estado] ?? estado;
}

export function etiquetaTipoPermiso(datos: PermisoDatos): string {
  const rem = datos.remunerado === "remunerado" ? "Remunerado" : "No remunerado";
  const mot =
    datos.motivo === "personal" ? "Permiso personal" : "Salida laboral";
  return `${rem} · ${mot}`;
}

export function recalcularDatosPermiso(datos: PermisoDatos): PermisoDatos {
  return {
    ...datos,
    tiempoConcedidoMinutos: calcularTiempoConcedidoMinutos(
      datos.fechaDesde,
      datos.fechaHasta,
      datos.horaDesde,
      datos.horaHasta,
    ),
  };
}
