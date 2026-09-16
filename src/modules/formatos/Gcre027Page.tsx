import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { rutaPublica } from "../../lib/rutaPublica";
import "../../components/setup/avisoSetupPersonal.css";
import { descargarBlob, generarExcelGcRe027, nombreArchivoGc027 } from "./gcre027Excel";
import {
  eliminarGestionCambio,
  esErrorTablaGestionCambio,
  guardarGestionCambio,
  listarGestionCambio,
  SQL_MIGRACION_GESTION_CAMBIO,
} from "./gcre027Service";
import {
  filaPlanCambioVacia,
  formularioGc027Vacio,
  MAX_ACTIVIDADES_PLAN,
  normalizarDatosGc027,
  prefillPortalMantenimiento,
  type FilaPlanCambio,
  type RegistroGc027,
  type RegistroGc027Datos,
} from "./gcre027Types";
import "./formatos.css";

function AvisoSetupGestionCambio() {
  const projectRef =
    import.meta.env.VITE_SUPABASE_URL?.match(/https:\/\/([^.]+)\./)?.[1] ?? "_";
  const urlSql = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;

  function copiarSql() {
    void navigator.clipboard.writeText(SQL_MIGRACION_GESTION_CAMBIO);
  }

  return (
    <aside className="aviso-setup-personal">
      <h3>Falta crear la tabla de GC-RE-027 en Supabase</h3>
      <p>Ejecuta este script en SQL Editor para guardar registros de gestión del cambio.</p>
      <div className="aviso-setup-personal__acciones">
        <button type="button" className="btn" onClick={copiarSql}>
          Copiar script SQL
        </button>
        <a className="btn btn--primario" href={urlSql} target="_blank" rel="noreferrer">
          Abrir SQL Editor
        </a>
      </div>
      <pre className="aviso-setup-personal__sql">{SQL_MIGRACION_GESTION_CAMBIO}</pre>
    </aside>
  );
}

