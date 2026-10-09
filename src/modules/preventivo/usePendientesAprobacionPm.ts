import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { coincideArea } from "../../lib/areas";
import { quitarCanalRealtime, suscribirPostgresChanges } from "../../lib/supabaseRealtime";
import { areaUsuario } from "../../lib/usuarioArea";
import { useAuth } from "../auth/AuthContext";
import { esPendienteAprobacionPm } from "../preventivo/aprobacionPm";
import { listarPreventivo } from "../preventivo/preventivoService";

const INTERVALO_MS = 20_000;
const CANAL_BADGE = "pm-aprobacion-badge";

/**
 * Cuenta PM pendientes de firma del líder (área del usuario, o todos si es admin).
 */
export function usePendientesAprobacionPm(): number {
  const { puede, perfil, rol } = useAuth();
  const ubicacion = useLocation();
  const [cantidad, setCantidad] = useState(0);
  const habilitado = puede("aprobar.preventivo");
  const areaLider = areaUsuario(perfil);
  const esAdmin = rol === "admin";

  const refrescar = useCallback(async () => {
    if (!habilitado) {
      setCantidad(0);
      return;
    }
    try {
      const lista = await listarPreventivo();
      const n = lista.filter((r) => {
        if (!esPendienteAprobacionPm(r)) return false;
        if (esAdmin) return true;
        if (!areaLider) return false;
        return coincideArea(r.area, areaLider);
      }).length;
      setCantidad(n);
    } catch {
      // Silencioso: no tumbar la navegación por un fallo de red.
    }
  }, [habilitado, esAdmin, areaLider]);

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

  // Al navegar (p. ej. tras aprobar) actualiza el badge.
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

  // Realtime: si hay INSERT/UPDATE en preventivo, refresca el contador.
  useEffect(() => {
    if (!habilitado) return;
    const canal = suscribirPostgresChanges(CANAL_BADGE, [
      {
        filter: { event: "*", schema: "public", table: "preventivo" },
        handler: () => void refrescarRef.current(),
      },
    ]);
    return () => quitarCanalRealtime(canal);
  }, [habilitado]);

  return cantidad;
}
