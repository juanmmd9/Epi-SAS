import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AREAS_CON_PM, areaTienePreventivo } from "../../lib/areas";
import { listarHojas } from "../hojas/hojasService";
import { filtrarHojasParaPreventivo, filtrarHojasPorArea, hojaEstaActiva } from "../hojas/hojasFiltro";
import type { HojaVida } from "../hojas/types";
import AvisoSetupPersonal from "../../components/setup/AvisoSetupPersonal";
import { listarPersonalActivo, existeTablaPersonal } from "../personal/personalService";
import { faltaTablaPersonal as esErrorTablaPersonal } from "../personal/personalSetup";
import SelectorPersonal from "../personal/SelectorPersonal";
import {
  construirDatosPersonal,
  idsDesdeRegistroPreventivo,
  nombresPersonalEnRegistro,
} from "../personal/personalVinculo";
import type { Persona } from "../personal/types";
import {
  actualizarPreventivo,
  crearPreventivo,
  eliminarPreventivo,
  listarPreventivo,
} from "./preventivoService";
import type { PrefillMtre045DesdePreventivo } from "../formatos/mtre045Types";
import type { RegistroPreventivo } from "./types";
import "./preventivo.css";

const formularioVacio = {
  area: "",
  maquinaId: "",
  fecha: "",
  descripcion: "",
};

interface EstadoNavegacion {
  registrarPm?: { maquinaId: string; area: string; fecha: string };
}

