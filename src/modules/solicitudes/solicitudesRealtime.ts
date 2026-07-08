import { coincideArea } from "../../lib/areas";
import type { RegistroCorrectivo } from "../correctivo/types";
import { solicitudAbierta } from "./solicitudesCalculo";

export interface AlertaSolicitud {
  clave: string;
  registroId: string;
  area: string;
  maquina: string;
  solicitante: string;
  numero: number;
  recibidaEn: number;
}

export function registroDesdeRealtime(fila: Record<string, unknown>): RegistroCorrectivo | null {
  if (!fila.id || typeof fila.id !== "string") return null;
  return {
    id: fila.id,
    personal_id: (fila.personal_id as string | null) ?? null,
    area: String(fila.area ?? ""),
    fecha: String(fila.fecha ?? ""),
    datos: (fila.datos as RegistroCorrectivo["datos"]) ?? ({} as RegistroCorrectivo["datos"]),
    creado_en: String(fila.creado_en ?? ""),
  };
}

export function crearAlertaDesdeRegistro(registro: RegistroCorrectivo): AlertaSolicitud {
  return {
    clave: `${registro.id}-${Date.now()}`,
    registroId: registro.id,
    area: registro.area,
    maquina: registro.datos.maquinaEquipoLocacion || "Sin máquina",
    solicitante: registro.datos.nombreSolicitante || "Sin solicitante",
    numero: registro.datos.numeroSolicitud || 0,
    recibidaEn: Date.now(),
  };
}

export function aplicaFiltroArea(registro: RegistroCorrectivo, areaFiltro?: string): boolean {
  if (!areaFiltro) return true;
  return coincideArea(registro.area, areaFiltro);
}

export function esSolicitudNuevaNotificable(
  registro: RegistroCorrectivo,
  areaFiltro?: string,
): boolean {
  return solicitudAbierta(registro) && aplicaFiltroArea(registro, areaFiltro);
}

export function reproducirSonidoNuevaSolicitud(): void {
  try {
    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.46);
    window.setTimeout(() => void ctx.close(), 600);
  } catch {
    // Sin audio en este navegador o sin gesto del usuario.
  }
}

export async function solicitarPermisoNotificaciones(): Promise<NotificationPermission | null> {
  if (!("Notification" in window)) return null;
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try {
    return await Notification.requestPermission();
  } catch {
    return null;
  }
}

export function mostrarNotificacionSistema(alerta: AlertaSolicitud): void {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  if (!document.hidden) return;
  try {
    const notif = new Notification(`Nueva solicitud #${alerta.numero || "—"}`, {
      body: `${alerta.area} · ${alerta.maquina}\n${alerta.solicitante}`,
      tag: `solicitud-${alerta.registroId}`,
    });
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
  } catch {
    // Permiso revocado o contexto no seguro.
  }
}

const CLAVE_SONIDO = "epi-solicitudes-sonido";

export function leerPreferenciaSonido(): boolean {
  return localStorage.getItem(CLAVE_SONIDO) !== "off";
}

export function guardarPreferenciaSonido(activo: boolean): void {
  localStorage.setItem(CLAVE_SONIDO, activo ? "on" : "off");
}
