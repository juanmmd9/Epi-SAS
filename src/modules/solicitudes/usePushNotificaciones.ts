import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { desactivarPushToken, guardarPushToken } from "./pushTokensService";

const ROLES_PUSH = new Set(["admin", "operador", "consulta"]);

/**
 * Registra el dispositivo en FCM y guarda el token en Supabase
 * para que la Edge Function pueda avisar con la app cerrada.
 */
export function usePushNotificaciones(
  userId: string | null | undefined,
  rol: string | null | undefined,
) {
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (!userId || !rol || !ROLES_PUSH.has(rol)) return;

    let cancelado = false;

    async function registrar() {
      try {
        let perm = await PushNotifications.checkPermissions();
        if (perm.receive !== "granted") {
          perm = await PushNotifications.requestPermissions();
        }
        if (perm.receive !== "granted" || cancelado) return;

        try {
          await PushNotifications.createChannel({
            id: "solicitudes",
            name: "Solicitudes de mantenimiento",
            description: "Avisos cuando se crea una solicitud correctiva",
            importance: 5,
            visibility: 1,
            sound: "default",
            vibration: true,
          });
        } catch {
          // Canales solo en Android 8+.
        }

        await PushNotifications.register();
      } catch (e) {
        console.warn("Push: no se pudo registrar", e);
      }
    }

    const subReg = PushNotifications.addListener("registration", (token) => {
      if (cancelado || !token.value) return;
      tokenRef.current = token.value;
      void guardarPushToken(userId, token.value, Capacitor.getPlatform()).catch((err) => {
        console.warn("Push: no se guardó el token", err);
      });
    });

    const subErr = PushNotifications.addListener("registrationError", (err) => {
      console.warn("Push registrationError", err);
    });

    // Con la app en segundo plano / cerrada, el sistema muestra la notificación.
    // En primer plano reenviamos al listener nativo (opcional toast ya lo cubre realtime).
    const subRecv = PushNotifications.addListener("pushNotificationReceived", () => {
      // Intencionalmente vacío: el banner del sistema o el realtime ya avisan.
    });

    const subAction = PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (accion) => {
        const area = (accion.notification.data?.area as string | undefined)?.trim();
        const destino = area
          ? `/solicitudes/area/${encodeURIComponent(area)}`
          : "/solicitudes";
        window.location.assign(destino);
      },
    );

    void registrar();

    return () => {
      cancelado = true;
      void subReg.then((h) => h.remove());
      void subErr.then((h) => h.remove());
      void subRecv.then((h) => h.remove());
      void subAction.then((h) => h.remove());
      const token = tokenRef.current;
      if (token) {
        void desactivarPushToken(token).catch(() => undefined);
      }
    };
  }, [userId, rol]);
}
