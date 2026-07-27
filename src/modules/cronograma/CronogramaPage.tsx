import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AREAS_CON_PM, coincideArea } from "../../lib/areas";
import { aFechaIso, diasEnMes, NOMBRES_MESES, valorFecha } from "../../lib/fechas";
import { useAuth } from "../auth/AuthContext";
import { listarHojas } from "../hojas/hojasService";
import type { HojaVida } from "../hojas/types";
import { listarPreventivo } from "../preventivo/preventivoService";
import { indicesPmCompletado, pmCompletado, vincularPreventivoConHojas } from "../preventivo/pmCompletado";
import type { RegistroPreventivo } from "../preventivo/types";
import { mapaCitasDelAnio, ocurrenciasEnAnio } from "./cronogramaCalculo";
import {
  etiquetaEstadoCita,
  evaluarEstadoCitaPm,
  tieneNoRealizado,
} from "./cronogramaEstadoCita";
import ReprogramarModal from "./ReprogramarModal";
import {
  crearExcepcion,
  eliminarExcepcion,
  listarExcepciones,
  reprogramarCitaPm,
} from "./cronogramaService";
import type { CitaCronograma, ExcepcionCronograma } from "./types";
import "./cronograma.css";

const NOMBRES_MESES_CORTOS_TEXTO = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

interface ReprogramarContexto {
  cita: CitaCronograma;
  mes: number;
  dia: number;
}

