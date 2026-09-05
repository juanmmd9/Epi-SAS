import { useCallback, useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { useAuth } from "../auth/AuthContext";
import { supabase } from "../../services/supabase";
import "./solicitudes.css";

type AlertaAsignacion = {
  clave: string;
  area: string;
  numero: string;
  maquina: string;
  recibidaEn: number;
};

/**
 * Aviso en app abierta cuando el admin asigna una solicitud al operario.
 */
function AvisosAsignacionCorrectivoGlobales() {
  const { perfil } = useAuth();
  const personalId = perfil?.personal_id;
  const habilitado = Boolean(
    personalId && (perfil?.rol === "operador" || perfil?.rol === "admin"),
  );
  const [alertas, setAlertas] = useState<AlertaAsignacion[]>([]);
  const conocidos = useRef(new Set<string>());

  const registrar = useCallback(async (fila: Record<string, unknown>) => {
    const id = String(fila.id ?? "");
    const correctivoId = String(fila.correctivo_id ?? "");
    const area = String(fila.area ?? "");
    if (!id || conocidos.current.has(id)) return;
    conocidos.current.add(id);

    let numero = "—";
    let maquina = "Solicitud";
    if (correctivoId) {
      const { data } = await supabase
        .from("correctivo")
        .select("datos")
        .eq("id", correctivoId)
        .maybeSingle();
      const datos = (data?.datos ?? {}) as Record<string, unknown>;
      if (datos.numeroSolicitud != null) numero = String(datos.numeroSolicitud);
      if (typeof datos.maquinaEquipoLocacion === "string" && datos.maquinaEquipoLocacion.trim()) {
        maquina = datos.maquinaEquipoLocacion.trim();
      }
    }

    const alerta: AlertaAsignacion = {
      clave: `${id}-${Date.now()}`,
      area: area || "Área",
      numero,
      maquina,
      recibidaEn: Date.now(),
    };
    setAlertas((prev) => [alerta, ...prev].slice(0, 4));

    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Math.floor(Math.random() * 100000) + 20000,
              title: `Solicitud asignada #${numero}`,
              body: `${alerta.area} · ${maquina}`,
              channelId: "solicitudes",
            },
          ],
        });
      } catch {
        // Local opcional si FCM ya avisó.
      }
    }
  }, []);

  useEffect(() => {
    if (!habilitado || !personalId) return;

    const canal = supabase
      .channel(`corr-asignacion-realtime-${personalId}-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "correctivo_asignaciones" },
        (payload) => {
          const fila = payload.new as Record<string, unknown>;
          if (fila.personal_id !== personalId) return;
          if (fila.origen === "claim") return;
          void registrar(fila);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(canal);
    };
  }, [habilitado, personalId, registrar]);

  if (!habilitado || alertas.length === 0) return null;

  return (
    <div className="pm-asignados-alerta--global" aria-live="polite">
      {alertas.map((a) => (
        <article key={a.clave} className="pm-asignados-alerta__toast">
          <strong>Solicitud asignada</strong>
          <p>
            #{a.numero} · {a.area} · {a.maquina}
          </p>
          <p className="pm-asignados-alerta__fecha">Revisa Mis solicitudes en Inicio</p>
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

export default AvisosAsignacionCorrectivoGlobales;
