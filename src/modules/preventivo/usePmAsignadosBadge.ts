import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { supabase } from "../../services/supabase";
import { contarMisPmPendientes } from "./pmAsignadosService";

const INTERVALO_MS = 25_000;

/** Badge en Inicio: PM asignados pendientes del operario vinculado. */
export function usePmAsignadosBadge(): number {
  const { perfil } = useAuth();
  const ubicacion = useLocation();
  const [cantidad, setCantidad] = useState(0);
  const personalId = perfil?.personal_id;
  const habilitado = Boolean(
    personalId && (perfil?.rol === "operador" || perfil?.rol === "admin"),
  );

  const refrescar = useCallback(async () => {
    if (!habilitado || !personalId) {
      setCantidad(0);
      return;
    }
    try {
      setCantidad(await contarMisPmPendientes(personalId));
    } catch {
      // Silencioso en navegación.
    }
  }, [habilitado, personalId]);

  useEffect(() => {
    if (!habilitado) {
      setCantidad(0);
      return;
    }
    void refrescar();
    const timer = window.setInterval(() => void refrescar(), INTERVALO_MS);
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
    if (!habilitado || !personalId) return;
    const canal = supabase
      .channel(`pm-asignados-badge-${personalId}-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "preventivo_asignaciones" },
        (payload) => {
          const fila = (payload.new ?? payload.old) as { personal_id?: string } | null;
          if (fila?.personal_id === personalId) void refrescar();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "preventivo" },
        () => void refrescar(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(canal);
    };
  }, [habilitado, personalId, refrescar]);

  return cantidad;
}
