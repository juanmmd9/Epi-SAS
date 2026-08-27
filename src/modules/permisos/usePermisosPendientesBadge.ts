import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { listarPermisosPendientes } from "./permisosService";
import { supabase } from "../../services/supabase";

const INTERVALO_MS = 20_000;

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
    const canal = supabase
      .channel(`permisos-pendientes-badge-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "permisos_personal" },
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
