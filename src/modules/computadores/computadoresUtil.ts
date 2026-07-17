import type { ComputadorInput, TipoComputador } from "./types";

/** Lista inicial tomada del Excel de Mantenimiento Preventivo (Abr-2022). */
export const SEMILLA_COMPUTADORES: ComputadorInput[] = [
  { codigo: "PC 04", ubicacion: "ALMACEN", tipo: "escritorio", usuario_asignado: "FRANKLIN CHILMA", frecuencia_pm_meses: 6, ultimo_pm: "2022-04-01", proximo_pm: null, datos: {} },
  { codigo: "PC 05", ubicacion: "ALMACEN", tipo: "escritorio", usuario_asignado: "FELIPE ROSALES", frecuencia_pm_meses: 6, ultimo_pm: "2022-04-01", proximo_pm: null, datos: {} },
  { codigo: "PC 23", ubicacion: "ASESOR COMERCIAL CALI", tipo: "escritorio", usuario_asignado: "YILMER MARIN", frecuencia_pm_meses: 6, ultimo_pm: "2022-04-01", proximo_pm: null, datos: {} },
  { codigo: "PC 17", ubicacion: "CALIDAD", tipo: "escritorio", usuario_asignado: "ROBINSON ARISTIZABAL", frecuencia_pm_meses: 6, ultimo_pm: "2022-04-01", proximo_pm: null, datos: {} },
  { codigo: "PC 12", ubicacion: "CARTERA", tipo: "escritorio", usuario_asignado: "NATALIA MORALES", frecuencia_pm_meses: 6, ultimo_pm: "2022-04-01", proximo_pm: null, datos: {} },
  { codigo: "PC 15", ubicacion: "COMERCIO EXTERIOR (EXPORTACIONES)", tipo: "portatil", usuario_asignado: "TATIANA ARICAPA", frecuencia_pm_meses: 6, ultimo_pm: "2022-04-01", proximo_pm: null, datos: {} },
  { codigo: "PC 14", ubicacion: "COMERCIO EXTERIOR (IMPORTACIONES)", tipo: "escritorio", usuario_asignado: "LUIS CORDOBA", frecuencia_pm_meses: 6, ultimo_pm: "2022-04-01", proximo_pm: null, datos: {} },
  { codigo: "PC 11", ubicacion: "COMPRAS", tipo: "escritorio", usuario_asignado: "ESTEFANY CRUZ", frecuencia_pm_meses: 6, ultimo_pm: "2022-04-01", proximo_pm: null, datos: {} },
  { codigo: "PC 10", ubicacion: "CONTABILIDAD", tipo: "escritorio", usuario_asignado: "ADRIANA VELASCO", frecuencia_pm_meses: 6, ultimo_pm: "2022-04-01", proximo_pm: null, datos: {} },
  { codigo: "PC 19", ubicacion: "COSTOS", tipo: "portatil", usuario_asignado: "TATIANA", frecuencia_pm_meses: 6, ultimo_pm: "2022-04-01", proximo_pm: null, datos: {} },
  { codigo: "PC 07", ubicacion: "DESPACHOS", tipo: "escritorio", usuario_asignado: "CARLOS MARIO CAMAYO", frecuencia_pm_meses: 6, ultimo_pm: "2022-04-01", proximo_pm: null, datos: {} },
  { codigo: "PC 22", ubicacion: "DIRECTOR COMERCIAL", tipo: "escritorio", usuario_asignado: "DE JESUS MOSQUERA", frecuencia_pm_meses: 6, ultimo_pm: "2022-04-01", proximo_pm: null, datos: {} },
  { codigo: "PC 25", ubicacion: "DIRECTOR DE DISEÑO Y DESARROLLO", tipo: "escritorio", usuario_asignado: "ANDRES MONTES", frecuencia_pm_meses: 6, ultimo_pm: "2022-04-01", proximo_pm: null, datos: {} },
  { codigo: "PC 08", ubicacion: "DIRECTOR DE LABORATORIO", tipo: "escritorio", usuario_asignado: "JUAN GUILLERMO ALVAREZ", frecuencia_pm_meses: 6, ultimo_pm: "2022-04-01", proximo_pm: null, datos: {} },
  { codigo: "PC 03", ubicacion: "DIRECTOR DE LOGISTICA", tipo: "escritorio", usuario_asignado: "ESTIVEN GARCIA", frecuencia_pm_meses: 6, ultimo_pm: "2022-04-01", proximo_pm: null, datos: {} },
  { codigo: "PC 31", ubicacion: "DIRECTOR DE MANTENIMIENTO", tipo: "portatil", usuario_asignado: "MIGUEL TORRES", frecuencia_pm_meses: 6, ultimo_pm: "2022-04-01", proximo_pm: null, datos: {} },
  { codigo: "", ubicacion: "DIRECTOR DE PRODUCCION", tipo: "escritorio", usuario_asignado: "FELIPE HOYOS", frecuencia_pm_meses: 6, ultimo_pm: "2022-04-01", proximo_pm: null, datos: {} },
  { codigo: "PC 28", ubicacion: "DISEÑADOR", tipo: "escritorio", usuario_asignado: "", frecuencia_pm_meses: 6, ultimo_pm: "2022-04-01", proximo_pm: null, datos: {} },
  { codigo: "PC 27", ubicacion: "DISEÑADOR PASANTE", tipo: "escritorio", usuario_asignado: "", frecuencia_pm_meses: 6, ultimo_pm: "2022-04-01", proximo_pm: null, datos: {} },
  { codigo: "PC 26", ubicacion: "DISEÑO Y DESARROLLO", tipo: "escritorio", usuario_asignado: "JUAN MANUEL MONCAYO", frecuencia_pm_meses: 6, ultimo_pm: "2022-04-01", proximo_pm: null, datos: {} },
  { codigo: "PC 30", ubicacion: "GERENCIA ADMINISTRATIVA", tipo: "escritorio", usuario_asignado: "YISELA LARGO", frecuencia_pm_meses: 6, ultimo_pm: "2022-04-01", proximo_pm: null, datos: {} },
  { codigo: "PC 29", ubicacion: "GERENCIA GENERAL", tipo: "portatil", usuario_asignado: "FREDDY MORCILLO", frecuencia_pm_meses: 6, ultimo_pm: "2022-04-01", proximo_pm: null, datos: {} },
  { codigo: "PC 13", ubicacion: "GESTION HUMANA", tipo: "escritorio", usuario_asignado: "LIGIA ESPAÑA", frecuencia_pm_meses: 6, ultimo_pm: "2022-04-01", proximo_pm: null, datos: {} },
  { codigo: "PC 32", ubicacion: "LIDER DE PRODUCCION", tipo: "escritorio", usuario_asignado: "JUAN DAVID MUÑOZ", frecuencia_pm_meses: 6, ultimo_pm: "2022-04-01", proximo_pm: null, datos: {} },
  { codigo: "PC 34", ubicacion: "MANTENIMIENTO", tipo: "escritorio", usuario_asignado: "ALEJANDRO OSPINA", frecuencia_pm_meses: 6, ultimo_pm: "2022-04-01", proximo_pm: null, datos: {} },
  { codigo: "PC 06", ubicacion: "MAQUILA", tipo: "escritorio", usuario_asignado: "FRANKLIN CHILMA", frecuencia_pm_meses: 6, ultimo_pm: "2022-04-01", proximo_pm: null, datos: {} },
  { codigo: "PC 20", ubicacion: "MERCADEO", tipo: "escritorio", usuario_asignado: "LAURA HERNANDEZ", frecuencia_pm_meses: 6, ultimo_pm: "2022-04-01", proximo_pm: null, datos: {} },
  { codigo: "PC 09", ubicacion: "METROLOGO", tipo: "escritorio", usuario_asignado: "YERSON MURILLO", frecuencia_pm_meses: 6, ultimo_pm: "2022-04-01", proximo_pm: null, datos: {} },
  { codigo: "PC 18", ubicacion: "PRACTICANTE ING DE MATERIALES", tipo: "portatil", usuario_asignado: "", frecuencia_pm_meses: 6, ultimo_pm: "2022-04-01", proximo_pm: null, datos: {} },
  { codigo: "PC 33", ubicacion: "PRODUCCION CODIGO DE BARRAS", tipo: "escritorio", usuario_asignado: "JUAN DAVID MUÑOZ", frecuencia_pm_meses: 6, ultimo_pm: "2022-04-01", proximo_pm: null, datos: {} },
  { codigo: "PC 21", ubicacion: "PUBLICIDAD", tipo: "escritorio", usuario_asignado: "JUAN CAMILO RAMOS", frecuencia_pm_meses: 6, ultimo_pm: "2022-04-01", proximo_pm: null, datos: {} },
  { codigo: "PC 24", ubicacion: "REVISOR FISCAL", tipo: "portatil", usuario_asignado: "JAIRO CERON", frecuencia_pm_meses: 6, ultimo_pm: "2022-04-01", proximo_pm: null, datos: {} },
  { codigo: "PC 01", ubicacion: "SERVICIO AL CLIENTE", tipo: "escritorio", usuario_asignado: "GUILLERMINA LARGO", frecuencia_pm_meses: 6, ultimo_pm: "2022-04-01", proximo_pm: null, datos: {} },
  { codigo: "PC 02", ubicacion: "SERVICIO AL CLIENTE", tipo: "escritorio", usuario_asignado: "SEBASTIAN GARCIA", frecuencia_pm_meses: 6, ultimo_pm: "2022-04-01", proximo_pm: null, datos: {} },
  { codigo: "", ubicacion: "SGC LABORATORIO", tipo: "escritorio", usuario_asignado: "FABIO BOTERO", frecuencia_pm_meses: 6, ultimo_pm: "2022-04-01", proximo_pm: null, datos: {} },
  { codigo: "PC 16", ubicacion: "SISTEMA DE GESTION DE CALIDAD", tipo: "escritorio", usuario_asignado: "SANDRA ANGEL", frecuencia_pm_meses: 6, ultimo_pm: "2022-04-01", proximo_pm: null, datos: {} },
];

export function normalizarTipoComputador(valor: string): TipoComputador {
  const t = valor.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  if (t.includes("porta")) return "portatil";
  if (t.includes("escrit")) return "escritorio";
  return "otro";
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
