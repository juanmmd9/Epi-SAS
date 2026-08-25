import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AREAS_SISTEMA, normalizarArea } from "../../lib/areas";
import { esRolReportaSolicitudes } from "../../lib/usuarioArea";
import { useAuth } from "../auth/AuthContext";
import { NOMBRES_MESES } from "../../lib/fechas";
import { listarCorrectivo, ordenarRegistrosCorrectivo } from "../correctivo/correctivoService";
import type { RegistroCorrectivo } from "../correctivo/types";
import { listarHojas } from "../hojas/hojasService";
import type { HojaVida } from "../hojas/types";
import { existeTablaRepuestos, listarRepuestos } from "./repuestosService";
import {
  diasAbierta,
  quienCerroSolicitud,
  repuestoPendiente,
  resumenesTodasAreas,
  solicitudAbierta,
  solicitudCerradaEnMes,
  solicitudEsperaRepuesto,
} from "./solicitudesCalculo";
import PanelAlertasSolicitudes from "./PanelAlertasSolicitudes";
import { useSolicitudesRealtime } from "./useSolicitudesRealtime";
import { ETIQUETAS_ESTADO_REPUESTO, type RepuestoSolicitud } from "./types";
import "./solicitudes.css";

type MetricaTablero = "abiertas" | "esperaRepuesto" | "cerradasMes" | "repuestosPendientes";

interface VistaMetrica {
  area: string;
  metrica: MetricaTablero;
}

const TITULOS_METRICA: Record<MetricaTablero, string> = {
  abiertas: "Solicitudes abiertas",
  esperaRepuesto: "En espera de repuesto",
  cerradasMes: "Cerradas este mes",
  repuestosPendientes: "Repuestos pendientes",
};

function rutaArea(area: string): string {
  return `/solicitudes/area/${encodeURIComponent(area)}`;
}

