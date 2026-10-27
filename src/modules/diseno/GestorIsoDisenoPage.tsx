import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { areaUsuario } from "../../lib/usuarioArea";
import { useAuth } from "../auth/AuthContext";
import type { UsuarioPortal } from "../auth/roles";
import { listarRegistradosDelArea } from "../inicio/equipoRegistrados";
import {
  calculateProjectProgress,
  calculateStageProgress,
  crearRegistrosIniciales,
  documentosDe,
  ENCARGADO_EJEMPLO,
  ISO_STAGES,
  MASTER_FORMATS,
  pesoFormato,
  tieneEvidenciaVisible,
  TIPOS_PROYECTO_ISO,
  type DocumentoIso,
  type EstadoFormatoIso,
  type IdLineaDisenoIso,
  type ProyectoIso,
  type RegistroFormatoIso,
  type TipoProyectoIso,
} from "./isoDisenoCatalogo";
import { subirDocumentoIsoDiseno } from "./isoDisenoDocsService";
import { cargarEstadoIso, guardarEstadoIso, restablecerEstadoIso } from "./isoDisenoState";
import "./gestorIsoDiseno.css";

function fechaHoy(): string {
  return new Date().toISOString().slice(0, 10);
}

function etiquetaEstado(status: EstadoFormatoIso): string {
  if (status === "Aprobado") return "Aprobado";
  if (status === "En Elaboración") return "En Proceso";
  return "Pendiente";
}

function claseBadge(status: EstadoFormatoIso): string {
  if (status === "Aprobado") return "gestor-iso__badge gestor-iso__badge--ok";
  if (status === "En Elaboración") return "gestor-iso__badge gestor-iso__badge--proceso";
  return "gestor-iso__badge gestor-iso__badge--pendiente";
}

function nombrePersona(persona: Pick<UsuarioPortal, "nombre" | "usuario" | "email">): string {
  return persona.nombre || persona.usuario || persona.email || "Sin nombre";
}

function IconoVerDocumento() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
      <path
        fill="currentColor"
        d="M12 5c-5.2 0-9.3 3.6-10.7 7 1.4 3.4 5.5 7 10.7 7s9.3-3.6 10.7-7C21.3 8.6 17.2 5 12 5zm0 11.5A4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 0 1 0 9zm0-2.2a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6z"
      />
    </svg>
  );
}

export interface GestorIsoDisenoProps {
  lineaId: IdLineaDisenoIso;
  titulo: string;
}

