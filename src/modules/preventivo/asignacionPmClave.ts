/** Clave única de una cita PM: máquina + fecha programada (ISO). */
export function claveAsignacionPm(hojaId: string, fechaProgramada: string): string {
  return `${hojaId}|${fechaProgramada}`;
}

/** Agrupa filas de asignación por cita (puede haber varios operarios). */
export function mapaAsignacionesPorClave<T extends { hoja_id: string; fecha_programada: string }>(
  asignaciones: T[],
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const a of asignaciones) {
    const clave = claveAsignacionPm(a.hoja_id, a.fecha_programada);
    const lista = map.get(clave);
    if (lista) lista.push(a);
    else map.set(clave, [a]);
  }
  return map;
}

export function personalIdsDeAsignaciones(
  asignaciones: Array<{ personal_id: string }> | undefined,
): string[] {
  if (!asignaciones?.length) return [];
  return [...new Set(asignaciones.map((a) => a.personal_id))];
}
