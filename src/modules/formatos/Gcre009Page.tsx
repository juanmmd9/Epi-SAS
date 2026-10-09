import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { AREAS_SISTEMA } from "../../lib/areas";
import { imprimirPdf } from "../../lib/imprimirPdf";
import { rutaPublica } from "../../lib/rutaPublica";
import {
  generarPdfGcRe009,
  obtenerPdfRegistro,
  urlVistaPreviaPdf,
} from "./gcre009Pdf";
import {
  eliminarNoConformidad,
  guardarNoConformidad,
  listarNoConformidades,
  subirEvidenciaNc,
} from "./formatosService";
import {
  filaPlanVacia,
  filaSeguimientoVacia,
  formularioNcVacio,
  normalizarDatosNc,
  ORIGENES_NC,
  prefillDesdeIndicador,
  type EvidenciaNc,
  type PrefillDesdeIndicador,
  type RegistroNc,
  type RegistroNcDatos,
} from "./types";
import "./formatos.css";

interface EstadoNavegacion {
  nc?: PrefillDesdeIndicador;
}

type TipoEvidencia = "imagen" | "pdf" | "docx" | "doc" | "office" | "otro";

function tipoEvidencia(nombre: string): TipoEvidencia {
  const archivo = nombre.toLowerCase();
  if (/\.(png|jpe?g|gif|webp|bmp)$/.test(archivo)) return "imagen";
  if (/\.pdf$/.test(archivo)) return "pdf";
  if (/\.docx$/.test(archivo)) return "docx";
  if (/\.doc$/.test(archivo)) return "doc";
  if (/\.(xlsx?|pptx?)$/.test(archivo)) return "office";
  return "otro";
}

function etiquetaTipo(tipo: TipoEvidencia): string {
  if (tipo === "pdf") return "PDF";
  if (tipo === "docx" || tipo === "doc") return "DOC";
  if (tipo === "office") return "XLS";
  if (tipo === "imagen") return "IMG";
  return "ARCHIVO";
}

