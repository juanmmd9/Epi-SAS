import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { AREAS_CON_PM } from "../../lib/areas";
import { listarHojas } from "../hojas/hojasService";
import type { HojaVida } from "../hojas/types";
import {
  actualizarPreventivo,
  crearPreventivo,
  eliminarPreventivo,
  esAdjuntoValido,
  listarPreventivo,
  MAX_ADJUNTO_BYTES,
  subirAdjunto,
} from "./preventivoService";
import type { RegistroPreventivo } from "./types";
import "./preventivo.css";

const formularioVacio = { area: "", maquinaId: "", fecha: "", descripcion: "" };

interface EstadoNavegacion {
  registrarPm?: { maquinaId: string; area: string; fecha: string };
}

function PreventivoPage() {
  const ubicacion = useLocation();
  const [registros, setRegistros] = useState<RegistroPreventivo[]>([]);
  const [maquinas, setMaquinas] = useState<HojaVida[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [campos, setCampos] = useState(formularioVacio);
  const [adjunto, setAdjunto] = useState<File | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [filtroArea, setFiltroArea] = useState("");

  useEffect(() => {
    Promise.all([listarPreventivo(), listarHojas()])
      .then(([regs, hojas]) => {
        setRegistros(regs);
        setMaquinas(hojas);
      })
      .catch((e: Error) => setError("No se pudieron cargar los datos: " + e.message))
      .finally(() => setCargando(false));
  }, []);

  // Precarga del formulario al llegar desde el panel de inicio (clic en una cita)
  useEffect(() => {
    const estado = ubicacion.state as EstadoNavegacion | null;
    if (!estado?.registrarPm) return;
    const { maquinaId, area, fecha } = estado.registrarPm;
    setEditandoId(null);
    setCampos({ area, maquinaId, fecha, descripcion: "" });
    setMensaje("Datos cargados desde el panel de inicio. Completa la actividad y el soporte.");
    window.history.replaceState({}, "");
  }, [ubicacion.state]);

  const maquinasDelArea = useMemo(
    () => maquinas.filter((m) => m.area === campos.area && m.activa),
    [maquinas, campos.area],
  );

  const registrosFiltrados = useMemo(
    () => (filtroArea ? registros.filter((r) => r.area === filtroArea) : registros),
    [registros, filtroArea],
  );

  function nombreMaquina(registro: RegistroPreventivo): string {
    const maquina = maquinas.find((m) => m.id === registro.hoja_id);
    if (maquina) return `${maquina.nombre} (${maquina.codigo ?? "sin código"})`;
    return registro.datos.equipo ?? "Máquina eliminada";
  }

  function iniciarEdicion(registro: RegistroPreventivo) {
    setEditandoId(registro.id);
    setCampos({
      area: registro.area,
      maquinaId: registro.hoja_id ?? "",
      fecha: registro.fecha,
      descripcion: registro.descripcion ?? "",
    });
    setAdjunto(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setCampos(formularioVacio);
    setAdjunto(null);
  }

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    setMensaje(null);

    const maquina = maquinas.find((m) => m.id === campos.maquinaId);
    if (!maquina) {
      setError("Selecciona una máquina válida registrada en hojas de vida.");
      return;
    }
    if (!editandoId && !adjunto) {
      setError("Debes seleccionar un archivo PDF o Word.");
      return;
    }
    if (adjunto) {
      if (!esAdjuntoValido(adjunto)) {
        setError("Solo se permiten archivos PDF, DOC o DOCX.");
        return;
      }
      if (adjunto.size > MAX_ADJUNTO_BYTES) {
        setError("El archivo debe pesar máximo 5 MB.");
        return;
      }
    }

    setGuardando(true);
    try {
      const input = {
        hoja_id: maquina.id,
        area: maquina.area,
        fecha: campos.fecha,
        descripcion: campos.descripcion.trim(),
        datos: {
          equipo: maquina.nombre,
          ...(adjunto ? { adjuntoNombre: adjunto.name } : {}),
        },
      };

      if (editandoId) {
        const cambios = adjunto
          ? { ...input, adjunto_url: await subirAdjunto(adjunto) }
          : input;
        const actualizado = await actualizarPreventivo(editandoId, cambios);
        setRegistros((previos) =>
          previos.map((r) => (r.id === actualizado.id ? actualizado : r)),
        );
        setMensaje("Registro actualizado correctamente.");
      } else {
        const url = await subirAdjunto(adjunto!);
        const creado = await crearPreventivo(input, url);
        setRegistros((previos) => [creado, ...previos]);
        setMensaje("Registro guardado correctamente.");
      }
      cancelarEdicion();
    } catch (e) {
      setError("No fue posible guardar: " + (e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  async function manejarEliminar(registro: RegistroPreventivo) {
    if (!window.confirm("¿Eliminar este registro de mantenimiento preventivo?")) return;
    try {
      await eliminarPreventivo(registro.id);
      setRegistros((previos) => previos.filter((r) => r.id !== registro.id));
      if (editandoId === registro.id) cancelarEdicion();
    } catch (e) {
      setError("No fue posible eliminar: " + (e as Error).message);
    }
  }

  return (
    <section className="preventivo">
      <h1>Mantenimiento preventivo</h1>
      <p className="preventivo__descripcion">
        Registro de actividades preventivas con soporte adjunto.{" "}
        <Link to="/preventivo/cronograma">Ver cronograma anual</Link>
      </p>

      <form className="preventivo-form" onSubmit={manejarEnvio}>
        <h2>{editandoId ? "Editar registro" : "Registrar actividad"}</h2>
        <div className="preventivo-form__grid">
          <label>
            Área *
            <select
              required
              value={campos.area}
              onChange={(e) =>
                setCampos((c) => ({ ...c, area: e.target.value, maquinaId: "" }))
              }
            >
              <option value="">Selecciona un área</option>
              {AREAS_CON_PM.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </label>

          <label>
            Máquina *
            <select
              required
              value={campos.maquinaId}
              onChange={(e) => setCampos((c) => ({ ...c, maquinaId: e.target.value }))}
            >
              <option value="">
                {campos.area
                  ? maquinasDelArea.length
                    ? "Selecciona una máquina"
                    : "No hay máquinas en esta área"
                  : "Selecciona primero un área"}
              </option>
              {maquinasDelArea.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre} ({m.codigo ?? "sin código"})
                </option>
              ))}
            </select>
          </label>

          <label>
            Fecha *
            <input
              required
              type="date"
              value={campos.fecha}
              onChange={(e) => setCampos((c) => ({ ...c, fecha: e.target.value }))}
            />
          </label>

          <label>
            Soporte (PDF/Word{editandoId ? ", opcional al editar" : ""}) {editandoId ? "" : "*"}
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setAdjunto(e.target.files?.[0] ?? null)}
            />
          </label>

          <label className="preventivo-form__descripcion">
            Actividad / descripción *
            <textarea
              required
              rows={3}
              value={campos.descripcion}
              onChange={(e) => setCampos((c) => ({ ...c, descripcion: e.target.value }))}
              placeholder="Ej. Cambio de aceite, revisión de correas..."
            />
          </label>
        </div>
        <div className="preventivo-form__acciones">
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

      {mensaje && <p className="preventivo__mensaje preventivo__mensaje--ok">{mensaje}</p>}
      {error && <p className="preventivo__mensaje preventivo__mensaje--error">{error}</p>}

      <div className="preventivo__filtros">
        <h2>Registros ({registrosFiltrados.length})</h2>
        <select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)}>
          <option value="">Todas las áreas</option>
          {AREAS_CON_PM.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>
      </div>

      {cargando && <p>Cargando registros...</p>}
      {!cargando && registrosFiltrados.length === 0 && (
        <p className="preventivo__vacio">No hay registros preventivos todavía.</p>
      )}

      {registrosFiltrados.length > 0 && (
        <div className="preventivo__tabla-contenedor">
          <table className="preventivo__tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Área</th>
                <th>Máquina</th>
                <th>Actividad</th>
                <th>Soporte</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {registrosFiltrados.map((registro) => (
                <tr key={registro.id}>
                  <td>{registro.fecha}</td>
                  <td>{registro.area}</td>
                  <td>{nombreMaquina(registro)}</td>
                  <td>{registro.descripcion}</td>
                  <td>
                    {registro.adjunto_url ? (
                      <a href={registro.adjunto_url} target="_blank" rel="noreferrer">
                        {registro.datos.adjuntoNombre ?? "Ver soporte"}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="preventivo__acciones">
                    <button className="btn" onClick={() => iniciarEdicion(registro)}>
                      Editar
                    </button>
                    <button
                      className="btn btn--peligro"
                      onClick={() => manejarEliminar(registro)}
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
    </section>
  );
}

export default PreventivoPage;
