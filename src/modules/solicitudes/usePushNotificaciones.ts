import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { PushNotifications } from "@capacitor/push-notifications";
import { ROLES_NOTIFICACION_SOLICITUDES } from "../auth/roles";
import { guardarPushToken } from "./pushTokensService";

const ROLES_PUSH = new Set<string>(ROLES_NOTIFICACION_SOLICITUDES);

/**
 * Registra el token FCM del celular en Supabase (push_tokens).
 * Requiere google-services.json en android/app/.
 */
export function usePushNotificaciones(
  userId: string | null | undefined,
  rol: string | null | undefined,
) {
  const iniciado = useRef(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (!userId || !rol || !ROLES_PUSH.has(rol)) return;

    let cancelado = false;

    async function prepararCanalAndroid() {
      if (Capacitor.getPlatform() !== "android") return;
      try {
        await LocalNotifications.createChannel({
          id: "solicitudes",
          name: "Nuevas solicitudes",
          description: "Avisos cuando llega una solicitud de mantenimiento",
          importance: 5,
          visibility: 1,
        });
        await LocalNotifications.createChannel({
          id: "preventivo",
          name: "PM asignados",
          description: "Avisos cuando te asignan un mantenimiento preventivo",
          importance: 5,
          visibility: 1,
        });
      } catch {
        // Canal opcional; FCM puede usar el canal por defecto.
      }
    }

    async function registrarPush() {
      if (iniciado.current) return;
      await prepararCanalAndroid();

      const permiso = await PushNotifications.checkPermissions();
      let recibir = permiso.receive;
      if (recibir !== "granted") {
        const pedido = await PushNotifications.requestPermissions();
        recibir = pedido.receive;
      }
      if (recibir !== "granted") return;

      await PushNotifications.register();
      iniciado.current = true;
    }

    const onReg = PushNotifications.addListener("registration", (ev) => {
      if (cancelado || !userId || !ev.value) return;
      void guardarPushToken(userId, ev.value, Capacitor.getPlatform()).catch(() => {});
    });

    const onError = PushNotifications.addListener("registrationError", () => {
      iniciado.current = false;
    });

    void registrarPush();

    return () => {
      cancelado = true;
      void onReg.then((h) => h.remove());
      void onError.then((h) => h.remove());
    };
  }, [userId, rol]);
}
