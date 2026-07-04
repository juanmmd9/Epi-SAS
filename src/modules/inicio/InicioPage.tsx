import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AREAS_CON_PM, coincideArea } from "../../lib/areas";
import { aFechaIso, NOMBRES_MESES, valorFecha } from "../../lib/fechas";
import { mapaCitasDelAnio } from "../cronograma/cronogramaCalculo";
import { evaluarEstadoCitaPm, type EstadoCitaPm } from "../cronograma/cronogramaEstadoCita";
import { listarExcepciones } from "../cronograma/cronogramaService";
import type { CitaCronograma, ExcepcionCronograma } from "../cronograma/types";
import { hojaEstaActiva } from "../hojas/hojasFiltro";
import { listarHojas } from "../hojas/hojasService";
import type { HojaVida } from "../hojas/types";
import { listarPreventivo } from "../preventivo/preventivoService";
import { indicesPmCompletado } from "../preventivo/pmCompletado";
import type { RegistroPreventivo } from "../preventivo/types";
import "./inicio.css";

interface CitaMes extends CitaCronograma {
  dia: number;
  estado: EstadoCitaPm;
  reprogramadoA: { anio: number; mes: number; dia: number } | null;
}

interface BloqueMes {
  mes: number;
  citas: CitaMes[];
  completadas: number;
}

interface DatosArea {
  area: string;
  totalMaquinas: number;
  maquinasActivas: number;
  totalCitas: number;
  citasCompletadas: number;
  porMes: BloqueMes[];
  proximaCita: { nombre: string; codigo: string; dia: number; mes: number } | null;
}

function construirDatosArea(
  area: string,
  anio: number,
  maquinas: HojaVida[],
  excepciones: ExcepcionCronograma[],
  preventivo: RegistroPreventivo[],
): DatosArea {
  const maquinasArea = maquinas.filter((m) => coincideArea(m.area, area));
  const maquinasPorId = new Map(maquinasArea.map((m) => [m.id, m]));
  const mapa = mapaCitasDelAnio(maquinas, excepciones, area, anio);
  const indicesCompletado = indicesPmCompletado(preventivo, anio);

  const hoy = new Date();
  const valorHoy = valorFecha(hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate());

  const porMes: BloqueMes[] = [];
  let totalCitas = 0;
  let citasCompletadas = 0;
  let proximaCita: DatosArea["proximaCita"] = null;

  for (let mes = 1; mes <= 12; mes++) {
    const citasMes: CitaMes[] = [];
    for (const [clave, citas] of mapa) {
      const [mesClave, diaClave] = clave.split("|").map(Number);
      if (mesClave !== mes) continue;
      for (const cita of citas) {
        const maquina = maquinasPorId.get(cita.maquinaId);

        const resultado = evaluarEstadoCitaPm(
          cita.maquinaId,
          area,
          anio,
          mes,
          diaClave,
          cita.origen,
          excepciones,
          indicesCompletado,
          valorHoy,
          maquina,
        );
        citasMes.push({
          ...cita,
          dia: diaClave,
          estado: resultado.estado,
          reprogramadoA: resultado.reprogramadoA,
        });
        totalCitas += 1;
        if (resultado.estado === "completada") citasCompletadas += 1;
        if (
          (resultado.estado === "programada" || resultado.estado === "reprogramada") &&
          valorFecha(anio, mes, diaClave) >= valorHoy &&
          (!proximaCita || valorFecha(anio, mes, diaClave) < valorFecha(anio, proximaCita.mes, proximaCita.dia))
        ) {
          proximaCita = { nombre: cita.nombre, codigo: cita.codigo, dia: diaClave, mes };
        }
      }
    }
    if (citasMes.length > 0) {
      citasMes.sort((a, b) => a.dia - b.dia);
      porMes.push({
        mes,
        citas: citasMes,
        completadas: citasMes.filter((c) => c.estado === "completada").length,
      });
    }
  }

  return {
    area,
    totalMaquinas: maquinasArea.length,
    maquinasActivas: maquinasArea.filter((m) => hojaEstaActiva(m)).length,
    totalCitas,
    citasCompletadas,
    porMes,
    proximaCita,
  };
}

