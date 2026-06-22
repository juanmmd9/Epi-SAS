import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import "./Layout.css";

function Layout() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const ubicacion = useLocation();

  useEffect(() => {
    setMenuAbierto(false);
  }, [ubicacion.pathname]);

  useEffect(() => {
    document.body.classList.toggle("layout-menu-abierto", menuAbierto);
    return () => document.body.classList.remove("layout-menu-abierto");
  }, [menuAbierto]);

  function cerrarMenu() {
    setMenuAbierto(false);
  }

  function alternarMenu() {
    setMenuAbierto((abierto) => !abierto);
  }

  return (
    <div className="layout">
      {menuAbierto && (
        <button
          type="button"
          className="layout__overlay"
          aria-label="Cerrar menú"
          onClick={cerrarMenu}
        />
      )}
      <Sidebar abierto={menuAbierto} onCerrar={cerrarMenu} />
      <div className="layout__cuerpo">
        <header className="layout__topbar">
          <button
            type="button"
            className="layout__menu-btn"
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuAbierto}
            onClick={alternarMenu}
          >
            <span className="layout__menu-icon" aria-hidden="true" />
          </button>
          <span className="layout__topbar-titulo">Portal Mantenimiento</span>
        </header>
        <main className="layout__contenido">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
