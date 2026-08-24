import { useEffect } from "react";

/**
 * Push FCM (app cerrada) requiere google-services.json de Firebase.
 * Mientras no esté en android/app/, este hook no registra nada para
 * evitar que la APK se cierre al abrir.
 *
 * Los avisos con la app abierta siguen por realtime + notificaciones locales.
 */
export function usePushNotificaciones(
  _userId: string | null | undefined,
  _rol: string | null | undefined,
) {
  useEffect(() => {
    // Intencionalmente vacío hasta configurar Firebase.
  }, []);
}
