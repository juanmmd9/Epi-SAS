import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../services/supabase";
import { listarCorrectivo } from "../correctivo/correctivoService";
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

export type ModoRealtimeSolicitudes = "completo" | "solo-lista" | "solo-alertas";

interface OpcionesRealtime {
  areaFiltro?: string;
  correctivos: RegistroCorrectivo[];
  onNuevaSolicitud?: (registro: RegistroCorrectivo) => void;
  habilitado?: boolean;
  /**
   * completo: lista + toasts + notificación (páginas de solicitudes).
   * solo-lista: actualiza lista sin avisar (si ya hay avisos globales).
   * solo-alertas: toasts + notificación en toda la app (Layout).
   */
  modo?: ModoRealtimeSolicitudes;
}

const INTERVALO_SONDEO_MS = 8_000;

export function useSolicitudesRealtime({
  areaFiltro,
  correctivos,
  onNuevaSolicitud,
  habilitado = true,
  modo = "completo",
}: OpcionesRealtime) {
  const conocidos = useRef(new Set<string>());
  const onNuevaRef = useRef(onNuevaSolicitud);
  const sonidoRef = useRef(leerPreferenciaSonido());
  const areaFiltroRef = useRef(areaFiltro);
  const sondeoEnCurso = useRef(false);
  const listoParaAlertar = useRef(modo !== "solo-alertas");

  const [alertas, setAlertas] = useState<AlertaSolicitud[]>([]);
  const [enLinea, setEnLinea] = useState(false);
  const [sondeoActivo, setSondeoActivo] = useState(false);
  const [sonidoActivo, setSonidoActivo] = useState(() => leerPreferenciaSonido());
  const [areasConNueva, setAreasConNueva] = useState<Set<string>>(() => new Set());
  const [idsDestacados, setIdsDestacados] = useState<Set<string>>(() => new Set());

  onNuevaRef.current = onNuevaSolicitud;
  sonidoRef.current = sonidoActivo;
  areaFiltroRef.current = areaFiltro;

  useEffect(() => {
    correctivos.forEach((r) => conocidos.current.add(r.id));
    if (modo !== "solo-alertas" && correctivos.length > 0) {
      listoParaAlertar.current = true;
    }
  }, [correctivos, modo]);

  // En modo global: marcar existentes como conocidos antes de alertar.
  useEffect(() => {
    if (!habilitado || modo !== "solo-alertas") return;
    let cancelado = false;
    listoParaAlertar.current = false;
    void listarCorrectivo()
      .then((regs) => {
        if (cancelado) return;
        for (const r of regs) conocidos.current.add(r.id);
        listoParaAlertar.current = true;
      })
      .catch(() => {
        if (!cancelado) listoParaAlertar.current = true;
      });
    return () => {
      cancelado = true;
    };
  }, [habilitado, modo]);

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

  const modoRef = useRef(modo);
  modoRef.current = modo;

  const registrarAlerta = useCallback(
    (registro: RegistroCorrectivo) => {
      if (modoRef.current === "solo-lista") return;
      const alerta = crearAlertaDesdeRegistro(registro);
      setAlertas((prev) => [alerta, ...prev].slice(0, 6));
      setAreasConNueva((prev) => new Set(prev).add(registro.area));
      destacarRegistro(registro.id);
      if (sonidoRef.current) reproducirSonidoNuevaSolicitud();
      void mostrarNotificacionSistema(alerta);
    },
    [destacarRegistro],
  );

  const procesarNueva = useCallback(
    (registro: RegistroCorrectivo) => {
      if (conocidos.current.has(registro.id)) return false;
      if (!listoParaAlertar.current) {
        conocidos.current.add(registro.id);
        return false;
      }
      conocidos.current.add(registro.id);
      if (!esSolicitudNuevaNotificable(registro, areaFiltroRef.current)) return false;
      if (modoRef.current !== "solo-alertas") {
        onNuevaRef.current?.(registro);
      }
      registrarAlerta(registro);
      return true;
    },
    [registrarAlerta],
  );

  const sondearNuevas = useCallback(async () => {
    if (sondeoEnCurso.current) return;
    sondeoEnCurso.current = true;
    try {
      const regs = await listarCorrectivo();
      for (const registro of regs) {
        procesarNueva(registro);
      }
    } catch {
      // Fallo de red puntual: el siguiente ciclo reintenta.
    } finally {
      sondeoEnCurso.current = false;
    }
  }, [procesarNueva]);

  // Realtime (inmediato) + sondeo de respaldo cada 8 s
  useEffect(() => {
    if (!habilitado) {
      setEnLinea(false);
      setSondeoActivo(false);
      return;
    }

    void solicitarPermisoNotificaciones();

    const canal = supabase
      .channel(`solicitudes-correctivo-${areaFiltro || "todas"}-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "correctivo" },
        (payload) => {
          const registro = registroDesdeRealtime(payload.new as Record<string, unknown>);
          if (!registro) return;
          procesarNueva(registro);
        },
      )
      .subscribe((estado) => {
        setEnLinea(estado === "SUBSCRIBED");
      });

    setSondeoActivo(true);
    void sondearNuevas();
    const timer = window.setInterval(() => {
      void sondearNuevas();
    }, INTERVALO_SONDEO_MS);

    return () => {
      window.clearInterval(timer);
      setSondeoActivo(false);
      void supabase.removeChannel(canal);
      setEnLinea(false);
    };
  }, [habilitado, areaFiltro, procesarNueva, sondearNuevas]);

  // Al volver a la pestaña, revisar al instante
  useEffect(() => {
    if (!habilitado) return;

    function alVolver() {
      if (document.visibilityState === "visible") {
        void sondearNuevas();
      }
    }

    document.addEventListener("visibilitychange", alVolver);
    return () => document.removeEventListener("visibilitychange", alVolver);
  }, [habilitado, sondearNuevas]);

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
    sondeoActivo,
    sonidoActivo,
    setSonidoActivo,
    areasConNueva,
    idsDestacados,
    marcarConocido,
    limpiarAreaNueva,
  };
}

export type { AlertaSolicitud };
