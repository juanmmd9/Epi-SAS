import { NavLink, useNavigate } from "react-router-dom";
import { rutaPublica } from "../../lib/rutaPublica";
import { useAuth } from "../../modules/auth/AuthContext";
import { ETIQUETAS_ROL, enlacesParaRol } from "../../modules/auth/roles";
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
        {enlaces.map((enlace) => (
          <NavLink
            key={enlace.ruta}
            to={enlace.ruta}
            end={enlace.ruta === "/"}
            className={({ isActive }) =>
              "sidebar__enlace" + (isActive ? " sidebar__enlace--activo" : "")
            }
            onClick={onCerrar}
          >
            {enlace.texto}
          </NavLink>
        ))}
      </nav>
      {perfil && (
        <div className="sidebar__usuario">
          <span className="sidebar__usuario-nombre">{perfil.nombre || perfil.email}</span>
          <span className="sidebar__usuario-rol">{ETIQUETAS_ROL[perfil.rol]}</span>
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