function PreventivoPage() {
  const ubicacion = useLocation();
  const navigate = useNavigate();
  const [registros, setRegistros] = useState<RegistroPreventivo[]>([]);
  const [maquinas, setMaquinas] = useState<HojaVida[]>([]);
  const [personal, setPersonal] = useState<Persona[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [campos, setCampos] = useState(formularioVacio);
  const [personalIds, setPersonalIds] = useState<string[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [filtroArea, setFiltroArea] = useState("");
  const [faltaTablaPersonal, setFaltaTablaPersonal] = useState(false);

  useEffect(() => {
    setCargando(true);
    setError(null);
    Promise.all([listarPreventivo(), listarHojas()])
      .then(([regs, hojas]) => {
        setRegistros(regs);
        setMaquinas(hojas);
      })
      .catch((e: Error) => setError("No se pudieron cargar los datos: " + e.message))
      .finally(() => setCargando(false));

    listarPersonalActivo()
      .then((tecnicos) => {
        setPersonal(tecnicos);
        setFaltaTablaPersonal(false);
      })
      .catch((e: Error) => {
        setPersonal([]);
        if (esErrorTablaPersonal(e.message)) setFaltaTablaPersonal(true);
      });

    existeTablaPersonal()
      .then((ok) => setFaltaTablaPersonal(!ok))
      .catch(() => setFaltaTablaPersonal(true));
  }, []);

  // Precarga del formulario al llegar desde el panel de inicio (clic en una cita)
  useEffect(() => {
    const estado = ubicacion.state as EstadoNavegacion | null;
    if (!estado?.registrarPm) return;
    const { maquinaId, area, fecha } = estado.registrarPm;
    setEditandoId(null);
    setCampos({ area, maquinaId, fecha, descripcion: "" });
    setPersonalIds([]);
    setMensaje("Datos cargados desde el panel de inicio. Completa la actividad y guarda.");
    window.history.replaceState({}, "");
  }, [ubicacion.state]);

  const maquinasDelArea = useMemo(
    () => filtrarHojasParaPreventivo(maquinas, campos.area, campos.maquinaId),
    [maquinas, campos.area, campos.maquinaId],
  );

  const maquinasInactivasEnArea = useMemo(() => {
    if (!campos.area) return 0;
    return filtrarHojasPorArea(maquinas, campos.area).filter(
      (m) => areaTienePreventivo(m.area) && !hojaEstaActiva(m),
    ).length;
  }, [maquinas, campos.area]);

  const registrosFiltrados = useMemo(
    () => (filtroArea ? registros.filter((r) => r.area === filtroArea) : registros),
    [registros, filtroArea],
  );

  function nombreMaquina(registro: RegistroPreventivo): string {
    const maquina = maquinas.find((m) => m.id === registro.hoja_id);
    if (maquina) return `${maquina.nombre} (${maquina.codigo ?? "sin código"})`;
    return registro.datos.equipo ?? "Máquina eliminada";
  }

  function nombresTecnicos(registro: RegistroPreventivo): string {
    const ids = idsDesdeRegistroPreventivo(registro);
    return nombresPersonalEnRegistro(ids, personal, registro.datos.personalNombres);
  }

  function iniciarEdicion(registro: RegistroPreventivo) {
    setEditandoId(registro.id);
    setCampos({
      area: registro.area,
      maquinaId: registro.hoja_id ?? "",
      fecha: registro.fecha,
      descripcion: registro.descripcion ?? "",
    });
    setPersonalIds(idsDesdeRegistroPreventivo(registro));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setCampos(formularioVacio);
    setPersonalIds([]);
  }

  function construirPrefillMtre045(registro: RegistroPreventivo): PrefillMtre045DesdePreventivo {
    const hoja = maquinas.find((m) => m.id === registro.hoja_id);
    return {
      preventivoId: registro.id,
      numeroReporte: registro.id.slice(0, 8).toUpperCase(),
      fecha: registro.fecha,
      equipo: hoja?.nombre ?? registro.datos.equipo ?? "",
      marca: hoja?.datos.marca ?? "",
      serie: hoja?.datos.serial ?? hoja?.codigo ?? "",
      area: registro.area,
      actividadRealizada: registro.descripcion ?? "",
      responsableMantenimiento: nombresTecnicos(registro),
      mtre045: registro.datos.mtre045,
    };
  }

  function abrirMtre045(registro: RegistroPreventivo) {
    navigate("/formatos/mt-re-045", { state: { mtre045: construirPrefillMtre045(registro) } });
  }

  function abrirMtre045FormularioActual() {
    if (!editandoId) {
      setError("Guarda el registro primero para abrir el MT-RE-045 con el número vinculado.");
      return;
    }
    const registro = registros.find((r) => r.id === editandoId);
    if (registro) abrirMtre045(registro);
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

    if (personal.length > 0 && personalIds.length === 0) {
      setError("Selecciona al menos un técnico que realizó la actividad.");
      return;
    }

    const idsValidos = personalIds.filter((id) => personal.some((p) => p.id === id));
    if (personalIds.length > 0 && idsValidos.length === 0) {
      setError("Los técnicos seleccionados no son válidos.");
      return;
    }

    setGuardando(true);
    try {
      const datosPersonal = construirDatosPersonal(idsValidos, personal);
      const input = {
        hoja_id: maquina.id,
        ...(datosPersonal.personalId ? { personal_id: datosPersonal.personalId } : {}),
        area: maquina.area,
        fecha: campos.fecha,
        descripcion: campos.descripcion.trim(),
        datos: {
          equipo: maquina.nombre,
          ...datosPersonal,
        },
      };

      if (editandoId) {
        const actualizado = await actualizarPreventivo(editandoId, input);
        setRegistros((previos) =>
          previos.map((r) => (r.id === actualizado.id ? actualizado : r)),
        );
        setMensaje(
          "Registro actualizado. Abra el formato MT-RE-045 para imprimir el reporte.",
        );
      } else {
        const creado = await crearPreventivo(input);
        setRegistros((previos) => [creado, ...previos]);
        setEditandoId(creado.id);
        setMensaje(
          "Registro guardado. Abra el formato MT-RE-045 para imprimir el reporte.",
        );
        return;
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
        Registro de actividades preventivas. Los datos quedan en el sistema; use el formato{" "}
        <strong>MT-RE-045</strong> para imprimir el reporte y archive el documento firmado.{" "}
        <Link to="/preventivo/cronograma">Ver cronograma anual</Link>
        {" · "}
        <Link to="/personal">Gestionar personal</Link>
      </p>

      {faltaTablaPersonal && (
        <AvisoSetupPersonal titulo="Para asignar técnicos, crea primero la tabla personal en Supabase" />
      )}

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
                  {!hojaEstaActiva(m) ? " — inactiva" : ""}
                </option>
              ))}
            </select>
            {campos.area && maquinasDelArea.length === 0 && (
              <span className="preventivo-form__ayuda">
                {maquinas.length === 0
                  ? "No hay máquinas en hojas de vida. Regístralas primero."
                  : maquinasInactivasEnArea > 0
                    ? `Hay ${maquinasInactivasEnArea} máquina(s) inactiva(s) en esta área. Reactívalas en Hojas de vida.`
                    : `No hay máquinas activas en ${campos.area}. Revisa el área asignada en Hojas de vida.`}
              </span>
            )}
          </label>

          <SelectorPersonal
            personal={personal}
            seleccionados={personalIds}
            onChange={setPersonalIds}
            disabled={faltaTablaPersonal}
            leyenda={
              personal.length > 0
                ? "Realizado por * (puedes marcar 2 o más técnicos)"
                : "Realizado por (opcional — registra personal primero)"
            }
          />

          <label>
            Fecha *
            <input
              required
              type="date"
              value={campos.fecha}
              onChange={(e) => setCampos((c) => ({ ...c, fecha: e.target.value }))}
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
          <button
            type="button"
            className="btn"
            disabled={guardando || !editandoId}
            onClick={abrirMtre045FormularioActual}
          >
            MT-RE-045
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
                <th>Técnicos</th>
                <th>Actividad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {registrosFiltrados.map((registro) => (
                <tr key={registro.id}>
                  <td>{registro.fecha}</td>
                  <td>{registro.area}</td>
                  <td>{nombreMaquina(registro)}</td>
                  <td>{nombresTecnicos(registro)}</td>
                  <td>{registro.descripcion}</td>
                  <td className="preventivo__acciones">
                    <button className="btn" onClick={() => abrirMtre045(registro)}>
                      MT-RE-045
                    </button>
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