function VisorWord({ url }: { url: string }) {
  const estilos = useRef<HTMLDivElement>(null);
  const hojas = useRef<HTMLDivElement>(null);
  const [estado, setEstado] = useState<"cargando" | "listo" | "error">("cargando");
  const [cantidad, setCantidad] = useState(0);
  const [detalle, setDetalle] = useState("");

  useEffect(() => {
    const destino = hojas.current;
    const cajaEstilos = estilos.current;
    if (!destino || !cajaEstilos) return;
    let cancelado = false;
    destino.replaceChildren();
    cajaEstilos.replaceChildren();
    setEstado("cargando");
    setCantidad(0);
    setDetalle("");

    void (async () => {
      try {
        const respuesta = await fetch(url);
        if (!respuesta.ok) throw new Error("No se pudo descargar el documento.");
        const buffer = await respuesta.arrayBuffer();
        if (cancelado) return;
        const { renderAsync } = await import("docx-preview");
        await renderAsync(buffer, destino, cajaEstilos, {
          className: "docx",
          inWrapper: true,
          breakPages: true,
          ignoreLastRenderedPageBreak: false,
          renderHeaders: true,
          renderFooters: true,
        });
        if (cancelado) return;
        setCantidad(destino.querySelectorAll("section.docx").length);
        setEstado("listo");
      } catch (e) {
        if (!cancelado) {
          setEstado("error");
          setDetalle((e as Error).message);
        }
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [url]);

  return (
    <div className="evidencia-visor__word">
      {estado === "cargando" && <p className="evidencia-visor__word-aviso">Cargando todas las hojas...</p>}
      {estado === "listo" && cantidad > 0 && (
        <p className="evidencia-visor__word-aviso">
          {cantidad} {cantidad === 1 ? "hoja" : "hojas"}. Desplaza hacia abajo para verlas todas.
        </p>
      )}
      {estado === "error" && (
        <p className="evidencia-visor__word-aviso">
          No se pudo mostrar el Word completo. {detalle}
        </p>
      )}
      <div ref={estilos} />
      <div ref={hojas} />
    </div>
  );
}

function urlVisorOffice(url: string): string {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
}

function fechaCorta(iso: string): string {
  const partes = iso.split("-");
  if (partes.length !== 3) return iso;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function etiquetaOrigen(clave: string): string {
  return ORIGENES_NC.find((origen) => origen.clave === clave)?.etiqueta ?? clave;
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
  const [subiendoId, setSubiendoId] = useState<string | null>(null);
  const [visor, setVisor] = useState<EvidenciaNc | null>(null);
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

  useEffect(() => {
    if (!visor) return;
    function cerrarConEscape(evento: KeyboardEvent) {
      if (evento.key === "Escape") setVisor(null);
    }
    window.addEventListener("keydown", cerrarConEscape);
    return () => window.removeEventListener("keydown", cerrarConEscape);
  }, [visor]);

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

  async function guardarEvidencias(registro: RegistroNc, evidencias: EvidenciaNc[]) {
    const base =
      editandoId === registro.id ? datos : normalizarDatosNc(registro.datos);
    const actualizado = await guardarNoConformidad({ ...base, evidencias }, registro.id);
    setRegistros((previos) =>
      previos.map((item) => (item.id === actualizado.id ? actualizado : item)),
    );
    if (editandoId === registro.id) setDatos(actualizado.datos);
  }

  async function agregarEvidencias(registro: RegistroNc, lista: FileList | null) {
    const archivos = lista ? Array.from(lista) : [];
    if (archivos.length === 0) return;
    setError(null);
    setSubiendoId(registro.id);
    try {
      const nuevas: EvidenciaNc[] = [];
      for (const archivo of archivos) {
        const url = await subirEvidenciaNc(archivo);
        nuevas.push({
          id: crypto.randomUUID(),
          nombre: archivo.name,
          url,
          subidoEn: new Date().toISOString(),
        });
      }
      const actuales = (
        editandoId === registro.id ? datos : normalizarDatosNc(registro.datos)
      ).evidencias;
      await guardarEvidencias(registro, [...actuales, ...nuevas]);
      setMensaje(
        `Evidencia agregada al GC-RE-009 No. ${registro.numero}. Queda en la tarjeta del formato.`,
      );
    } catch (e) {
      setError("No se pudo subir la evidencia: " + (e as Error).message);
    } finally {
      setSubiendoId(null);
    }
  }

  async function quitarEvidencia(registro: RegistroNc, evidenciaId: string) {
    const evidencia = registro.datos.evidencias.find((item) => item.id === evidenciaId);
    if (!evidencia) return;
    if (!window.confirm(`¿Quitar la evidencia «${evidencia.nombre}» de este formato?`)) return;
    setError(null);
    try {
      const actuales = (
        editandoId === registro.id ? datos : registro.datos
      ).evidencias;
      await guardarEvidencias(
        registro,
        actuales.filter((item) => item.id !== evidenciaId),
      );
    } catch (e) {
      setError("No se pudo quitar la evidencia: " + (e as Error).message);
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
            sistema. En cada registro adjunte la foto o el documento que demuestra que la
            acción se hizo. Para el papel oficial use <strong>Imprimir</strong> y archive el
            documento firmado junto con esas evidencias.
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

      <div className="formatos__layout formatos__layout--formulario">
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

      </div>

      <section className="nc-registros">
        <div className="nc-registros__cabecera">
          <h2>Registros guardados</h2>
          <p className="formatos__plantilla">
            Plantilla en blanco:{" "}
            <a href={rutaPublica("/templates/GC-RE-009-v2.pdf")} target="_blank" rel="noreferrer">
              GC-RE-009-v2.pdf
            </a>
          </p>
        </div>
        {registros.length === 0 && (
          <p className="formatos__vacio">Aún no hay registros GC-RE-009.</p>
        )}
        <div className="nc-registros__grid">
          {registros.map((registro) => (
            <article
              key={registro.id}
              className={`nc-card ${editandoId === registro.id ? "nc-card--activa" : ""}`}
            >
              <header className="nc-card__tope">
                <strong>No. {registro.numero}</strong>
                <time dateTime={registro.datos.fechaDeteccion}>
                  {fechaCorta(registro.datos.fechaDeteccion)}
                </time>
              </header>
              <div className="nc-card__meta">
                <span className="nc-card__chip">{registro.datos.area || "Sin área"}</span>
                <span className="nc-card__chip">{etiquetaOrigen(registro.datos.origen)}</span>
              </div>
              <p className="nc-card__desc">{registro.datos.descripcion}</p>
              <div className="nc-card__evidencias">
                <div className="nc-card__evidencias-cabecera">
                  <h3>
                    Evidencias
                    {registro.datos.evidencias.length > 0
                      ? ` (${registro.datos.evidencias.length})`
                      : ""}
                  </h3>
                  <label className="btn nc-card__agregar">
                    {subiendoId === registro.id ? "Subiendo..." : "Agregar"}
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                      multiple
                      hidden
                      disabled={subiendoId === registro.id}
                      onChange={(e) => {
                        void agregarEvidencias(registro, e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                {registro.datos.evidencias.length === 0 && (
                  <p className="nc-card__vacio">
                    Foto o documento que demuestra que la acción se hizo.
                  </p>
                )}
                {registro.datos.evidencias.length > 0 && (
                  <ul className="nc-card__mosaico">
                    {registro.datos.evidencias.map((evidencia) => {
                      const tipo = tipoEvidencia(evidencia.nombre);
                      return (
                        <li key={evidencia.id} className="nc-card__pieza">
                          <button
                            type="button"
                            className="nc-card__ver"
                            onClick={() => setVisor(evidencia)}
                          >
                            {tipo === "imagen" ? (
                              <img src={evidencia.url} alt="" />
                            ) : (
                              <span className="nc-card__tipo">{etiquetaTipo(tipo)}</span>
                            )}
                            <span className="nc-card__nombre">{evidencia.nombre}</span>
                          </button>
                          <button
                            type="button"
                            className="nc-card__quitar"
                            onClick={() => void quitarEvidencia(registro, evidencia.id)}
                          >
                            Quitar
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              <div className="nc-card__acciones">
                <button
                  className="btn"
                  disabled={cargandoPdfId === registro.id}
                  onClick={() => void imprimirRegistro(registro)}
                >
                  {cargandoPdfId === registro.id ? "..." : "Imprimir"}
                </button>
                <button className="btn" onClick={() => cargarRegistro(registro)}>
                  Editar
                </button>
                <button className="btn btn--peligro" onClick={() => eliminarRegistro(registro)}>
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {visor && (
        <div className="evidencia-visor" onClick={() => setVisor(null)}>
          <div
            className="evidencia-visor__panel"
            role="dialog"
            aria-modal="true"
            aria-label={visor.nombre}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="evidencia-visor__barra">
              <h2>{visor.nombre}</h2>
              <div className="evidencia-visor__barra-acciones">
                <a className="btn" href={visor.url} target="_blank" rel="noreferrer">
                  Abrir en pestaña
                </a>
                <button type="button" className="btn" onClick={() => setVisor(null)}>
                  Cerrar
                </button>
              </div>
            </div>
            <div
              className={
                tipoEvidencia(visor.nombre) === "docx"
                  ? "evidencia-visor__cuerpo evidencia-visor__cuerpo--word"
                  : "evidencia-visor__cuerpo"
              }
            >
              {tipoEvidencia(visor.nombre) === "imagen" && (
                <img src={visor.url} alt={visor.nombre} />
              )}
              {tipoEvidencia(visor.nombre) === "pdf" && (
                <iframe title={visor.nombre} src={visor.url} />
              )}
              {tipoEvidencia(visor.nombre) === "docx" && <VisorWord url={visor.url} />}
              {tipoEvidencia(visor.nombre) === "doc" && (
                <p>
                  Este archivo es Word antiguo (.doc) y aquí solo se ve una hoja. Guárdalo como
                  .docx para ver todas las hojas.
                </p>
              )}
              {tipoEvidencia(visor.nombre) === "office" && (
                <iframe title={visor.nombre} src={urlVisorOffice(visor.url)} />
              )}
              {tipoEvidencia(visor.nombre) === "otro" && (
                <p>
                  Este archivo no se puede mostrar aquí. Ábrelo en una pestaña nueva.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

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
