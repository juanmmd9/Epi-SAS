import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { SoloConPermiso } from "../auth/SoloConPermiso";
import { imprimirPdf } from "../../lib/imprimirPdf";
import { listarPersonal } from "../personal/personalService";
import type { Persona } from "../personal/types";
import { obtenerPdfPermiso, urlVistaPreviaPdf } from "./ghre030Pdf";
import { listarHorarioAnio, listarFestivosAnio } from "./horarioService";
import {
  etiquetaEstadoPermiso,
  etiquetaTipoPermiso,
  formatearTiempoConcedido,
  nombreDiaSemana,
  obtenerJornadaEsperada,
} from "./permisosCalculo";
import {
  cancelarPermiso,
  decidirPermiso,
  eliminarPermiso,
  existeTablaPermisos,
  listarPermisos,
} from "./permisosService";
import {
  SQL_MIGRACION_PERMISOS,
  SQL_MIGRACION_PERMISO_CANCELADO,
  SQL_MIGRACION_PERMISO_RECHAZADO,
} from "./permisosSetup";
import AvisoPoliticaPermisosOperador from "./AvisoPoliticaPermisosOperador";
import {
  permisoPuedeCancelarse,
  permisoPuedeImprimirse,
  MOTIVOS_PERMISO,
  TIPOS_REMUNERACION,
  type Festivo,
  type HorarioLaboral,
  type MotivoPermiso,
  type RegistroPermiso,
  type TipoRemuneracion,
} from "./types";
import "./permisos.css";

function AvisoSetupPermisos() {
  const projectRef =
    import.meta.env.VITE_SUPABASE_URL?.match(/https:\/\/([^.]+)\./)?.[1] ?? "_";
  const urlSql = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;

  function copiarSql() {
    void navigator.clipboard.writeText(SQL_MIGRACION_PERMISOS);
  }

  return (
    <aside className="aviso-setup-personal permisos__aviso-sql">
      <h3>Falta crear las tablas de permisos en Supabase</h3>
      <p>Ejecuta este script en SQL Editor y recarga la página.</p>
      <div className="aviso-setup-personal__acciones">
        <button type="button" className="btn" onClick={copiarSql}>
          Copiar script SQL
        </button>
        <a className="btn btn--primario" href={urlSql} target="_blank" rel="noreferrer">
          Abrir SQL Editor
        </a>
      </div>
      <pre className="aviso-setup-personal__sql">{SQL_MIGRACION_PERMISOS}</pre>
    </aside>
  );
}

