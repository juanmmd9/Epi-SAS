import { AREAS_PLANTA } from "../../lib/areas";
import type { HojaVida, VerificacionMedicion } from "./types";

export type EstadoMedicion = "sin-registro" | "vigente" | "vencida" | "no-apto";

/** Equipo que mide: báscula, balanza, gramera, cinta o flexómetro. */
const ES_MEDICION = /bascul|balanz|gramera|cinta metrica|flexometro/i;

/** Masa o accesorio de ensayo. No mide y no se verifica como equipo de medición. */
const NO_ES_MEDICION = /peso de prueba|pesa de prueba|torso de prueba|eslinga de prueba/i;

function textoHoja(hoja: HojaVida): string {
  return `${hoja.nombre} ${hoja.codigo ?? ""}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function esEquipoMedicion(hoja: HojaVida): boolean {
  const texto = textoHoja(hoja);
  if (NO_ES_MEDICION.test(texto)) return false;
  if (hoja.datos?.esMedicion) return true;
  return ES_MEDICION.test(texto);
}

export function verificacionesDe(hoja: HojaVida): VerificacionMedicion[] {
  const lista = hoja.datos?.verificaciones;
  if (!Array.isArray(lista)) return [];
  return [...lista].sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export function ultimaVerificacion(hoja: HojaVida): VerificacionMedicion | null {
  return verificacionesDe(hoja)[0] ?? null;
}

export function estadoMedicion(hoja: HojaVida, hoy = new Date()): EstadoMedicion {
  const ultima = ultimaVerificacion(hoja);
  if (!ultima) return "sin-registro";
  if (ultima.resultado === "No apto") return "no-apto";
  if (ultima.proxima && ultima.proxima < fechaIso(hoy)) return "vencida";
  if (!ultima.proxima) return "sin-registro";
  return "vigente";
}

export function etiquetaEstado(estado: EstadoMedicion): string {
  if (estado === "vigente") return "Vigente";
  if (estado === "vencida") return "Vencida";
  if (estado === "no-apto") return "No apto";
  return "Sin registro";
}

export function fechaIso(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

export function areasSinInstrumento(hojas: HojaVida[]): string[] {
  const conEquipo = new Set(hojas.filter(esEquipoMedicion).map((hoja) => hoja.area));
  return AREAS_PLANTA.filter((area) => !conEquipo.has(area));
}
