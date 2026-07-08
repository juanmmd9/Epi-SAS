import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../services/supabase";
import type { RegistroCorrectivo } from "../correctivo/types";
import {
  crearAlertaDesdeRegistro,
  esSolicitudNuevaNotificable,
  guardarPreferenciaSonido,
  leerPreferenciaSonido,
  mostrarNotificacionSistema,
  registroDesdeRealtime,
  reproducirSonidoNuevaSolicitud,
  solicitarPermisoNotificaciones,
  type AlertaSolicitud,
} from "./solicitudesRealtime";

interface OpcionesRealtime {
  areaFiltro?: string;
  correctivos: RegistroCorrectivo[];
  onNuevaSolicitud?: (registro: RegistroCorrectivo) => void;
  habilitado?: boolean;
}

export function useSolicitudesRealtime({
  areaFiltro,
  correctivos,
  onNuevaSolicitud,
  habilitado = true,
}: OpcionesRealtime) {
  const conocidos = useRef(new Set<string>());
  const onNuevaRef = useRef(onNuevaSolicitud);
  const sonidoRef = useRef(leerPreferenciaSonido());

  const [alertas, setAlertas] = useState<AlertaSolicitud[]>([]);
  const [enLinea, setEnLinea] = useState(false);
  const [sonidoActivo, setSonidoActivo] = useState(() => leerPreferenciaSonido());
  const [areasConNueva, setAreasConNueva] = useState<Set<string>>(() => new Set());
  const [idsDestacados, setIdsDestacados] = useState<Set<string>>(() => new Set());

  onNuevaRef.current = onNuevaSolicitud;
  sonidoRef.current = sonidoActivo;

  useEffect(() => {
    correctivos.forEach((r) => conocidos.current.add(r.id));
  }, [correctivos]);

  useEffect(() => {
    guardarPreferenciaSonido(sonidoActivo);
  }, [sonidoActivo]);

  const marcarConocido = useCallback((id: string) => {
    conocidos.current.add(id);
  }, []);

  const destacarRegistro = useCallback((id: string) => {
    setIdsDestacados((prev) => new Set(prev).add(id));
    window.setTimeout(() => {
      setIdsDestacados((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 10_000);
  }, []);

  const registrarAlerta = useCallback(
    (registro: RegistroCorrectivo) => {
      const alerta = crearAlertaDesdeRegistro(registro);
      setAlertas((prev) => [alerta, ...prev].slice(0, 6));
      setAreasConNueva((prev) => new Set(prev).add(registro.area));
      destacarRegistro(registro.id);
      if (sonidoRef.current) reproducirSonidoNuevaSolicitud();
      mostrarNotificacionSistema(alerta);
    },
    [destacarRegistro],
  );

  useEffect(() => {
    if (!habilitado) return;

    void solicitarPermisoNotificaciones();

    const canal = supabase
      .channel(`solicitudes-correctivo-${areaFiltro || "todas"}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "correctivo" },
        (payload) => {
          const registro = registroDesdeRealtime(payload.new as Record<string, unknown>);
          if (!registro) return;
          if (conocidos.current.has(registro.id)) return;
          conocidos.current.add(registro.id);
          if (!esSolicitudNuevaNotificable(registro, areaFiltro)) return;

          onNuevaRef.current?.(registro);
          registrarAlerta(registro);
        },
      )
      .subscribe((estado) => {
        setEnLinea(estado === "SUBSCRIBED");
      });

    return () => {
      void supabase.removeChannel(canal);
      setEnLinea(false);
    };
  }, [habilitado, areaFiltro, registrarAlerta]);

  const descartarAlerta = useCallback((clave: string) => {
    setAlertas((prev) => prev.filter((a) => a.clave !== clave));
  }, []);

  const limpiarAreaNueva = useCallback((area: string) => {
    setAreasConNueva((prev) => {
      const next = new Set(prev);
      next.delete(area);
      return next;
    });
  }, []);

  return {
    alertas,
    descartarAlerta,
    enLinea,
    sonidoActivo,
    setSonidoActivo,
    areasConNueva,
    idsDestacados,
    marcarConocido,
    limpiarAreaNueva,
  };
}

export type { AlertaSolicitud };