function PermisosPage() {
  const navigate = useNavigate();
  const { perfil, puede, esAdmin } = useAuth();
  const puedeAprobar = puede("aprobar.permisos");
  const anioActual = new Date().getFullYear();
  const [permisos, setPermisos] = useState<RegistroPermiso[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [horarios, setHorarios] = useState<HorarioLaboral[]>([]);
  const [festivos, setFestivos] = useState<Festivo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [faltaTabla, setFaltaTabla] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [imprimiendoId, setImprimiendoId] = useState<string | null>(null);
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);
  const [filtroPersonal, setFiltroPersonal] = useState("");
  const [filtroMes, setFiltroMes] = useState("");
  const [filtroAnio, setFiltroAnio] = useState(String(anioActual));
  const [filtroEstado, setFiltroEstado] = useState("");
  const [decidiendoId, setDecidiendoId] = useState<string | null>(null);
  const [tiposPendientes, setTiposPendientes] = useState<
    Record<string, { remunerado: TipoRemuneracion; motivo: MotivoPermiso }>
  >({});
  const previewAnterior = useRef<string | null>(null);
  const previewRef = useRef<HTMLElement>(null);

  const mapaPersonas = useMemo(() => {
    const mapa = new Map<string, Persona>();
    personas.forEach((p) => mapa.set(p.id, p));
    return mapa;
  }, [personas]);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const ok = await existeTablaPermisos();
      setFaltaTabla(!ok);
      if (!ok) {
        setPermisos([]);
        return;
      }
      const anio = Number.parseInt(filtroAnio, 10) || anioActual;
      const [lista, personal, horario, listaFestivos] = await Promise.all([
        listarPermisos(),
        listarPersonal(),
        listarHorarioAnio(anio).catch(() => [] as HorarioLaboral[]),
        listarFestivosAnio(anio).catch(() => [] as Festivo[]),
      ]);
      setPermisos(lista);
      setPersonas(personal);
      setHorarios(horario);
      setFestivos(listaFestivos);
    } catch (e) {
      setError("No se pudieron cargar los permisos: " + (e as Error).message);
    } finally {
      setCargando(false);
    }
  }, [filtroAnio, anioActual]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  useEffect(() => {
    if (!puedeAprobar) return;
    const id = window.setInterval(() => {
      void listarPermisos()
        .then(setPermisos)
        .catch(() => undefined);
    }, 20000);
    return () => window.clearInterval(id);
  }, [puedeAprobar]);

  useEffect(() => {
    return () => {
      if (previewAnterior.current) URL.revokeObjectURL(previewAnterior.current);
    };
  }, []);

  const pendientes = useMemo(
    () => permisos.filter((p) => p.estado === "solicitado"),
    [permisos],
  );

  const permisosFiltrados = useMemo(() => {
    return permisos.filter((permiso) => {
      if (!puedeAprobar && perfil?.id && permiso.datos.solicitadoPorId !== perfil.id) {
        return false;
      }
      if (filtroPersonal && permiso.personal_id !== filtroPersonal) return false;
      if (filtroEstado && permiso.estado !== filtroEstado) return false;
      const fecha = permiso.datos.fechaDesde;
      if (filtroAnio && !fecha.startsWith(filtroAnio)) return false;
      if (filtroMes) {
        const mes = fecha.slice(5, 7);
        if (mes !== filtroMes.padStart(2, "0")) return false;
      }
      return true;
    });
  }, [
    permisos,
    filtroPersonal,
    filtroMes,
    filtroAnio,
    filtroEstado,
    puedeAprobar,
    perfil?.id,
  ]);

  function cerrarVistaPrevia() {
    if (previewAnterior.current) URL.revokeObjectURL(previewAnterior.current);
    previewAnterior.current = null;
    setPdfPreview(null);
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

  function editarPermiso(permiso: RegistroPermiso) {
    if (!puedeAprobar) {
      setError("El operador no puede modificar una solicitud ya enviada. Solo puede anularla si sigue pendiente.");
      return;
    }
    navigate("/formatos/gh-re-030", { state: { editarPermiso: permiso } });
  }

  async function imprimirPermiso(permiso: RegistroPermiso) {
    setError(null);
    setMensaje(null);
    if (!esAdmin && !permisoPuedeImprimirse(permiso.estado)) {
      setError("Solo se imprime un permiso aprobado.");
      return;
    }
    setImprimiendoId(permiso.id);
    try {
      const pdfBytes = await obtenerPdfPermiso(permiso);
      mostrarPreview(pdfBytes);
      imprimirPdf(pdfBytes);
      setMensaje(`Formato GH-RE-030 No. ${permiso.numero} listo para impresión.`);
    } catch (e) {
      setError("No se pudo generar el formato: " + (e as Error).message);
    } finally {
      setImprimiendoId(null);
    }
  }

  async function manejarEliminar(permiso: RegistroPermiso) {
    if (!window.confirm(`¿Eliminar permiso No. ${permiso.numero}?`)) return;
    setError(null);
    setMensaje(null);
    try {
      await eliminarPermiso(permiso.id);
      setPermisos((previos) => previos.filter((p) => p.id !== permiso.id));
      setMensaje(`Permiso No. ${permiso.numero} eliminado.`);
    } catch (e) {
      setError("No se pudo eliminar: " + (e as Error).message);
    }
  }

  function tipoPara(permiso: RegistroPermiso): {
    remunerado: TipoRemuneracion;
    motivo: MotivoPermiso;
  } {
    return (
      tiposPendientes[permiso.id] ?? {
        remunerado: permiso.datos.remunerado || "remunerado",
        motivo: permiso.datos.motivo || "personal",
      }
    );
  }

  function actualizarTipoPendiente(
    id: string,
    cambios: Partial<{ remunerado: TipoRemuneracion; motivo: MotivoPermiso }>,
  ) {
    setTiposPendientes((prev) => {
      const base = prev[id] ?? { remunerado: "remunerado" as const, motivo: "personal" as const };
      return { ...prev, [id]: { ...base, ...cambios } };
    });
  }

  async function manejarDecision(
    permiso: RegistroPermiso,
    decision: "autorizado" | "rechazado",
  ) {
    if (!perfil) return;
    let motivo = "";
    if (decision === "rechazado") {
      motivo = window.prompt("Motivo del rechazo (opcional):", "") ?? "";
    } else if (!window.confirm(`¿Aprobar permiso No. ${permiso.numero}?`)) {
      return;
    }

    const tipo = tipoPara(permiso);

    setDecidiendoId(permiso.id);
    setError(null);
    setMensaje(null);
    try {
      const actualizado = await decidirPermiso(
        permiso,
        decision,
        { id: perfil.id, nombre: perfil.nombre || perfil.email },
        motivo,
        decision === "autorizado" ? tipo : undefined,
      );
      setPermisos((previos) =>
        previos.map((p) => (p.id === actualizado.id ? actualizado : p)),
      );
      setTiposPendientes((prev) => {
        const copia = { ...prev };
        delete copia[permiso.id];
        return copia;
      });
      setMensaje(
        decision === "autorizado"
          ? `Permiso No. ${permiso.numero} aprobado.`
          : `Permiso No. ${permiso.numero} rechazado.`,
      );
    } catch (e) {
      const msg = (e as Error).message;
      if (/check|rechazado|estado/i.test(msg)) {
        setError(
          "Falta habilitar el estado «rechazado» en Supabase. Ejecuta la migración permisos_estado_rechazado.sql.",
        );
      } else {
        setError("No se pudo actualizar el permiso: " + msg);
      }
    } finally {
      setDecidiendoId(null);
    }
  }

  async function manejarCancelar(permiso: RegistroPermiso) {
    if (!perfil) {
      setError("No se pudo verificar tu sesión. Recarga la página e intenta de nuevo.");
      return;
    }
    if (!permisoPuedeCancelarse(permiso.estado)) {
      setError("Solo se pueden anular solicitudes en estado Solicitado.");
      return;
    }
    if (!puedeAprobar && permiso.datos.solicitadoPorId && permiso.datos.solicitadoPorId !== perfil.id) {
      setError("Solo puedes anular tus propias solicitudes.");
      return;
    }
    // En español el diálogo nativo dice «Aceptar / Cancelar»: hay que pulsar ACEPTAR.
    const ok = window.confirm(
      `La solicitud No. ${permiso.numero} se marcará como CANCELADA.\n\nPulsa ACEPTAR para confirmar.`,
    );
    if (!ok) return;

    setDecidiendoId(permiso.id);
    setError(null);
    setMensaje(null);
    try {
      const actualizado = await cancelarPermiso(permiso, {
        id: perfil.id,
        nombre: perfil.nombre || perfil.email,
      });
      setPermisos((previos) =>
        previos.map((p) => (p.id === actualizado.id ? actualizado : p)),
      );
      setFiltroEstado("cancelado");
      setMensaje(`Solicitud No. ${permiso.numero} anulada (estado: Cancelado).`);
    } catch (e) {
      const msg = (e as Error).message;
      if (/check|cancelado|estado/i.test(msg)) {
        setError(
          "Falta habilitar el estado «cancelado» en Supabase. Ejecuta la migración permisos_estado_cancelado.sql.",
        );
      } else {
        setError("No se pudo anular la solicitud: " + msg);
      }
    } finally {
      setDecidiendoId(null);
    }
  }

  function copiarMigracionRechazo() {
    void navigator.clipboard.writeText(SQL_MIGRACION_PERMISO_RECHAZADO);
    setMensaje("Script de migración (rechazado/cancelado) copiado. Pégalo en SQL Editor de Supabase.");
  }

  function copiarMigracionCancelado() {
    void navigator.clipboard.writeText(SQL_MIGRACION_PERMISO_CANCELADO);
    setMensaje("Script de migración «cancelado» copiado. Pégalo en SQL Editor de Supabase.");
  }

  return (
    <section className="permisos">
      <header className="permisos__encabezado">
        <div>
          <h1>{puedeAprobar ? "Control de permisos del personal" : "Mis solicitudes de permiso"}</h1>
          <p className="personal__descripcion">
            {puedeAprobar
              ? "Aprueba o rechaza solicitudes GH-RE-030. El operador registra; tú decides."
              : "Registra permisos de trabajadores. Tras enviarlos no se pueden editar; solo anular si siguen pendientes."}
          </p>
        </div>
        <div className="permisos__enlaces-cabecera">
          <SoloConPermiso permiso="crear.permisos">
            <Link className="btn btn--primario" to="/formatos/gh-re-030">
              Nuevo permiso
            </Link>
          </SoloConPermiso>
          <SoloConPermiso permiso="ver.horario">
            <Link className="btn" to="/personal/horario">
              Horario y festivos
            </Link>
          </SoloConPermiso>
          <SoloConPermiso permiso="ver.personal">
            <Link className="btn" to="/personal">
              Volver a Personal
            </Link>
          </SoloConPermiso>
        </div>
      </header>

      {!puedeAprobar && <AvisoPoliticaPermisosOperador />}

      {faltaTabla && <AvisoSetupPermisos />}

      {puedeAprobar && !faltaTabla && pendientes.length > 0 && (
        <aside className="permisos__bandeja">
          <div className="permisos__bandeja-cabecera">
            <h2>Pendientes de aprobación ({pendientes.length})</h2>
            <span className="permisos__chip permisos__chip--solicitado">Requiere decisión</span>
          </div>
          <ul className="permisos__bandeja-lista">
            {pendientes.map((permiso) => {
              const tipo = tipoPara(permiso);
              return (
              <li key={permiso.id} className="permisos__bandeja-item">
                <div>
                  <strong>
                    No. {permiso.numero} — {permiso.datos.nombreTrabajador}
                  </strong>
                  <p>
                    {permiso.datos.fechaDesde} · {permiso.datos.horaDesde} → {permiso.datos.horaHasta}{" "}
                    · {formatearTiempoConcedido(permiso.datos.tiempoConcedidoMinutos)}
                    {permiso.datos.solicitadoPorNombre
                      ? ` · Solicitó: ${permiso.datos.solicitadoPorNombre}`
                      : ""}
                  </p>
                  {permiso.datos.descripcion && <p>{permiso.datos.descripcion}</p>}
                  <div className="permisos__tipo-admin">
                    <label>
                      Remuneración
                      <select
                        value={tipo.remunerado}
                        onChange={(e) =>
                          actualizarTipoPendiente(permiso.id, {
                            remunerado: e.target.value as TipoRemuneracion,
                          })
                        }
                      >
                        {TIPOS_REMUNERACION.map((item) => (
                          <option key={item.clave} value={item.clave}>
                            {item.etiqueta}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Motivo
                      <select
                        value={tipo.motivo}
                        onChange={(e) =>
                          actualizarTipoPendiente(permiso.id, {
                            motivo: e.target.value as MotivoPermiso,
                          })
                        }
                      >
                        {MOTIVOS_PERMISO.map((item) => (
                          <option key={item.clave} value={item.clave}>
                            {item.etiqueta}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
                <div className="permisos__tabla-acciones">
                  <button
                    type="button"
                    className="btn btn--primario"
                    disabled={decidiendoId === permiso.id}
                    onClick={() => void manejarDecision(permiso, "autorizado")}
                  >
                    Aprobar
                  </button>
                  <button
                    type="button"
                    className="btn btn--advertencia"
                    disabled={decidiendoId === permiso.id}
                    onClick={() => void manejarDecision(permiso, "rechazado")}
                  >
                    Rechazar
                  </button>
                  <button type="button" className="btn" onClick={() => editarPermiso(permiso)}>
                    Ver
                  </button>
                </div>
              </li>
              );
            })}
          </ul>
        </aside>
      )}

      {(puedeAprobar || puede("crear.permisos")) && (
        <p className="permisos__ayuda-sql">
          Si al rechazar o cancelar aparece error de estado,{" "}
          <button type="button" className="btn" onClick={copiarMigracionCancelado}>
            copia la migración SQL
          </button>{" "}
          y ejecútala en Supabase.
        </p>
      )}

      {mensaje && <p className="permisos__mensaje permisos__mensaje--ok">{mensaje}</p>}
      {error && <p className="permisos__mensaje permisos__mensaje--error">{error}</p>}

      <div className="permisos__filtros">
        <label>
          Año
          <input
            type="number"
            min={2020}
            max={2100}
            value={filtroAnio}
            onChange={(e) => setFiltroAnio(e.target.value)}
          />
        </label>
        <label>
          Mes
          <select value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)}>
            <option value="">Todos</option>
            {Array.from({ length: 12 }, (_, i) => {
              const mes = String(i + 1).padStart(2, "0");
              return (
                <option key={mes} value={mes}>
                  {mes}
                </option>
              );
            })}
          </select>
        </label>
        <label>
          Estado
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <option value="">Todos</option>
            <option value="solicitado">Solicitado</option>
            <option value="autorizado">Aprobado</option>
            <option value="rechazado">Rechazado</option>
            <option value="cancelado">Cancelado</option>
            <option value="en_permiso">En permiso</option>
            <option value="cerrado">Cerrado</option>
            <option value="borrador">Borrador</option>
          </select>
        </label>
        {puedeAprobar && (
          <label>
            Técnico
            <select value={filtroPersonal} onChange={(e) => setFiltroPersonal(e.target.value)}>
              <option value="">Todos</option>
              {personas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {cargando && <p>Cargando permisos...</p>}

      {!cargando && !faltaTabla && permisosFiltrados.length === 0 && (
        <p className="personal__vacio">
          No hay permisos para los filtros seleccionados.{" "}
          <Link to="/formatos/gh-re-030">Registrar uno</Link>.
        </p>
      )}

      {!cargando && festivos.length > 0 && puedeAprobar && (
        <p className="permisos__resumen-festivos">
          {festivos.length} festivos cargados en {filtroAnio}.{" "}
          <Link to="/personal/horario">Ver calendario</Link>
        </p>
      )}

      {!cargando && permisosFiltrados.length > 0 && (
        <div className="permisos__tabla-scroll">
          <table className="permisos__tabla">
            <thead>
              <tr>
                <th>No.</th>
                <th>Día</th>
                <th>Fecha</th>
                <th>Festivo</th>
                <th>Técnico</th>
                <th>Hora salida</th>
                <th>Hora llegada</th>
                <th>Tiempo</th>
                <th>Tipo permiso</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {permisosFiltrados.map((permiso) => {
                const jornada = obtenerJornadaEsperada(
                  horarios,
                  permiso.datos.fechaDesde,
                  festivos,
                );
                const persona = mapaPersonas.get(permiso.personal_id);
                const imprimiendo = imprimiendoId === permiso.id;
                const pendiente = permiso.estado === "solicitado";
                return (
                  <tr
                    key={permiso.id}
                    className={
                      (jornada?.esFestivo ? "permisos__fila--festivo" : "") +
                      (pendiente ? " permisos__fila--pendiente" : "")
                    }
                  >
                    <td>{permiso.numero}</td>
                    <td>{nombreDiaSemana(permiso.datos.fechaDesde)}</td>
                    <td>{permiso.datos.fechaDesde}</td>
                    <td>
                      {jornada?.esFestivo ? (
                        <span className="permisos__chip permisos__chip--festivo">
                          {jornada.nombreFestivo}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{persona?.nombre ?? permiso.datos.nombreTrabajador}</td>
                    <td>{permiso.datos.horaSalidaGh || permiso.datos.horaDesde}</td>
                    <td>{permiso.datos.horaLlegadaGh || permiso.datos.horaHasta}</td>
                    <td>{formatearTiempoConcedido(permiso.datos.tiempoConcedidoMinutos)}</td>
                    <td>{etiquetaTipoPermiso(permiso.datos)}</td>
                    <td>
                      <span className={`permisos__chip permisos__chip--${permiso.estado}`}>
                        {etiquetaEstadoPermiso(permiso.estado)}
                      </span>
                      {permiso.datos.motivoRechazo && (
                        <small className="permisos__motivo-rechazo">
                          {permiso.datos.motivoRechazo}
                        </small>
                      )}
                      {permiso.datos.motivoCancelacion && (
                        <small className="permisos__motivo-rechazo">
                          {permiso.datos.motivoCancelacion}
                        </small>
                      )}
                    </td>
                    <td>
                      <div className="permisos__tabla-acciones">
                        {puedeAprobar && pendiente && (
                          <>
                            <button
                              type="button"
                              className="btn btn--primario"
                              disabled={decidiendoId === permiso.id}
                              onClick={() => void manejarDecision(permiso, "autorizado")}
                            >
                              Aprobar
                            </button>
                            <button
                              type="button"
                              className="btn btn--advertencia"
                              disabled={decidiendoId === permiso.id}
                              onClick={() => void manejarDecision(permiso, "rechazado")}
                            >
                              Rechazar
                            </button>
                          </>
                        )}
                        {permisoPuedeCancelarse(permiso.estado) &&
                          (puedeAprobar ||
                            !permiso.datos.solicitadoPorId ||
                            permiso.datos.solicitadoPorId === perfil?.id) && (
                            <button
                              type="button"
                              className="btn btn--advertencia"
                              disabled={decidiendoId === permiso.id}
                              onClick={() => void manejarCancelar(permiso)}
                            >
                              {decidiendoId === permiso.id ? "Anulando..." : "Anular solicitud"}
                            </button>
                          )}
                        {puedeAprobar && (
                          <button
                            type="button"
                            className="btn"
                            onClick={() => editarPermiso(permiso)}
                          >
                            Editar
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn"
                          disabled={
                            imprimiendo ||
                            (!esAdmin && !permisoPuedeImprimirse(permiso.estado))
                          }
                          onClick={() => void imprimirPermiso(permiso)}
                        >
                          {imprimiendo ? "..." : "Imprimir"}
                        </button>
                        <SoloConPermiso permiso="eliminar.registros">
                          <button
                            type="button"
                            className="btn btn--peligro"
                            onClick={() => void manejarEliminar(permiso)}
                          >
                            Eliminar
                          </button>
                        </SoloConPermiso>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pdfPreview && (
        <section ref={previewRef} className="permisos__preview">
          <div className="permisos__preview-barra">
            <h2>Vista previa para impresión</h2>
            <button type="button" className="btn" onClick={cerrarVistaPrevia}>
              Cerrar
            </button>
          </div>
          <iframe title="Vista previa GH-RE-030" src={pdfPreview} className="permisos__iframe" />
        </section>
      )}
    </section>
  );
}

export default PermisosPage;
