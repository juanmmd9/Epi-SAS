import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { coincideArea } from "../../lib/areas";
import { areaUsuario } from "../../lib/usuarioArea";
import { useAuth } from "../auth/AuthContext";
import {
  actualizarPersona,
  agregarNota,
  etiquetaEstadoEquipo,
  leerEquipo,
  quitarNota,
  quitarPersona,
  type EstadoSeguimiento,
  type PersonaEquipo,
} from "./equipoDiseno";
import "./inicio.css";

function fechaHoy(): string {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

function EquipoPersonaPage() {
  const { personaId } = useParams();
  const navegar = useNavigate();
  const { perfil, rol } = useAuth();
  const area = areaUsuario(perfil);
  const esDiseno = rol === "lider" && Boolean(area) && coincideArea(area ?? "", "Diseno y Desarrollo");
  const usuarioId = perfil?.id ?? "";
  const inicial = usuarioId ? leerEquipo(usuarioId).find((item) => item.id === personaId) : undefined;
  const [persona, setPersona] = useState<PersonaEquipo | null>(inicial ?? null);
  const [nombre, setNombre] = useState(inicial?.nombre ?? "");
  const [cargo, setCargo] = useState(inicial?.cargo ?? "");
  const [fecha, setFecha] = useState(fechaHoy);
  const [estado, setEstado] = useState<EstadoSeguimiento>("pendiente");
  const [texto, setTexto] = useState("");

  if (!esDiseno) return <Navigate to="/" replace />;

  if (!persona) {
    return (
      <section className="inicio equipo">
        <Link to="/equipo" className="inicio-diseno__volver">
          Volver al equipo
        </Link>
        <h1>Esta persona no está en el equipo</h1>
      </section>
    );
  }

  function guardarFicha(evento: FormEvent) {
    evento.preventDefault();
    if (!usuarioId || !persona || !nombre.trim()) return;
    const lista = actualizarPersona(usuarioId, persona.id, nombre, cargo);
    setPersona(lista.find((item) => item.id === persona.id) ?? null);
  }

  function registrar(evento: FormEvent) {
    evento.preventDefault();
    if (!usuarioId || !persona || !texto.trim()) return;
    const lista = agregarNota(usuarioId, persona.id, { fecha, estado, texto });
    const actual = lista.find((item) => item.id === persona.id) ?? null;
    setPersona(actual);
    setTexto("");
    setFecha(fechaHoy());
  }

  function eliminar() {
    if (!usuarioId || !persona) return;
    quitarPersona(usuarioId, persona.id);
    navegar("/equipo");
  }

  function eliminarNota(notaId: string) {
    if (!usuarioId || !persona) return;
    const lista = quitarNota(usuarioId, persona.id, notaId);
    setPersona(lista.find((item) => item.id === persona.id) ?? null);
  }

  return (
    <section className="inicio equipo">
      <Link to="/equipo" className="inicio-diseno__volver">
        Volver al equipo
      </Link>
      <div className="inicio__cabecera">
        <div>
          <h1>{persona.nombre}</h1>
          <p className="inicio__descripcion">
            {persona.cargo || "Sin cargo"} · seguimiento del director de diseño
          </p>
        </div>
      </div>

      <form className="equipo__alta" onSubmit={guardarFicha}>
        <label>
          Nombre
          <input value={nombre} onChange={(evento) => setNombre(evento.target.value)} required />
        </label>
        <label>
          Cargo
          <input value={cargo} onChange={(evento) => setCargo(evento.target.value)} />
        </label>
        <button type="submit" className="btn">
          Guardar ficha
        </button>
      </form>

      <h2>Seguimiento</h2>
      <form className="equipo__nota" onSubmit={registrar}>
        <label>
          Fecha
          <input type="date" value={fecha} onChange={(evento) => setFecha(evento.target.value)} required />
        </label>
        <label>
          Estado
          <select value={estado} onChange={(evento) => setEstado(evento.target.value as EstadoSeguimiento)}>
            <option value="al_dia">Al día</option>
            <option value="pendiente">Pendiente</option>
            <option value="atencion">Requiere atención</option>
          </select>
        </label>
        <label className="equipo__nota-texto">
          Qué se revisó
          <textarea
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
            rows={3}
            placeholder="Avance, pendiente o lo que hay que revisar"
            required
          />
        </label>
        <button type="submit" className="btn btn--primario">
          Registrar
        </button>
      </form>

      {persona.notas.length === 0 ? (
        <p className="equipo__vacio">Todavía no hay seguimiento de esta persona.</p>
      ) : (
        <ul className="equipo__historial">
          {persona.notas.map((nota) => (
            <li key={nota.id}>
              <div>
                <strong>{nota.fecha}</strong>
                <em className={`equipo__estado equipo__estado--${nota.estado}`}>
                  {etiquetaEstadoEquipo(nota.estado)}
                </em>
              </div>
              <p>{nota.texto}</p>
              <button type="button" className="btn btn--peligro" onClick={() => eliminarNota(nota.id)}>
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}

      <button type="button" className="btn btn--peligro equipo__quitar" onClick={eliminar}>
        Eliminar persona
      </button>
    </section>
  );
}

export default EquipoPersonaPage;
