import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { quitarCanalRealtime, suscribirPostgresChanges } from "../../lib/supabaseRealtime";
import { useAuth } from "../auth/AuthContext";
import { listarPermisosPendientes } from "./permisosService";

const INTERVALO_MS = 20_000;
const CANAL_BADGE = "permisos-pendientes-badge";

/**
 * Cuenta permisos en estado «solicitado» para el badge del admin que aprueba.
 */
export function usePermisosPendientesBadge(): number {
  const { puede } = useAuth();
  const ubicacion = useLocation();
  const [cantidad, setCantidad] = useState(0);
  const habilitado = puede("aprobar.permisos");

  const refrescar = useCallback(async () => {
    if (!habilitado) {
      setCantidad(0);
      return;
    }
    try {
      const lista = await listarPermisosPendientes();
      setCantidad(lista.length);
    } catch {
      // Silencioso: no tumbar la navegación por un fallo de red.
    }
  }, [habilitado]);

  const refrescarRef = useRef(refrescar);
  refrescarRef.current = refrescar;

  useEffect(() => {
    if (!habilitado) {
      setCantidad(0);
      return;
    }
    void refrescar();
    const timer = window.setInterval(() => {
      void refrescar();
    }, INTERVALO_MS);
    return () => window.clearInterval(timer);
  }, [habilitado, refrescar]);

  useEffect(() => {
    if (!habilitado) return;
    void refrescar();
  }, [ubicacion.pathname, habilitado, refrescar]);

  useEffect(() => {
    if (!habilitado) return;
    function alVolver() {
      if (document.visibilityState === "visible") void refrescar();
    }
    document.addEventListener("visibilitychange", alVolver);
    return () => document.removeEventListener("visibilitychange", alVolver);
  }, [habilitado, refrescar]);

  useEffect(() => {
    if (!habilitado) return;
    const canal = suscribirPostgresChanges(CANAL_BADGE, [
      {
        filter: { event: "*", schema: "public", table: "permisos_personal" },
        handler: () => void refrescarRef.current(),
      },
    ]);
    return () => quitarCanalRealtime(canal);
  }, [habilitado]);

  return cantidad;
}
