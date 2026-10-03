import { Link, Navigate, useParams } from "react-router-dom";
import { AREAS_MAPA_PROCESOS, coincideArea, normalizarArea } from "../../lib/areas";
import { areaUsuario } from "../../lib/usuarioArea";
import { useAuth } from "../auth/AuthContext";
import "./inicio.css";

function AreaMenuPage() {
  const { areaNombre } = useParams();
  const { perfil, rol } = useAuth();
  const areaUsuarioActual = areaUsuario(perfil);
  const esDiseno =
    (rol === "lider" || rol === "solicitante") &&
    Boolean(areaUsuarioActual) &&
    coincideArea(areaUsuarioActual ?? "", "Diseno y Desarrollo");
  const area = normalizarArea(areaNombre ? decodeURIComponent(areaNombre) : "");
  const valida = AREAS_MAPA_PROCESOS.some((item) => item === area);
  const esMantenimiento = coincideArea(area, "Mantenimiento");
  const esGerencia = coincideArea(area, "Gerencia General");

  if (!esDiseno) return <Navigate to="/" replace />;

  if (!valida) {
    return (
      <section className="inicio">
        <h1>Área no encontrada</h1>
        <Link to="/" className="btn">
          Volver al inicio
        </Link>
      </section>
    );
  }

  return (
    <section className="inicio area-menu">
      <div className="inicio__cabecera">
        <div>
          <h1>{area}</h1>
          {esMantenimiento ? (
            <p className="inicio__descripcion">Pedidos que las áreas envían a Mantenimiento.</p>
          ) : esGerencia ? (
            <p className="inicio__descripcion">Pedidos que las áreas envían a Gerencia.</p>
          ) : null}
        </div>
      </div>

      {esMantenimiento ? (
        <div className="area-menu__cards area-menu__cards--destacada">
          <Link
            className="area-menu__card area-menu__card--principal"
            to="/solicitudes"
            state={{ solicitudesDe: "Mantenimiento", desdeArea: areaUsuarioActual }}
          >
            <span className="area-menu__icono" aria-hidden>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
                <path d="M9 12h6M9 16h4" />
              </svg>
            </span>
            <h2>Solicitudes de Mantenimiento</h2>
            <p>Crear y consultar los pedidos hacia Mantenimiento.</p>
            <span className="area-menu__ir">Abrir solicitudes</span>
          </Link>
        </div>
      ) : null}

      {esGerencia ? (
        <div className="area-menu__cards area-menu__cards--destacada">
          <Link className="area-menu__card area-menu__card--principal" to="/gerencia/pedir">
            <span className="area-menu__icono" aria-hidden>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 21V8l8-5 8 5v13" />
                <path d="M9 21v-6h6v6" />
              </svg>
            </span>
            <h2>Solicitar a Gerencia</h2>
            <p>Crear y consultar los pedidos hacia Gerencia General.</p>
            <span className="area-menu__ir">Abrir solicitud</span>
          </Link>
        </div>
      ) : null}
    </section>
  );
}

export default AreaMenuPage;
