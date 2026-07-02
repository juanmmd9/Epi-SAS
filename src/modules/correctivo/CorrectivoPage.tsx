import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { SoloConPermiso } from "../auth/SoloConPermiso";
import { AREAS_SISTEMA } from "../../lib/areas";
import { listarHojas } from "../hojas/hojasService";
import type { HojaVida } from "../hojas/types";
import { listarPersonalActivo } from "../personal/personalService";
import SelectorPersonal from "../personal/SelectorPersonal";
import {
  construirDatosPersonal,
  idsDesdeRegistroCorrectivo,
  nombresPersonalEnRegistro,
} from "../personal/personalVinculo";
import type { Persona } from "../personal/types";
import {
  actualizarCorrectivo,
  calcularTiempoRespuesta,
  crearCorrectivo,
  eliminarCorrectivo,
  exportarCsv,
  listarCorrectivo,
  ordenarRegistrosCorrectivo,
  siguienteNumeroSolicitud,
} from "./correctivoService";
import {
  ESTADOS_MAQUINA,
  TIPOS_SOLICITUD,
  type RegistroCorrectivo,
} from "./types";
import "./correctivo.css";

const formularioVacio = {
  fecha: "",
  horaSolicitud: "",
  nombreSolicitante: "",
  horaRespuesta: "",
  horaInicioSolicitud: "",
  horaFinSolicitud: "",
  area: "",
  maquinaId: "",
  maquinaEquipoLocacion: "",
  codigoMaquina: "",
  estadoMaquina: "",
  descripcionSolicitud: "",
  solucionSolicitud: "",
  fechaCierre: "",
  horaCierre: "",
  quienRevisa: "",
};

