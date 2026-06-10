import { NavLink } from "react-router-dom";

const enlaces = [
  { ruta: "/", texto: "Inicio" },
  { ruta: "/preventivo", texto: "Mant. preventivo" },
  { ruta: "/correctivo", texto: "Mant. correctivo" },
  { ruta: "/hojas-de-vida", texto: "Hojas de vida" },
  { ruta: "/indicadores", texto: "Indicadores" },
  { ruta: "/formatos", texto: "Formatos" },
  { ruta: "/personal", texto: "Personal" },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__marca">
        <img src="/Image/EPI-Logo.png" alt="Logo EPI" />
        <span>Portal Mantenimiento</span>
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
          >
            {enlace.texto}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
