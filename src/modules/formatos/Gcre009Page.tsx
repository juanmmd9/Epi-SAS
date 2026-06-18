import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { AREAS_SISTEMA } from "../../lib/areas";
import { imprimirPdf } from "../../lib/imprimirPdf";
import {
  generarPdfGcRe009,
  obtenerPdfRegistro,
  urlVistaPreviaPdf,
} from "./gcre009Pdf";
import {
  eliminarNoConformidad,
  guardarNoConformidad,
  listarNoConformidades,
} from "./formatosService";
import {
  filaPlanVacia,
  filaSeguimientoVacia,
  formularioNcVacio,
  ORIGENES_NC,
  prefillDesdeIndicador,
  type PrefillDesdeIndicador,
  type RegistroNc,
  type RegistroNcDatos,
} from "./types";
import "./formatos.css";

interface EstadoNavegacion {
  nc?: PrefillDesdeIndicador;
}

function Gcre009Page() {
  const ubicacion = useLocation();
  const [datos, setDatos] = useState<RegistroNcDatos>(formularioNcVacio());
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [numeroActual, setNumeroActual] = useState<number | null>(null);
  const [registros, setRegistros] = useState<RegistroNc[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);
  const [cargandoPdfId, setCargandoPdfId] = useState<string | null>(null);
  const previewAnterior = useRef<string | null>(null);
  const previewRef = useRef<HTMLElement>(null);

  useEffect(() => {
    listarNoConformidades()
      .then(setRegistros)
      .catch((e: Error) => setError("No se pudieron cargar los registros: " + e.message));
  }, []);

  useEffect(() => {
    const estado = ubicacion.state as EstadoNavegacion | null;
    if (!estado?.nc) return;
    setEditandoId(null);
    setNumeroActual(null);
    setDatos(prefillDesdeIndicador(estado.nc));
    setMensaje("Formulario precargado desde indicadores. Complete y guarde.");
    window.history.replaceState({}, "");
  }, [ubicacion.state]);

  useEffect(() => {
    return () => {
      if (previewAnterior.current) URL.revokeObjectURL(previewAnterior.current);
    };
  }, []);

  function actualizarDatos(cambios: Partial<RegistroNcDatos>) {
    setDatos((previos) => ({ ...previos, ...cambios }));
  }

  function limpiarFormulario() {
    setEditandoId(null);
    setNumeroActual(null);
    setDatos(formularioNcVacio());
    setMensaje(null);
    setError(null);
  }

  function cerrarVistaPrevia() {
    if (previewAnterior.current) URL.revokeObjectURL(previewAnterior.current);
    previewAnterior.current = null;
    setPdfPreview(null);
  }

  function nuevoRegistro() {
    limpiarFormulario();
    cerrarVistaPrevia();
  }

  function cargarRegistro(registro: RegistroNc) {
    setEditandoId(registro.id);
    setNumeroActual(registro.numero);
    setDatos(registro.datos);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function mostrarPreview(pdfBytes: Uint8Array) {
    if (previewAnterior.current) URL.revokeObjectURL(previewAnterior.current);
    const url = urlVistaPreviaPdf(pdfBytes);
    previewAnterior.current = url;
    setPdfPreview(url);
    requestAnimationFrame(() => {
      previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function manejarGuardar(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    setMensaje(null);

    if (!datos.area || !datos.fechaDeteccion || !datos.descripcion.trim()) {
      setError("Completa área, fecha de detección y descripción.");
      return;
    }

    setGuardando(true);
    try {
      const registro = await guardarNoConformidad(datos, editandoId);
      setRegistros((previos) => {
        const sinActual = previos.filter((r) => r.id !== registro.id);
        return [registro, ...sinActual];
      });
      setEditandoId(registro.id);
      setNumeroActual(registro.numero);
      setMensaje(
        `Registro No. ${registro.numero} guardado. Use «Imprimir formato» y archive el papel en carpeta física.`,
      );
    } catch (e) {
      setError("No fue posible guardar: " + (e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  async function manejarImprimir() {
    setError(null);
    if (!numeroActual) {
      setError("Guarda el permiso primero para obtener el número oficial antes de imprimir.");
      return;
    }
    setCargandoPdfId(editandoId ?? "formulario");
    try {
      const pdfBytes = await generarPdfGcRe009(datos, numeroActual);
      mostrarPreview(pdfBytes);
      imprimirPdf(pdfBytes);
    } catch (e) {
      setError("No se pudo generar el formato para imprimir: " + (e as Error).message);
    } finally {
      setCargandoPdfId(null);
    }
  }

  async function imprimirRegistro(registro: RegistroNc) {
    setError(null);
    setCargandoPdfId(registro.id);
    try {
      const pdfBytes = await obtenerPdfRegistro(registro);
      mostrarPreview(pdfBytes);
      imprimirPdf(pdfBytes);
    } catch (e) {
      setError("No se pudo generar el formato para imprimir: " + (e as Error).message);
    } finally {
      setCargandoPdfId(null);
    }
  }

  async function eliminarRegistro(registro: RegistroNc) {
    if (!window.confirm(`¿Eliminar el registro GC-RE-009 No. ${registro.numero}?`)) return;
    try {
      await eliminarNoConformidad(registro.id);
      setRegistros((previos) => previos.filter((r) => r.id !== registro.id));
      if (editandoId === registro.id) nuevoRegistro();
    } catch (e) {
      setError("No fue posible eliminar: " + (e as Error).message);
    }
  }

  return (
    <section className="formatos">
      <header className="formatos__cabecera">
        <div>
          <Link to="/formatos" className="btn">← Volver a formatos</Link>
          <h1>GC-RE-009 — No conformidades y acciones correctivas</h1>
          <p className="formatos__descripcion">
            Complete el formulario y pulse <strong>Guardar</strong>. Los datos quedan en el
            sistema; cuando necesite el formato oficial use <strong>Imprimir</strong> y archive
            el documento firmado en carpeta física.
          </p>
        </div>
        <button type="button" className="btn" onClick={nuevoRegistro}>
          Nuevo registro
        </button>
      </header>

      {datos.origenIndicador && (
        <p className="formatos__aviso-indicador">
          Vinculado a indicador: {datos.origenIndicador.indicador} ({datos.origenIndicador.mes}/
          {datos.origenIndicador.anio}) — meta {datos.origenIndicador.meta}, valor{" "}
          {datos.origenIndicador.valor}.
        </p>
      )}

      <div className="formatos__layout">
        <div className="formatos__formulario">
          <form className="gcre-form" onSubmit={(e) => void manejarGuardar(e)}>
            <div className="gcre-form__grid-3">
              <label>
                No. registro
                <input type="text" readOnly value={numeroActual ?? "Nuevo"} />
              </label>
              <label>
                Área *
                <select
                  required
                  value={datos.area}
                  onChange={(e) => actualizarDatos({ area: e.target.value })}
                >
                  <option value="">Seleccione</option>
                  {AREAS_SISTEMA.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </label>
              <label>
                Fecha de detección *
                <input
                  required
                  type="date"
                  value={datos.fechaDeteccion}
                  onChange={(e) => actualizarDatos({ fechaDeteccion: e.target.value })}
                />
              </label>
            </div>

            <fieldset>
              <legend>Origen de la no conformidad</legend>
              <div className="gcre-form__origen">
                {ORIGENES_NC.map((o) => (
                  <label key={o.clave}>
                    <input
                      type="radio"
                      name="origen"
                      value={o.clave}
                      checked={datos.origen === o.clave}
                      onChange={() => actualizarDatos({ origen: o.clave })}
                    />{" "}
                    {o.etiqueta}
                  </label>
                ))}
              </div>
            </fieldset>

            <label>
              Descripción de la no conformidad *
              <textarea
                required
                rows={3}
                value={datos.descripcion}
                onChange={(e) => actualizarDatos({ descripcion: e.target.value })}
              />
            </label>

            <div className="gcre-form__grid-2">
              <label>
                Detectada por (nombre)
                <input
                  value={datos.detectadaPorNombre}
                  onChange={(e) => actualizarDatos({ detectadaPorNombre: e.target.value })}
                />
              </label>
              <label>
                Cargo
                <input
                  value={datos.detectadaPorCargo}
                  onChange={(e) => actualizarDatos({ detectadaPorCargo: e.target.value })}
                />
              </label>
            </div>

            <fieldset>
              <legend>Tratamiento inmediato / corrección</legend>
              <label>
                Acción inmediata
                <textarea
                  rows={2}
                  value={datos.tratamientoInmediato}
                  onChange={(e) => actualizarDatos({ tratamientoInmediato: e.target.value })}
                />
              </label>
              <div className="gcre-form__grid-2">
                <label>
                  Ejecutado por
                  <input
                    value={datos.tratamientoInmediatoPor}
                    onChange={(e) => actualizarDatos({ tratamientoInmediatoPor: e.target.value })}
                  />
                </label>
                <label>
                  Fecha
                  <input
                    type="date"
                    value={datos.tratamientoInmediatoFecha}
                    onChange={(e) => actualizarDatos({ tratamientoInmediatoFecha: e.target.value })}
                  />
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend>Análisis de causa raíz</legend>
              <label>
                Herramienta utilizada
                <input
                  placeholder="Ej. Ishikawa, 5 por qué"
                  value={datos.herramientaCausa}
                  onChange={(e) => actualizarDatos({ herramientaCausa: e.target.value })}
                />
              </label>
              <label>
                Resumen del análisis
                <textarea
                  rows={2}
                  value={datos.resumenCausa}
                  onChange={(e) => actualizarDatos({ resumenCausa: e.target.value })}
                />
              </label>
              <div className="gcre-form__grid-2">
                <label>
                  Tratamiento ejecutado por
                  <input
                    value={datos.analisisPor}
                    onChange={(e) => actualizarDatos({ analisisPor: e.target.value })}
                  />
                </label>
                <label>
                  Fecha
                  <input
                    type="date"
                    value={datos.analisisFecha}
                    onChange={(e) => actualizarDatos({ analisisFecha: e.target.value })}
                  />
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend>Determinación y plan de acción</legend>
              <div className="gcre-form__radio-inline">
                <span>¿Requiere acción correctiva formal?</span>
                <label>
                  <input
                    type="radio"
                    name="requiereAccionFormal"
                    value="si"
                    checked={datos.requiereAccionFormal === "si"}
                    onChange={() => actualizarDatos({ requiereAccionFormal: "si" })}
                  />{" "}
                  Sí
                </label>
                <label>
                  <input
                    type="radio"
                    name="requiereAccionFormal"
                    value="no"
                    checked={datos.requiereAccionFormal === "no"}
                    onChange={() => actualizarDatos({ requiereAccionFormal: "no" })}
                  />{" "}
                  No
                </label>
              </div>
              <table className="gcre-form__tabla">
                <thead>
                  <tr>
                    <th>Actividad</th>
                    <th>Responsable</th>
                    <th>Fecha entrega</th>
                    <th>Evidencia</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.planAccion.map((fila, indice) => (
                    <tr key={indice}>
                      <td>
                        <input
                          value={fila.actividad}
                          onChange={(e) => {
                            const plan = [...datos.planAccion];
                            plan[indice] = { ...fila, actividad: e.target.value };
                            actualizarDatos({ planAccion: plan });
                          }}
                        />
                      </td>
                      <td>
                        <input
                          value={fila.responsable}
                          onChange={(e) => {
                            const plan = [...datos.planAccion];
                            plan[indice] = { ...fila, responsable: e.target.value };
                            actualizarDatos({ planAccion: plan });
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          value={fila.fechaEntrega}
                          onChange={(e) => {
                            const plan = [...datos.planAccion];
                            plan[indice] = { ...fila, fechaEntrega: e.target.value };
                            actualizarDatos({ planAccion: plan });
                          }}
                        />
                      </td>
                      <td>
                        <input
                          value={fila.evidencia}
                          onChange={(e) => {
                            const plan = [...datos.planAccion];
                            plan[indice] = { ...fila, evidencia: e.target.value };
                            actualizarDatos({ planAccion: plan });
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                type="button"
                className="btn"
                onClick={() =>
                  actualizarDatos({ planAccion: [...datos.planAccion, filaPlanVacia()] })
                }
              >
                + Agregar fila al plan
              </button>
            </fieldset>

            <fieldset>
              <legend>Seguimiento, eficacia y cierre</legend>
              <label>
                ¿Se cumplieron las actividades en las fechas propuestas?
                <input
                  value={datos.seguimientoCumplimiento}
                  onChange={(e) => actualizarDatos({ seguimientoCumplimiento: e.target.value })}
                />
              </label>
              <label>
                ¿Fueron eficaces las acciones tomadas?
                <input
                  value={datos.seguimientoEficacia}
                  onChange={(e) => actualizarDatos({ seguimientoEficacia: e.target.value })}
                />
              </label>
              <table className="gcre-form__tabla">
                <thead>
                  <tr>
                    <th>Actividad</th>
                    <th>Cumplido</th>
                    <th>¿Fue eficaz?</th>
                    <th>¿Por qué?</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.seguimientoFilas.map((fila, indice) => (
                    <tr key={indice}>
                      <td>
                        <input
                          value={fila.actividad}
                          onChange={(e) => {
                            const filas = [...datos.seguimientoFilas];
                            filas[indice] = { ...fila, actividad: e.target.value };
                            actualizarDatos({ seguimientoFilas: filas });
                          }}
                        />
                      </td>
                      <td>
                        <select
                          value={fila.cumplido}
                          onChange={(e) => {
                            const filas = [...datos.seguimientoFilas];
                            filas[indice] = {
                              ...fila,
                              cumplido: e.target.value as "" | "si" | "no",
                            };
                            actualizarDatos({ seguimientoFilas: filas });
                          }}
                        >
                          <option value="">—</option>
                          <option value="si">SI</option>
                          <option value="no">NO</option>
                        </select>
                      </td>
                      <td>
                        <select
                          value={fila.fueEficaz}
                          onChange={(e) => {
                            const filas = [...datos.seguimientoFilas];
                            filas[indice] = {
                              ...fila,
                              fueEficaz: e.target.value as "" | "si" | "no",
                            };
                            actualizarDatos({ seguimientoFilas: filas });
                          }}
                        >
                          <option value="">—</option>
                          <option value="si">SI</option>
                          <option value="no">NO</option>
                        </select>
                      </td>
                      <td>
                        <input
                          value={fila.porque}
                          onChange={(e) => {
                            const filas = [...datos.seguimientoFilas];
                            filas[indice] = { ...fila, porque: e.target.value };
                            actualizarDatos({ seguimientoFilas: filas });
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                type="button"
                className="btn"
                onClick={() =>
                  actualizarDatos({
                    seguimientoFilas: [...datos.seguimientoFilas, filaSeguimientoVacia()],
                  })
                }
              >
                + Agregar fila de seguimiento
              </button>
              <div className="gcre-form__grid-2">
                <label>
                  Verificado por (nombre)
                  <input
                    value={datos.verificadoPorNombre}
                    onChange={(e) => actualizarDatos({ verificadoPorNombre: e.target.value })}
                  />
                </label>
                <label>
                  Cargo
                  <input
                    value={datos.verificadoPorCargo}
                    onChange={(e) => actualizarDatos({ verificadoPorCargo: e.target.value })}
                  />
                </label>
              </div>
              <div className="gcre-form__radio-inline">
                <span>¿El tratamiento fue eficaz?</span>
                <label>
                  <input
                    type="radio"
                    name="tratamientoEficaz"
                    value="si"
                    checked={datos.tratamientoEficaz === "si"}
                    onChange={() => actualizarDatos({ tratamientoEficaz: "si" })}
                  />{" "}
                  Sí
                </label>
                <label>
                  <input
                    type="radio"
                    name="tratamientoEficaz"
                    value="no"
                    checked={datos.tratamientoEficaz === "no"}
                    onChange={() => actualizarDatos({ tratamientoEficaz: "no" })}
                  />{" "}
                  No
                </label>
              </div>
              <label>
                ¿Por qué?
                <textarea
                  rows={2}
                  value={datos.tratamientoEficazPorque}
                  onChange={(e) => actualizarDatos({ tratamientoEficazPorque: e.target.value })}
                />
              </label>
            </fieldset>

            <div className="gcre-form__acciones">
              <button type="submit" className="btn btn--primario" disabled={guardando}>
                {guardando ? "Guardando..." : editandoId ? "Guardar cambios" : "Guardar"}
              </button>
              <button
                type="button"
                className="btn"
                disabled={guardando || cargandoPdfId === (editandoId ?? "formulario")}
                onClick={() => void manejarImprimir()}
              >
                {cargandoPdfId === (editandoId ?? "formulario") ? "Generando..." : "Imprimir formato"}
              </button>
            </div>
          </form>

          {mensaje && <p className="formatos__mensaje formatos__mensaje--ok">{mensaje}</p>}
          {error && <p className="formatos__mensaje formatos__mensaje--error">{error}</p>}
        </div>

        <aside className="formatos__lista">
          <h2>Registros guardados</h2>
          <p className="formatos__plantilla">
            Plantilla en blanco:{" "}
            <a href="/templates/GC-RE-009-v2.pdf" target="_blank" rel="noreferrer">
              GC-RE-009-v2.pdf
            </a>
          </p>
          {registros.length === 0 && (
            <p className="formatos__vacio">Aún no hay registros GC-RE-009.</p>
          )}
          {registros.map((registro) => (
            <article key={registro.id} className="item-nc">
              <div>
                <strong>
                  No. {registro.numero} — {registro.datos.area}
                </strong>
                <p>
                  {registro.datos.fechaDeteccion} · {registro.datos.origen} ·{" "}
                  {registro.datos.descripcion.slice(0, 80)}
                  {registro.datos.descripcion.length > 80 ? "..." : ""}
                </p>
              </div>
              <div className="item-nc__acciones">
                <button
                  className="btn"
                  disabled={cargandoPdfId === registro.id}
                  onClick={() => void imprimirRegistro(registro)}
                >
                  {cargandoPdfId === registro.id ? "Generando..." : "Imprimir"}
                </button>
                <button className="btn" onClick={() => cargarRegistro(registro)}>Editar</button>
                <button className="btn btn--peligro" onClick={() => eliminarRegistro(registro)}>
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </aside>
      </div>

      {pdfPreview && (
        <section className="formatos__preview" ref={previewRef}>
          <div className="formatos__preview-cabecera">
            <h2>Vista previa para impresión</h2>
            <a className="btn" href={pdfPreview} target="_blank" rel="noreferrer">
              Abrir en pestaña nueva
            </a>
          </div>
          <object
            data={pdfPreview}
            type="application/pdf"
            className="formatos__preview-doc"
          >
            <p>
              Tu navegador no puede mostrar el PDF aquí.{" "}
              <a href={pdfPreview} target="_blank" rel="noreferrer">
                Ábrelo en una pestaña nueva
              </a>
              .
            </p>
          </object>
        </section>
      )}
    </section>
  );
}

export default Gcre009Page;
