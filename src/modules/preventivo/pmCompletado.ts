import type { RegistroPreventivo } from "./types";
import type { HojaVida } from "../hojas/types";

export interface IndicesPmCompletado {
  exactas: Set<string>;
  porMes: Set<string>;
}

/** Asocia registros PM antiguos a la hoja de vida por código o nombre. */
export function vincularPreventivoConHojas(
  registros: RegistroPreventivo[],
  maquinas: HojaVida[],
): RegistroPreventivo[] {
  const porCodigo = new Map<string, string>();
  const porNombre = new Map<string, string>();
  for (const maquina of maquinas) {
    const codigo = (maquina.codigo ?? "").trim().toLowerCase();
    const nombre = maquina.nombre.trim().toLowerCase();
    if (codigo) porCodigo.set(codigo, maquina.id);
    if (nombre) porNombre.set(nombre, maquina.id);
  }

  return registros.map((registro) => {
    if (registro.hoja_id) return registro;
    const codigo = (registro.datos.codigo ?? "").trim().toLowerCase();
    const equipo = (registro.datos.equipo ?? "").trim().toLowerCase();
    const hoja_id =
      (codigo && porCodigo.get(codigo)) ||
      (equipo && porNombre.get(equipo)) ||
      null;
    return hoja_id ? { ...registro, hoja_id } : registro;
  });
}

/** Índices de PM registrados en un año (fecha exacta o mismo mes). */
export function indicesPmCompletado(
  preventivo: RegistroPreventivo[],
  anio: number,
): IndicesPmCompletado {
  const exactas = new Set<string>();
  const porMes = new Set<string>();
  const prefijoAnio = String(anio);

  for (const registro of preventivo) {
    if (!registro.hoja_id || !registro.fecha?.startsWith(prefijoAnio)) continue;
    exactas.add(`${registro.hoja_id}|${registro.fecha}`);
    porMes.add(`${registro.hoja_id}|${registro.fecha.slice(0, 7)}`);
  }

  return { exactas, porMes };
}

/** True si ya hay registro PM para esa máquina en la fecha o en el mismo mes. */
export function pmCompletado(
  maquinaId: string,
  fechaIso: string,
  indices: IndicesPmCompletado,
): boolean {
  return (
    indices.exactas.has(`${maquinaId}|${fechaIso}`) ||
    indices.porMes.has(`${maquinaId}|${fechaIso.slice(0, 7)}`)
  );
}
