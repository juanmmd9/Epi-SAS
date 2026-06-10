import { useEffect, useMemo, useState } from "react";
import { AREAS_CON_PM } from "../../lib/areas";
import { diasEnMes, NOMBRES_MESES } from "../../lib/fechas";
import { listarHojas } from "../hojas/hojasService";
import type { HojaVida } from "../hojas/types";
import { mapaCitasDelAnio, ocurrenciasEnAnio } from "./cronogramaCalculo";
import {
  crearExcepcion,
  eliminarExcepcion,
  listarExcepciones,
} from "./cronogramaService";
import type { CitaCronograma, ExcepcionCronograma } from "./types";
import "./cronograma.css";

const NOMBRES_MESES_CORTOS_TEXTO = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

function CronogramaPage() {
  const anioActual = new Date().getFullYear();
  const [area, setArea] = useState<string>(AREAS_CON_PM[0]);
  const [anio, setAnio] = useState(anioActual);
  const [maquinas, setMaquinas] = useState<HojaVida[]>([]);
  const [excepciones, setExcepciones] = useState<ExcepcionCronograma[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diaSeleccionado, setDiaSeleccionado] = useState<{ mes: number; dia: number } | null>(null);

  useEffect(() => {
    Promise.all([listarHojas(), listarExcepciones()])
      .then(([hojas, excs]) => {
        setMaquinas(hojas);
        setExcepciones(excs);
      })
      .catch((e: Error) => setError("No se pudieron cargar los datos: " + e.message))
      .finally(() => setCargando(false));
  }, []);

  const mapaCitas = useMemo(
    () => mapaCitasDelAnio(maquinas, excepciones, area, anio),
    [maquinas, excepciones, area, anio],
  );

  const resumenMaquinas = useMemo(
    () =>
      maquinas
        .filter((m) => m.area === area && m.primer_pm)
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
        m.area === area &&
        m.activa &&
        !citasDelDia.some((c) => c.maquinaId === m.id),
    );
  }, [maquinas, area, diaSeleccionado, citasDelDia]);

  async function quitarCita(cita: CitaCronograma) {
    if (!diaSeleccionado) return;
    setError(null);
    try {
      if (cita.origen === "manual") {
        const excepcion = excepciones.find((e) => {
          const d = e.datos;
          return (
            d.tipo === "agregar" &&
            d.area === area &&
            d.maquinaId === cita.maquinaId &&
            d.anio === anio &&
            d.mes === diaSeleccionado.mes &&
            d.dia === diaSeleccionado.dia
          );
        });
        if (!excepcion) return;
        await eliminarExcepcion(excepcion.id);
        setExcepciones((previas) => previas.filter((e) => e.id !== excepcion.id));
      } else {
        const creada = await crearExcepcion({
          tipo: "excluir",
          area,
          maquinaId: cita.maquinaId,
          anio,
          mes: diaSeleccionado.mes,
          dia: diaSeleccionado.dia,
        });
        setExcepciones((previas) => [...previas, creada]);
      }
    } catch (e) {
      setError("No fue posible actualizar el día: " + (e as Error).message);
    }
  }

  async function agregarCita(maquinaId: string) {
    if (!diaSeleccionado || !maquinaId) return;
    setError(null);
    try {
      // Si estaba excluida ese día, basta con quitar la exclusión
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
      <h1>Cronograma preventivo {anio}</h1>
      <p className="cronograma__descripcion">
        Generado automáticamente desde las hojas de vida (primer PM + frecuencia).
        Haz clic en un día para programar o excluir máquinas puntualmente.
      </p>

      <div className="cronograma__controles">
        <label>
          Área
          <select value={area} onChange={(e) => { setArea(e.target.value); setDiaSeleccionado(null); }}>
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
            <button className="btn" onClick={() => { setAnio(anio - 1); setDiaSeleccionado(null); }}>
              ←
            </button>
            <span>{anio}</span>
            <button className="btn" onClick={() => { setAnio(anio + 1); setDiaSeleccionado(null); }}>
              →
            </button>
          </div>
        </label>
        <p className="cronograma__total">
          {totalCitas} cita(s) programada(s) en {area} para {anio}
        </p>
      </div>

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
                    const seleccionado =
                      diaSeleccionado?.mes === mes && diaSeleccionado?.dia === dia;
                    return (
                      <button
                        key={dia}
                        className={
                          "mes__dia" +
                          (citas.length > 0 ? " mes__dia--con-pm" : "") +
                          (seleccionado ? " mes__dia--seleccionado" : "")
                        }
                        title={citas.map((c) => `${c.nombre} (${c.codigo})`).join(", ")}
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
          {citasDelDia.length === 0 && <p>No hay máquinas programadas este día.</p>}
          <ul>
            {citasDelDia.map((cita) => (
              <li key={cita.maquinaId}>
                <strong>{cita.nombre}</strong> ({cita.codigo}) · cada {cita.frecuencia}m
                {cita.origen === "manual" && <em> · agregada manualmente</em>}
                <button className="btn btn--peligro" onClick={() => quitarCita(cita)}>
                  Quitar este día
                </button>
              </li>
            ))}
          </ul>
          {maquinasAgregables.length > 0 && (
            <label className="dia-detalle__agregar">
              Programar máquina este día:
              <select defaultValue="" onChange={(e) => { agregarCita(e.target.value); e.target.value = ""; }}>
                <option value="">Selecciona una máquina</option>
                {maquinasAgregables.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} ({m.codigo ?? "sin código"})
                  </option>
                ))}
              </select>
            </label>
          )}
          <button className="btn" onClick={() => setDiaSeleccionado(null)}>
            Cerrar detalle
          </button>
        </div>
      )}

      {!cargando && (
        <div className="cronograma__resumen">
          <h2>Resumen por máquina</h2>
          {resumenMaquinas.length === 0 && (
            <p>
              Registra máquinas en Hojas de vida con primer PM y frecuencia para
              generar el cronograma automático.
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
                      .map(
                        (o) =>
                          `${String(o.dia).padStart(2, "0")} ${NOMBRES_MESES_CORTOS_TEXTO[o.mes - 1]}`,
                      )
                      .join(", ")}
                {!maquina.activa && <em> · fuera de circulación</em>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export default CronogramaPage;
