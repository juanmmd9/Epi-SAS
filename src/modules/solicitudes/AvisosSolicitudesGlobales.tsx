import { useAuth } from "../auth/AuthContext";
import { ROLES_NOTIFICACION_SOLICITUDES } from "../auth/roles";
import PanelAlertasSolicitudes from "./PanelAlertasSolicitudes";
import { usePushNotificaciones } from "./usePushNotificaciones";
import { useSolicitudesRealtime } from "./useSolicitudesRealtime";
import "./solicitudes.css";

const ROLES_AVISO = new Set<string>(ROLES_NOTIFICACION_SOLICITUDES);

/**
 * Escucha nuevas solicitudes en toda la app.
 * Admin: todas. Operador: las de su área (bandeja).
 */
function AvisosSolicitudesGlobales() {
  const { perfil, puede } = useAuth();
  const rol = perfil?.rol;
  const habilitado = Boolean(rol && ROLES_AVISO.has(rol) && puede("ver.solicitudes"));
  const areaFiltro = rol === "operador" && perfil?.area ? perfil.area : undefined;

  usePushNotificaciones(perfil?.id, rol);

  const { alertas, descartarAlerta, enLinea, sondeoActivo } = useSolicitudesRealtime({
    correctivos: [],
    habilitado,
    modo: "solo-alertas",
    areaFiltro,
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
