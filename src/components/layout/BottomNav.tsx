import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../modules/auth/AuthContext";
import { etiquetaRol } from "../../modules/auth/roles";
import { areaUsuario } from "../../lib/usuarioArea";
import { usePendientesAprobacionPm } from "../../modules/preventivo/usePendientesAprobacionPm";
import { usePermisosPendientesBadge } from "../../modules/permisos/usePermisosPendientesBadge";
import { useSolicitudesAbiertasBadge } from "../../modules/solicitudes/useSolicitudesAbiertasBadge";
import IconoNavSvg from "./IconoNav";
import {
  algunMasActivo,
  itemsNavParaRol,
  rutaActiva,
  type ItemNav,
} from "./navConfig";

type TonoBadge = "verde" | "naranja" | "azul";

function BadgeNav({
  cantidad,
  etiqueta,
  tono = "verde",
}: {
  cantidad: number;
  etiqueta: string;
  tono?: TonoBadge;
}) {
  if (cantidad <= 0) return null;
  const clase =
    tono === "naranja"
      ? " nav-badge--naranja"
      : tono === "azul"
        ? " nav-badge--azul"
        : "";
  return (
    <span className={"nav-badge" + clase} aria-label={etiqueta}>
      {cantidad > 9 ? "9+" : cantidad}
    </span>
  );
}