function Gcre027Page() {
  const [datos, setDatos] = useState<RegistroGc027Datos>(formularioGc027Vacio());
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [numeroActual, setNumeroActual] = useState<number | null>(null);
  const [registros, setRegistros] = useState<RegistroGc027[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [faltaTabla, setFaltaTabla] = useState(false);

  useEffect(() => {
    listarGestionCambio()
      .then(setRegistros)
      .catch((e: Error) => {
        if (esErrorTablaGestionCambio(e.message)) setFaltaTabla(true);
        setError("No se pudieron cargar los registros: " + e.message);
      });
  }, []);

  function actualizarDatos(cambios: Partial<RegistroGc027Datos>) {
    setDatos((prev) => ({ ...prev, ...cambios }));
  }

  function actualizarPlan(indice: number, cambios: Partial<FilaPlanCambio>) {
    setDatos((prev) => {
      const plan = prev.plan.map((fila, i) => (i === indice ? { ...fila, ...cambios } : fila));
      return { ...prev, plan };
    });
  }

  function agregarActividad() {
    setDatos((prev) => {
      if (prev.plan.length >= MAX_ACTIVIDADES_PLAN) return prev;
      return { ...prev, plan: [...prev.plan, filaPlanCambioVacia()] };
    });
  }

  function quitarActividad(indice: number) {
    setDatos((prev) => {
      if (prev.plan.length <= 1) return prev;
      return { ...prev, plan: prev.plan.filter((_, i) => i !== indice) };
    });
  }

  function limpiarFormulario() {
    setEditandoId(null);
    setNumeroActual(null);
    setDatos(formularioGc027Vacio());
    setMensaje(null);
    setError(null);
  }

  function cargarRegistro(registro: RegistroGc027) {
    setEditandoId(registro.id);
    setNumeroActual(registro.numero);
    setDatos(normalizarDatosGc027(registro.datos));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cargarEjemploPortal() {
    setEditandoId(null);
    setNumeroActual(null);
    setDatos(prefillPortalMantenimiento());
    setMensaje(
      "Formulario precargado con el Portal de Mantenimiento. Revisa, guarda como registro y descarga el Excel.",
    );
    setError(null);
  }

  async function manejarGuardar(evento: FormEvent) {
    evento.preventDefault();
    setGuardando(true);
    setMensaje(null);
    setError(null);
    try {
      if (!datos.proceso.trim() || !datos.responsable.trim()) {
        throw new Error("Proceso y responsable son obligatorios.");
      }
      if (!datos.descripcion.trim()) {
        throw new Error("La descripción del cambio es obligatoria.");
      }
      const guardado = await guardarGestionCambio(datos, editandoId);
      setEditandoId(guardado.id);
      setNumeroActual(guardado.numero);
      setRegistros((prev) => {
        const sin = prev.filter((r) => r.id !== guardado.id);
        return [guardado, ...sin].sort((a, b) => b.numero - a.numero);
      });
      setMensaje(
        editandoId
          ? `Registro GC-RE-027 No. ${guardado.numero} actualizado.`
          : `Registro GC-RE-027 No. ${guardado.numero} guardado.`,
      );
      setFaltaTabla(false);
    } catch (e) {
      const msg = (e as Error).message;
      if (esErrorTablaGestionCambio(msg)) setFaltaTabla(true);
      setError("No se pudo guardar: " + msg);
    } finally {
      setGuardando(false);
    }
  }

  async function manejarEliminar(registro: RegistroGc027) {
    if (!window.confirm(`¿Eliminar el registro GC-RE-027 No. ${registro.numero}?`)) return;
    try {
      await eliminarGestionCambio(registro.id);
      setRegistros((prev) => prev.filter((r) => r.id !== registro.id));
      if (editandoId === registro.id) limpiarFormulario();
      setMensaje(`Registro No. ${registro.numero} eliminado.`);
    } catch (e) {
      setError("No se pudo eliminar: " + (e as Error).message);
    }
  }

  async function manejarDescargarExcel() {
    setExportando(true);
    setError(null);
    try {
      const blob = await generarExcelGcRe027(datos, numeroActual);
      descargarBlob(blob, nombreArchivoGc027(numeroActual));
      setMensaje("Excel GC-RE-027 descargado.");
    } catch (e) {
      setError("No se pudo generar el Excel: " + (e as Error).message);
    } finally {
      setExportando(false);
    }
  }

  const urlEjemplo = rutaPublica("/templates/GC-RE-027-Portal-Mantenimiento.xlsx");

  return (
    <section className="formatos">
      <header className="formatos__cabecera">
        <div>
          <Link to="/formatos" className="btn">
            ← Volver a formatos
          </Link>
          <h1>GC-RE-027 — Gestión del cambio</h1>
          <p className="formatos__descripcion">
            Registra cambios del SGC, guárdalos en el sistema y descarga el Excel oficial
            diligenciado.
          </p>
        </div>
        <div className="formatos__cabecera-acciones">
          <button type="button" className="btn" onClick={cargarEjemploPortal}>
            Cargar ejemplo Portal
          </button>
          <a className="btn" href={urlEjemplo} download>
            Descargar ejemplo Excel
          </a>
        </div>
      </header>

      {faltaTabla && <AvisoSetupGestionCambio />}

      <div className="formatos__layout">
        <div className="formatos__formulario">
          <form className="gcre-form" onSubmit={(e) => void manejarGuardar(e)}>
            <h3 className="gcre-form__seccion">Información general</h3>
            <div className="gcre-form__grid-3">
              <label>
                No. registro
                <input type="text" readOnly value={numeroActual ?? "Nuevo"} />
              </label>
              <label>
                Fecha de diligenciamiento *
                <input
                  type="date"
                  required
                  value={datos.fechaDiligenciamiento}
                  onChange={(e) => actualizarDatos({ fechaDiligenciamiento: e.target.value })}
                />
              </label>
              <label>
                Fecha última revisión
                <input
                  type="date"
                  value={datos.fechaUltimaRevision}
                  onChange={(e) => actualizarDatos({ fechaUltimaRevision: e.target.value })}
                />
              </label>
            </div>
            <div className="gcre-form__grid-2">
              <label>
                Proceso o área *
                <input
                  type="text"
                  required
                  value={datos.proceso}
                  onChange={(e) => actualizarDatos({ proceso: e.target.value })}
                />
              </label>
              <label>
                Responsable *
                <input
                  type="text"
                  required
                  value={datos.responsable}
                  onChange={(e) => actualizarDatos({ responsable: e.target.value })}
                />
              </label>
            </div>

            <h3 className="gcre-form__seccion">1. Descripción del cambio</h3>
            <label>
              Descripción *
              <textarea
                required
                rows={6}
                value={datos.descripcion}
                onChange={(e) => actualizarDatos({ descripcion: e.target.value })}
              />
            </label>

            <h3 className="gcre-form__seccion">2. Análisis de posibles riesgos</h3>
            <label>
              Riesgos
              <textarea
                rows={5}
                value={datos.riesgos}
                onChange={(e) => actualizarDatos({ riesgos: e.target.value })}
              />
            </label>

            <h3 className="gcre-form__seccion">3. Análisis de posibles oportunidades</h3>
            <label>
              Oportunidades
              <textarea
                rows={5}
                value={datos.oportunidades}
                onChange={(e) => actualizarDatos({ oportunidades: e.target.value })}
              />
            </label>

            <h3 className="gcre-form__seccion">4. Requisitos legales aplicables</h3>
            <label>
              Requisitos legales
              <textarea
                rows={4}
                value={datos.requisitosLegales}
                onChange={(e) => actualizarDatos({ requisitosLegales: e.target.value })}
              />
            </label>

            <h3 className="gcre-form__seccion">5. Análisis del impacto</h3>
            <label>
              Impacto
              <textarea
                rows={5}
                value={datos.impacto}
                onChange={(e) => actualizarDatos({ impacto: e.target.value })}
              />
            </label>

            <h3 className="gcre-form__seccion">6. Planeación del cambio</h3>
            <div className="gcre027-plan">
              {datos.plan.map((fila, indice) => (
                <fieldset key={indice} className="gcre027-plan__fila">
                  <div className="gcre027-plan__cabecera">
                    <legend>Actividad {indice + 1}</legend>
                    {datos.plan.length > 1 && (
                      <button
                        type="button"
                        className="btn gcre027-plan__quitar"
                        onClick={() => quitarActividad(indice)}
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                  <label>
                    Actividad
                    <textarea
                      rows={2}
                      value={fila.actividad}
                      onChange={(e) => actualizarPlan(indice, { actividad: e.target.value })}
                    />
                  </label>
                  <div className="gcre-form__grid-2">
                    <label>
                      Responsable
                      <input
                        type="text"
                        value={fila.responsable}
                        onChange={(e) => actualizarPlan(indice, { responsable: e.target.value })}
                      />
                    </label>
                    <label>
                      Comunicar cambio a
                      <input
                        type="text"
                        value={fila.comunicar}
                        onChange={(e) => actualizarPlan(indice, { comunicar: e.target.value })}
                      />
                    </label>
                    <label>
                      Fecha ejecución
                      <input
                        type="date"
                        value={fila.fechaEjecucion}
                        onChange={(e) =>
                          actualizarPlan(indice, { fechaEjecucion: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Fecha seguimiento
                      <input
                        type="date"
                        value={fila.fechaSeguimiento}
                        onChange={(e) =>
                          actualizarPlan(indice, { fechaSeguimiento: e.target.value })
                        }
                      />
                    </label>
                  </div>
                </fieldset>
              ))}
              <button
                type="button"
                className="btn gcre027-plan__agregar"
                onClick={agregarActividad}
                disabled={datos.plan.length >= MAX_ACTIVIDADES_PLAN}
              >
                + Agregar actividad
              </button>
              {datos.plan.length >= MAX_ACTIVIDADES_PLAN && (
                <p className="formatos__plantilla">
                  La plantilla Excel admite hasta {MAX_ACTIVIDADES_PLAN} actividades.
                </p>
              )}
            </div>

            <div className="gcre-form__acciones">
              <button type="submit" className="btn btn--primario" disabled={guardando}>
                {guardando
                  ? "Guardando..."
                  : editandoId
                    ? `Actualizar No. ${numeroActual}`
                    : "Guardar registro"}
              </button>
              <button
                type="button"
                className="btn"
                disabled={exportando}
                onClick={() => void manejarDescargarExcel()}
              >
                {exportando ? "Generando..." : "Descargar Excel"}
              </button>
              <button type="button" className="btn" onClick={limpiarFormulario}>
                Nuevo
              </button>
            </div>
          </form>

          {mensaje && <p className="formatos__mensaje formatos__mensaje--ok">{mensaje}</p>}
          {error && <p className="formatos__mensaje formatos__mensaje--error">{error}</p>}
        </div>

        <aside className="formatos__lista">
          <h2>Registros guardados</h2>
          <p className="formatos__plantilla">
            Plantilla oficial:{" "}
            <a href={rutaPublica("/templates/GC-RE-027.xlsx")} download>
              GC-RE-027.xlsx
            </a>
            . Ejemplo portal:{" "}
            <a href={urlEjemplo} download>
              GC-RE-027-Portal-Mantenimiento.xlsx
            </a>
            .
          </p>
          {registros.length === 0 ? (
            <p className="formatos__vacio">Aún no hay registros GC-RE-027.</p>
          ) : (
            registros.map((registro) => (
              <article key={registro.id} className="item-nc">
                <strong>
                  GC-RE-027 No. {registro.numero} — {registro.datos.proceso || "Sin proceso"}
                </strong>
                <p>
                  {registro.datos.fechaDiligenciamiento} ·{" "}
                  {(registro.datos.descripcion || "").slice(0, 70)}
                  {(registro.datos.descripcion || "").length > 70 ? "..." : ""}
                </p>
                <div className="item-nc__acciones">
                  <button type="button" className="btn" onClick={() => cargarRegistro(registro)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => void manejarEliminar(registro)}
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))
          )}
        </aside>
      </div>
    </section>
  );
}

export default Gcre027Page;
