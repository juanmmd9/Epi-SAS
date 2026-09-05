import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { supabase } from "../../services/supabase";
import { listarHojas } from "../hojas/hojasService";
import {
  mostrarNotificacionPmAsignado,
  prepararCanalNotificacionesPm,
  reproducirSonidoPmAsignado,
  type AlertaPmAsignado,
} from "./pmAsignacionRealtime";
import "./pmAsignadosAvisos.css";

/**
 * Avisos en app abierta cuando al operario le asignan un PM (realtime + notificación local).
 */
function AvisosPmAsignadosGlobales() {
  const { perfil } = useAuth();
  const personalId = perfil?.personal_id;
  const habilitado = Boolean(
    personalId && (perfil?.rol === "operador" || perfil?.rol === "admin"),
  );
  const [alertas, setAlertas] = useState<AlertaPmAsignado[]>([]);
  const mapaMaquinas = useRef(new Map<string, { nombre: string; codigo: string }>());

  const cargarMaquinas = useCallback(async () => {
    try {
      const hojas = await listarHojas();
      mapaMaquinas.current = new Map(
        hojas.map((h) => [
          h.id,
          { nombre: h.nombre || "Equipo", codigo: h.codigo || "—" },
        ]),
      );
    } catch {
      // Sin catálogo: se usa texto genérico.
    }
  }, []);

  const registrarAlerta = useCallback((fila: Record<string, unknown>) => {
    const hojaId = String(fila.hoja_id ?? "");
    const area = String(fila.area ?? "");
    const fecha = String(fila.fecha_programada ?? "");
    if (!hojaId || !fecha) return;

    const maquina = mapaMaquinas.current.get(hojaId);
    const alerta: AlertaPmAsignado = {
      clave: `${hojaId}-${fecha}-${Date.now()}`,
      area,
      maquina: maquina?.nombre ?? "Máquina",
      codigo: maquina?.codigo ?? "—",
      fechaProgramada: fecha,
      recibidaEn: Date.now(),
    };

    setAlertas((prev) => [alerta, ...prev].slice(0, 4));
    reproducirSonidoPmAsignado();
    void mostrarNotificacionPmAsignado(alerta);
  }, []);

  useEffect(() => {
    if (!habilitado) return;
    void prepararCanalNotificacionesPm();
    void cargarMaquinas();
  }, [habilitado, cargarMaquinas]);

  useEffect(() => {
    if (!habilitado || !personalId) return;

    const canal = supabase
      .channel(`pm-asignacion-realtime-${personalId}-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "preventivo_asignaciones" },
        (payload) => {
          const fila = payload.new as Record<string, unknown>;
          if (fila.personal_id !== personalId) return;
          registrarAlerta(fila);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "preventivo_asignaciones" },
        (payload) => {
          const fila = payload.new as Record<string, unknown>;
          const anterior = payload.old as Record<string, unknown>;
          if (fila.personal_id !== personalId) return;
          if (anterior.personal_id === fila.personal_id) return;
          registrarAlerta(fila);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(canal);
    };
  }, [habilitado, personalId, registrarAlerta]);

  if (!habilitado || alertas.length === 0) return null;

  return (
    <div className="pm-asignados-alerta--global" aria-live="polite">
      {alertas.map((a) => (
        <article key={a.clave} className="pm-asignados-alerta__toast">
          <strong>PM asignado</strong>
          <p>
            {a.area} · {a.maquina} ({a.codigo})
          </p>
          <p className="pm-asignados-alerta__fecha">Fecha programada: {a.fechaProgramada}</p>
          <button
            type="button"
            className="pm-asignados-alerta__cerrar"
            onClick={() => setAlertas((prev) => prev.filter((x) => x.clave !== a.clave))}
          >
            Entendido
          </button>
        </article>
      ))}
    </div>
  );
}

export default AvisosPmAsignadosGlobales;
