export interface FechaCalendario {
  anio: number;
  mes: number; // 1-12
  dia: number;
}

export const NOMBRES_MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export const NOMBRES_MESES_CORTOS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

export function esAnioBisiesto(anio: number): boolean {
  return (anio % 4 === 0 && anio % 100 !== 0) || anio % 400 === 0;
}

export function diasEnMes(anio: number, mes: number): number {
  return new Date(anio, mes, 0).getDate();
}

/** Si el dia no existe en el mes (ej. 31 en abril, 29 feb no bisiesto) lo ajusta al ultimo valido. */
export function ajustarDiaPorMes(dia: number, mes: number, anio: number): number {
  if (mes === 2 && dia === 29 && !esAnioBisiesto(anio)) return 28;
  return Math.min(dia, diasEnMes(anio, mes));
}

export function parseFechaIso(fechaIso: string | null | undefined): FechaCalendario | null {
  if (!fechaIso || typeof fechaIso !== "string") return null;
  const partes = fechaIso.trim().split("-");
  if (partes.length !== 3) return null;
  const anio = Number.parseInt(partes[0], 10);
  const mes = Number.parseInt(partes[1], 10);
  const dia = Number.parseInt(partes[2], 10);
  if (
    Number.isNaN(anio) ||
    Number.isNaN(mes) ||
    Number.isNaN(dia) ||
    mes < 1 ||
    mes > 12 ||
    dia < 1 ||
    dia > 31
  ) {
    return null;
  }
  return { anio, mes, dia };
}

export function aFechaIso(anio: number, mes: number, dia: number): string {
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

export function sumarMeses(
  anio: number,
  mes: number,
  dia: number,
  mesesASumar: number,
): FechaCalendario {
  const fecha = new Date(anio, mes - 1 + mesesASumar, dia);
  return {
    anio: fecha.getFullYear(),
    mes: fecha.getMonth() + 1,
    dia: fecha.getDate(),
  };
}

/** Valor entero comparable: 20260610 para 2026-06-10. */
export function valorFecha(anio: number, mes: number, dia: number): number {
  return anio * 10000 + mes * 100 + dia;
}
