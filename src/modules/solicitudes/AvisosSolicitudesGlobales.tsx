import { useAuth } from "../auth/AuthContext";
import PanelAlertasSolicitudes from "./PanelAlertasSolicitudes";
import { usePushNotificaciones } from "./usePushNotificaciones";
import { useSolicitudesRealtime } from "./useSolicitudesRealtime";
import "./solicitudes.css";

/** Roles de mantenimiento que deben enterarse de nuevas solicitudes. */
const ROLES_AVISO = new Set(["admin", "operador", "consulta"]);

/**
 * Escucha nuevas solicitudes en toda la app (no solo en /solicitudes)
 * y muestra toast + notificación del sistema/celular.
 * En Android también registra FCM (push con app cerrada).
 */
function AvisosSolicitudesGlobales() {
  const { perfil, puede } = useAuth();
  const rol = perfil?.rol;
  const habilitado = Boolean(rol && ROLES_AVISO.has(rol) && puede("ver.solicitudes"));

  usePushNotificaciones(perfil?.id, rol);

  const { alertas, descartarAlerta, enLinea, sondeoActivo, sonidoActivo, setSonidoActivo } =
    useSolicitudesRealtime({
      correctivos: [],
      habilitado,
      modo: "solo-alertas",
    });

  if (!habilitado) return null;

  return (
    <div className="solicitudes-alerta--global">
      {(enLinea || sondeoActivo) && (
        <div className="solicitudes-alerta__chip-global" title="Avisos de nuevas solicitudes activos">
          <button
            type="button"
            className={
              "btn solicitudes-alerta__sonido" + (sonidoActivo ? " btn--primario" : "")
            }
            onClick={() => setSonidoActivo((v) => !v)}
          >
            {sonidoActivo ? "Avisos ON" : "Avisos OFF"}
          </button>
          <span className={enLinea ? "solicitudes-alerta__punto solicitudes-alerta__punto--ok" : ""}>
            {enLinea ? "En vivo" : "Auto"}
          </span>
        </div>
      )}
      <PanelAlertasSolicitudes
        enLinea={enLinea}
        sondeoActivo={sondeoActivo}
        sonidoActivo={sonidoActivo}
        onToggleSonido={() => setSonidoActivo((v) => !v)}
        alertas={alertas}
        onDescartar={descartarAlerta}
        soloToasts
      />
    </div>
  );
}

export default AvisosSolicitudesGlobales;
