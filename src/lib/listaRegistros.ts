/** Normaliza texto para búsqueda (minúsculas, sin tildes). */
export function normalizarBusqueda(valor: string | null | undefined): string {
  return (valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** True si todos los términos de la consulta aparecen en el texto. */
export function coincideBusqueda(
  consulta: string,
  ...campos: Array<string | null | undefined>
): boolean {
  const q = normalizarBusqueda(consulta);
  if (!q) return true;
  const haystack = normalizarBusqueda(campos.filter(Boolean).join(" "));
  return q.split(/\s+/).every((termino) => haystack.includes(termino));
}

export function registroEnPeriodo(
  fechaIso: string | null | undefined,
  mes: number,
  anio: number,
): boolean {
  if (!fechaIso || fechaIso.length < 7) return false;
  const y = Number(fechaIso.slice(0, 4));
  const m = Number(fechaIso.slice(5, 7));
  if (Number.isNaN(y) || Number.isNaN(m)) return false;
  if (mes === 0) return y === anio;
  return y === anio && m === mes;
}

export const TAMANO_PAGINA_LISTA = 12;

export function totalPaginas(total: number, porPagina = TAMANO_PAGINA_LISTA): number {
  return Math.max(1, Math.ceil(Math.max(total, 0) / porPagina));
}

export function paginarLista<T>(
  items: T[],
  pagina: number,
  porPagina = TAMANO_PAGINA_LISTA,
): T[] {
  const inicio = (Math.max(1, pagina) - 1) * porPagina;
  return items.slice(inicio, inicio + porPagina);
}
