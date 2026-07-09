import { Link } from "react-router-dom";
import { rutaSolicitudesArea } from "../../lib/usuarioArea";
import type { AlertaSolicitud } from "./solicitudesRealtime";

interface Props {
  enLinea: boolean;
  sondeoActivo?: boolean;
  sonidoActivo: boolean;
  onToggleSonido: () => void;
  alertas: AlertaSolicitud[];
  onDescartar: (clave: string) => void;
  areaActual?: string;
}

function PanelAlertasSolicitudes({
  enLinea,
  sondeoActivo = false,
  sonidoActivo,
  onToggleSonido,
  alertas,
  onDescartar,
  areaActual,
}: Props) {
  const actualizando = enLinea || sondeoActivo;
  return (
    <>
      <div className="solicitudes-alerta__barra">
        <span
          className={
            "solicitudes-alerta__estado" +
            (actualizando
              ? " solicitudes-alerta__estado--en-linea"
              : " solicitudes-alerta__estado--off")
          }
          title={
            enLinea
              ? "Escuchando nuevas solicitudes en tiempo real"
              : sondeoActivo
                ? "Actualizando la lista cada pocos segundos (respaldo). Para avisos instantáneos ejecuta correctivo_realtime.sql en Supabase."
                : "Sin actualización automática. Recarga o activa Realtime en Supabase."
          }
        >
          {enLinea ? "En vivo" : sondeoActivo ? "Auto" : "Sin en vivo"}
        </span>
        <button
          type="button"
          className={"btn solicitudes-alerta__sonido" + (sonidoActivo ? " btn--primario" : "")}
          onClick={onToggleSonido}
        >
          {sonidoActivo ? "Sonido ON" : "Sonido OFF"}
        </button>
        {alertas.length > 0 && (
          <span className="solicitudes-alerta__badge">{alertas.length} nueva(s)</span>
        )}
      </div>

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
            {!areaActual || areaActual !== alerta.area ? (
              <Link
                to={rutaSolicitudesArea(alerta.area)}
                className="solicitudes-alerta__enlace"
                onClick={() => onDescartar(alerta.clave)}
              >
                Ver en {alerta.area} →
              </Link>
            ) : (
              <button
                type="button"
                className="solicitudes-alerta__enlace-btn"
                onClick={() => onDescartar(alerta.clave)}
              >
                Ver en la lista ↓
              </button>
            )}
          </article>
        ))}
      </div>
    </>
  );
}

export default PanelAlertasSolicitudes;
