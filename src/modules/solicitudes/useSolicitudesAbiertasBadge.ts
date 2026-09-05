import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { coincideArea } from "../../lib/areas";
import { useAuth } from "../auth/AuthContext";
import { listarCorrectivo } from "../correctivo/correctivoService";
import { supabase } from "../../services/supabase";
import {
  existeTablaAsignacionesCorrectivo,
  listarAsignacionesCorrectivo,
  listarAsignacionesPorPersonal,
  mapaAsignacionesPorCorrectivo,
} from "./asignacionCorrectivoService";
import { solicitudAbierta } from "./solicitudesCalculo";

const INTERVALO_MS = 20_000;

/**
 * Badge de solicitudes.
 * Admin/consulta: abiertas. Operador: mías + libres de su área (bandeja).
 */
export function useSolicitudesAbiertasBadge(): number {
  const { perfil, puede } = useAuth();
  const ubicacion = useLocation();
  const [cantidad, setCantidad] = useState(0);
  const rol = perfil?.rol;
  const habilitado = Boolean(
    rol &&
      (rol === "admin" || rol === "operador" || rol === "consulta") &&
      puede("ver.solicitudes"),
  );

  const refrescar = useCallback(async () => {
    if (!habilitado) {
      setCantidad(0);
      return;
    }
    try {
      const lista = await listarCorrectivo();
      const abiertas = lista.filter(solicitudAbierta);

      if (rol === "operador" && perfil?.personal_id) {
        const hayTabla = await existeTablaAsignacionesCorrectivo().catch(() => false);
        if (!hayTabla) {
          setCantidad(0);
          return;
        }
        const [mias, todas] = await Promise.all([
          listarAsignacionesPorPersonal(perfil.personal_id),
          listarAsignacionesCorrectivo(),
        ]);
        const idsMias = new Set(mias.map((a) => a.correctivo_id));
        const mapa = mapaAsignacionesPorCorrectivo(todas);
        const areaOp = perfil.area;
        let n = 0;
        for (const r of abiertas) {
          if (idsMias.has(r.id)) {
            n += 1;
            continue;
          }
          const libre = !(mapa.get(r.id)?.length);
          if (libre && areaOp && coincideArea(r.area, areaOp)) n += 1;
        }
        setCantidad(n);
        return;
      }

      setCantidad(abiertas.length);
    } catch {
      // Silencioso.
    }
  }, [habilitado, rol, perfil?.personal_id, perfil?.area]);

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
    if (!habilitado) return;
    const canal = supabase
      .channel(`solicitudes-abiertas-badge-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "correctivo" },
        () => void refrescar(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "correctivo_asignaciones" },
        () => void refrescar(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(canal);
    };
  }, [habilitado, refrescar]);

  return cantidad;
}
