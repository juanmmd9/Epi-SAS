import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { coincideArea } from "../../lib/areas";
import { areaUsuario } from "../../lib/usuarioArea";
import { useAuth } from "../auth/AuthContext";
import { esPendienteAprobacionPm } from "../preventivo/aprobacionPm";
import { listarPreventivo } from "../preventivo/preventivoService";
import { supabase } from "../../services/supabase";

const INTERVALO_MS = 20_000;

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
    const canal = supabase
      .channel(`pm-aprobacion-badge-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "preventivo" },
        () => {
          void refrescar();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(canal);
    };
  }, [habilitado, refrescar]);

  return cantidad;
}