function SolicitudesPage() {
  const { perfil, puede } = useAuth();
  const mesActual = NOMBRES_MESES[new Date().getMonth()];
  const esReporta = esRolReportaSolicitudes(perfil);
  const puedeVerCorrectivo = puede("ver.correctivo");
  const [correctivos, setCorrectivos] = useState<RegistroCorrectivo[]>([]);
  const [repuestos, setRepuestos] = useState<RepuestoSolicitud[]>([]);
  const [maquinas, setMaquinas] = useState<HojaVida[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vistaMetrica, setVistaMetrica] = useState<VistaMetrica | null>(null);

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      setError(null);
      try {
        const [regs, hojas] = await Promise.all([listarCorrectivo(), listarHojas()]);
        setCorrectivos(regs);
        setMaquinas(hojas);
        const hayTabla = await existeTablaRepuestos();
        if (hayTabla) {
          setRepuestos(await listarRepuestos());
        } else {
          setRepuestos([]);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar datos");
      } finally {
        setCargando(false);
      }
    }
    void cargar();
  }, []);

  const mapaMaquinas = useMemo(() => {
    const mapa = new Map<string, HojaVida>();
    for (const hoja of maquinas) mapa.set(hoja.id, hoja);
    return mapa;
  }, [maquinas]);

  useEffect(() => {
    if (!vistaMetrica) return;
    function alTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") setVistaMetrica(null);
    }
    window.addEventListener("keydown", alTecla);
    return () => window.removeEventListener("keydown", alTecla);
  }, [vistaMetrica]);

  const resumenes = useMemo(
    () => resumenesTodasAreas(AREAS_SISTEMA, correctivos, repuestos),
    [correctivos, repuestos],
  );

  const alNuevaSolicitud = useCallback((registro: RegistroCorrectivo) => {
    setCorrectivos((prev) => {
      if (prev.some((r) => r.id === registro.id)) return prev;
      return ordenarRegistrosCorrectivo([registro, ...prev]);
    });
  }, []);

  // Mantenimiento: avisos globales en Layout. Solicitante: avisos en esta página.
  const {
    alertas,
    descartarAlerta,
    enLinea,
    sondeoActivo,
    areasConNueva,
    limpiarAreaNueva,
  } = useSolicitudesRealtime({
    correctivos,
    onNuevaSolicitud: alNuevaSolicitud,
    habilitado: !cargando,
    modo: esReporta ? "completo" : "solo-lista",
  });

  const totales = useMemo(
    () =>
      resumenes.reduce(
        (acc, r) => ({
          abiertas: acc.abiertas + r.abiertas,
          esperaRepuesto: acc.esperaRepuesto + r.esperaRepuesto,
          cerradasMes: acc.cerradasMes + r.cerradasMes,
          repuestosPendientes: acc.repuestosPendientes + r.repuestosPendientes,
        }),
        { abiertas: 0, esperaRepuesto: 0, cerradasMes: 0, repuestosPendientes: 0 },
      ),
    [resumenes],
  );

  const anioRef = new Date().getFullYear();
  const mesRef = new Date().getMonth() + 1;

  const correctivosFiltrados = useMemo(() => {
    if (!vistaMetrica || vistaMetrica.metrica === "repuestosPendientes") return [];
    const areaNorm = normalizarArea(vistaMetrica.area);
    const delArea = correctivos.filter((r) => normalizarArea(r.area) === areaNorm);
    switch (vistaMetrica.metrica) {
      case "abiertas":
        return delArea.filter(solicitudAbierta);
      case "esperaRepuesto":
        return delArea.filter(solicitudEsperaRepuesto);
      case "cerradasMes":
        return delArea.filter((r) => solicitudCerradaEnMes(r, anioRef, mesRef));
      default:
        return [];
    }
  }, [vistaMetrica, correctivos, anioRef, mesRef]);

  const repuestosFiltrados = useMemo(() => {
    if (!vistaMetrica || vistaMetrica.metrica !== "repuestosPendientes") return [];
    const areaNorm = normalizarArea(vistaMetrica.area);
    return repuestos.filter(
      (r) => normalizarArea(r.area) === areaNorm && repuestoPendiente(r),
    );
  }, [vistaMetrica, repuestos]);

  function abrirMetrica(area: string, metrica: MetricaTablero) {
    setVistaMetrica({ area, metrica });
  }

  if (cargando) {
    return (
      <section className="solicitudes">
        <h1>Solicitudes</h1>
        <p className="solicitudes__descripcion">Cargando tablero...</p>
      </section>
    );
  }

  return (
    <section className="solicitudes">
      <div className="solicitudes__cabecera">
        <div>
          <h1>Solicitudes</h1>
          <p className="solicitudes__descripcion">
            {esReporta ? (
              <>
                Vista de todas las áreas. Entra a cualquiera para crear o consultar solicitudes.
                Haz clic en Abiertas, Espera, Cerradas o Rep. pendientes para ver el listado.
              </>
            ) : (
              <>
                Vista por área de solicitudes correctivas abiertas, en espera de repuesto y
                pedidos de repuestos. Cerradas en {mesActual}:{" "}
                <strong>{totales.cerradasMes}</strong>. Haz clic en cada cifra para ver el
                detalle.
              </>
            )}{" "}
            {esReporta
              ? "Deja esta pantalla abierta para recibir avisos al instante."
              : "Los avisos de nuevas solicitudes llegan en toda la app (toast + notificación)."}
          </p>
        </div>
        {esReporta ? (
          <PanelAlertasSolicitudes
            enLinea={enLinea}
            sondeoActivo={sondeoActivo}
            alertas={alertas}
            onDescartar={descartarAlerta}
          />
        ) : null}
      </div>

      {error && <p className="solicitudes__error">{error}</p>}

      <div className="solicitudes__grid">
        {resumenes.map((resumen) => (
          <article
            key={resumen.area}
            className={
              "sol-card" + (areasConNueva.has(resumen.area) ? " sol-card--nueva" : "")
            }
          >
            <div className="sol-card__cabecera">
              <h3>{resumen.area}</h3>
              <Link
                to={rutaArea(resumen.area)}
                className="sol-card__enlace"
                onClick={() => limpiarAreaNueva(resumen.area)}
              >
                Ver área →
              </Link>
            </div>
            <div className="sol-card__stats">
              <button
                type="button"
                className="sol-card__stat sol-card__stat--alerta sol-card__stat--boton"
                onClick={() => abrirMetrica(resumen.area, "abiertas")}
              >
                <span>Abiertas</span>
                <strong>{resumen.abiertas}</strong>
              </button>
              <button
                type="button"
                className="sol-card__stat sol-card__stat--espera sol-card__stat--boton"
                onClick={() => abrirMetrica(resumen.area, "esperaRepuesto")}
              >
                <span>Espera repuesto</span>
                <strong>{resumen.esperaRepuesto}</strong>
              </button>
              <button
                type="button"
                className="sol-card__stat sol-card__stat--ok sol-card__stat--boton"
                onClick={() => abrirMetrica(resumen.area, "cerradasMes")}
              >
                <span>Cerradas mes</span>
                <strong>{resumen.cerradasMes}</strong>
              </button>
              <button
                type="button"
                className="sol-card__stat sol-card__stat--boton"
                onClick={() => abrirMetrica(resumen.area, "repuestosPendientes")}
              >
                <span>Rep. pendientes</span>
                <strong>{resumen.repuestosPendientes}</strong>
              </button>
            </div>
          </article>
        ))}
      </div>

      {vistaMetrica && (
        <div
          className="sol-metrica-modal__overlay"
          onClick={() => setVistaMetrica(null)}
          role="presentation"
        >
          <div
            className="sol-metrica-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sol-metrica-titulo"
          >
            <div className="sol-metrica-modal__cabecera">
              <div>
                <h2 id="sol-metrica-titulo">
                  {TITULOS_METRICA[vistaMetrica.metrica]} — {vistaMetrica.area}
                </h2>
                <p className="solicitudes__descripcion">
                  {vistaMetrica.metrica === "cerradasMes"
                    ? `Cierres de ${mesActual} ${anioRef}.`
                    : "Listado según el contador del tablero."}
                </p>
              </div>
              <button
                type="button"
                className="sol-metrica-modal__cerrar"
                onClick={() => setVistaMetrica(null)}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            {vistaMetrica.metrica === "repuestosPendientes" ? (
              repuestosFiltrados.length === 0 ? (
                <p className="solicitudes__vacio">No hay repuestos pendientes en esta área.</p>
              ) : (
                <div className="solicitudes-lista">
                  {repuestosFiltrados.map((repuesto) => {
                    const maquina = repuesto.hoja_id
                      ? mapaMaquinas.get(repuesto.hoja_id)
                      : undefined;
                    const codigoMaquina = maquina?.codigo?.trim() || "";
                    const nombreMaquina = maquina?.nombre?.trim() || "";
                    return (
                      <article key={repuesto.id} className="solicitud-item">
                        <div>
                          <strong>
                            {repuesto.codigo ? `${repuesto.codigo} — ` : ""}
                            {repuesto.descripcion}
                          </strong>
                          <p className="solicitud-item__meta">
                            Máquina:{" "}
                            {maquina
                              ? `${codigoMaquina ? `${codigoMaquina} — ` : ""}${nombreMaquina || "Sin nombre"}`
                              : "Sin máquina vinculada"}
                            {" · "}
                            Cant. {repuesto.cantidad} ·{" "}
                            {ETIQUETAS_ESTADO_REPUESTO[repuesto.estado]}
                            {repuesto.fecha_necesaria
                              ? ` · Necesario: ${repuesto.fecha_necesaria}`
                              : ""}
                          </p>
                          {repuesto.notas && (
                            <p className="solicitud-item__desc">{repuesto.notas}</p>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )
            ) : correctivosFiltrados.length === 0 ? (
              <p className="solicitudes__vacio">No hay solicitudes en esta categoría.</p>
            ) : (
              <div className="solicitudes-lista">
                {correctivosFiltrados.map((registro) => {
                  const dias = diasAbierta(registro);
                  const enEspera = solicitudEsperaRepuesto(registro);
                  const cerrada = Boolean(registro.datos.fechaCierre?.trim());
                  const quienCerro = cerrada ? quienCerroSolicitud(registro) : null;
                  return (
                    <article
                      key={registro.id}
                      className={
                        "solicitud-item" + (enEspera ? " solicitud-item--espera" : "")
                      }
                    >
                      <div>
                        <strong>
                          Solicitud #{registro.datos.numeroSolicitud}
                          {enEspera && " · En espera de repuesto"}
                          {cerrada &&
                            ` · Cerrada ${registro.datos.fechaCierre.slice(0, 10)}`}
                        </strong>
                        <p className="solicitud-item__meta">
                          {registro.fecha.slice(0, 10)}
                          {registro.datos.codigoMaquina && ` · ${registro.datos.codigoMaquina}`}
                          {registro.datos.maquinaEquipoLocacion &&
                            ` · ${registro.datos.maquinaEquipoLocacion}`}
                          {dias !== null && ` · ${dias} día(s) abierta`}
                          {registro.datos.nombreSolicitante &&
                            ` · ${registro.datos.nombreSolicitante}`}
                        </p>
                        {quienCerro && (
                          <p className="solicitud-item__cierre">
                            Cerrada por: <strong>{quienCerro}</strong>
                          </p>
                        )}
                        <p className="solicitud-item__desc">
                          {registro.datos.descripcionSolicitud || "Sin descripción"}
                        </p>
                      </div>
                      {puedeVerCorrectivo && (
                        <Link
                          className="btn btn--primario"
                          to="/correctivo"
                          state={{
                            editarCorrectivoId: registro.id,
                            filtroArea: vistaMetrica.area,
                          }}
                        >
                          Abrir en correctivo
                        </Link>
                      )}
                    </article>
                  );
                })}
              </div>
            )}

            <div className="sol-metrica-modal__pie">
              <Link
                className="btn"
                to={rutaArea(vistaMetrica.area)}
                onClick={() => setVistaMetrica(null)}
              >
                Ir al área completa
              </Link>
              <button
                type="button"
                className="btn btn--primario"
                onClick={() => setVistaMetrica(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default SolicitudesPage;