function GestorIsoDiseno({ lineaId, titulo }: GestorIsoDisenoProps) {
  const { perfil } = useAuth();
  const area = areaUsuario(perfil);
  const [estado, setEstado] = useState(() => cargarEstadoIso(lineaId));
  const [busqueda, setBusqueda] = useState("");
  const [modalFormato, setModalFormato] = useState<RegistroFormatoIso | null>(null);
  const [modalProyecto, setModalProyecto] = useState(false);
  const [modalDocs, setModalDocs] = useState<RegistroFormatoIso | null>(null);
  const [equipo, setEquipo] = useState<UsuarioPortal[]>([]);
  const [docsFormato, setDocsFormato] = useState<DocumentoIso[]>([]);
  const [subiendoDoc, setSubiendoDoc] = useState(false);
  const [errorDoc, setErrorDoc] = useState<string | null>(null);

  useEffect(() => {
    setEstado(cargarEstadoIso(lineaId));
    setBusqueda("");
    setModalFormato(null);
    setModalProyecto(false);
    setModalDocs(null);
    setDocsFormato([]);
    setErrorDoc(null);
  }, [lineaId]);

  useEffect(() => {
    if (!area || !perfil?.id) {
      setEquipo([]);
      return;
    }
    let vigente = true;
    void listarRegistradosDelArea(area, perfil.id)
      .then((lista) => {
        if (!vigente) return;
        setEquipo(lista.filter((persona) => persona.rol === "solicitante"));
      })
      .catch(() => {
        if (vigente) setEquipo([]);
      });
    return () => {
      vigente = false;
    };
  }, [area, perfil?.id]);

  const opcionesEncargado = useMemo(() => {
    const lista: { id: string; nombre: string; etiqueta: string }[] = [
      {
        id: ENCARGADO_EJEMPLO.id,
        nombre: ENCARGADO_EJEMPLO.nombre,
        etiqueta: `${ENCARGADO_EJEMPLO.nombre} · perfil de ejemplo`,
      },
    ];
    if (perfil) {
      lista.push({
        id: perfil.id,
        nombre: nombrePersona(perfil),
        etiqueta: `${nombrePersona(perfil)} · director / líder`,
      });
    }
    for (const persona of equipo) {
      if (lista.some((item) => item.id === persona.id)) continue;
      lista.push({
        id: persona.id,
        nombre: nombrePersona(persona),
        etiqueta: `${nombrePersona(persona)} · equipo`,
      });
    }
    return lista;
  }, [equipo, perfil]);

  const [formFormato, setFormFormato] = useState({
    version: "01",
    status: "Pendiente" as EstadoFormatoIso,
    filledBy: "",
    date: fechaHoy(),
    approvedBy: "",
    approvalDate: "",
    evidence: "",
    notes: "",
  });
  const [formProyecto, setFormProyecto] = useState<{
    code: string;
    name: string;
    type: TipoProyectoIso;
    leadId: string;
    startDate: string;
    targetDate: string;
  }>({
    code: "",
    name: "",
    type: "Nuevo Producto",
    leadId: ENCARGADO_EJEMPLO.id,
    startDate: fechaHoy(),
    targetDate: "",
  });

  const proyecto = estado.projects.find((p) => p.id === estado.selectedProjectId) ?? null;

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return estado.projects;
    return estado.projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.lead.toLowerCase().includes(q),
    );
  }, [busqueda, estado.projects]);

  const etapaActual = ISO_STAGES.find((s) => s.id === estado.currentStageTab) ?? ISO_STAGES[0];
  const formatosEtapa = MASTER_FORMATS.filter((f) => f.stage === etapaActual.id);

  function persistir(siguiente: typeof estado) {
    setEstado(siguiente);
    guardarEstadoIso(lineaId, siguiente);
  }

  function abrirFormato(formatCode: string) {
    let rec = estado.records.find(
      (r) => r.projectId === estado.selectedProjectId && r.formatCode === formatCode,
    );
    if (!rec) {
      rec = {
        id: `REC-${crypto.randomUUID()}`,
        projectId: estado.selectedProjectId,
        formatCode,
        version: "01",
        status: "Pendiente",
        filledBy: "",
        date: "",
        approvedBy: "",
        approvalDate: "",
        evidence: "",
        notes: "",
        documents: [],
      };
      persistir({ ...estado, records: [...estado.records, rec] });
    }
    setFormFormato({
      version: rec.version || "01",
      status: rec.status || "Pendiente",
      filledBy: rec.filledBy || "",
      date: rec.date || fechaHoy(),
      approvedBy: rec.approvedBy || "",
      approvalDate: rec.approvalDate || "",
      evidence: rec.evidence || "",
      notes: rec.notes || "",
    });
    setDocsFormato(documentosDe(rec));
    setErrorDoc(null);
    setModalFormato(rec);
  }

  async function subirArchivosFormato(archivos: FileList | null) {
    if (!modalFormato || !archivos || archivos.length === 0) return;
    setSubiendoDoc(true);
    setErrorDoc(null);
    try {
      const nuevos: DocumentoIso[] = [];
      for (const archivo of Array.from(archivos)) {
        const url = await subirDocumentoIsoDiseno(
          lineaId,
          modalFormato.projectId,
          modalFormato.formatCode,
          archivo,
        );
        nuevos.push({
          id: crypto.randomUUID(),
          nombre: archivo.name,
          url,
          fecha: fechaHoy(),
        });
      }
      setDocsFormato((prev) => [...nuevos, ...prev]);
      if (formFormato.status === "Pendiente") {
        setFormFormato((prev) => ({ ...prev, status: "En Elaboración" }));
      }
    } catch (e) {
      setErrorDoc(e instanceof Error ? e.message : "No se pudo subir el documento.");
    } finally {
      setSubiendoDoc(false);
    }
  }

  function quitarDocumentoFormato(id: string) {
    setDocsFormato((prev) => prev.filter((doc) => doc.id !== id));
  }

  function guardarFormato(e: FormEvent) {
    e.preventDefault();
    if (!modalFormato) return;
    const records = estado.records.map((r) =>
      r.id === modalFormato.id
        ? {
            ...r,
            version: formFormato.version.trim() || "01",
            status: formFormato.status,
            filledBy: formFormato.filledBy.trim(),
            date: formFormato.date,
            approvedBy: formFormato.approvedBy.trim(),
            approvalDate: formFormato.approvalDate,
            evidence: formFormato.evidence.trim(),
            notes: formFormato.notes.trim(),
            documents: docsFormato,
          }
        : r,
    );
    persistir({ ...estado, records });
    setModalFormato(null);
    setDocsFormato([]);
    setErrorDoc(null);
  }

  function resolverEncargado(leadId: string): { leadId: string; lead: string } {
    const elegido = opcionesEncargado.find((item) => item.id === leadId);
    if (elegido) return { leadId: elegido.id, lead: elegido.nombre };
    return { leadId: ENCARGADO_EJEMPLO.id, lead: ENCARGADO_EJEMPLO.nombre };
  }

  function crearProyecto(e: FormEvent) {
    e.preventDefault();
    const id = `PRJ-${crypto.randomUUID()}`;
    const encargado = resolverEncargado(formProyecto.leadId);
    const nuevo: ProyectoIso = {
      id,
      code: formProyecto.code.trim().toUpperCase(),
      name: formProyecto.name.trim(),
      type: formProyecto.type,
      lead: encargado.lead,
      leadId: encargado.leadId,
      startDate: formProyecto.startDate,
      targetDate: formProyecto.targetDate,
      status: "En progreso",
    };
    persistir({
      ...estado,
      projects: [nuevo, ...estado.projects],
      records: [...crearRegistrosIniciales(id), ...estado.records],
      selectedProjectId: id,
      currentStageTab: "8.3.2",
    });
    setModalProyecto(false);
    setFormProyecto({
      code: "",
      name: "",
      type: "Nuevo Producto",
      leadId: opcionesEncargado[0]?.id ?? ENCARGADO_EJEMPLO.id,
      startDate: fechaHoy(),
      targetDate: "",
    });
  }

  function cambiarEncargadoProyecto(leadId: string) {
    if (!proyecto) return;
    const encargado = resolverEncargado(leadId);
    persistir({
      ...estado,
      projects: estado.projects.map((item) =>
        item.id === proyecto.id
          ? { ...item, lead: encargado.lead, leadId: encargado.leadId }
          : item,
      ),
    });
  }

  function imprimirReporte() {
    if (!proyecto) return;
    window.print();
  }

  const progresoGlobal = proyecto
    ? calculateProjectProgress(proyecto.id, estado.records)
    : 0;

  return (
    <section className="gestor-iso">
      <div className="gestor-iso__top">
        <div>
          <Link className="inicio-diseno__volver" to="/inicio">
            ← Inicio Diseño
          </Link>
          <h1>{titulo}</h1>
          <p className="gestor-iso__sub">
            Gestor ISO 9001:2015 — Numeral 8.3 · Formatos F-DIS por etapa
          </p>
        </div>
        <div className="gestor-iso__acciones">
          <button
            type="button"
            className="btn btn--primario"
            onClick={() => {
              setFormProyecto({
                code: "",
                name: "",
                type: "Nuevo Producto",
                leadId:
                  equipo[0]?.id ??
                  perfil?.id ??
                  ENCARGADO_EJEMPLO.id,
                startDate: fechaHoy(),
                targetDate: "",
              });
              setModalProyecto(true);
            }}
          >
            Nuevo proyecto
          </button>
          <button
            type="button"
            className="btn"
            title="Restablecer datos de ejemplo de esta línea"
            onClick={() => {
              if (
                window.confirm(
                  `¿Restablecer los proyectos de «${titulo}» a los datos de ejemplo?`,
                )
              ) {
                persistir(restablecerEstadoIso(lineaId));
              }
            }}
          >
            Restablecer
          </button>
        </div>
      </div>

      <div className="gestor-iso__layout">
        <aside className="gestor-iso__aside">
          <input
            className="gestor-iso__buscar"
            type="search"
            placeholder="Buscar proyecto o código…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <div className="gestor-iso__lista-titulo">
            <span>Proyectos activos</span>
            <span className="gestor-iso__conteo">{filtrados.length}</span>
          </div>
          <ul className="gestor-iso__lista">
            {filtrados.map((proj) => {
              const pct = calculateProjectProgress(proj.id, estado.records);
              const activo = proj.id === estado.selectedProjectId;
              return (
                <li key={proj.id}>
                  <button
                    type="button"
                    className={
                      activo ? "gestor-iso__item gestor-iso__item--activo" : "gestor-iso__item"
                    }
                    onClick={() =>
                      persistir({ ...estado, selectedProjectId: proj.id, currentStageTab: "8.3.2" })
                    }
                  >
                    <div className="gestor-iso__item-top">
                      <span className="gestor-iso__codigo">{proj.code}</span>
                      <span
                        className={
                          pct === 100 ? "gestor-iso__pct gestor-iso__pct--ok" : "gestor-iso__pct"
                        }
                      >
                        {pct}% ISO
                      </span>
                    </div>
                    <strong>{proj.name}</strong>
                    <span>{proj.lead}</span>
                    <div
                      className={
                        pct === 100 ? "gestor-iso__barra gestor-iso__barra--ok" : "gestor-iso__barra"
                      }
                    >
                      <i style={{ width: `${pct}%` }} />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          {filtrados.length === 0 ? (
            <p className="gestor-iso__vacio">No hay proyectos con ese filtro.</p>
          ) : null}
        </aside>

        <div>
          {proyecto ? (
            <>
              <div className="gestor-iso__detalle">
                <div>
                  <div className="gestor-iso__item-top">
                    <span className="gestor-iso__codigo">{proyecto.code}</span>
                    <span className="gestor-iso__pct">{proyecto.type}</span>
                  </div>
                  <h2>{proyecto.name}</h2>
                  <p className="gestor-iso__meta">
                    <span>Inicio: {proyecto.startDate}</span>
                    <span>Límite: {proyecto.targetDate}</span>
                  </p>
                  <label className="gestor-iso__encargado">
                    Encargado del proyecto
                    <select
                      value={
                        proyecto.leadId &&
                        opcionesEncargado.some((item) => item.id === proyecto.leadId)
                          ? proyecto.leadId
                          : ENCARGADO_EJEMPLO.id
                      }
                      onChange={(e) => cambiarEncargadoProyecto(e.target.value)}
                    >
                      {opcionesEncargado.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.etiqueta}
                        </option>
                      ))}
                      {proyecto.leadId &&
                      !opcionesEncargado.some((item) => item.id === proyecto.leadId) ? (
                        <option value={proyecto.leadId}>{proyecto.lead}</option>
                      ) : null}
                    </select>
                  </label>
                </div>
                <div className="gestor-iso__avance">
                  <div>
                    <small>Cumplimiento numeral 8.3</small>
                    <strong>{progresoGlobal}%</strong>
                  </div>
                  <div
                    className={
                      progresoGlobal === 100
                        ? "gestor-iso__anillo gestor-iso__anillo--ok"
                        : "gestor-iso__anillo"
                    }
                  >
                    {progresoGlobal}%
                  </div>
                </div>
              </div>

              <div className="gestor-iso__panel">
                <div className="gestor-iso__tabs">
                  {ISO_STAGES.map((st) => {
                    const pct = calculateStageProgress(proyecto.id, st.id, estado.records);
                    const activo = estado.currentStageTab === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        className={activo ? "gestor-iso__tab gestor-iso__tab--activo" : "gestor-iso__tab"}
                        onClick={() => persistir({ ...estado, currentStageTab: st.id })}
                      >
                        {st.name}
                        <em>{pct}%</em>
                      </button>
                    );
                  })}
                </div>

                <div className="gestor-iso__panel-cuerpo">
                  <div className="gestor-iso__panel-cab">
                    <div>
                      <h3>
                        Etapa {etapaActual.id}: {etapaActual.name}
                      </h3>
                      <p>
                        Ponderación en el proyecto: {Math.round(etapaActual.weight * 100)}%
                        {etapaActual.id === "8.3.4_DES"
                          ? " · concepto 10% · preliminar 20% · detalle 20%"
                          : null}
                      </p>
                    </div>
                    <button type="button" className="btn" onClick={imprimirReporte}>
                      Reporte auditoría
                    </button>
                  </div>

                  <div className="gestor-iso__tabla-wrap">
                    <table className="gestor-iso__tabla">
                      <thead>
                        <tr>
                          <th>Código</th>
                          <th>Formato / Procedimiento</th>
                          <th>Peso</th>
                          <th>Versión</th>
                          <th>Estado</th>
                          <th>Responsable</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {formatosEtapa.map((fmt) => {
                          const rec =
                            estado.records.find(
                              (r) =>
                                r.projectId === proyecto.id && r.formatCode === fmt.code,
                            ) ?? null;
                          const status = rec?.status ?? "Pendiente";
                          const docs = documentosDe(rec);
                          const conEvidencia = tieneEvidenciaVisible(rec);
                          return (
                            <tr key={fmt.code}>
                              <td>
                                <code>{fmt.code}</code>
                              </td>
                              <td>
                                <span className="gestor-iso__fmt-nombre">{fmt.name}</span>
                                <span className="gestor-iso__fmt-ev">
                                  {docs.length > 0
                                    ? `${docs.length} documento${docs.length === 1 ? "" : "s"}`
                                    : rec?.evidence
                                      ? "Evidencia registrada"
                                      : "Sin evidencia registrada"}
                                </span>
                              </td>
                              <td>{Math.round(pesoFormato(fmt) * 1000) / 10}%</td>
                              <td>v{rec?.version || "01"}</td>
                              <td>
                                <div className="gestor-iso__estado-celda">
                                  <span className={claseBadge(status)}>
                                    {etiquetaEstado(status)}
                                  </span>
                                  <button
                                    type="button"
                                    className={
                                      conEvidencia
                                        ? "gestor-iso__ver-doc"
                                        : "gestor-iso__ver-doc gestor-iso__ver-doc--off"
                                    }
                                    title={
                                      conEvidencia
                                        ? "Ver documentos / evidencia"
                                        : "Sin documentos para visualizar"
                                    }
                                    disabled={!conEvidencia || !rec}
                                    onClick={() => rec && setModalDocs(rec)}
                                  >
                                    <IconoVerDocumento />
                                    <span className="sr-only">Ver documentos</span>
                                  </button>
                                </div>
                              </td>
                              <td>{rec?.filledBy || "—"}</td>
                              <td>
                                <button
                                  type="button"
                                  className="btn"
                                  onClick={() => abrirFormato(fmt.code)}
                                >
                                  Diligenciar
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="gestor-iso__vacio">Selecciona o crea un proyecto.</p>
          )}
        </div>
      </div>

      {modalFormato ? (
        <div className="gestor-iso__modal" role="dialog" aria-modal="true">
          <div className="gestor-iso__modal-caja">
            <div className="gestor-iso__modal-cab">
              <div>
                <span className="gestor-iso__codigo">{modalFormato.formatCode}</span>
                <h3>
                  {MASTER_FORMATS.find((f) => f.code === modalFormato.formatCode)?.name ??
                    "Formato"}
                </h3>
              </div>
              <button type="button" aria-label="Cerrar" onClick={() => setModalFormato(null)}>
                ×
              </button>
            </div>
            <form className="gestor-iso__form" onSubmit={guardarFormato}>
              <div className="gestor-iso__grid">
                <label>
                  Versión documental
                  <input
                    required
                    value={formFormato.version}
                    onChange={(e) => setFormFormato({ ...formFormato, version: e.target.value })}
                  />
                </label>
                <label>
                  Estado de calidad
                  <select
                    required
                    value={formFormato.status}
                    onChange={(e) =>
                      setFormFormato({
                        ...formFormato,
                        status: e.target.value as EstadoFormatoIso,
                      })
                    }
                  >
                    <option value="Pendiente">Pendiente (0%)</option>
                    <option value="En Elaboración">En Elaboración (50%)</option>
                    <option value="Aprobado">Aprobado / Liberado (100%)</option>
                  </select>
                </label>
                <label>
                  Responsable diligenciamiento
                  <input
                    required
                    value={formFormato.filledBy}
                    onChange={(e) => setFormFormato({ ...formFormato, filledBy: e.target.value })}
                  />
                </label>
                <label>
                  Fecha registro
                  <input
                    type="date"
                    required
                    value={formFormato.date}
                    onChange={(e) => setFormFormato({ ...formFormato, date: e.target.value })}
                  />
                </label>
                <label>
                  Aprobado por (revisión)
                  <input
                    value={formFormato.approvedBy}
                    onChange={(e) => setFormFormato({ ...formFormato, approvedBy: e.target.value })}
                  />
                </label>
                <label>
                  Fecha aprobación
                  <input
                    type="date"
                    value={formFormato.approvalDate}
                    onChange={(e) =>
                      setFormFormato({ ...formFormato, approvalDate: e.target.value })
                    }
                  />
                </label>
              </div>
              <div className="gestor-iso__docs">
                <div className="gestor-iso__docs-cab">
                  <strong>Documentos de evidencia</strong>
                  <label className="btn gestor-iso__docs-subir">
                    {subiendoDoc ? "Subiendo…" : "Subir documento"}
                    <input
                      type="file"
                      multiple
                      hidden
                      disabled={subiendoDoc}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.zip"
                      onChange={(e) => {
                        void subirArchivosFormato(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                {errorDoc ? <p className="gestor-iso__docs-error">{errorDoc}</p> : null}
                {docsFormato.length === 0 ? (
                  <p className="gestor-iso__hint">PDF, Word, Excel, imágenes o ZIP (máx. 20 MB c/u).</p>
                ) : (
                  <ul className="gestor-iso__docs-lista">
                    {docsFormato.map((doc) => (
                      <li key={doc.id}>
                        <a href={doc.url} target="_blank" rel="noreferrer">
                          {doc.nombre}
                        </a>
                        <span>{doc.fecha}</span>
                        <button type="button" className="btn" onClick={() => quitarDocumentoFormato(doc.id)}>
                          Quitar
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <label>
                Enlace / ruta adicional (opcional)
                <input
                  value={formFormato.evidence}
                  onChange={(e) => setFormFormato({ ...formFormato, evidence: e.target.value })}
                  placeholder="Ej: //Servidor/Planos o enlace a Drive"
                />
              </label>
              <label>
                Hallazgos y observaciones técnicas
                <textarea
                  rows={3}
                  value={formFormato.notes}
                  onChange={(e) => setFormFormato({ ...formFormato, notes: e.target.value })}
                />
              </label>
              <div className="gestor-iso__form-acciones">
                <button
                  type="button"
                  className="btn"
                  disabled={subiendoDoc}
                  onClick={() => {
                    setModalFormato(null);
                    setDocsFormato([]);
                    setErrorDoc(null);
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn--primario" disabled={subiendoDoc}>
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {modalDocs ? (
        <div className="gestor-iso__modal" role="dialog" aria-modal="true">
          <div className="gestor-iso__modal-caja gestor-iso__modal-caja--chica">
            <div className="gestor-iso__modal-cab">
              <div>
                <span className="gestor-iso__codigo">{modalDocs.formatCode}</span>
                <h3>Documentos del formato</h3>
              </div>
              <button type="button" aria-label="Cerrar" onClick={() => setModalDocs(null)}>
                ×
              </button>
            </div>
            <div className="gestor-iso__docs-vista">
              {documentosDe(modalDocs).length === 0 && !modalDocs.evidence?.trim() ? (
                <p>No hay documentos cargados.</p>
              ) : null}
              {documentosDe(modalDocs).map((doc) => (
                <a
                  key={doc.id}
                  className="gestor-iso__docs-chip"
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <IconoVerDocumento />
                  <span>{doc.nombre}</span>
                </a>
              ))}
              {modalDocs.evidence?.trim() ? (
                <p className="gestor-iso__hint">
                  Ruta / enlace:{" "}
                  {/^https?:\/\//i.test(modalDocs.evidence.trim()) ? (
                    <a href={modalDocs.evidence.trim()} target="_blank" rel="noreferrer">
                      {modalDocs.evidence.trim()}
                    </a>
                  ) : (
                    <code>{modalDocs.evidence.trim()}</code>
                  )}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {modalProyecto ? (
        <div className="gestor-iso__modal" role="dialog" aria-modal="true">
          <div className="gestor-iso__modal-caja">
            <div className="gestor-iso__modal-cab">
              <div>
                <h3>Registrar nuevo proyecto de diseño</h3>
              </div>
              <button type="button" aria-label="Cerrar" onClick={() => setModalProyecto(false)}>
                ×
              </button>
            </div>
            <form className="gestor-iso__form" onSubmit={crearProyecto}>
              <label>
                Código del proyecto
                <input
                  required
                  value={formProyecto.code}
                  onChange={(e) => setFormProyecto({ ...formProyecto, code: e.target.value })}
                  placeholder="Ej: PRJ-2026-03"
                />
              </label>
              <label>
                Nombre del proyecto / producto
                <input
                  required
                  value={formProyecto.name}
                  onChange={(e) => setFormProyecto({ ...formProyecto, name: e.target.value })}
                />
              </label>
              <div className="gestor-iso__grid">
                <label>
                  Tipo de desarrollo
                  <select
                    value={formProyecto.type}
                    onChange={(e) =>
                      setFormProyecto({
                        ...formProyecto,
                        type: e.target.value as TipoProyectoIso,
                      })
                    }
                  >
                    {TIPOS_PROYECTO_ISO.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Encargado (equipo de Diseño)
                  <select
                    required
                    value={formProyecto.leadId}
                    onChange={(e) => setFormProyecto({ ...formProyecto, leadId: e.target.value })}
                  >
                    {opcionesEncargado.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.etiqueta}
                      </option>
                    ))}
                  </select>
                  <span className="gestor-iso__hint">
                    Sale de Equipo (auxiliares registrados). Si aún no hay, usa el perfil de ejemplo.
                  </span>
                </label>
                <label>
                  Fecha de inicio
                  <input
                    type="date"
                    required
                    value={formProyecto.startDate}
                    onChange={(e) =>
                      setFormProyecto({ ...formProyecto, startDate: e.target.value })
                    }
                  />
                </label>
                <label>
                  Fecha compromiso
                  <input
                    type="date"
                    required
                    value={formProyecto.targetDate}
                    onChange={(e) =>
                      setFormProyecto({ ...formProyecto, targetDate: e.target.value })
                    }
                  />
                </label>
              </div>
              <div className="gestor-iso__form-acciones">
                <button type="button" className="btn" onClick={() => setModalProyecto(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn--primario">
                  Crear e inicializar formatos
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {proyecto ? (
        <div className="gestor-iso__print" aria-hidden>
          <h1>Informe de control de diseño y desarrollo</h1>
          <p>Cumplimiento ISO 9001:2015 — Numeral 8.3</p>
          <p>
            <strong>Código:</strong> {proyecto.code} · <strong>Proyecto:</strong> {proyecto.name}
          </p>
          <p>
            <strong>Líder:</strong> {proyecto.lead} · <strong>Tipo:</strong> {proyecto.type} ·{" "}
            <strong>Avance:</strong> {progresoGlobal}%
          </p>
          <table className="gestor-iso__tabla">
            <thead>
              <tr>
                <th>Código</th>
                <th>Etapa</th>
                <th>Formato</th>
                <th>Versión</th>
                <th>Estado</th>
                <th>Aprobado por</th>
              </tr>
            </thead>
            <tbody>
              {MASTER_FORMATS.map((fmt) => {
                const rec = estado.records.find(
                  (r) => r.projectId === proyecto.id && r.formatCode === fmt.code,
                );
                return (
                  <tr key={fmt.code}>
                    <td>{fmt.code}</td>
                    <td>{fmt.stage}</td>
                    <td>{fmt.name}</td>
                    <td>v{rec?.version || "01"}</td>
                    <td>{rec?.status || "Pendiente"}</td>
                    <td>{rec?.approvedBy || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

export default GestorIsoDiseno;
