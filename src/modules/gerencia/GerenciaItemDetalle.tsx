import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthContext";
import {
  actualizarItemGerencia,
  agregarComentario,
  crearCotizacion,
  listarComentarios,
  listarCotizaciones,
  listarHistorial,
  marcarCotizacionElegida,
  tablasSeguimientoListas,
} from "./gerenciaService";
import {
  avancePorcentaje,
  diasAbiertos,
  diasLimiteSla,
  formatoFechaCorta,
  formatoMontoCop,
  semaforoItem,
} from "./gerenciaSla";
import {
  IMPACTOS_GERENCIA,
  etiquetaEstado,
  etiquetaImpacto,
  etiquetaTablero,
  etiquetaTipo,
  type ComentarioGerencia,
  type CotizacionGerencia,
  type HistorialGerencia,
  type ImpactoGerencia,
  type ItemGerencia,
} from "./types";

interface Props {
  item: ItemGerencia;
  puedeGestionar: boolean;
  onCerrar: () => void;
  onActualizado: (item: ItemGerencia) => void;
}

function GerenciaItemDetalle({ item: inicial, puedeGestionar, onCerrar, onActualizado }: Props) {
  const { perfil } = useAuth();
  const [item, setItem] = useState(inicial);
  const [historial, setHistorial] = useState<HistorialGerencia[]>([]);
  const [comentarios, setComentarios] = useState<ComentarioGerencia[]>([]);
  const [cotizaciones, setCotizaciones] = useState<CotizacionGerencia[]>([]);
  const [seguimientoOk, setSeguimientoOk] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [comentario, setComentario] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [montoCot, setMontoCot] = useState("");
  const [vigencia, setVigencia] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [notasCot, setNotasCot] = useState("");
  const [impacto, setImpacto] = useState<ImpactoGerencia>(inicial.impacto);
  const [compromiso, setCompromiso] = useState(inicial.fecha_compromiso ?? "");
  const [responsable, setResponsable] = useState(inicial.responsable_nombre ?? "");

  const cargar = useCallback(async () => {
    setError(null);
    try {
      const ok = await tablasSeguimientoListas();
      setSeguimientoOk(ok);
      if (!ok) return;
      const [h, c, q] = await Promise.all([
        listarHistorial(inicial.id),
        listarComentarios(inicial.id),
        listarCotizaciones(inicial.id),
      ]);
      setHistorial(h);
      setComentarios(c);
      setCotizaciones(q);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el detalle");
    }
  }, [inicial.id]);

  useEffect(() => {
    setItem(inicial);
    setImpacto(inicial.impacto);
    setCompromiso(inicial.fecha_compromiso ?? "");
    setResponsable(inicial.responsable_nombre ?? "");
    void cargar();
  }, [inicial, cargar]);

  const semaforo = semaforoItem(item);
  const dias = diasAbiertos(item);
  const limite = diasLimiteSla(item.urgencia);
  const avance = avancePorcentaje(item);
  const autorNombre = perfil?.nombre || perfil?.usuario || "Usuario";

  async function enviarComentario(evento: FormEvent) {
    evento.preventDefault();
    setOcupado(true);
    setError(null);
    try {
      const nuevo = await agregarComentario(
        item.id,
        comentario,
        perfil?.id ?? null,
        autorNombre,
      );
      setComentarios((prev) => [...prev, nuevo]);
      setComentario("");
      setMensaje("Comentario publicado.");
      const h = await listarHistorial(item.id);
      setHistorial(h);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo comentar");
    } finally {
      setOcupado(false);
    }
  }

  async function enviarCotizacion(evento: FormEvent) {
    evento.preventDefault();
    if (!proveedor.trim()) {
      setError("Indica el proveedor.");
      return;
    }
    setOcupado(true);
    setError(null);
    try {
      const montoNum = montoCot.trim() ? Number(montoCot.replace(",", ".")) : null;
      const creada = await crearCotizacion({
        itemId: item.id,
        proveedor,
        monto: montoNum != null && !Number.isNaN(montoNum) ? montoNum : null,
        vigencia: vigencia || null,
        archivo,
        notas: notasCot,
        autorId: perfil?.id ?? null,
        autorNombre,
      });
      setCotizaciones((prev) => [creada, ...prev]);
      setProveedor("");
      setMontoCot("");
      setVigencia("");
      setArchivo(null);
      setNotasCot("");
      setMensaje("Cotización guardada.");
      setHistorial(await listarHistorial(item.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la cotización");
    } finally {
      setOcupado(false);
    }
  }

  async function elegirCotizacion(cot: CotizacionGerencia) {
    if (!puedeGestionar) return;
    setOcupado(true);
    setError(null);
    try {
      await marcarCotizacionElegida(item.id, cot.id, cot.proveedor, cot.monto);
      setCotizaciones(await listarCotizaciones(item.id));
      const actualizado = await actualizarItemGerencia(item.id, {
        proveedor: cot.proveedor,
        monto: cot.monto,
      });
      setItem(actualizado);
      onActualizado(actualizado);
      setMensaje(`Elegida cotización de ${cot.proveedor}.`);
      setHistorial(await listarHistorial(item.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo elegir");
    } finally {
      setOcupado(false);
    }
  }

  async function guardarGestion(evento: FormEvent) {
    evento.preventDefault();
    if (!puedeGestionar) return;
    setOcupado(true);
    setError(null);
    try {
      const actualizado = await actualizarItemGerencia(item.id, {
        impacto,
        fecha_compromiso: compromiso || null,
        responsable_nombre: responsable,
      });
      setItem(actualizado);
      onActualizado(actualizado);
      setMensaje("Datos de gestión guardados.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setOcupado(false);
    }
  }

  async function confirmarRecepcion() {
    setOcupado(true);
    setError(null);
    try {
      const actualizado = await actualizarItemGerencia(item.id, {
        confirmado_area: true,
      });
      setItem(actualizado);
      onActualizado(actualizado);
      setMensaje("Confirmaste la recepción / cierre.");
      if (seguimientoOk) setHistorial(await listarHistorial(item.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo confirmar");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="gerencia__modal gerencia__modal--detalle" role="dialog" aria-modal="true">
      <button type="button" className="gerencia__modal-fondo" aria-label="Cerrar" onClick={onCerrar} />
      <div className="gerencia__modal-panel gerencia__modal-panel--ancho">
        <header className="gerencia__detalle-cabecera">
          <div>
            <p className="gerencia__detalle-kicker">
              {etiquetaTipo(item.tipo)} · {etiquetaTablero(item.tablero)}
            </p>
            <h2>{item.titulo}</h2>
            <p className="gerencia__modal-detalle">
              {item.area || "Sin área"}
              {item.solicitante_nombre ? ` · ${item.solicitante_nombre}` : ""}
              {" · "}
              {etiquetaEstado(item.estado)}
            </p>
          </div>
          <button type="button" className="btn" onClick={onCerrar}>
            Cerrar
          </button>
        </header>

        <div className="gerencia__detalle-metas">
          <div className={`gerencia__semaforo gerencia__semaforo--${semaforo}`}>
            SLA {semaforo.toUpperCase()} · {dias} / {limite} días
          </div>
          <div className="gerencia__avance">
            <span>Avance {avance}%</span>
            <div className="gerencia__avance-barra">
              <i style={{ width: `${avance}%` }} />
            </div>
          </div>
          {formatoMontoCop(item.monto) && (
            <strong>{formatoMontoCop(item.monto)}</strong>
          )}
        </div>

        {!seguimientoOk && (
          <p className="gerencia__mensaje gerencia__mensaje--aviso">
            Para historial, comentarios y cotizaciones ejecuta en SQL Editor{" "}
            <code>supabase/migrations/gerencia_seguimiento.sql</code>.
          </p>
        )}
        {error && <p className="gerencia__mensaje gerencia__mensaje--error">{error}</p>}
        {mensaje && <p className="gerencia__mensaje gerencia__mensaje--ok">{mensaje}</p>}

        <div className="gerencia__detalle-grid">
          <section className="gerencia__panel">
            <h3>Seguimiento</h3>
            <p className="gerencia__tarjeta-detalle">
              Creada: {formatoFechaCorta(item.creado_en)} · Impacto:{" "}
              {etiquetaImpacto(item.impacto)}
              {item.fecha_compromiso
                ? ` · Compromiso: ${formatoFechaCorta(item.fecha_compromiso)}`
                : ""}
              {item.responsable_nombre ? ` · Resp.: ${item.responsable_nombre}` : ""}
              {item.proveedor ? ` · Proveedor: ${item.proveedor}` : ""}
            </p>
            {item.notas && <p className="gerencia__tarjeta-detalle">{item.notas}</p>}

            {item.estado === "eliminado" && (
              <p className="gerencia__aviso-eliminacion">
                <strong>
                  {item.eliminado_por_nombre
                    ? `${item.eliminado_por_nombre} eliminó esta solicitud.`
                    : "Esta solicitud fue eliminada."}
                </strong>
                <br />
                Motivo: {item.motivo_eliminacion || "Sin motivo registrado"}
                {item.eliminado_en ? ` · ${formatoFechaCorta(item.eliminado_en)}` : ""}
              </p>
            )}

            {puedeGestionar && item.estado !== "eliminado" && (
              <form className="gerencia__form" onSubmit={(e) => void guardarGestion(e)}>
                <label className="gerencia__campo">
                  Impacto
                  <select
                    value={impacto}
                    onChange={(e) => setImpacto(e.target.value as ImpactoGerencia)}
                  >
                    {IMPACTOS_GERENCIA.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.etiqueta}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="gerencia__campo">
                  Fecha compromiso
                  <input
                    type="date"
                    value={compromiso}
                    onChange={(e) => setCompromiso(e.target.value)}
                  />
                </label>
                <label className="gerencia__campo">
                  Responsable Gerencia
                  <input
                    value={responsable}
                    onChange={(e) => setResponsable(e.target.value)}
                    placeholder="Nombre"
                  />
                </label>
                <button type="submit" className="btn btn--primario" disabled={ocupado}>
                  Guardar gestión
                </button>
              </form>
            )}

            {!item.confirmado_area && item.estado === "hecho" && (
              <button
                type="button"
                className="btn btn--primario"
                disabled={ocupado}
                onClick={() => void confirmarRecepcion()}
              >
                Confirmar recepción (área)
              </button>
            )}
            {item.confirmado_area && (
              <p className="gerencia__mensaje gerencia__mensaje--ok">Área confirmó recepción.</p>
            )}
          </section>

          <section className="gerencia__panel">
            <h3>Línea de tiempo</h3>
            {!seguimientoOk ? (
              <p className="gerencia__vacio">Activa el SQL de seguimiento.</p>
            ) : historial.length === 0 ? (
              <p className="gerencia__vacio">Sin eventos aún.</p>
            ) : (
              <ol className="gerencia__timeline">
                {historial.map((h) => (
                  <li key={h.id}>
                    <strong>{h.tipo}</strong>
                    <span>{formatoFechaCorta(h.creado_en)}</span>
                    <p>{h.detalle}</p>
                    {h.autor_nombre && <small>{h.autor_nombre}</small>}
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="gerencia__panel">
            <h3>Comentarios</h3>
            <div className="gerencia__comentarios">
              {comentarios.map((c) => (
                <article key={c.id} className="gerencia__comentario">
                  <header>
                    <strong>{c.autor_nombre || "Usuario"}</strong>
                    <span>{formatoFechaCorta(c.creado_en)}</span>
                  </header>
                  <p>{c.mensaje}</p>
                </article>
              ))}
              {seguimientoOk && comentarios.length === 0 && (
                <p className="gerencia__vacio">Sin comentarios.</p>
              )}
            </div>
            {seguimientoOk && (
              <form className="gerencia__form" onSubmit={(e) => void enviarComentario(e)}>
                <label className="gerencia__campo">
                  Nuevo comentario
                  <textarea
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    rows={3}
                    required
                  />
                </label>
                <button type="submit" className="btn btn--primario" disabled={ocupado}>
                  Publicar
                </button>
              </form>
            )}
          </section>

          <section className="gerencia__panel">
            <h3>Cotizaciones</h3>
            <div className="gerencia__lista">
              {cotizaciones.map((cot) => (
                <article
                  key={cot.id}
                  className={`gerencia__tarjeta${cot.elegida ? " gerencia__tarjeta--elegida" : ""}`}
                >
                  <h4 className="gerencia__tarjeta-titulo">{cot.proveedor}</h4>
                  <div className="gerencia__tarjeta-meta">
                    {formatoMontoCop(cot.monto) && (
                      <span className="gerencia__tag">{formatoMontoCop(cot.monto)}</span>
                    )}
                    {cot.elegida && (
                      <span className="gerencia__tag gerencia__tag--hecho">Elegida</span>
                    )}
                    {cot.vigencia && (
                      <span className="gerencia__tag">Vig. {formatoFechaCorta(cot.vigencia)}</span>
                    )}
                  </div>
                  {cot.notas && <p className="gerencia__tarjeta-detalle">{cot.notas}</p>}
                  <div className="gerencia__tarjeta-acciones">
                    {cot.archivo_url && (
                      <a className="btn" href={cot.archivo_url} target="_blank" rel="noreferrer">
                        Ver archivo
                      </a>
                    )}
                    {puedeGestionar && !cot.elegida && (
                      <button
                        type="button"
                        className="btn btn--primario"
                        disabled={ocupado}
                        onClick={() => void elegirCotizacion(cot)}
                      >
                        Elegir
                      </button>
                    )}
                  </div>
                </article>
              ))}
              {seguimientoOk && cotizaciones.length === 0 && (
                <p className="gerencia__vacio">Sin cotizaciones.</p>
              )}
            </div>
            {seguimientoOk && (
              <form className="gerencia__form" onSubmit={(e) => void enviarCotizacion(e)}>
                <label className="gerencia__campo">
                  Proveedor *
                  <input
                    value={proveedor}
                    onChange={(e) => setProveedor(e.target.value)}
                    required
                  />
                </label>
                <label className="gerencia__campo">
                  Monto
                  <input
                    value={montoCot}
                    onChange={(e) => setMontoCot(e.target.value)}
                    inputMode="decimal"
                  />
                </label>
                <label className="gerencia__campo">
                  Vigencia
                  <input
                    type="date"
                    value={vigencia}
                    onChange={(e) => setVigencia(e.target.value)}
                  />
                </label>
                <label className="gerencia__campo">
                  Archivo (PDF / imagen)
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                  />
                </label>
                <label className="gerencia__campo">
                  Notas
                  <textarea
                    value={notasCot}
                    onChange={(e) => setNotasCot(e.target.value)}
                    rows={2}
                  />
                </label>
                <button type="submit" className="btn btn--primario" disabled={ocupado}>
                  Guardar cotización
                </button>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default GerenciaItemDetalle;
