import { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { DIAS_SEMANA } from "./types";
import {
  crearFestivo,
  eliminarFestivo,
  existeTablaHorario,
  guardarHorario,
  inicializarFestivosColombia,
  inicializarHorarioEstandar,
  listarFestivosAnio,
  listarHorarioAnio,
} from "./horarioService";
import { SQL_MIGRACION_PERMISOS } from "./permisosSetup";
import { nombreDiaSemana } from "./permisosCalculo";
import type { Festivo, HorarioLaboral } from "./types";
import "./permisos.css";

function AvisoSetupHorario() {
  const projectRef =
    import.meta.env.VITE_SUPABASE_URL?.match(/https:\/\/([^.]+)\./)?.[1] ?? "_";
  const urlSql = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;

  function copiarSql() {
    void navigator.clipboard.writeText(SQL_MIGRACION_PERMISOS);
  }

  return (
    <aside className="aviso-setup-personal permisos__aviso-sql">
      <h3>Falta crear la tabla horario_laboral en Supabase</h3>
      <div className="aviso-setup-personal__acciones">
        <button type="button" className="btn" onClick={copiarSql}>
          Copiar script SQL
        </button>
        <a className="btn btn--primario" href={urlSql} target="_blank" rel="noreferrer">
          Abrir SQL Editor
        </a>
      </div>
    </aside>
  );
}

function HorarioLaboralPage() {
  const { puede } = useAuth();
  const anioActual = new Date().getFullYear();
  const [anio, setAnio] = useState(anioActual);
  const [filas, setFilas] = useState<HorarioLaboral[]>([]);
  const [festivos, setFestivos] = useState<Festivo[]>([]);
  const [nuevoFestivo, setNuevoFestivo] = useState({ fecha: "", descripcion: "" });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [inicializando, setInicializando] = useState(false);
  const [inicializandoFestivos, setInicializandoFestivos] = useState(false);
  const [faltaTabla, setFaltaTabla] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const ok = await existeTablaHorario();
      setFaltaTabla(!ok);
      if (!ok) {
        setFilas([]);
        setFestivos([]);
        return;
      }
      const [lista, listaFestivos] = await Promise.all([
        listarHorarioAnio(anio),
        listarFestivosAnio(anio),
      ]);
      setFilas(lista);
      setFestivos(listaFestivos);
    } catch (e) {
      setError("No se pudo cargar el horario: " + (e as Error).message);
    } finally {
      setCargando(false);
    }
  }, [anio]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  function etiquetaDia(dia: number): string {
    return DIAS_SEMANA.find((d) => d.valor === dia)?.etiqueta ?? String(dia);
  }

  function actualizarFilaLocal(actualizada: HorarioLaboral) {
    setFilas((previas) => {
      const indice = previas.findIndex((f) => f.id === actualizada.id);
      if (indice >= 0) {
        const copia = [...previas];
        copia[indice] = actualizada;
        return copia;
      }
      return [...previas, actualizada].sort(
        (a, b) => a.dia_semana - b.dia_semana || a.turno - b.turno,
      );
    });
  }

  async function manejarGuardarFila(fila: HorarioLaboral) {
    setGuardando(true);
    setError(null);
    try {
      const guardada = await guardarHorario({
        id: fila.id,
        anio: fila.anio,
        dia_semana: fila.dia_semana,
        turno: fila.turno,
        hora_inicio: fila.hora_inicio,
        hora_fin: fila.hora_fin,
        activo: fila.activo,
      });
      actualizarFilaLocal(guardada);
      setMensaje("Horario actualizado.");
    } catch (e) {
      setError("No se pudo guardar: " + (e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  async function manejarInicializar() {
    setInicializando(true);
    setError(null);
    try {
      const cantidad = await inicializarHorarioEstandar(anio);
      setMensaje(
        cantidad > 0
          ? `Horario estándar ${anio} cargado (${cantidad} turnos). Lun–vie 7:30–12:00 y 13:00–16:30; sáb 8:00–12:00.`
          : `El horario ${anio} ya estaba configurado.`,
      );
      await recargar();
    } catch (e) {
      setError("No se pudo inicializar: " + (e as Error).message);
    } finally {
      setInicializando(false);
    }
  }

  async function manejarInicializarFestivos() {
    setInicializandoFestivos(true);
    setError(null);
    try {
      const creados = await inicializarFestivosColombia(anio);
      setMensaje(
        creados > 0
          ? `Se agregaron ${creados} festivos de Colombia para ${anio}.`
          : `Los festivos de ${anio} ya estaban cargados.`,
      );
      await recargar();
    } catch (e) {
      setError("No se pudieron cargar festivos: " + (e as Error).message);
    } finally {
      setInicializandoFestivos(false);
    }
  }

  async function manejarAgregarFestivo() {
    if (!nuevoFestivo.fecha) {
      setError("Indica la fecha del festivo.");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const creado = await crearFestivo(anio, nuevoFestivo.fecha, nuevoFestivo.descripcion);
      setFestivos((previos) =>
        [...previos, creado].sort((a, b) => a.fecha.localeCompare(b.fecha)),
      );
      setNuevoFestivo({ fecha: "", descripcion: "" });
      setMensaje("Festivo registrado.");
    } catch (e) {
      setError("No se pudo agregar el festivo: " + (e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  async function manejarEliminarFestivo(festivo: Festivo) {
    if (!window.confirm(`¿Eliminar festivo ${festivo.fecha}?`)) return;
    try {
      await eliminarFestivo(festivo.id);
      setFestivos((previos) => previos.filter((f) => f.id !== festivo.id));
    } catch (e) {
      setError("No se pudo eliminar: " + (e as Error).message);
    }
  }

  if (!puede("ver.horario")) {
    return <Navigate to="/" replace />;
  }

  return (
    <section className="permisos">
      <header className="permisos__encabezado">
        <div>
          <h1>Horario laboral y festivos</h1>
          <p className="personal__descripcion">
            Define la jornada por día y los días festivos del año. Los festivos no cuentan
            como jornada laboral en el control de permisos.
          </p>
        </div>
        <Link className="btn" to="/personal/permisos">
          Volver a permisos
        </Link>
      </header>

      {faltaTabla && <AvisoSetupHorario />}

      <section className="horario-form">
        <div className="horario-form__barra">
          <label>
            Año
            <input
              type="number"
              min={2020}
              max={2100}
              value={anio}
              onChange={(e) => setAnio(Number.parseInt(e.target.value, 10) || anioActual)}
            />
          </label>
          <button
            type="button"
            className="btn btn--primario"
            disabled={inicializando || faltaTabla}
            onClick={() => void manejarInicializar()}
          >
            Cargar horario estándar
          </button>
        </div>

        {mensaje && <p className="permisos__mensaje permisos__mensaje--ok">{mensaje}</p>}
        {error && <p className="permisos__mensaje permisos__mensaje--error">{error}</p>}

        {cargando && <p>Cargando horario...</p>}

        {!cargando && !faltaTabla && filas.length === 0 && (
          <p className="personal__vacio">
            No hay horario para {anio}. Pulsa <strong>Cargar horario estándar</strong>.
          </p>
        )}

        {!cargando && filas.length > 0 && (
          <table className="horario-form__tabla">
            <thead>
              <tr>
                <th>Día</th>
                <th>Turno</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Activo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filas.map((fila) => (
                <tr key={fila.id}>
                  <td>{etiquetaDia(fila.dia_semana)}</td>
                  <td>{fila.turno === 1 ? "Mañana" : "Tarde"}</td>
                  <td>
                    <input
                      type="time"
                      value={fila.hora_inicio}
                      onChange={(e) =>
                        setFilas((previas) =>
                          previas.map((f) =>
                            f.id === fila.id ? { ...f, hora_inicio: e.target.value } : f,
                          ),
                        )
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="time"
                      value={fila.hora_fin}
                      onChange={(e) =>
                        setFilas((previas) =>
                          previas.map((f) =>
                            f.id === fila.id ? { ...f, hora_fin: e.target.value } : f,
                          ),
                        )
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={fila.activo}
                      onChange={(e) =>
                        setFilas((previas) =>
                          previas.map((f) =>
                            f.id === fila.id ? { ...f, activo: e.target.checked } : f,
                          ),
                        )
                      }
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn"
                      disabled={guardando}
                      onClick={() => void manejarGuardarFila(fila)}
                    >
                      Guardar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="horario-form festivos-form">
        <h2>Festivos del año {anio}</h2>
        <p className="festivos-form__nota">
          Los permisos en día festivo se marcan automáticamente. Puedes agregar festivos
          locales o de empresa además del calendario de Colombia.
        </p>

        <div className="horario-form__barra">
          <button
            type="button"
            className="btn btn--primario"
            disabled={inicializandoFestivos || faltaTabla}
            onClick={() => void manejarInicializarFestivos()}
          >
            Cargar festivos Colombia {anio}
          </button>
        </div>

        <form
          className="festivos-form__alta"
          onSubmit={(e) => {
            e.preventDefault();
            void manejarAgregarFestivo();
          }}
        >
          <label>
            Fecha
            <input
              type="date"
              value={nuevoFestivo.fecha}
              onChange={(e) => setNuevoFestivo((f) => ({ ...f, fecha: e.target.value }))}
            />
          </label>
          <label>
            Descripción
            <input
              value={nuevoFestivo.descripcion}
              onChange={(e) => setNuevoFestivo((f) => ({ ...f, descripcion: e.target.value }))}
              placeholder="Ej. Puente festivo, día de la empresa..."
            />
          </label>
          <button type="submit" className="btn" disabled={guardando || faltaTabla}>
            Agregar festivo
          </button>
        </form>

        {festivos.length === 0 && !cargando && (
          <p className="personal__vacio">
            No hay festivos para {anio}. Pulsa <strong>Cargar festivos Colombia</strong>.
          </p>
        )}

        {festivos.length > 0 && (
          <table className="horario-form__tabla festivos-form__tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Día</th>
                <th>Descripción</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {festivos.map((festivo) => (
                <tr key={festivo.id} className="festivos-form__fila">
                  <td>{festivo.fecha}</td>
                  <td>{nombreDiaSemana(festivo.fecha)}</td>
                  <td>{festivo.descripcion ?? "Festivo"}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn--peligro"
                      onClick={() => void manejarEliminarFestivo(festivo)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </section>
  );
}

export default HorarioLaboralPage;
