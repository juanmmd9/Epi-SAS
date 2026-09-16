import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { coincideArea } from "../../lib/areas";
import { quitarCanalRealtime, suscribirPostgresChanges } from "../../lib/supabaseRealtime";
import { useAuth } from "../auth/AuthContext";
import { listarCorrectivo } from "../correctivo/correctivoService";
import {
  existeTablaAsignacionesCorrectivo,
  listarAsignacionesCorrectivo,
  listarAsignacionesPorPersonal,
  mapaAsignacionesPorCorrectivo,
} from "./asignacionCorrectivoService";
import { solicitudAbierta } from "./solicitudesCalculo";

const INTERVALO_MS = 20_000;
const CANAL_BADGE = "solicitudes-abiertas-badge";

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

  const refrescarRef = useRef(refrescar);
  refrescarRef.current = refrescar;

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
    const canal = suscribirPostgresChanges(CANAL_BADGE, [
      {
        filter: { event: "*", schema: "public", table: "correctivo" },
        handler: () => void refrescarRef.current(),
      },
      {
        filter: { event: "*", schema: "public", table: "correctivo_asignaciones" },
        handler: () => void refrescarRef.current(),
      },
    ]);
    return () => quitarCanalRealtime(canal);
  }, [habilitado]);

  return cantidad;
}