function CorrectivoPage() {
  const { puede } = useAuth();
  const [registros, setRegistros] = useState<RegistroCorrectivo[]>([]);
  const [maquinas, setMaquinas] = useState<HojaVida[]>([]);
  const [personal, setPersonal] = useState<Persona[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [campos, setCampos] = useState(formularioVacio);
  const [personalIds, setPersonalIds] = useState<string[]>([]);
  const [tipos, setTipos] = useState<string[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [filtroArea, setFiltroArea] = useState("");

  useEffect(() => {
    Promise.all([listarCorrectivo(), listarHojas(), listarPersonalActivo()])
      .then(([regs, hojas, tecnicos]) => {
        setRegistros(regs);
        setMaquinas(hojas);
        setPersonal(tecnicos);
      })
      .catch((e: Error) => setError("No se pudieron cargar los datos: " + e.message))
      .finally(() => setCargando(false));
  }, []);

  const maquinasDelArea = useMemo(
    () => maquinas.filter((m) => m.area === campos.area),
    [maquinas, campos.area],
  );

  const registrosFiltrados = useMemo(() => {
    const lista = filtroArea ? registros.filter((r) => r.area === filtroArea) : registros;
    return ordenarRegistrosCorrectivo(lista);
  }, [registros, filtroArea]);

  function actualizar(nombre: keyof typeof formularioVacio, valor: string) {
    setCampos((c) => ({ ...c, [nombre]: valor }));
  }

  function seleccionarMaquina(maquinaId: string) {
    const maquina = maquinas.find((m) => m.id === maquinaId);
    setCampos((c) => ({
      ...c,
      maquinaId,
      maquinaEquipoLocacion: maquina ? maquina.nombre : c.maquinaEquipoLocacion,
      codigoMaquina: maquina ? (maquina.codigo ?? "") : c.codigoMaquina,
    }));
  }

  function alternarTipo(tipo: string) {
    setTipos((previos) =>
      previos.includes(tipo) ? previos.filter((t) => t !== tipo) : [...previos, tipo],
    );
  }

  function nombresTecnicos(registro: RegistroCorrectivo): string {
    const ids = idsDesdeRegistroCorrectivo(registro);
    return nombresPersonalEnRegistro(ids, personal, registro.datos.personalNombres);
  }

  function actualizarQuienRevisa(ids: string[]) {
    const nombres = ids
      .map((id) => personal.find((p) => p.id === id)?.nombre)
      .filter(Boolean);
    if (nombres.length > 0) {
      setCampos((c) => ({ ...c, quienRevisa: nombres.join(", ") }));
    }
  }

  function manejarPersonalIds(ids: string[]) {
    setPersonalIds(ids);
    actualizarQuienRevisa(ids);
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setCampos(formularioVacio);
    setPersonalIds([]);
    setTipos([]);
  }

  function iniciarEdicion(registro: RegistroCorrectivo) {
    setEditandoId(registro.id);
    setCampos({
      fecha: registro.fecha,
      horaSolicitud: registro.datos.horaSolicitud,
      nombreSolicitante: registro.datos.nombreSolicitante,
      horaRespuesta: registro.datos.horaRespuesta,
      horaInicioSolicitud: registro.datos.horaInicioSolicitud,
      horaFinSolicitud: registro.datos.horaFinSolicitud,
      area: registro.area,
      maquinaId: registro.datos.maquinaId,
      maquinaEquipoLocacion: registro.datos.maquinaEquipoLocacion,
      codigoMaquina: registro.datos.codigoMaquina,
      estadoMaquina: registro.datos.estadoMaquina,
      descripcionSolicitud: registro.datos.descripcionSolicitud,
      solucionSolicitud: registro.datos.solucionSolicitud,
      fechaCierre: registro.datos.fechaCierre,
      horaCierre: registro.datos.horaCierre,
      quienRevisa: registro.datos.quienRevisa,
    });
    setPersonalIds(idsDesdeRegistroCorrectivo(registro));
    setTipos(registro.datos.tiposSolicitud);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    setMensaje(null);

    if (tipos.length === 0) {
      setError("Selecciona al menos un tipo de solicitud.");
      return;
    }

    if (personal.length > 0 && personalIds.length === 0) {
      setError("Selecciona al menos un técnico responsable.");
      return;
    }

    const idsValidos = personalIds.filter((id) => personal.some((p) => p.id === id));
    if (personalIds.length > 0 && idsValidos.length === 0) {
      setError("Los técnicos seleccionados no son válidos.");
      return;
    }

    setGuardando(true);
    try {
      const numeroSolicitud = editandoId
        ? (registros.find((r) => r.id === editandoId)?.datos.numeroSolicitud ?? 0)
        : siguienteNumeroSolicitud(registros);

      const datosPersonal = construirDatosPersonal(idsValidos, personal);
      const nombresTecnicosTexto = datosPersonal.personalNombres.join(", ");

      const input = {
        ...(datosPersonal.personalId ? { personal_id: datosPersonal.personalId } : {}),
        area: campos.area,
        fecha: campos.fecha,
        datos: {
          numeroSolicitud,
          horaSolicitud: campos.horaSolicitud,
          nombreSolicitante: campos.nombreSolicitante.trim(),
          horaRespuesta: campos.horaRespuesta,
          tiempoRespuesta: calcularTiempoRespuesta(
            campos.horaSolicitud,
            campos.horaRespuesta,
          ),
          horaInicioSolicitud: campos.horaInicioSolicitud,
          horaFinSolicitud: campos.horaFinSolicitud,
          maquinaEquipoLocacion: campos.maquinaEquipoLocacion.trim(),
          codigoMaquina: campos.codigoMaquina.trim(),
          maquinaId: campos.maquinaId,
          estadoMaquina: campos.estadoMaquina,
          tiposSolicitud: tipos,
          descripcionSolicitud: campos.descripcionSolicitud.trim(),
          solucionSolicitud: campos.solucionSolicitud.trim(),
          fechaCierre: campos.fechaCierre,
          horaCierre: campos.horaCierre,
          quienRevisa: campos.quienRevisa.trim() || nombresTecnicosTexto,
          ...datosPersonal,
        },
      };

      if (editandoId) {
        const actualizado = await actualizarCorrectivo(editandoId, input);
        setRegistros((previos) =>
          ordenarRegistrosCorrectivo(
            previos.map((r) => (r.id === actualizado.id ? actualizado : r)),
          ),
        );
        setMensaje("Solicitud actualizada correctamente.");
      } else {
        const creado = await crearCorrectivo(input);
        setRegistros((previos) => ordenarRegistrosCorrectivo([creado, ...previos]));
        setMensaje(`Solicitud No. ${numeroSolicitud} guardada correctamente.`);
      }
      cancelarEdicion();
    } catch (e) {
      setError("No fue posible guardar: " + (e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  async function manejarEliminar(registro: RegistroCorrectivo) {
    if (!window.confirm(`¿Eliminar la solicitud No. ${registro.datos.numeroSolicitud}?`)) return;
    try {
      await eliminarCorrectivo(registro.id);
      setRegistros((previos) => previos.filter((r) => r.id !== registro.id));
      if (editandoId === registro.id) cancelarEdicion();
    } catch (e) {
      setError("No fue posible eliminar: " + (e as Error).message);
    }
  }

  return (
    <section className="correctivo">
      <h1>Mantenimiento correctivo</h1>
      <p className="correctivo__descripcion">
        Solicitudes de servicio de mantenimiento por área.{" "}
        <Link to="/personal">Gestionar personal</Link>
      </p>

      <SoloConPermiso permiso="crear.correctivo">
        <form className="correctivo-form" onSubmit={manejarEnvio}>
        <h2>
          {editandoId
            ? "Editar solicitud"
            : `Nueva solicitud (No. ${siguienteNumeroSolicitud(registros)})`}
        </h2>

        <div className="correctivo-form__grid">
          <label>
            Fecha solicitud *
            <input required type="date" value={campos.fecha}
              onChange={(e) => actualizar("fecha", e.target.value)} />
          </label>
          <label>
            Hora solicitud *
            <input required type="time" value={campos.horaSolicitud}
              onChange={(e) => actualizar("horaSolicitud", e.target.value)} />
          </label>
          <label>
            Nombre solicitante *
            <input required value={campos.nombreSolicitante}
              onChange={(e) => actualizar("nombreSolicitante", e.target.value)} />
          </label>
          <label>
            Hora respuesta
            <input type="time" value={campos.horaRespuesta}
              onChange={(e) => actualizar("horaRespuesta", e.target.value)} />
          </label>
          <label>
            Hora inicio trabajo
            <input type="time" value={campos.horaInicioSolicitud}
              onChange={(e) => actualizar("horaInicioSolicitud", e.target.value)} />
          </label>
          <label>
            Hora fin trabajo
            <input type="time" value={campos.horaFinSolicitud}
              onChange={(e) => actualizar("horaFinSolicitud", e.target.value)} />
          </label>
          <label>
            Proceso / Área *
            <select required value={campos.area}
              onChange={(e) => actualizar("area", e.target.value)}>
              <option value="">Selecciona un área</option>
              {AREAS_SISTEMA.map((area) => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </label>
          <label>
            Máquina registrada (opcional)
            <select value={campos.maquinaId}
              onChange={(e) => seleccionarMaquina(e.target.value)}>
              <option value="">Selección manual abajo</option>
              {maquinasDelArea.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre} ({m.codigo ?? "sin código"})
                </option>
              ))}
            </select>
          </label>
          <label>
            Máquina / Equipo / Locación *
            <input required value={campos.maquinaEquipoLocacion}
              onChange={(e) => actualizar("maquinaEquipoLocacion", e.target.value)} />
          </label>
          <label>
            Código máquina
            <input value={campos.codigoMaquina}
              onChange={(e) => actualizar("codigoMaquina", e.target.value)} />
          </label>
          <label>
            Estado máquina *
            <select required value={campos.estadoMaquina}
              onChange={(e) => actualizar("estadoMaquina", e.target.value)}>
              <option value="">Selecciona estado</option>
              {ESTADOS_MAQUINA.map((estado) => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </select>
          </label>
        </div>

        <fieldset className="correctivo-form__tipos">
          <legend>Tipo de solicitud * (puedes marcar varios)</legend>
          <div>
            {TIPOS_SOLICITUD.map((tipo) => (
              <label key={tipo} className="check-tipo">
                <input
                  type="checkbox"
                  checked={tipos.includes(tipo)}
                  onChange={() => alternarTipo(tipo)}
                />{" "}
                {tipo.charAt(0) + tipo.slice(1).toLowerCase()}
              </label>
            ))}
          </div>
        </fieldset>

        <SelectorPersonal
          personal={personal}
          seleccionados={personalIds}
          onChange={manejarPersonalIds}
          leyenda="Técnicos responsables * (puedes marcar 2 o más)"
        />

        <div className="correctivo-form__grid">
          <label className="correctivo-form__completa">
            Descripción de solicitud *
            <textarea required rows={2} value={campos.descripcionSolicitud}
              onChange={(e) => actualizar("descripcionSolicitud", e.target.value)} />
          </label>
          <label className="correctivo-form__completa">
            Solución
            <textarea rows={2} value={campos.solucionSolicitud}
              onChange={(e) => actualizar("solucionSolicitud", e.target.value)} />
          </label>
          <label>
            Fecha cierre
            <input type="date" value={campos.fechaCierre}
              onChange={(e) => actualizar("fechaCierre", e.target.value)} />
          </label>
          <label>
            Hora cierre
            <input type="time" value={campos.horaCierre}
              onChange={(e) => actualizar("horaCierre", e.target.value)} />
          </label>
          <label>
            Quién revisa
            <input value={campos.quienRevisa}
              onChange={(e) => actualizar("quienRevisa", e.target.value)}
              placeholder="Se completa con los técnicos seleccionados"
            />
          </label>
        </div>

        <div className="correctivo-form__acciones">
          <button type="submit" className="btn btn--primario" disabled={guardando}>
            {guardando ? "Guardando..." : editandoId ? "Guardar cambios" : "Registrar solicitud"}
          </button>
          {editandoId && (
            <button type="button" className="btn" onClick={cancelarEdicion}>
              Cancelar edición
            </button>
          )}
        </div>
      </form>
      </SoloConPermiso>

      {!puede("crear.correctivo") && (
        <p className="correctivo__descripcion">Modo consulta: solo puedes ver las solicitudes.</p>
      )}

      {mensaje && <p className="correctivo__mensaje correctivo__mensaje--ok">{mensaje}</p>}
      {error && <p className="correctivo__mensaje correctivo__mensaje--error">{error}</p>}

      <div className="correctivo__filtros">
        <h2>Solicitudes ({registrosFiltrados.length})</h2>
        <div className="correctivo__filtros-acciones">
          <select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)}>
            <option value="">Todas las áreas</option>
            {AREAS_SISTEMA.map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
          <button
            className="btn"
            disabled={registrosFiltrados.length === 0}
            onClick={() => exportarCsv(registrosFiltrados)}
          >
            Exportar CSV
          </button>
        </div>
      </div>

      {cargando && <p>Cargando solicitudes...</p>}
      {!cargando && registrosFiltrados.length === 0 && (
        <p className="correctivo__vacio">No hay solicitudes registradas todavía.</p>
      )}

      {registrosFiltrados.length > 0 && (
        <div className="correctivo__tabla-contenedor">
          <table className="correctivo__tabla">
            <thead>
              <tr>
                <th>No.</th>
                <th>Fecha</th>
                <th>Área</th>
                <th>Máquina</th>
                <th>Técnicos</th>
                <th>Estado</th>
                <th>Tipo</th>
                <th>Descripción</th>
                <th>T. respuesta</th>
                <th>Cierre</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {registrosFiltrados.map((registro) => (
                <tr key={registro.id}>
                  <td>{registro.datos.numeroSolicitud}</td>
                  <td>{registro.fecha}</td>
                  <td>{registro.area}</td>
                  <td>
                    {registro.datos.maquinaEquipoLocacion}
                    {registro.datos.codigoMaquina && (
                      <span className="correctivo__codigo"> {registro.datos.codigoMaquina}</span>
                    )}
                  </td>
                  <td>{nombresTecnicos(registro)}</td>
                  <td>{registro.datos.estadoMaquina}</td>
                  <td>{registro.datos.tiposSolicitud.join(", ")}</td>
                  <td className="correctivo__descripcion-celda">
                    {registro.datos.descripcionSolicitud}
                  </td>
                  <td>{registro.datos.tiempoRespuesta || "—"}</td>
                  <td>{registro.datos.fechaCierre || "Abierta"}</td>
                  <td className="correctivo__acciones">
                    <SoloConPermiso permiso="crear.correctivo">
                      <button className="btn" onClick={() => iniciarEdicion(registro)}>
                        Editar
                      </button>
                    </SoloConPermiso>
                    <SoloConPermiso permiso="eliminar.registros">
                      <button className="btn btn--peligro" onClick={() => manejarEliminar(registro)}>
                        Eliminar
                      </button>
                    </SoloConPermiso>
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

export default CorrectivoPage;