function BottomNav() {
  const { perfil, rol, salir } = useAuth();
  const ubicacion = useLocation();
  const navegar = useNavigate();
  const [masAbierto, setMasAbierto] = useState(false);
  const pendientesFirma = usePendientesAprobacionPm();
  const solicitudesAbiertas = useSolicitudesAbiertasBadge();
  const permisosPendientes = usePermisosPendientesBadge();

  const { tabs, mas } = useMemo(() => itemsNavParaRol(rol), [rol]);
  const masActivo = algunMasActivo(ubicacion.pathname, mas);
  const aprobarEnMas = mas.some((i) => i.ruta === "/preventivo/aprobaciones");
  const solicitudesEnMas = mas.some((i) => i.ruta === "/solicitudes");
  const permisosEnMas = mas.some((i) => i.ruta === "/personal/permisos");
  const badgeMasCantidad =
    (aprobarEnMas ? pendientesFirma : 0) +
    (solicitudesEnMas ? solicitudesAbiertas : 0) +
    (permisosEnMas ? permisosPendientes : 0);
  const badgeMasTono: TonoBadge =
    aprobarEnMas && pendientesFirma > 0
      ? "verde"
      : permisosEnMas && permisosPendientes > 0
        ? "azul"
        : "naranja";

  useEffect(() => {
    setMasAbierto(false);
  }, [ubicacion.pathname]);

  useEffect(() => {
    document.body.classList.toggle("layout-mas-abierto", masAbierto);
    return () => document.body.classList.remove("layout-mas-abierto");
  }, [masAbierto]);

  async function manejarCerrarSesion() {
    setMasAbierto(false);
    await salir();
    navegar("/login", { replace: true });
  }

  function irA(item: ItemNav) {
    setMasAbierto(false);
    navegar(item.ruta);
  }

  function badgePara(item: ItemNav) {
    if (item.ruta === "/preventivo/aprobaciones") {
      return (
        <BadgeNav
          cantidad={pendientesFirma}
          etiqueta={`${pendientesFirma} pendiente(s) de firmar`}
          tono="verde"
        />
      );
    }
    if (item.ruta === "/solicitudes") {
      return (
        <BadgeNav
          cantidad={solicitudesAbiertas}
          etiqueta={`${solicitudesAbiertas} solicitud(es) abierta(s)`}
          tono="naranja"
        />
      );
    }
    if (item.ruta === "/personal/permisos") {
      return (
        <BadgeNav
          cantidad={permisosPendientes}
          etiqueta={`${permisosPendientes} permiso(s) por aprobar`}
          tono="azul"
        />
      );
    }
    return null;
  }

  return (
    <>
      <nav className="bottom-nav" aria-label="Navegación principal">
        {tabs.map((item) => {
          const activo = rutaActiva(ubicacion.pathname, item.ruta);
          return (
            <NavLink
              key={item.ruta}
              to={item.ruta}
              end={item.ruta === "/"}
              className={"bottom-nav__item" + (activo ? " bottom-nav__item--activo" : "")}
            >
              <span className="bottom-nav__icono-wrap">
                <IconoNavSvg nombre={item.icono} />
                {badgePara(item)}
              </span>
              <span>{item.etiquetaCorta}</span>
            </NavLink>
          );
        })}
        <button
          type="button"
          className={
            "bottom-nav__item bottom-nav__item--boton" +
            (masAbierto || masActivo ? " bottom-nav__item--activo" : "")
          }
          aria-expanded={masAbierto}
          aria-controls="menu-mas-modulos"
          onClick={() => setMasAbierto((v) => !v)}
        >
          <span className="bottom-nav__icono-wrap">
            <IconoNavSvg nombre="mas" />
            {badgeMasCantidad > 0 ? (
              <BadgeNav
                cantidad={badgeMasCantidad}
                etiqueta="Hay pendientes en el menú"
                tono={badgeMasTono}
              />
            ) : null}
          </span>
          <span>Más</span>
        </button>
      </nav>

      {masAbierto && (
        <div className="mas-sheet" role="presentation">
          <button
            type="button"
            className="mas-sheet__fondo"
            aria-label="Cerrar menú"
            onClick={() => setMasAbierto(false)}
          />
          <div
            id="menu-mas-modulos"
            className="mas-sheet__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mas-sheet-titulo"
          >
            <div className="mas-sheet__asa" aria-hidden="true" />
            <h2 id="mas-sheet-titulo">Menú</h2>

            {mas.length > 0 ? (
              <div className="mas-sheet__grid">
                {mas.map((item) => {
                  const activo = rutaActiva(ubicacion.pathname, item.ruta);
                  const esAprobar = item.ruta === "/preventivo/aprobaciones";
                  const esSolicitudes = item.ruta === "/solicitudes";
                  const esPermisos = item.ruta === "/personal/permisos";
                  const aviso =
                    (esAprobar && pendientesFirma > 0) ||
                    (esSolicitudes && solicitudesAbiertas > 0) ||
                    (esPermisos && permisosPendientes > 0);
                  return (
                    <button
                      key={item.ruta}
                      type="button"
                      className={
                        "mas-sheet__tile" +
                        (activo ? " mas-sheet__tile--activo" : "") +
                        (aviso ? " mas-sheet__tile--aviso" : "")
                      }
                      onClick={() => irA(item)}
                    >
                      <span className="mas-sheet__tile-icono">
                        <IconoNavSvg nombre={item.icono} />
                        {badgePara(item)}
                      </span>
                      <span className="mas-sheet__tile-texto">{item.texto}</span>
                      {esAprobar && pendientesFirma > 0 ? (
                        <span className="mas-sheet__tile-hint">Por firmar</span>
                      ) : null}
                      {esSolicitudes && solicitudesAbiertas > 0 ? (
                        <span className="mas-sheet__tile-hint mas-sheet__tile-hint--naranja">
                          Abiertas
                        </span>
                      ) : null}
                      {esPermisos && permisosPendientes > 0 ? (
                        <span className="mas-sheet__tile-hint mas-sheet__tile-hint--azul">
                          Por aprobar
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="mas-sheet__vacio">No hay más módulos para tu rol.</p>
            )}

            {perfil && (
              <div className="mas-sheet__usuario">
                <div>
                  <strong>{perfil.nombre || perfil.usuario || perfil.email}</strong>
                  <small>
                    {etiquetaRol(perfil.rol)}
                    {areaUsuario(perfil) ? ` · ${areaUsuario(perfil)}` : ""}
                  </small>
                </div>
                <button
                  type="button"
                  className="btn"
                  onClick={() => void manejarCerrarSesion()}
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default BottomNav;
