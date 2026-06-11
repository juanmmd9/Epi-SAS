import { useEffect, useMemo, useState, type FormEvent } from "react";
import { NOMBRES_MESES } from "../../lib/fechas";
import { AREAS_SISTEMA } from "../../lib/areas";
import AvisoSetupPersonal from "../../components/setup/AvisoSetupPersonal";
import { listarCorrectivo } from "../correctivo/correctivoService";
import type { RegistroCorrectivo } from "../correctivo/types";
import { listarPreventivo } from "../preventivo/preventivoService";
import type { RegistroPreventivo } from "../preventivo/types";
import {
  calcularEstadisticasPersonal,
  etiquetaPeriodo,
  filtrarCorrectivoPorPeriodo,
  filtrarPreventivoPorPeriodo,
  type AlcancePeriodo,
} from "./personalCalculo";
import {
  actualizarPersona,
  crearPersona,
  eliminarPersona,
  existeTablaPersonal,
  listarPersonal,
} from "./personalService";
import { faltaTablaPersonal as esErrorTablaPersonal } from "./personalSetup";
import type { Persona } from "./types";
import "./personal.css";

const formularioVacio = { nombre: "", cargo: "", area: "" };

function PersonalPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [preventivo, setPreventivo] = useState<RegistroPreventivo[]>([]);
  const [correctivo, setCorrectivo] = useState<RegistroCorrectivo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [campos, setCampos] = useState(formularioVacio);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [faltaTabla, setFaltaTabla] = useState(false);
  const anioActual = new Date().getFullYear();
  const mesActual = new Date().getMonth() + 1;
  const [alcancePeriodo, setAlcancePeriodo] = useState<AlcancePeriodo>("todo");
  const [anioFiltro, setAnioFiltro] = useState(anioActual);
  const [mesFiltro, setMesFiltro] = useState(mesActual);

  useEffect(() => {
    recargarDatos();
  }, []);

  function recargarDatos() {
    setCargando(true);
    existeTablaPersonal()
      .then((ok) => {
        setFaltaTabla(!ok);
        if (!ok) {
          setPersonas([]);
          setPreventivo([]);
          setCorrectivo([]);
          return;
        }
        return Promise.all([listarPersonal(), listarPreventivo(), listarCorrectivo()]).then(
          ([lista, prev, corr]) => {
            setPersonas(lista);
            setPreventivo(prev);
            setCorrectivo(corr);
          },
        );
      })
      .catch((e: Error) => setError("No se pudieron cargar los datos: " + e.message))
      .finally(() => setCargando(false));
  }

  const filtroPeriodo = useMemo(
    () => ({ alcance: alcancePeriodo, anio: anioFiltro, mes: mesFiltro }),
    [alcancePeriodo, anioFiltro, mesFiltro],
  );

  const preventivoFiltrado = useMemo(
    () => filtrarPreventivoPorPeriodo(preventivo, filtroPeriodo),
    [preventivo, filtroPeriodo],
  );

  const correctivoFiltrado = useMemo(
    () => filtrarCorrectivoPorPeriodo(correctivo, filtroPeriodo),
    [correctivo, filtroPeriodo],
  );

  const estadisticas = useMemo(
    () => calcularEstadisticasPersonal(personas, preventivoFiltrado, correctivoFiltrado),
    [personas, preventivoFiltrado, correctivoFiltrado],
  );

  const estadisticasOrdenadas = useMemo(
    () => [...estadisticas].sort((a, b) => b.totalRegistros - a.totalRegistros),
    [estadisticas],
  );

  function cancelarEdicion() {
    setEditandoId(null);
    setCampos(formularioVacio);
  }

  function iniciarEdicion(persona: Persona) {
    setEditandoId(persona.id);
    setCampos({
      nombre: persona.nombre,
      cargo: persona.cargo ?? "",
      area: persona.area ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    setMensaje(null);

    const nombre = campos.nombre.trim();
    if (!nombre) {
      setError("El nombre es obligatorio.");
      return;
    }

    const input = {
      nombre,
      cargo: campos.cargo.trim() || null,
      area: campos.area || null,
    };

    setGuardando(true);
    try {
      if (editandoId) {
        const actualizada = await actualizarPersona(editandoId, input);
        setPersonas((previas) =>
          previas.map((p) => (p.id === actualizada.id ? actualizada : p)),
        );
        setMensaje(`"${actualizada.nombre}" actualizado.`);
      } else {
        const creada = await crearPersona(input);
        setPersonas((previas) => [...previas, creada].sort((a, b) => a.nombre.localeCompare(b.nombre)));
        setMensaje(`"${creada.nombre}" registrado en el personal.`);
      }
      cancelarEdicion();
    } catch (e) {
      const msg = (e as Error).message;
      if (esErrorTablaPersonal(msg)) setFaltaTabla(true);
      setError(
        esErrorTablaPersonal(msg)
          ? "Primero crea la tabla personal en Supabase (instrucciones abajo)."
          : "No fue posible guardar: " + msg,
      );
    } finally {
      setGuardando(false);
    }
  }

  async function manejarCambioEstado(persona: Persona) {
    try {
      const actualizada = await actualizarPersona(persona.id, { activo: !persona.activo });
      setPersonas((previas) =>
        previas.map((p) => (p.id === actualizada.id ? actualizada : p)),
      );
    } catch (e) {
      setError("No fue posible cambiar el estado: " + (e as Error).message);
    }
  }

  async function manejarEliminar(persona: Persona) {
    if (
      !window.confirm(
        `¿Eliminar a "${persona.nombre}"? Los registros preventivos y correctivos conservarán su historial pero quedarán sin técnico asignado.`,
      )
    ) {
      return;
    }
    try {
      await eliminarPersona(persona.id);
      setPersonas((previas) => previas.filter((p) => p.id !== persona.id));
      if (editandoId === persona.id) cancelarEdicion();
    } catch (e) {
      setError("No fue posible eliminar: " + (e as Error).message);
    }
  }

  return (
    <section className="personal">
      <h1>Personal de mantenimiento</h1>
      <p className="personal__descripcion">
        Registra técnicos y revisa cuántas máquinas y actividades ha atendido cada
        persona en preventivo y correctivo.
      </p>

      {faltaTabla && <AvisoSetupPersonal />}

      <form className="personal-form" onSubmit={manejarEnvio}>
        <h2>{editandoId ? "Editar persona" : "Registrar persona"}</h2>
        <div className="personal-form__grid">
          <label>
            Nombre completo *
            <input
              required
              value={campos.nombre}
              onChange={(e) => setCampos((c) => ({ ...c, nombre: e.target.value }))}
              placeholder="Ej. Juan Pérez"
            />
          </label>
          <label>
            Cargo
            <input
              value={campos.cargo}
              onChange={(e) => setCampos((c) => ({ ...c, cargo: e.target.value }))}
              placeholder="Ej. Técnico mecánico"
            />
          </label>
          <label>
            Área principal
            <select
              value={campos.area}
              onChange={(e) => setCampos((c) => ({ ...c, area: e.target.value }))}
            >
              <option value="">Sin área fija</option>
              {AREAS_SISTEMA.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="personal-form__acciones">
          <button type="submit" className="btn btn--primario" disabled={guardando}>
            {guardando ? "Guardando..." : editandoId ? "Guardar cambios" : "Registrar"}
          </button>
          {editandoId && (
            <button type="button" className="btn" onClick={cancelarEdicion}>
              Cancelar edición
            </button>
          )}
        </div>
      </form>

      {mensaje && <p className="personal__mensaje personal__mensaje--ok">{mensaje}</p>}
      {error && <p className="personal__mensaje personal__mensaje--error">{error}</p>}

      <div className="personal__seccion">
        <h2>Personal registrado ({personas.length})</h2>
        {cargando && <p>Cargando personal...</p>}
        {!cargando && personas.length === 0 && (
          <p className="personal__vacio">
            Aún no hay personas registradas. Agrega técnicos para asignarlos en
            preventivo y correctivo.
          </p>
        )}
        {!cargando && personas.length > 0 && (
          <div className="personal__tabla-contenedor">
            <table className="personal__tabla">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Cargo</th>
                  <th>Área</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {personas.map((persona) => (
                  <tr key={persona.id} className={persona.activo ? "" : "inactiva"}>
                    <td>{persona.nombre}</td>
                    <td>{persona.cargo ?? "—"}</td>
                    <td>{persona.area ?? "—"}</td>
                    <td>
                      {persona.activo ? (
                        <span className="personal__chip personal__chip--ok">Activo</span>
                      ) : (
                        <span className="personal__chip personal__chip--inactivo">Inactivo</span>
                      )}
                    </td>
                    <td className="personal__acciones">
                      <button className="btn" onClick={() => iniciarEdicion(persona)}>
                        Editar
                      </button>
                      <button className="btn" onClick={() => manejarCambioEstado(persona)}>
                        {persona.activo ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        className="btn btn--peligro"
                        onClick={() => manejarEliminar(persona)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="personal__seccion">
        <div className="personal__seccion-cabecera">
          <h2>Productividad por persona</h2>
          <div className="personal__filtros-periodo">
            <label>
              Periodo
              <select
                value={alcancePeriodo}
                onChange={(e) => setAlcancePeriodo(e.target.value as AlcancePeriodo)}
              >
                <option value="todo">Todo el historial</option>
                <option value="anio">Año completo</option>
                <option value="mes">Mes específico</option>
              </select>
            </label>
            {alcancePeriodo !== "todo" && (
              <div className="personal__anio">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setAnioFiltro((a) => a - 1)}
                  aria-label="Año anterior"
                >
                  ←
                </button>
                <span>{anioFiltro}</span>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setAnioFiltro((a) => a + 1)}
                  aria-label="Año siguiente"
                >
                  →
                </button>
              </div>
            )}
            {alcancePeriodo === "mes" && (
              <label>
                Mes
                <select
                  value={mesFiltro}
                  onChange={(e) => setMesFiltro(Number.parseInt(e.target.value, 10))}
                >
                  {NOMBRES_MESES.map((nombre, indice) => (
                    <option key={nombre} value={indice + 1}>
                      {nombre}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </div>
        <p className="personal__nota">
          Mostrando actividades de{" "}
          <strong>{etiquetaPeriodo(filtroPeriodo)}</strong>. Cuenta registros donde
          la persona fue técnico responsable (puede ser 1 o varios por registro). Las máquinas son equipos distintos
          atendidos (sin repetir la misma máquina).
        </p>
        {cargando && <p>Cargando estadísticas...</p>}
        {!cargando && personas.length === 0 && (
          <p className="personal__vacio">Registra personal para ver estadísticas.</p>
        )}
        {!cargando && personas.length > 0 && (
          <div className="personal__tabla-contenedor">
            <table className="personal__tabla">
              <thead>
                <tr>
                  <th>Persona</th>
                  <th>PM realizados</th>
                  <th>Correctivos</th>
                  <th>Total registros</th>
                  <th>Máquinas atendidas</th>
                </tr>
              </thead>
              <tbody>
                {estadisticasOrdenadas.map((fila) => (
                  <tr key={fila.persona.id} className={fila.persona.activo ? "" : "inactiva"}>
                    <td>
                      <strong>{fila.persona.nombre}</strong>
                      {fila.persona.cargo && (
                        <div style={{ fontSize: "0.82rem", color: "var(--color-texto-suave)" }}>
                          {fila.persona.cargo}
                        </div>
                      )}
                    </td>
                    <td className="personal__numero">{fila.preventivos}</td>
                    <td className="personal__numero">{fila.correctivos}</td>
                    <td className="personal__numero">{fila.totalRegistros}</td>
                    <td className="personal__numero">{fila.maquinasDistintas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default PersonalPage;