function InicioPage() {
  const anioActual = new Date().getFullYear();
  const mesActual = new Date().getMonth() + 1;
  const ubicacion = useLocation();
  const navegar = useNavigate();
  const [anio, setAnio] = useState(anioActual);
  const [maquinas, setMaquinas] = useState<HojaVida[]>([]);
  const [excepciones, setExcepciones] = useState<ExcepcionCronograma[]>([]);
  const [preventivo, setPreventivo] = useState<RegistroPreventivo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    recargarDatos();
  }, [ubicacion.key]);

  useEffect(() => {
    function alVolverAlPanel() {
      if (document.visibilityState === "visible") {
        recargarDatos();
      }
    }
    window.addEventListener("focus", alVolverAlPanel);
    document.addEventListener("visibilitychange", alVolverAlPanel);
    return () => {
      window.removeEventListener("focus", alVolverAlPanel);
      document.removeEventListener("visibilitychange", alVolverAlPanel);
    };
  }, []);

  function recargarDatos() {
    setCargando(true);
    Promise.all([listarHojas(), listarExcepciones(), listarPreventivo()])
      .then(([hojas, excs, prev]) => {
        setMaquinas(hojas);
        setExcepciones(excs);
        setPreventivo(prev);
      })
      .catch((e: Error) => setError("No se pudieron cargar los datos: " + e.message))
      .finally(() => setCargando(false));
  }

  const datosPorArea = useMemo(
    () =>
      AREAS_CON_PM.map((area) =>
        construirDatosArea(area, anio, maquinas, excepciones, preventivo),
      ),
    [anio, maquinas, excepciones, preventivo],
  );

  return (
    <section className="inicio">
      <div className="inicio__cabecera">
        <div>
          <h1>Panel de mantenimiento preventivo</h1>
          <p className="inicio__descripcion">
            Programación anual por área. Para reprogramar un PM, usa el{" "}
            <Link to="/preventivo/cronograma">calendario</Link>.
          </p>
          <div className="inicio__leyenda">
            <span className="inicio__leyenda-item inicio__leyenda-item--completada">Hecho</span>
            <span className="inicio__leyenda-item inicio__leyenda-item--programada">Programado</span>
            <span className="inicio__leyenda-item inicio__leyenda-item--no-realizado">No realizado</span>
            <span className="inicio__leyenda-item inicio__leyenda-item--reprogramada">Reprogramado</span>
            <span className="inicio__leyenda-item inicio__leyenda-item--vencida">Vencido (activa)</span>
            <span className="inicio__leyenda-item inicio__leyenda-item--de-baja">De baja</span>
          </div>
        </div>
        <div className="inicio__anio">
          <button className="btn" onClick={() => setAnio(anio - 1)}>←</button>
          <span>{anio}</span>
          <button className="btn" onClick={() => setAnio(anio + 1)}>→</button>
        </div>
      </div>

      {error && <p className="inicio__error">{error}</p>}

      {cargando && <p>Cargando panel...</p>}

      <div className="inicio__areas">
        {!cargando &&
          datosPorArea.map((datos) => (
            <article key={datos.area} className="area-card">
              <div className="area-card__cabecera">
                <h3>{datos.area}</h3>
                <div className="area-card__stats">
                  <span className="chip">{datos.totalMaquinas} máquina(s)</span>
                  <span className="chip">{datos.maquinasActivas} activa(s)</span>
                  <span className="chip chip--pm">{datos.totalCitas} PM en {anio}</span>
                  {datos.citasCompletadas > 0 && (
                    <span className="chip chip--ok">{datos.citasCompletadas} registrado(s)</span>
                  )}
                </div>
              </div>

              {datos.totalMaquinas === 0 ? (
                <p className="area-card__vacio">
                  Registra equipos en <Link to="/hojas-de-vida">Hojas de vida</Link> con
                  área {datos.area}, primer PM y frecuencia en meses.
                </p>
              ) : (
                <>
                  <p className="area-card__proximo">
                    {datos.proximaCita ? (
                      <>
                        <strong>Próximo PM:</strong> {datos.proximaCita.nombre} (
                        {datos.proximaCita.codigo}) — {datos.proximaCita.dia}{" "}
                        {NOMBRES_MESES[datos.proximaCita.mes - 1]} {anio}
                      </>
                    ) : (
                      <>
                        <strong>{anio}:</strong> no hay PM pendientes a futuro en esta área.
                      </>
                    )}
                  </p>

                  {datos.porMes.length === 0 ? (
                    <p className="area-card__vacio">
                      Hay máquinas pero ningún PM calculado para {anio}. Revisa primer
                      PM, frecuencia y que la máquina esté activa.
                    </p>
                  ) : (
                    <div className="area-card__meses">
                      {datos.porMes.map((bloque) => (
                        <div
                          key={bloque.mes}
                          className={
                            "mes-bloque" +
                            (anio === anioActual && bloque.mes === mesActual
                              ? " mes-bloque--actual"
                              : "") +
                            (bloque.completadas === bloque.citas.length && bloque.citas.length > 0
                              ? " mes-bloque--todo-cumplido"
                              : "")
                          }
                        >
                          <div className="mes-bloque__titulo">
                            <span>{NOMBRES_MESES[bloque.mes - 1]}</span>
                            <span>{bloque.completadas}/{bloque.citas.length} hecho(s)</span>
                          </div>
                          <ul>
                            {bloque.citas.map((cita) => (
                              <li
                                key={`${cita.maquinaId}-${cita.dia}`}
                                className={`cita cita--${cita.estado.replaceAll("_", "-")}${cita.estado === "de_baja" ? " cita--solo-lectura" : ""}`}
                                role={cita.estado === "de_baja" ? undefined : "button"}
                                tabIndex={cita.estado === "de_baja" ? undefined : 0}
                                title={`${cita.nombre} — ${cita.estado === "de_baja" ? "De baja — fuera de circulación" : cita.estado}`}
                                onClick={
                                  cita.estado === "de_baja"
                                    ? undefined
                                    : () =>
                                        navegar("/preventivo", {
                                          state: {
                                            registrarPm: {
                                              maquinaId: cita.maquinaId,
                                              area: datos.area,
                                              fecha: aFechaIso(
                                                anio,
                                                cita.reprogramadoA?.mes ?? bloque.mes,
                                                cita.reprogramadoA?.dia ?? cita.dia,
                                              ),
                                            },
                                          },
                                        })
                                }
                                onKeyDown={
                                  cita.estado === "de_baja"
                                    ? undefined
                                    : (e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                          e.preventDefault();
                                          navegar("/preventivo", {
                                            state: {
                                              registrarPm: {
                                                maquinaId: cita.maquinaId,
                                                area: datos.area,
                                                fecha: aFechaIso(
                                                  anio,
                                                  cita.reprogramadoA?.mes ?? bloque.mes,
                                                  cita.reprogramadoA?.dia ?? cita.dia,
                                                ),
                                              },
                                            },
                                          });
                                        }
                                      }
                                }
                              >
                                {cita.estado === "completada" && (
                                  <span className="cita__check">✓</span>
                                )}
                                {cita.estado === "no_realizado" && (
                                  <span className="cita__icono">!</span>
                                )}
                                <span className="cita__dia">{cita.dia}</span>
                                <span className="cita__nombre">{cita.nombre}</span>
                                <span className="cita__codigo">
                                  {cita.codigo} · cada {cita.frecuencia}m
                                  {cita.reprogramadoA && cita.estado === "no_realizado" && (
                                    <> · → {cita.reprogramadoA.dia}/{cita.reprogramadoA.mes}</>
                                  )}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              <div className="area-card__pie">
                <Link className="btn" to="/preventivo/cronograma">Ver calendario</Link>
                <Link className="btn btn--primario" to="/preventivo">Registrar PM</Link>
              </div>
            </article>
          ))}
      </div>
    </section>
  );
}

export default InicioPage;
