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
 * Los avisos quedan siempre activos (sin botón ON/OFF).
 */
function AvisosSolicitudesGlobales() {
  const { perfil, puede } = useAuth();
  const rol = perfil?.rol;
  const habilitado = Boolean(rol && ROLES_AVISO.has(rol) && puede("ver.solicitudes"));

  usePushNotificaciones(perfil?.id, rol);

  const { alertas, descartarAlerta, enLinea, sondeoActivo } = useSolicitudesRealtime({
    correctivos: [],
    habilitado,
    modo: "solo-alertas",
  });

  if (!habilitado) return null;

  return (
    <div className="solicitudes-alerta--global">
      <PanelAlertasSolicitudes
        enLinea={enLinea}
        sondeoActivo={sondeoActivo}
        alertas={alertas}
        onDescartar={descartarAlerta}
        soloToasts
      />
    </div>
  );
}

export default AvisosSolicitudesGlobales;
