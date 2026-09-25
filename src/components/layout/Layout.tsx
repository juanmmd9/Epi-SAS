import { useRef } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import DeferredMount from "../DeferredMount";
import { useAuth } from "../../modules/auth/AuthContext";
import {
  enlacesParaRol,
  puede as puedeRol,
  rutaInicioParaRol,
  type RolPortal,
} from "../../modules/auth/roles";
import { permisoParaRuta } from "../../lib/guardRutas";
import { areaUsuario } from "../../lib/usuarioArea";
import AvisosSolicitudesGlobales from "../../modules/solicitudes/AvisosSolicitudesGlobales";
import AvisosAsignacionCorrectivoGlobales from "../../modules/solicitudes/AvisosAsignacionCorrectivoGlobales";
import AvisosPmAsignadosGlobales from "../../modules/preventivo/AvisosPmAsignadosGlobales";
import BottomNav from "./BottomNav";
import Sidebar from "./Sidebar";
import "./Layout.css";

function normalizarRuta(pathname: string): string {
  if (!pathname || pathname === "") return "/";
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname;
}

/** Primera ruta que el rol sí puede abrir (evita bucle / pantalla «Actualiza»). */
function destinoAccesible(
  rol: RolPortal | null | undefined,
  area: string | null | undefined,
  pathnameActual: string,
): string | null {
  const actual = normalizarRuta(pathnameActual);
  const candidatos = [
    rutaInicioParaRol(rol, area),
    ...enlacesParaRol(rol).map((e) => e.ruta),
  ];
  const vistos = new Set<string>();
  for (const raw of candidatos) {
    const ruta = normalizarRuta(raw);
    if (vistos.has(ruta)) continue;
    vistos.add(ruta);
    if (ruta === actual) continue;
    const permiso = permisoParaRuta(ruta);
    if (!permiso || puedeRol(rol, permiso)) return ruta;
  }
  return null;
}

function Layout() {
  const ubicacion = useLocation();
  const navegar = useNavigate();
  const { perfil, rol, puede, salir } = useAuth();
  const rutasPermitidas = useRef(new Set<string>());

  const pathname = normalizarRuta(ubicacion.pathname);
  const permisoRuta = permisoParaRuta(pathname);
  const tienePermiso = !permisoRuta || puede(permisoRuta);
  if (tienePermiso) rutasPermitidas.current.add(pathname);

  // Evita pantalla en blanco por redirección infinita (p. ej. rol nuevo sin permisos en APK vieja).
  if (permisoRuta && !puede(permisoRuta) && !rutasPermitidas.current.has(pathname)) {
    const destino = destinoAccesible(rol, areaUsuario(perfil), pathname);
    if (destino) {
      return (
        <Navigate
          to={destino}
          replace
          state={{ sinPermiso: pathname }}
        />
      );
    }
    return (
      <div className="layout__sin-permiso">
        <h1>Sin acceso a esta pantalla</h1>
        <p>
          Tu rol (<strong>{rol ?? "—"}</strong>) no tiene permiso para esta sección.
        </p>
        <button
          type="button"
          className="btn"
          onClick={() => {
            void salir().then(() => navegar("/login", { replace: true }));
          }}
        >
          Cerrar sesión
        </button>
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
      <DeferredMount delay={1200}>
        <AvisosSolicitudesGlobales />
        <AvisosAsignacionCorrectivoGlobales />
        <AvisosPmAsignadosGlobales />
      </DeferredMount>
    </div>
  );
}

export default Layout;
