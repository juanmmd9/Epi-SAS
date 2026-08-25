import { useEffect, useRef, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../modules/auth/AuthContext";
import { rutaInicioParaRol } from "../../modules/auth/roles";
import { permisoParaRuta } from "../../lib/guardRutas";
import { areaUsuario } from "../../lib/usuarioArea";
import AvisosSolicitudesGlobales from "../../modules/solicitudes/AvisosSolicitudesGlobales";
import Sidebar from "./Sidebar";
import "./Layout.css";

function Layout() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const ubicacion = useLocation();
  const { perfil, rol, puede } = useAuth();
  const rutasPermitidas = useRef(new Set<string>());

  useEffect(() => {
    setMenuAbierto(false);
  }, [ubicacion.pathname]);

  useEffect(() => {
    document.body.classList.toggle("layout-menu-abierto", menuAbierto);
    return () => document.body.classList.remove("layout-menu-abierto");
  }, [menuAbierto]);

  const permisoRuta = permisoParaRuta(ubicacion.pathname);
  const tienePermiso = !permisoRuta || puede(permisoRuta);
  if (tienePermiso) rutasPermitidas.current.add(ubicacion.pathname);

  // Evita pantalla en blanco por redirección infinita (p. ej. rol nuevo sin permisos en APK vieja).
  if (permisoRuta && !puede(permisoRuta) && !rutasPermitidas.current.has(ubicacion.pathname)) {
    const destino = rutaInicioParaRol(rol, areaUsuario(perfil));
    if (destino !== ubicacion.pathname) {
      return (
        <Navigate
          to={destino}
          replace
          state={{ sinPermiso: ubicacion.pathname }}
        />
      );
    }
    return (
      <div className="layout__sin-permiso">
        <h1>Actualiza la aplicación</h1>
        <p>
          Tu rol (<strong>{rol ?? "—"}</strong>) requiere una versión reciente del portal. Cierra
          sesión, reinstala la APK o recarga la página.
        </p>
      </div>
    );
  }

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
      <AvisosSolicitudesGlobales />
    </div>
  );
}

export default Layout;
