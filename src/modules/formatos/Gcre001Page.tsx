import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { imprimirPdf } from "../../lib/imprimirPdf";
import {
  generarPdfGcRe001,
  obtenerPdfRegistroAm,
  urlVistaPreviaPdf,
} from "./gcre001Pdf";
import {
  eliminarAccionMejora,
  guardarAccionMejora,
  listarAccionesMejora,
} from "./gcre001Service";
import {
  formularioAmVacio,
  ORIGENES_MEJORA,
  prefillDesdeProyectoPortal,
  prefillDesdeRiesgo,
  type PrefillDesdeRiesgo,
  type RegistroAm,
  type RegistroAmDatos,
} from "./gcre001Types";
import { filaPlanVacia } from "./types";
import "./formatos.css";

interface EstadoNavegacion {
  mejora?: PrefillDesdeRiesgo;
}

function Gcre001Page() {
  const ubicacion = useLocation();
  const [datos, setDatos] = useState<RegistroAmDatos>(formularioAmVacio());
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [numeroActual, setNumeroActual] = useState<number | null>(null);
  const [registros, setRegistros] = useState<RegistroAm[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);
  const [cargandoPdfId, setCargandoPdfId] = useState<string | null>(null);
  const previewAnterior = useRef<string | null>(null);
  const previewRef = useRef<HTMLElement>(null);

  useEffect(() => {
    listarAccionesMejora()
      .then(setRegistros)
      .catch((e: Error) => setError("No se pudieron cargar los registros: " + e.message));
  }, []);

  useEffect(() => {
    const estado = ubicacion.state as EstadoNavegacion | null;
    if (!estado?.mejora) return;
    setEditandoId(null);
    setNumeroActual(null);
    setDatos(prefillDesdeRiesgo(estado.mejora));
    setMensaje("Formulario precargado desde matriz de riesgos. Complete y guarde.");
    window.history.replaceState({}, "");
  }, [ubicacion.state]);

  useEffect(() => {
    return () => {
      if (previewAnterior.current) URL.revokeObjectURL(previewAnterior.current);
    };
  }, []);

  function actualizarDatos(cambios: Partial<RegistroAmDatos>) {
    setDatos((previos) => ({ ...previos, ...cambios }));
  }

  function limpiarFormulario() {
    setEditandoId(null);
    setNumeroActual(null);
    setDatos(formularioAmVacio());
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

  function cargarRegistro(registro: RegistroAm) {
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

    if (!datos.proceso || !datos.fechaRegistro || !datos.descripcion.trim()) {
      setError("Completa proceso, fecha de registro y descripción.");
      return;
    }

    setGuardando(true);
    try {
      const registro = await guardarAccionMejora(datos, editandoId);
      setRegistros((previos) => {
        const sinActual = previos.filter((r) => r.id !== registro.id);
        return [registro, ...sinActual];
      });
      setEditandoId(registro.id);
      setNumeroActual(registro.numero);
      setMensaje(
        `Registro No. ${registro.numero} guardado. Use «Imprimir formato» y archive el documento firmado.`,
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
      setError("Guarda el registro primero para obtener el número oficial antes de imprimir.");
      return;
    }
    setCargandoPdfId(editandoId ?? "formulario");
    try {
      const pdfBytes = await generarPdfGcRe001(datos, numeroActual);
      mostrarPreview(pdfBytes);
      imprimirPdf(pdfBytes);
    } catch (e) {
      setError("No se pudo generar el formato para imprimir: " + (e as Error).message);
    } finally {
      setCargandoPdfId(null);
    }
  }

  async function imprimirRegistro(registro: RegistroAm) {
    setError(null);
    setCargandoPdfId(registro.id);
    try {
      const pdfBytes = await obtenerPdfRegistroAm(registro);
      mostrarPreview(pdfBytes);
      imprimirPdf(pdfBytes);
    } catch (e) {
      setError("No se pudo generar el formato para imprimir: " + (e as Error).message);
    } finally {
      setCargandoPdfId(null);
    }
  }

  async function eliminarRegistro(registro: RegistroAm) {
    if (!window.confirm(`¿Eliminar el registro GC-RE-001 No. ${registro.numero}?`)) return;
    try {
      await eliminarAccionMejora(registro.id);
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
          <h1>GC-RE-001 — Acciones de mejora</h1>
          <p className="formatos__descripcion">
            Complete el formulario y pulse <strong>Guardar</strong>. Los datos quedan en el
            sistema; use <strong>Imprimir formato</strong> para obtener el documento oficial.
          </p>
        </div>
        <button type="button" className="btn" onClick={nuevoRegistro}>
          Nuevo registro
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            setEditandoId(null);
            setNumeroActual(null);
            setDatos(prefillDesdeProyectoPortal());
            setMensaje("Presentación del Portal de Mantenimiento cargada. Revise, guarde e imprima.");
          }}
        >
          Cargar presentación proyecto
        </button>
      </header>

      {datos.origenRiesgo && (
        <p className="formatos__aviso-indicador">
          Vinculado a riesgo: {datos.origenRiesgo.descripcion} (nivel {datos.origenRiesgo.valor} —{" "}
          {datos.origenRiesgo.nivel})
        </p>
      )}

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
                Fecha de registro *
                <input
                  required
                  type="date"
                  value={datos.fechaRegistro}
                  onChange={(e) => actualizarDatos({ fechaRegistro: e.target.value })}
                />
              </label>
              <label>
                Proceso *
                <input
                  required
                  value={datos.proceso}
                  onChange={(e) => actualizarDatos({ proceso: e.target.value })}
                />
              </label>
            </div>
            <div className="gcre-form__grid-3">
              <label>
                Responsable del proceso
                <input
                  value={datos.responsableProceso}
                  onChange={(e) => actualizarDatos({ responsableProceso: e.target.value })}
                />
              </label>
              <label>
                Reportado por
                <input
                  value={datos.reportadoPor}
                  onChange={(e) => actualizarDatos({ reportadoPor: e.target.value })}
                />
              </label>
              <label>
                Cargo
                <input
                  value={datos.reportadoCargo}
                  onChange={(e) => actualizarDatos({ reportadoCargo: e.target.value })}
                />
              </label>
            </div>

            <fieldset>
              <legend>Origen de la oportunidad de mejora</legend>
              <div className="gcre-form__origen">
                {ORIGENES_MEJORA.map((o) => (
                  <label key={o.clave}>
                    <input
                      type="radio"
                      name="origenMejora"
                      value={o.clave}
                      checked={datos.origen === o.clave}
                      onChange={() => actualizarDatos({ origen: o.clave })}
                    />{" "}
                    {o.etiqueta}
                  </label>
                ))}
              </div>
              {datos.origen === "otro" && (
                <label>
                  Especifique otro origen
                  <input
                    value={datos.origenOtro}
                    onChange={(e) => actualizarDatos({ origenOtro: e.target.value })}
                  />
                </label>
              )}
            </fieldset>

            <fieldset>
              <legend>Descripción de la oportunidad de mejora</legend>
              <label>
                Situación identificada y oportunidad de mejora *
                <textarea
                  required
                  rows={4}
                  value={datos.descripcion}
                  onChange={(e) => actualizarDatos({ descripcion: e.target.value })}
                />
              </label>
              <label>
                Beneficio esperado
                <textarea
                  rows={2}
                  value={datos.beneficioEsperado}
                  onChange={(e) => actualizarDatos({ beneficioEsperado: e.target.value })}
                />
              </label>
            </fieldset>

            {datos.origenRiesgo && (
              <fieldset>
                <legend>Datos del riesgo (matriz)</legend>
                <div className="gcre-form__grid-3">
                  <label>
                    Probabilidad
                    <input readOnly value={datos.origenRiesgo.probabilidad} />
                  </label>
                  <label>
                    Consecuencia
                    <input readOnly value={datos.origenRiesgo.consecuencia} />
                  </label>
                  <label>
                    Nivel / Valor
                    <input
                      readOnly
                      value={`${datos.origenRiesgo.valor} (${datos.origenRiesgo.nivel})`}
                    />
                  </label>
                </div>
                <label>
                  Tratamiento
                  <input readOnly value={datos.origenRiesgo.tratamiento} />
                </label>
                <label>
                  Consecuencias potenciales
                  <input readOnly value={datos.origenRiesgo.consecuencias} />
                </label>
              </fieldset>
            )}

            <fieldset>
              <legend>Evaluación de la mejora</legend>
              <p>Recursos requeridos</p>
              <div className="gcre-form__origen">
                <label>
                  <input
                    type="checkbox"
                    checked={datos.recursosHumanos}
                    onChange={(e) => actualizarDatos({ recursosHumanos: e.target.checked })}
                  />{" "}
                  Humanos
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={datos.recursosTecnologicos}
                    onChange={(e) => actualizarDatos({ recursosTecnologicos: e.target.checked })}
                  />{" "}
                  Tecnológicos
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={datos.recursosInfraestructura}
                    onChange={(e) =>
                      actualizarDatos({ recursosInfraestructura: e.target.checked })
                    }
                  />{" "}
                  Infraestructura
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={datos.recursosEconomicos}
                    onChange={(e) => actualizarDatos({ recursosEconomicos: e.target.checked })}
                  />{" "}
                  Económicos
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={datos.recursosOtros}
                    onChange={(e) => actualizarDatos({ recursosOtros: e.target.checked })}
                  />{" "}
                  Otros
                </label>
              </div>
              <label>
                Descripción de recursos
                <textarea
                  rows={2}
                  value={datos.recursosDescripcion}
                  onChange={(e) => actualizarDatos({ recursosDescripcion: e.target.value })}
                />
              </label>
              <label>
                Alineación con objetivos de calidad
                <input
                  value={datos.alineacionObjetivos}
                  onChange={(e) => actualizarDatos({ alineacionObjetivos: e.target.value })}
                />
              </label>
              <div className="gcre-form__radio-inline">
                <span>Resultado de la evaluación</span>
                <label>
                  <input
                    type="radio"
                    name="evaluacion"
                    value="aprobada"
                    checked={datos.evaluacion === "aprobada"}
                    onChange={() => actualizarDatos({ evaluacion: "aprobada" })}
                  />{" "}
                  Aprobada
                </label>
                <label>
                  <input
                    type="radio"
                    name="evaluacion"
                    value="no_aprobada"
                    checked={datos.evaluacion === "no_aprobada"}
                    onChange={() => actualizarDatos({ evaluacion: "no_aprobada" })}
                  />{" "}
                  No aprobada
                </label>
              </div>
              <label>
                Justificación
                <textarea
                  rows={2}
                  value={datos.evaluacionJustificacion}
                  onChange={(e) => actualizarDatos({ evaluacionJustificacion: e.target.value })}
                />
              </label>
            </fieldset>

            <fieldset>
              <legend>Plan de acción</legend>
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
              <legend>Aprobación del plan</legend>
              <div className="gcre-form__grid-2">
                <label>
                  Responsable del proceso
                  <input
                    value={datos.aprobacionResponsable}
                    onChange={(e) => actualizarDatos({ aprobacionResponsable: e.target.value })}
                  />
                </label>
                <label>
                  Fecha
                  <input
                    type="date"
                    value={datos.aprobacionResponsableFecha}
                    onChange={(e) =>
                      actualizarDatos({ aprobacionResponsableFecha: e.target.value })
                    }
                  />
                </label>
              </div>
              <div className="gcre-form__grid-2">
                <label>
                  Líder SGC
                  <input
                    value={datos.aprobacionLiderSgc}
                    onChange={(e) => actualizarDatos({ aprobacionLiderSgc: e.target.value })}
                  />
                </label>
                <label>
                  Fecha
                  <input
                    type="date"
                    value={datos.aprobacionLiderSgcFecha}
                    onChange={(e) => actualizarDatos({ aprobacionLiderSgcFecha: e.target.value })}
                  />
                </label>
              </div>
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
                {cargandoPdfId === (editandoId ?? "formulario")
                  ? "Generando..."
                  : "Imprimir formato"}
              </button>
            </div>
          </form>

          {mensaje && <p className="formatos__mensaje formatos__mensaje--ok">{mensaje}</p>}
          {error && <p className="formatos__mensaje formatos__mensaje--error">{error}</p>}
        </div>

        <aside className="formatos__lista">
          <h2>Registros guardados</h2>
          {registros.length === 0 && (
            <p className="formatos__vacio">Aún no hay registros GC-RE-001.</p>
          )}
          {registros.map((registro) => (
            <article key={registro.id} className="item-nc">
              <div>
                <strong>
                  No. {registro.numero} — {registro.datos.proceso}
                </strong>
                <p>
                  {registro.datos.fechaRegistro} · {registro.datos.descripcion.slice(0, 80)}
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
                <button className="btn" onClick={() => cargarRegistro(registro)}>
                  Editar
                </button>
                <button className="btn btn--peligro" onClick={() => void eliminarRegistro(registro)}>
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

export default Gcre001Page;
