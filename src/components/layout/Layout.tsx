import { useRef } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../modules/auth/AuthContext";
import { rutaInicioParaRol } from "../../modules/auth/roles";
import { permisoParaRuta } from "../../lib/guardRutas";
import { areaUsuario } from "../../lib/usuarioArea";
import AvisosSolicitudesGlobales from "../../modules/solicitudes/AvisosSolicitudesGlobales";
import BottomNav from "./BottomNav";
import Sidebar from "./Sidebar";
import "./Layout.css";

function Layout() {
  const ubicacion = useLocation();
  const { perfil, rol, puede } = useAuth();
  const rutasPermitidas = useRef(new Set<string>());

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

  return (
    <div className="layout">
      <Sidebar abierto={false} onCerrar={() => undefined} />
      <div className="layout__cuerpo">
        <header className="layout__topbar">
          <span className="layout__topbar-titulo">Portal Mantenimiento</span>
        </header>
        <main className="layout__contenido">
          <Outlet />
        </main>
        <BottomNav />
      </div>
      <AvisosSolicitudesGlobales />
    </div>
  );
}

export default Layout;
