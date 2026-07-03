import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AREAS_CON_PM, coincideArea } from "../../lib/areas";
import { aFechaIso, NOMBRES_MESES, NOMBRES_MESES_CORTOS, valorFecha } from "../../lib/fechas";
import { mapaCitasDelAnio } from "../cronograma/cronogramaCalculo";
import {
  destinoMesSiguiente,
  etiquetaEstadoCita,
  evaluarEstadoCitaPm,
  type DestinoReprogramacion,
  type EstadoCitaPm,
} from "../cronograma/cronogramaEstadoCita";
import {
  crearExcepcion,
  eliminarExcepcion,
  listarExcepciones,
} from "../cronograma/cronogramaService";
import type { CitaCronograma, ExcepcionCronograma } from "../cronograma/types";
import { useAuth } from "../auth/AuthContext";
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
  reprogramadoA: DestinoReprogramacion | null;
  excepcionNoRealizadoId: string | null;
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
  citasNoRealizadas: number;
  citasVencidas: number;
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
  let citasNoRealizadas = 0;
  let citasVencidas = 0;
  let proximaCita: DatosArea["proximaCita"] = null;

  for (let mes = 1; mes <= 12; mes++) {
    const citasMes: CitaMes[] = [];
    for (const [clave, citas] of mapa) {
      const [mesClave, diaClave] = clave.split("|").map(Number);
      if (mesClave !== mes) continue;
      for (const cita of citas) {
        const maquina = maquinasPorId.get(cita.maquinaId);
        if (maquina && !hojaEstaActiva(maquina)) continue;

        const resultado = evaluarEstadoCitaPm(
          cita.maquinaId,
          area,
          anio,
          mes,
          diaClave,
          excepciones,
          indicesCompletado,
          valorHoy,
        );
        citasMes.push({
          ...cita,
          dia: diaClave,
          estado: resultado.estado,
          reprogramadoA: resultado.reprogramadoA,
          excepcionNoRealizadoId: resultado.excepcionNoRealizadoId,
        });
        totalCitas += 1;
        if (resultado.estado === "completada" || resultado.estado === "reprogramada_hecha") {
          citasCompletadas += 1;
        }
        if (resultado.estado === "no_realizado" || resultado.estado === "reprogramada") {
          citasNoRealizadas += 1;
        }
        if (resultado.estado === "vencida") {
          citasVencidas += 1;
        }
        if (
          (resultado.estado === "pendiente" || resultado.estado === "reprogramada") &&
          valorFecha(anio, mes, diaClave) >= valorHoy &&
          (!proximaCita ||
            valorFecha(anio, mes, diaClave) <
              valorFecha(anio, proximaCita.mes, proximaCita.dia))
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
        completadas: citasMes.filter(
          (c) => c.estado === "completada" || c.estado === "reprogramada_hecha",
        ).length,
      });
    }
  }

  return {
    area,
    totalMaquinas: maquinasArea.length,
    maquinasActivas: maquinasArea.filter((m) => hojaEstaActiva(m)).length,
    totalCitas,
    citasCompletadas,
    citasNoRealizadas,
    citasVencidas,
    porMes,
    proximaCita,
  };
}

function textoReprogramado(destino: DestinoReprogramacion): string {
  return `${destino.dia} ${NOMBRES_MESES_CORTOS[destino.mes - 1]} ${destino.anio}`;
}

