import type { TipoComputador } from "./types";

export { SEMILLA_COMPUTADORES } from "./computadoresSemilla";

export function normalizarTipoComputador(valor: string): TipoComputador {
  const t = valor.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  if (t.includes("porta")) return "portatil";
  if (t.includes("mesa") || t.includes("escrit")) return "escritorio";
  return "otro";
}

/** Interpreta fechas del Excel (Date, YYYY-MM-DD o M/D/YY). */
export function parseFechaExcel(valor: unknown): string | null {
  if (valor == null || valor === "") return null;
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    const y = valor.getUTCFullYear();
    const m = String(valor.getUTCMonth() + 1).padStart(2, "0");
    const d = String(valor.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const texto = String(valor).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) return texto.slice(0, 10);
  const mdy = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (mdy) {
    let y = Number(mdy[3]);
    if (y < 100) y += 2000;
    return `${y}-${String(mdy[1]).padStart(2, "0")}-${String(mdy[2]).padStart(2, "0")}`;
  }
  return null;
}

/** Suma meses a una fecha ISO (YYYY-MM-DD). */
export function sumarMeses(fechaIso: string, meses: number): string {
  const [y, m, d] = fechaIso.slice(0, 10).split("-").map(Number);
  const fecha = new Date(y, m - 1 + meses, d || 1);
  const yy = fecha.getFullYear();
  const mm = String(fecha.getMonth() + 1).padStart(2, "0");
  const dd = String(fecha.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function calcularProximoPm(
  ultimoPm: string | null,
  frecuenciaMeses: number,
): string | null {
  if (!ultimoPm) return null;
  return sumarMeses(ultimoPm.slice(0, 10), frecuenciaMeses);
}

export function pmVencido(proximoPm: string | null, referencia = new Date()): boolean {
  if (!proximoPm) return false;
  const [y, m, d] = proximoPm.slice(0, 10).split("-").map(Number);
  const limite = new Date(y, m - 1, d);
  const hoy = new Date(referencia.getFullYear(), referencia.getMonth(), referencia.getDate());
  return limite.getTime() < hoy.getTime();
}

export function pmProximoEnDias(
  proximoPm: string | null,
  dias = 30,
  referencia = new Date(),
): boolean {
  if (!proximoPm || pmVencido(proximoPm, referencia)) return false;
  const [y, m, d] = proximoPm.slice(0, 10).split("-").map(Number);
  const limite = new Date(y, m - 1, d);
  const hoy = new Date(referencia.getFullYear(), referencia.getMonth(), referencia.getDate());
  const max = new Date(hoy);
  max.setDate(max.getDate() + dias);
  return limite.getTime() <= max.getTime();
}

/** Extrae el número del código (ej. "PC 04" → 4). Sin número → Infinity (al final). */
export function numeroCodigoPc(codigo: string): number {
  const match = codigo.match(/(\d+)/);
  if (!match) return Number.POSITIVE_INFINITY;
  return Number.parseInt(match[1], 10);
}

/** Ordena por código de menor a mayor (PC 01, PC 02…); sin código al final. */
export function compararCodigoPc(a: string, b: string): number {
  const na = numeroCodigoPc(a);
  const nb = numeroCodigoPc(b);
  if (na !== nb) return na - nb;
  return a.localeCompare(b, "es", { sensitivity: "base" });
}
