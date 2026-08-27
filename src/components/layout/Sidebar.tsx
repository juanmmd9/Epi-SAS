import { NavLink, useNavigate } from "react-router-dom";
import { rutaPublica } from "../../lib/rutaPublica";
import { useAuth } from "../../modules/auth/AuthContext";
import { etiquetaRol, enlacesParaRol } from "../../modules/auth/roles";
import { areaUsuario } from "../../lib/usuarioArea";
import { usePendientesAprobacionPm } from "../../modules/preventivo/usePendientesAprobacionPm";
import { usePermisosPendientesBadge } from "../../modules/permisos/usePermisosPendientesBadge";
import { useSolicitudesAbiertasBadge } from "../../modules/solicitudes/useSolicitudesAbiertasBadge";
import "../../modules/auth/auth.css";
import "./Layout.css";

interface Props {
  abierto: boolean;
  onCerrar: () => void;
}

function Sidebar({ abierto, onCerrar }: Props) {
  const navegar = useNavigate();
  const { perfil, salir } = useAuth();
  const enlaces = enlacesParaRol(perfil?.rol);
  const pendientesFirma = usePendientesAprobacionPm();
  const solicitudesAbiertas = useSolicitudesAbiertasBadge();
  const permisosPendientes = usePermisosPendientesBadge();

  async function manejarCerrarSesion() {
    onCerrar();
    await salir();
    navegar("/login", { replace: true });
  }

  return (
    <aside className={"sidebar" + (abierto ? " sidebar--abierto" : "")}>
      <div className="sidebar__marca">
        <img
          className="sidebar__logo"
          src={rutaPublica("/Image/EPI-Logo.png")}
          alt="EPI — Empresa de Producción Industrial"
          width={286}
          height={90}
        />
        <span className="sidebar__titulo">Portal Mantenimiento</span>
      </div>
      <nav className="sidebar__nav">
        {enlaces.map((enlace) => {
          const esAprobar = enlace.ruta === "/preventivo/aprobaciones";
          const esSolicitudes = enlace.ruta === "/solicitudes";
          const esPermisos = enlace.ruta === "/personal/permisos";
          const avisoFirma = esAprobar && pendientesFirma > 0;
          const avisoSol = esSolicitudes && solicitudesAbiertas > 0;
          const avisoPerm = esPermisos && permisosPendientes > 0;
          return (
            <NavLink
              key={enlace.ruta}
              to={enlace.ruta}
              end={enlace.ruta === "/" || enlace.ruta === "/solicitudes"}
              className={({ isActive }) =>
                "sidebar__enlace" +
                (isActive ? " sidebar__enlace--activo" : "") +
                (avisoFirma || avisoSol || avisoPerm ? " sidebar__enlace--aviso" : "") +
                (avisoSol && !avisoFirma && !avisoPerm ? " sidebar__enlace--aviso-sol" : "") +
                (avisoPerm && !avisoFirma ? " sidebar__enlace--aviso-perm" : "")
              }
              onClick={onCerrar}
            >
              <span className="sidebar__enlace-texto">{enlace.texto}</span>
              {avisoFirma ? (
                <span
                  className="nav-badge nav-badge--sidebar"
                  aria-label={`${pendientesFirma} pendiente(s) de firmar`}
                >
                  {pendientesFirma > 9 ? "9+" : pendientesFirma}
                </span>
              ) : null}
              {avisoSol ? (
                <span
                  className="nav-badge nav-badge--sidebar nav-badge--naranja"
                  aria-label={`${solicitudesAbiertas} solicitud(es) abierta(s)`}
                >
                  {solicitudesAbiertas > 9 ? "9+" : solicitudesAbiertas}
                </span>
              ) : null}
              {avisoPerm ? (
                <span
                  className="nav-badge nav-badge--sidebar nav-badge--azul"
                  aria-label={`${permisosPendientes} permiso(s) por aprobar`}
                >
                  {permisosPendientes > 9 ? "9+" : permisosPendientes}
                </span>
              ) : null}
            </NavLink>
          );
        })}
      </nav>
      {perfil && (
        <div className="sidebar__usuario">
          <span className="sidebar__usuario-nombre">
            {perfil.nombre || perfil.usuario || perfil.email}
          </span>
          <span className="sidebar__usuario-rol">
            {etiquetaRol(perfil.rol)}
            {areaUsuario(perfil) ? ` · ${areaUsuario(perfil)}` : ""}
          </span>
          <button
            type="button"
            className="btn sidebar__cerrar-sesion"
            onClick={() => void manejarCerrarSesion()}
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
