import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { listarCorrectivo } from "../correctivo/correctivoService";
import { supabase } from "../../services/supabase";
import { solicitudAbierta } from "./solicitudesCalculo";

const INTERVALO_MS = 20_000;

/** Roles de mantenimiento que atienden solicitudes (mismo criterio que avisos globales). */
const ROLES_BADGE = new Set(["admin", "operador", "consulta"]);

/**
 * Cuenta solicitudes correctivas abiertas para mostrar badge en el icono Solicitudes.
 */
export function useSolicitudesAbiertasBadge(): number {
  const { perfil, puede } = useAuth();
  const ubicacion = useLocation();
  const [cantidad, setCantidad] = useState(0);
  const rol = perfil?.rol;
  const habilitado = Boolean(rol && ROLES_BADGE.has(rol) && puede("ver.solicitudes"));

  const refrescar = useCallback(async () => {
    if (!habilitado) {
      setCantidad(0);
      return;
    }
    try {
      const lista = await listarCorrectivo();
      setCantidad(lista.filter(solicitudAbierta).length);
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
      .channel(`solicitudes-abiertas-badge-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "correctivo" },
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
