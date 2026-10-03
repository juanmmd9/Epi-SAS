import { Link } from "react-router-dom";
import { rutaSolicitudesArea } from "../../lib/usuarioArea";
import type { AlertaSolicitud } from "./solicitudesRealtime";

interface Props {
  enLinea: boolean;
  sondeoActivo?: boolean;
  alertas: AlertaSolicitud[];
  onDescartar: (clave: string) => void;
  areaActual?: string;
  /** Si true, solo toasts flotantes (avisos globales en Layout). */
  soloToasts?: boolean;
}

function PanelAlertasSolicitudes({
  alertas,
  onDescartar,
  areaActual,
  soloToasts = false,
}: Props) {
  return (
    <>
      {!soloToasts && alertas.length > 0 && (
        <div className="solicitudes-alerta__barra">
          <span className="solicitudes-alerta__badge">{alertas.length} nueva(s)</span>
        </div>
      )}

      <div className="solicitudes-alerta__toasts" aria-live="polite">
        {alertas.map((alerta) => (
          <article key={alerta.clave} className="solicitudes-alerta__toast">
            <button
              type="button"
              className="solicitudes-alerta__cerrar"
              aria-label="Cerrar aviso"
              onClick={() => onDescartar(alerta.clave)}
            >
              ×
            </button>
            <strong>Nueva solicitud #{alerta.numero || "—"}</strong>
            <p>
              {alerta.area} · {alerta.maquina}
            </p>
            <p className="solicitudes-alerta__solicitante">{alerta.solicitante}</p>
            {areaActual ? (
              <button
                type="button"
                className="solicitudes-alerta__enlace-btn"
                onClick={() => onDescartar(alerta.clave)}
              >
                Ver en la lista ↓
              </button>
            ) : (
              <Link
                to={rutaSolicitudesArea(alerta.area)}
                className="solicitudes-alerta__enlace"
                onClick={() => onDescartar(alerta.clave)}
              >
                Ver en {alerta.area} →
              </Link>
            )}
          </article>
        ))}
      </div>
    </>
  );
}

export default PanelAlertasSolicitudes;