function InicioPage() {
  const anioActual = new Date().getFullYear();
  const mesActual = new Date().getMonth() + 1;
  const ubicacion = useLocation();
  const navegar = useNavigate();
  const { puede, esAdmin } = useAuth();
  const puedeGestionar = esAdmin || puede("crear.preventivo");
  const [anio, setAnio] = useState(anioActual);
  const [maquinas, setMaquinas] = useState<HojaVida[]>([]);
  const [excepciones, setExcepciones] = useState<ExcepcionCronograma[]>([]);
  const [preventivo, setPreventivo] = useState<RegistroPreventivo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState<string | null>(null);

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

  async function marcarNoRealizado(
    area: string,
    maquinaId: string,
    mes: number,
    dia: number,
  ) {
    const clave = `${area}|${maquinaId}|${mes}|${dia}`;
    setProcesando(clave);
    setError(null);
    try {
      const creada = await crearExcepcion(
        { tipo: "no_realizado", area, maquinaId, anio, mes, dia },
        "No se pudo en la fecha programada",
      );
      setExcepciones((previas) => [...previas, creada]);
    } catch (e) {
      setError("No se pudo marcar la cita: " + (e as Error).message);
    } finally {
      setProcesando(null);
    }
  }

  async function reprogramarMesSiguiente(
    area: string,
    maquinaId: string,
    mes: number,
    dia: number,
  ) {
    const destino = destinoMesSiguiente(anio, mes, dia);
    const clave = `reprog|${area}|${maquinaId}|${mes}|${dia}`;
    setProcesando(clave);
    setError(null);
    try {
      const yaExiste = excepciones.some(
        (e) =>
          e.datos.tipo === "agregar" &&
          e.datos.maquinaId === maquinaId &&
          e.datos.anio === destino.anio &&
          e.datos.mes === destino.mes &&
          e.datos.dia === destino.dia,
      );
      const nuevas: ExcepcionCronograma[] = [];
      if (!yaExiste) {
        nuevas.push(
          await crearExcepcion(
            {
              tipo: "agregar",
              area,
              maquinaId,
              anio: destino.anio,
              mes: destino.mes,
              dia: destino.dia,
            },
            "Reprogramado desde inicio",
          ),
        );
      }
      const sinMarca = !excepciones.some((e) =>
        e.datos.tipo === "no_realizado" &&
        e.datos.maquinaId === maquinaId &&
        e.datos.anio === anio &&
        e.datos.mes === mes &&
        e.datos.dia === dia,
      );
      if (sinMarca) {
        nuevas.push(
          await crearExcepcion(
            { tipo: "no_realizado", area, maquinaId, anio, mes, dia },
            "No se pudo en la fecha programada",
          ),
        );
      }
      if (nuevas.length > 0) {
        setExcepciones((previas) => [...previas, ...nuevas]);
      }
    } catch (e) {
      setError("No se pudo reprogramar: " + (e as Error).message);
    } finally {
      setProcesando(null);
    }
  }

  async function desmarcarNoRealizado(excepcionId: string | null) {
    if (!excepcionId) return;
    setProcesando(excepcionId);
    setError(null);
    try {
      await eliminarExcepcion(excepcionId);
      setExcepciones((previas) => previas.filter((e) => e.id !== excepcionId));
    } catch (e) {
      setError("No se pudo deshacer la marca: " + (e as Error).message);
    } finally {
      setProcesando(null);
    }
  }

  function irARegistrarPm(area: string, mes: number, cita: CitaMes) {
    const fecha =
      cita.reprogramadoA && (cita.estado === "reprogramada" || cita.estado === "no_realizado")
        ? aFechaIso(cita.reprogramadoA.anio, cita.reprogramadoA.mes, cita.reprogramadoA.dia)
        : aFechaIso(anio, mes, cita.dia);
    navegar("/preventivo", {
      state: {
        registrarPm: {
          maquinaId: cita.maquinaId,
          area,
          fecha,
        },
      },
    });
  }

  return (
    <section className="inicio">
      <div className="inicio__cabecera">
        <div>
          <h1>Panel de mantenimiento preventivo</h1>
          <p className="inicio__descripcion">
            La fecha de la hoja de vida no cambia. Puedes marcar si no se pudo hacer el PM
            en el día programado y reprogramarlo al mes siguiente.
          </p>
          <div className="inicio__leyenda">
            <span className="inicio__leyenda-item inicio__leyenda-item--completada">Hecho</span>
            <span className="inicio__leyenda-item inicio__leyenda-item--pendiente">Pendiente</span>
            <span className="inicio__leyenda-item inicio__leyenda-item--vencida">Vencido</span>
            <span className="inicio__leyenda-item inicio__leyenda-item--no-realizado">No se pudo</span>
            <span className="inicio__leyenda-item inicio__leyenda-item--reprogramada">Reprogramado</span>
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
                    <span className="chip chip--ok">{datos.citasCompletadas} hecho(s)</span>
                  )}
                  {datos.citasNoRealizadas > 0 && (
                    <span className="chip chip--no-realizado">
                      {datos.citasNoRealizadas} no realizado(s)
                    </span>
                  )}
                  {datos.citasVencidas > 0 && (
                    <span className="chip chip--vencida">{datos.citasVencidas} vencido(s)</span>
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
                            {bloque.citas.map((cita) => {
                              const claveAccion = `${datos.area}|${cita.maquinaId}|${bloque.mes}|${cita.dia}`;
                              const claveReprog = `reprog|${claveAccion}`;
                              const ocupado =
                                procesando === claveAccion ||
                                procesando === claveReprog ||
                                procesando === cita.excepcionNoRealizadoId;
                              const puedeMarcar =
                                cita.estado === "vencida" ||
                                cita.estado === "pendiente" ||
                                cita.estado === "no_realizado";
                              const puedeReprogramar =
                                (cita.estado === "no_realizado" ||
                                  cita.estado === "vencida" ||
                                  cita.estado === "reprogramada") &&
                                !cita.reprogramadoA;
                              return (
                                <li
                                  key={`${cita.maquinaId}-${cita.dia}`}
                                  className={`cita cita--${cita.estado.replaceAll("_", "-")}`}
                                >
                                  <button
                                    type="button"
                                    className="cita__principal"
                                    title={etiquetaEstadoCita(cita.estado)}
                                    onClick={() => irARegistrarPm(datos.area, bloque.mes, cita)}
                                  >
                                    {(cita.estado === "completada" ||
                                      cita.estado === "reprogramada_hecha") && (
                                      <span className="cita__check">✓</span>
                                    )}
                                    {cita.estado === "no_realizado" && (
                                      <span className="cita__icono">!</span>
                                    )}
                                    <span className="cita__dia">{cita.dia}</span>
                                    <span className="cita__info">
                                      <span className="cita__nombre">{cita.nombre}</span>
                                      <span className="cita__codigo">
                                        {cita.codigo} · cada {cita.frecuencia}m
                                        {cita.reprogramadoA &&
                                          (cita.estado === "reprogramada" ||
                                            cita.estado === "reprogramada_hecha") && (
                                            <> · → {textoReprogramado(cita.reprogramadoA)}</>
                                          )}
                                      </span>
                                    </span>
                                  </button>
                                  {puedeGestionar &&
                                    cita.estado !== "completada" &&
                                    cita.estado !== "reprogramada_hecha" && (
                                      <div
                                        className="cita__acciones"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {puedeMarcar && !cita.excepcionNoRealizadoId && (
                                          <button
                                            type="button"
                                            className="btn btn--mini btn--advertencia"
                                            disabled={ocupado}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              void marcarNoRealizado(
                                                datos.area,
                                                cita.maquinaId,
                                                bloque.mes,
                                                cita.dia,
                                              );
                                            }}
                                          >
                                            No se pudo
                                          </button>
                                        )}
                                        {puedeReprogramar && (
                                          <button
                                            type="button"
                                            className="btn btn--mini btn--primario"
                                            disabled={ocupado}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              void reprogramarMesSiguiente(
                                                datos.area,
                                                cita.maquinaId,
                                                bloque.mes,
                                                cita.dia,
                                              );
                                            }}
                                          >
                                            Mes siguiente
                                          </button>
                                        )}
                                        {cita.excepcionNoRealizadoId && (
                                          <button
                                            type="button"
                                            className="btn btn--mini"
                                            disabled={ocupado}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              void desmarcarNoRealizado(
                                                cita.excepcionNoRealizadoId,
                                              );
                                            }}
                                          >
                                            Deshacer
                                          </button>
                                        )}
                                      </div>
                                    )}
                                </li>
                              );
                            })}
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
