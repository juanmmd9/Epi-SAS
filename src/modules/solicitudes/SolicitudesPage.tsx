import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AREAS_SISTEMA, coincideArea } from "../../lib/areas";
import { areaUsuario } from "../../lib/usuarioArea";
import { useAuth } from "../auth/AuthContext";
import { NOMBRES_MESES } from "../../lib/fechas";
import { listarCorrectivo, ordenarRegistrosCorrectivo } from "../correctivo/correctivoService";
import type { RegistroCorrectivo } from "../correctivo/types";
import { existeTablaRepuestos, listarRepuestos } from "./repuestosService";
import { resumenesTodasAreas } from "./solicitudesCalculo";
import PanelAlertasSolicitudes from "./PanelAlertasSolicitudes";
import { useSolicitudesRealtime } from "./useSolicitudesRealtime";
import type { RepuestoSolicitud } from "./types";
import "./solicitudes.css";

function rutaArea(area: string): string {
  return `/solicitudes/area/${encodeURIComponent(area)}`;
}

function SolicitudesPage() {
  const { perfil } = useAuth();
  const mesActual = NOMBRES_MESES[new Date().getMonth()];
  const areaAsignada = areaUsuario(perfil);
  const esSolicitante = perfil?.rol === "solicitante";
  const [correctivos, setCorrectivos] = useState<RegistroCorrectivo[]>([]);
  const [repuestos, setRepuestos] = useState<RepuestoSolicitud[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      setError(null);
      try {
        const regs = await listarCorrectivo();
        setCorrectivos(regs);
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

  const {
    alertas,
    descartarAlerta,
    enLinea,
    sondeoActivo,
    sonidoActivo,
    setSonidoActivo,
    areasConNueva,
    limpiarAreaNueva,
  } = useSolicitudesRealtime({
    correctivos,
    onNuevaSolicitud: alNuevaSolicitud,
    habilitado: !cargando,
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

  if (esSolicitante && !areaAsignada) {
    return (
      <section className="solicitudes">
        <h1>Solicitudes</h1>
        <p className="solicitudes__error">
          Tu usuario no tiene área asignada. Pide al administrador que configure tu perfil en
          Usuarios portal.
        </p>
      </section>
    );
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
            {esSolicitante ? (
              <>
                Vista de todas las áreas. Tu área asignada es{" "}
                <strong>{areaAsignada}</strong>: solo ahí puedes crear y gestionar solicitudes.
              </>
            ) : (
              <>
                Vista por área de solicitudes correctivas abiertas, en espera de repuesto y
                pedidos de repuestos. Cerradas en {mesActual}:{" "}
                <strong>{totales.cerradasMes}</strong>.
              </>
            )}{" "}
            Deja esta pantalla abierta para recibir avisos al instante.
          </p>
        </div>
        <PanelAlertasSolicitudes
          enLinea={enLinea}
          sondeoActivo={sondeoActivo}
          sonidoActivo={sonidoActivo}
          onToggleSonido={() => setSonidoActivo((v) => !v)}
          alertas={alertas}
          onDescartar={descartarAlerta}
        />
      </div>

      {error && <p className="solicitudes__error">{error}</p>}

      <div className="solicitudes__grid">
        {resumenes.map((resumen) => {
          const esMiArea =
            Boolean(areaAsignada) && coincideArea(resumen.area, areaAsignada ?? "");
          const soloConsulta = esSolicitante && !esMiArea;
          return (
            <Link
              key={resumen.area}
              to={rutaArea(resumen.area)}
              className={
                "sol-card" +
                (areasConNueva.has(resumen.area) ? " sol-card--nueva" : "") +
                (esMiArea ? " sol-card--propia" : "") +
                (soloConsulta ? " sol-card--consulta" : "")
              }
              onClick={() => limpiarAreaNueva(resumen.area)}
            >
              <h3>
                {resumen.area}
                {esMiArea && <span className="sol-card__badge">Tu área</span>}
              </h3>
              <div className="sol-card__stats">
                <div className="sol-card__stat sol-card__stat--alerta">
                  <span>Abiertas</span>
                  <strong>{resumen.abiertas}</strong>
                </div>
                <div className="sol-card__stat sol-card__stat--espera">
                  <span>Espera repuesto</span>
                  <strong>{resumen.esperaRepuesto}</strong>
                </div>
                <div className="sol-card__stat sol-card__stat--ok">
                  <span>Cerradas mes</span>
                  <strong>{resumen.cerradasMes}</strong>
                </div>
                <div className="sol-card__stat">
                  <span>Rep. pendientes</span>
                  <strong>{resumen.repuestosPendientes}</strong>
                </div>
              </div>
              <span className="sol-card__enlace">
                {soloConsulta ? "Ver (solo consulta) →" : "Ver detalle →"}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default SolicitudesPage;
