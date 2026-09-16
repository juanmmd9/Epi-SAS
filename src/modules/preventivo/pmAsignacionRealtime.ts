import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

export interface AlertaPmAsignado {
  clave: string;
  area: string;
  maquina: string;
  codigo: string;
  fechaProgramada: string;
  recibidaEn: number;
}

export async function prepararCanalNotificacionesPm(): Promise<void> {
  if (Capacitor.getPlatform() !== "android") return;
  try {
    await LocalNotifications.createChannel({
      id: "preventivo",
      name: "PM asignados",
      description: "Avisos cuando te asignan un mantenimiento preventivo",
      importance: 5,
      visibility: 1,
    });
  } catch {
    // Opcional.
  }
}

export async function mostrarNotificacionPmAsignado(alerta: AlertaPmAsignado): Promise<void> {
  const titulo = "PM asignado";
  const cuerpo = `${alerta.area} · ${alerta.maquina} (${alerta.codigo}) — ${alerta.fechaProgramada}`;

  if (Capacitor.isNativePlatform()) {
    try {
      await prepararCanalNotificacionesPm();
      const permiso = await LocalNotifications.checkPermissions();
      if (permiso.display !== "granted") {
        const pedido = await LocalNotifications.requestPermissions();
        if (pedido.display !== "granted") return;
      }
      const id = Math.abs(
        Array.from(alerta.clave).reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) | 0, 11),
      );
      await LocalNotifications.schedule({
        notifications: [
          {
            id: id % 2_000_000_000 || 2,
            title: titulo,
            body: cuerpo,
            channelId: "preventivo",
            extra: { tipo: "pm_asignado", fecha: alerta.fechaProgramada },
          },
        ],
      });
      return;
    } catch {
      // Sigue con Notification API web.
    }
  }

  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    new Notification(titulo, { body: cuerpo, tag: alerta.clave });
  } catch {
    // Sin permiso o bloqueado.
  }
}

export function reproducirSonidoPmAsignado(): void {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.36);
    window.setTimeout(() => void ctx.close(), 500);
  } catch {
    // Sin audio.
  }
}
