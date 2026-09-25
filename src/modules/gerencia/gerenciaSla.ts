import type { ItemGerencia, SemaforoGerencia, UrgenciaGerencia } from "./types";

/** Días límite según urgencia (abierta, no hecha). */
export function diasLimiteSla(urgencia: UrgenciaGerencia): number {
  if (urgencia === "alta") return 5;
  if (urgencia === "baja") return 20;
  return 10;
}

export function diasAbiertos(item: ItemGerencia, ahora = new Date()): number {
  const inicio = new Date(item.creado_en).getTime();
  if (Number.isNaN(inicio)) return 0;
  const finIso =
    item.estado === "eliminado" && item.eliminado_en
      ? item.eliminado_en
      : item.estado === "hecho" && item.cerrado_en
        ? item.cerrado_en
        : null;
  const fin = finIso ? new Date(finIso).getTime() : ahora.getTime();
  return Math.max(0, Math.floor((fin - inicio) / (1000 * 60 * 60 * 24)));
}

export function semaforoItem(item: ItemGerencia, ahora = new Date()): SemaforoGerencia {
  if (item.estado === "hecho") return "verde";
  if (item.estado === "eliminado") return "rojo";
  const dias = diasAbiertos(item, ahora);
  const limite = diasLimiteSla(item.urgencia);
  if (dias > limite) return "rojo";
  if (dias > Math.floor(limite * 0.6)) return "amarillo";
  return "verde";
}

export function avancePorcentaje(item: ItemGerencia): number {
  if (item.estado === "eliminado") return 0;
  if (item.estado === "hecho") return item.confirmado_area ? 100 : 90;
  if (item.tablero === "por_clasificar") return 10;
  if (item.estado === "pausado") return 40;
  if (item.estado === "en_proceso") return 55;
  return 30;
}

export function formatoMontoCop(monto: number | null | undefined): string | null {
  if (monto == null || Number.isNaN(monto)) return null;
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(monto);
}

export function formatoFechaCorta(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