function CronogramaPage() {
  const anioActual = new Date().getFullYear();
  const { puede, esAdmin } = useAuth();
  const puedeGestionar = esAdmin || puede("crear.preventivo");

  const [area, setArea] = useState<string>(AREAS_CON_PM[0]);
  const [anio, setAnio] = useState(anioActual);
  const [maquinas, setMaquinas] = useState<HojaVida[]>([]);
  const [excepciones, setExcepciones] = useState<ExcepcionCronograma[]>([]);
  const [preventivo, setPreventivo] = useState<RegistroPreventivo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diaSeleccionado, setDiaSeleccionado] = useState<{ mes: number; dia: number } | null>(null);
  const [reprogramar, setReprogramar] = useState<ReprogramarContexto | null>(null);
  const [guardandoReprog, setGuardandoReprog] = useState(false);
  const [exito, setExito] = useState<string | null>(null);

  const valorHoy = useMemo(() => {
    const hoy = new Date();
    return valorFecha(hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate());
  }, []);

  useEffect(() => {
    Promise.all([listarHojas(), listarExcepciones(), listarPreventivo()])
      .then(([hojas, excs, prev]) => {
        setMaquinas(hojas);
        setExcepciones(excs);
        setPreventivo(prev);
      })
      .catch((e: Error) => setError("No se pudieron cargar los datos: " + e.message))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    if (!exito) return;
    const t = window.setTimeout(() => setExito(null), 4500);
    return () => window.clearTimeout(t);
  }, [exito]);

  const mapaCitas = useMemo(
    () => mapaCitasDelAnio(maquinas, excepciones, area, anio),
    [maquinas, excepciones, area, anio],
  );

  const indicesCompletado = useMemo(
    () => indicesPmCompletado(vincularPreventivoConHojas(preventivo, maquinas), anio, maquinas),
    [preventivo, maquinas, anio],
  );

  const resumenMaquinas = useMemo(
    () =>
      maquinas
        .filter((m) => coincideArea(m.area, area) && m.primer_pm)
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
        .map((m) => ({
          maquina: m,
          ocurrencias: ocurrenciasEnAnio(m, anio),
        })),
    [maquinas, area, anio],
  );

  const totalCitas = useMemo(
    () => [...mapaCitas.values()].reduce((suma, citas) => suma + citas.length, 0),
    [mapaCitas],
  );

  const citasDelDia: CitaCronograma[] = diaSeleccionado
    ? (mapaCitas.get(`${diaSeleccionado.mes}|${diaSeleccionado.dia}`) ?? [])
    : [];

  const maquinasAgregables = useMemo(() => {
    if (!diaSeleccionado) return [];
    return maquinas.filter(
      (m) =>
        coincideArea(m.area, area) &&
        m.activa &&
        !citasDelDia.some((c) => c.maquinaId === m.id),
    );
  }, [maquinas, area, diaSeleccionado, citasDelDia]);

  const maquinasPorId = useMemo(
    () => new Map(maquinas.map((m) => [m.id, m])),
    [maquinas],
  );

  function estadoDeCita(cita: CitaCronograma, mes: number, dia: number) {
    return evaluarEstadoCitaPm(
      cita.maquinaId,
      area,
      anio,
      mes,
      dia,
      cita.origen,
      excepciones,
      indicesCompletado,
      valorHoy,
      maquinasPorId.get(cita.maquinaId),
    );
  }

  function claseDiaCalendario(mes: number, dia: number, citas: CitaCronograma[]): string {
    const seleccionado = diaSeleccionado?.mes === mes && diaSeleccionado?.dia === dia;
    let clase = "mes__dia";

    if (citas.length === 0) {
      if (seleccionado) clase += " mes__dia--seleccionado";
      return clase;
    }

    const estados = citas.map((c) => estadoDeCita(c, mes, dia).estado);

    if (estados.every((e) => e === "completada")) {
      clase += " mes__dia--cumplida";
    } else if (estados.some((e) => e === "no_realizado")) {
      clase += " mes__dia--no-realizado";
    } else if (estados.some((e) => e === "reprogramada")) {
      clase += " mes__dia--reprogramada";
    } else if (estados.some((e) => e === "vencida")) {
      clase += " mes__dia--vencida";
    } else if (estados.some((e) => e === "de_baja")) {
      clase += " mes__dia--de-baja";
    } else {
      clase += " mes__dia--con-pm";
    }

    if (seleccionado) clase += " mes__dia--seleccionado";
    return clase;
  }

  async function confirmarReprogramacion(destinoMes: number, destinoDia: number) {
    if (!reprogramar) return;
    setGuardandoReprog(true);
    setError(null);
    try {
      await reprogramarCitaPm(excepciones, {
        area,
        anio,
        maquinaId: reprogramar.cita.maquinaId,
        origenMes: reprogramar.mes,
        origenDia: reprogramar.dia,
        origenAutomatica: reprogramar.cita.origen === "automatica",
        destinoMes,
        destinoDia,
      });

      const lista = await listarExcepciones();
      setExcepciones(lista);
      setReprogramar(null);
      setDiaSeleccionado({ mes: destinoMes, dia: destinoDia });
      setExito(
        `Actividad reprogramada al ${destinoDia} de ${NOMBRES_MESES[destinoMes - 1]} ${anio}.`,
      );
    } catch (e) {
      setError("No se pudo reprogramar: " + (e as Error).message);
    } finally {
      setGuardandoReprog(false);
    }
  }

  async function agregarCita(maquinaId: string) {
    if (!diaSeleccionado || !maquinaId) return;
    setError(null);
    try {
      const exclusion = excepciones.find((e) => {
        const d = e.datos;
        return (
          d.tipo === "excluir" &&
          d.area === area &&
          d.maquinaId === maquinaId &&
          d.anio === anio &&
          d.mes === diaSeleccionado.mes &&
          d.dia === diaSeleccionado.dia
        );
      });
      if (exclusion) {
        await eliminarExcepcion(exclusion.id);
        setExcepciones((previas) => previas.filter((e) => e.id !== exclusion.id));
        return;
      }
      const creada = await crearExcepcion({
        tipo: "agregar",
        area,
        maquinaId,
        anio,
        mes: diaSeleccionado.mes,
        dia: diaSeleccionado.dia,
      });
      setExcepciones((previas) => [...previas, creada]);
    } catch (e) {
      setError("No fue posible agregar la máquina: " + (e as Error).message);
    }
  }

  return (
    <section className="cronograma">
      <h1>Calendario de mantenimiento preventivo</h1>
      <p className="cronograma__descripcion">
        Programación desde hojas de vida (primer PM + frecuencia). La fecha base no cambia:
        puedes <strong>reprogramar</strong> si no se pudo hacer el PM en el día planeado.
      </p>

      <div className="cronograma__controles">
        <label>
          Área
          <select
            value={area}
            onChange={(e) => {
              setArea(e.target.value);
              setDiaSeleccionado(null);
            }}
          >
            {AREAS_CON_PM.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label>
          Año
          <div className="cronograma__anio">
            <button
              type="button"
              className="btn"
              onClick={() => {
                setAnio(anio - 1);
                setDiaSeleccionado(null);
              }}
            >
              ←
            </button>
            <span>{anio}</span>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setAnio(anio + 1);
                setDiaSeleccionado(null);
              }}
            >
              →
            </button>
          </div>
        </label>
        <p className="cronograma__total">
          {totalCitas} cita(s) en {area} para {anio}
        </p>
        <div className="cronograma__leyenda">
          <span className="cronograma__leyenda-item cronograma__leyenda-item--pendiente">
            Programado
          </span>
          <span className="cronograma__leyenda-item cronograma__leyenda-item--no-realizado">
            No realizado
          </span>
          <span className="cronograma__leyenda-item cronograma__leyenda-item--reprogramada">
            Reprogramado
          </span>
          <span className="cronograma__leyenda-item cronograma__leyenda-item--cumplido">
            Completado
          </span>
          <span className="cronograma__leyenda-item cronograma__leyenda-item--vencida">
            Vencido (máquina activa)
          </span>
          <span className="cronograma__leyenda-item cronograma__leyenda-item--de-baja">
            De baja
          </span>
        </div>
      </div>

      {exito && <p className="cronograma__exito">{exito}</p>}
      {error && <p className="cronograma__error">{error}</p>}
      {cargando && <p>Cargando cronograma...</p>}

      {!cargando && (
        <div className="cronograma__calendario">
          {NOMBRES_MESES.map((nombreMes, indiceMes) => {
            const mes = indiceMes + 1;
            const dias = diasEnMes(anio, mes);
            return (
              <div key={mes} className="mes">
                <h3>{nombreMes}</h3>
                <div className="mes__dias">
                  {Array.from({ length: dias }, (_, i) => i + 1).map((dia) => {
                    const citas = mapaCitas.get(`${mes}|${dia}`) ?? [];
                    return (
                      <button
                        key={dia}
                        type="button"
                        className={claseDiaCalendario(mes, dia, citas)}
                        title={citas
                          .map((c) => {
                            const est = estadoDeCita(c, mes, dia).estado;
                            return `${c.nombre} — ${etiquetaEstadoCita(est)}`;
                          })
                          .join(", ")}
                        onClick={() => setDiaSeleccionado({ mes, dia })}
                      >
                        {dia}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {diaSeleccionado && (
        <div className="dia-detalle">
          <h2>
            {diaSeleccionado.dia} de {NOMBRES_MESES[diaSeleccionado.mes - 1]} de {anio} — {area}
          </h2>
          {citasDelDia.length === 0 && (
            <p className="dia-detalle__vacio">No hay máquinas programadas este día.</p>
          )}
          <div className="dia-detalle__tarjetas">
            {citasDelDia.map((cita) => {
              const { estado, reprogramadoA } = estadoDeCita(
                cita,
                diaSeleccionado.mes,
                diaSeleccionado.dia,
              );
              const puedeReprogramar =
                puedeGestionar &&
                (estado === "programada" ||
                  estado === "vencida" ||
                  estado === "reprogramada");

              return (
                <article
                  key={cita.maquinaId}
                  className={`actividad-card actividad-card--${estado.replaceAll("_", "-")}`}
                >
                  <div className="actividad-card__principal">
                    <div>
                      <span className={`actividad-card__badge actividad-card__badge--${estado.replaceAll("_", "-")}`}>
                        {etiquetaEstadoCita(estado)}
                      </span>
                      <h3>{cita.nombre}</h3>
                      <p className="actividad-card__meta">
                        {cita.codigo} · cada {cita.frecuencia}m
                      </p>
                      {reprogramadoA && estado === "no_realizado" && (
                        <p className="actividad-card__destino">
                          Nueva fecha: {reprogramadoA.dia} de {NOMBRES_MESES[reprogramadoA.mes - 1]}
                        </p>
                      )}
                    </div>
                    {puedeReprogramar && (
                      <button
                        type="button"
                        className="btn btn--reprogramar"
                        onClick={() =>
                          setReprogramar({
                            cita,
                            mes: diaSeleccionado.mes,
                            dia: diaSeleccionado.dia,
                          })
                        }
                      >
                        Reprogramar
                      </button>
                    )}
                  </div>
                  {estado === "no_realizado" && !reprogramadoA && (
                    <p className="actividad-card__ayuda">
                      ¿No puedes hacerlo este día? Usa <strong>Reprogramar</strong> en la fecha original
                      o abre el día nuevo si ya fue movida.
                    </p>
                  )}
                </article>
              );
            })}
          </div>

          {puedeGestionar && maquinasAgregables.length > 0 && (
            <label className="dia-detalle__agregar">
              Programar máquina este día:
              <select
                defaultValue=""
                onChange={(e) => {
                  agregarCita(e.target.value);
                  e.target.value = "";
                }}
              >
                <option value="">Selecciona una máquina</option>
                {maquinasAgregables.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} ({m.codigo ?? "sin código"})
                  </option>
                ))}
              </select>
            </label>
          )}

          <button type="button" className="btn" onClick={() => setDiaSeleccionado(null)}>
            Cerrar detalle
          </button>
        </div>
      )}

      <aside className="cronograma__ayuda">
        <h2>¿Cómo reprogramar?</h2>
        <ol>
          <li>Selecciona el <strong>área</strong> y haz clic en el día con PM programado.</li>
          <li>Pulsa <strong>Reprogramar</strong> en la tarjeta de la máquina.</li>
          <li>Elige la <strong>nueva fecha</strong> en el calendario y confirma.</li>
          <li>La fecha original queda como <strong>no realizado</strong>; la nueva como <strong>reprogramado</strong>.</li>
        </ol>
        <p>
          <Link to="/">Ver resumen en Inicio</Link>
        </p>
      </aside>

      {!cargando && (
        <div className="cronograma__resumen">
          <h2>Resumen por máquina</h2>
          {resumenMaquinas.length === 0 && (
            <p>
              Registra máquinas en Hojas de vida con primer PM y frecuencia para generar el
              cronograma automático.
            </p>
          )}
          <ul>
            {resumenMaquinas.map(({ maquina, ocurrencias }) => (
              <li key={maquina.id}>
                <strong>{maquina.nombre}</strong> ({maquina.codigo ?? "sin código"}) —
                cada {maquina.frecuencia_pm_meses || 12} mes(es):{" "}
                {ocurrencias.length === 0
                  ? "Sin fechas en este año"
                  : ocurrencias
                      .map((o) => {
                        const fechaIso = aFechaIso(anio, o.mes, o.dia);
                        const cumplida = pmCompletado(maquina.id, fechaIso, indicesCompletado);
                        const noRealizado = tieneNoRealizado(
                          excepciones,
                          area,
                          maquina.id,
                          anio,
                          o.mes,
                          o.dia,
                        );
                        const texto = `${String(o.dia).padStart(2, "0")} ${NOMBRES_MESES_CORTOS_TEXTO[o.mes - 1]}`;
                        if (cumplida) return `✓ ${texto}`;
                        if (noRealizado) return `⚠ ${texto}`;
                        return texto;
                      })
                      .join(", ")}
                {!maquina.activa && <em> · fuera de circulación</em>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {reprogramar && (
        <ReprogramarModal
          key={`${reprogramar.cita.maquinaId}-${reprogramar.mes}-${reprogramar.dia}`}
          abierto
          guardando={guardandoReprog}
          area={area}
          anio={anio}
          mesInicial={reprogramar.mes}
          cita={reprogramar.cita}
          origenDia={reprogramar.dia}
          mapaCitas={mapaCitas}
          onCerrar={() => !guardandoReprog && setReprogramar(null)}
          onConfirmar={confirmarReprogramacion}
        />
      )}
    </section>
  );
}

export default CronogramaPage;
