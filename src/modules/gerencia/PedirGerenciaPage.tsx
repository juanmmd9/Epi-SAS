import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AREAS_SOLICITUD_GERENCIA } from "../../lib/areas";
import { quitarCanalRealtime, suscribirPostgresChanges } from "../../lib/supabaseRealtime";
import { areaUsuario } from "../../lib/usuarioArea";
import { useAuth } from "../auth/AuthContext";
import GerenciaItemDetalle from "./GerenciaItemDetalle";
import {
  crearItemGerencia,
  eliminarItemGerencia,
  listarMisPedidosGerencia,
  tablaGerenciaLista,
} from "./gerenciaService";
import {
  avancePorcentaje,
  diasAbiertos,
  formatoFechaCorta,
  formatoMontoCop,
  semaforoItem,
} from "./gerenciaSla";
import {
  IMPACTOS_GERENCIA,
  TIPOS_GERENCIA,
  URGENCIAS_GERENCIA,
  etiquetaEstado,
  etiquetaTablero,
  etiquetaTipo,
  type ImpactoGerencia,
  type ItemGerencia,
  type TipoGerencia,
  type UrgenciaGerencia,
} from "./types";
import "./gerencia.css";

function PedirGerenciaPage() {
  const { perfil } = useAuth();
  const [items, setItems] = useState<ItemGerencia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [tablaOk, setTablaOk] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [detalle, setDetalle] = useState<ItemGerencia | null>(null);
  const [eliminando, setEliminando] = useState<ItemGerencia | null>(null);
  const [motivoEliminacion, setMotivoEliminacion] = useState("");

  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<TipoGerencia>("proyecto");
  const [area, setArea] = useState(() => areaUsuario(perfil) || "");
  const [urgencia, setUrgencia] = useState<UrgenciaGerencia>("media");
  const [impacto, setImpacto] = useState<ImpactoGerencia>("medio");
  const [motivo, setMotivo] = useState("");
  const [monto, setMonto] = useState("");

  const cargar = useCallback(async () => {
    if (!perfil?.id) return;
    setCargando(true);
    setError(null);
    try {
      const ok = await tablaGerenciaLista();
      setTablaOk(ok);
      if (!ok) {
        setItems([]);
        return;
      }
      setItems(await listarMisPedidosGerencia(perfil.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar tus pedidos");
    } finally {
      setCargando(false);
    }
  }, [perfil?.id]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    if (!perfil?.id || !tablaOk) return;
    const canal = suscribirPostgresChanges(`gerencia-mis-pedidos-${perfil.id}`, [
      {
        filter: {
          event: "*",
          schema: "public",
          table: "gerencia_items",
          filter: `solicitante_id=eq.${perfil.id}`,
        },
        handler: () => {
          void listarMisPedidosGerencia(perfil.id)
            .then(setItems)
            .catch(() => undefined);
        },
      },
    ]);
    return () => {
      quitarCanalRealtime(canal);
    };
  }, [perfil?.id, tablaOk]);

  function abrirEliminar(item: ItemGerencia) {
    setEliminando(item);
    setMotivoEliminacion("");
    setError(null);
    setMensaje(null);
  }

  async function confirmarEliminar(evento: FormEvent) {
    evento.preventDefault();
    if (!eliminando) return;
    if (!motivoEliminacion.trim()) {
      setError("Indica por qué eliminas la solicitud.");
      return;
    }
    setOcupado(true);
    setError(null);
    try {
      const actualizado = await eliminarItemGerencia(
        eliminando.id,
        motivoEliminacion,
        perfil?.nombre || perfil?.usuario || "Líder de área",
      );
      setItems((prev) => prev.map((i) => (i.id === actualizado.id ? actualizado : i)));
      setEliminando(null);
      setMotivoEliminacion("");
      if (detalle?.id === actualizado.id) setDetalle(actualizado);
      setMensaje(`«${actualizado.titulo}» fue eliminada. Gerencia verá el motivo.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar");
    } finally {
      setOcupado(false);
    }
  }

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    if (!titulo.trim()) {
      setError("Escribe un título.");
      return;
    }
    if (!motivo.trim()) {
      setError("Indica por qué se necesita.");
      return;
    }
    setOcupado(true);
    setError(null);
    setMensaje(null);
    try {
      const montoNum = monto.trim() ? Number(monto.replace(",", ".")) : null;
      const creado = await crearItemGerencia({
        titulo,
        tipo,
        area: area || null,
        urgencia,
        impacto,
        notas: motivo,
        monto: montoNum != null && !Number.isNaN(montoNum) ? montoNum : null,
        tablero: "por_clasificar",
        origen: "solicitud",
        solicitante_id: perfil?.id ?? null,
        solicitante_nombre: perfil?.nombre || perfil?.usuario || "Solicitante",
      });
      setItems((prev) => [creado, ...prev]);
      setTitulo("");
      setMotivo("");
      setMonto("");
      setMensaje("Pedido enviado a Gerencia. Quedó en Por clasificar.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <section className="gerencia">
      <header className="gerencia__cabecera">
        <div>
          <h1>Solicitar a Gerencia</h1>
          <p className="gerencia__descripcion">
            Envía proyectos, compras o máquinas y haz seguimiento: estado, tiempos, comentarios y
            cotizaciones.
          </p>
        </div>
      </header>

      {!tablaOk && (
        <p className="gerencia__mensaje gerencia__mensaje--aviso">
          Falta crear la tabla en Supabase. Ejecuta en SQL Editor{" "}
          <code>supabase/migrations/gerencia_items.sql</code>.
        </p>
      )}
      {error && <p className="gerencia__mensaje gerencia__mensaje--error">{error}</p>}
      {mensaje && <p className="gerencia__mensaje gerencia__mensaje--ok">{mensaje}</p>}

      <div className="gerencia__layout-pedir">
        <div className="gerencia__panel">
          <h2>Nueva solicitud</h2>
          <form className="gerencia__form gerencia__form--grid" onSubmit={(e) => void manejarEnvio(e)}>
            <label className="gerencia__campo">
              Tipo *
              <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoGerencia)}>
                {TIPOS_GERENCIA.filter((t) => t.id !== "otro").map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.etiqueta}
                  </option>
                ))}
              </select>
            </label>
            <label className="gerencia__campo">
              Área
              <select value={area} onChange={(e) => setArea(e.target.value)}>
                <option value="">—</option>
                {AREAS_SOLICITUD_GERENCIA.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
            <label className="gerencia__campo gerencia__campo--ancho">
              Título *
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej. Extrusora línea 2"
                required
              />
            </label>
            <label className="gerencia__campo gerencia__campo--ancho">
              Por qué se necesita *
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
                placeholder="Describe el problema o la necesidad"
                required
              />
            </label>
            <label className="gerencia__campo">
              Urgencia
              <select
                value={urgencia}
                onChange={(e) => setUrgencia(e.target.value as UrgenciaGerencia)}
              >
                {URGENCIAS_GERENCIA.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.etiqueta}
                  </option>
                ))}
              </select>
            </label>
            <label className="gerencia__campo">
              Impacto en el negocio
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
            <label className="gerencia__campo gerencia__campo--ancho">
              Monto estimado (opcional)
              <input
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                inputMode="decimal"
                placeholder="Ej. 12500000"
              />
            </label>
            <div className="gerencia__form-acciones">
              <button type="submit" className="btn btn--primario" disabled={ocupado || !tablaOk}>
                {ocupado ? "Enviando..." : "Enviar a Gerencia"}
              </button>
            </div>
          </form>
        </div>

        <div className="gerencia__panel">
          <div className="gerencia__panel-cabecera">
            <h2>Mis solicitudes</h2>
            <span>
              {cargando
                ? "Cargando…"
                : `${items.length} registro${items.length === 1 ? "" : "s"}`}
            </span>
          </div>
          {cargando && <p className="gerencia__vacio">Cargando...</p>}
          {!cargando && items.length === 0 && (
            <p className="gerencia__vacio">Aún no has enviado pedidos.</p>
          )}
          <div className="gerencia__lista">
            {items.map((item) => {
              const sem = semaforoItem(item);
              const avance = avancePorcentaje(item);
              const eliminada = item.estado === "eliminado";
              return (
                <article
                  key={item.id}
                  className={`gerencia__tarjeta gerencia__tarjeta--pedir${
                    eliminada ? " gerencia__tarjeta--eliminada" : ""
                  }`}
                >
                  {!eliminada && (
                    <button
                      type="button"
                      className="gerencia__tarjeta-cerrar"
                      title="Eliminar solicitud"
                      aria-label={`Eliminar ${item.titulo}`}
                      onClick={() => abrirEliminar(item)}
                    >
                      ×
                    </button>
                  )}
                  <h3 className="gerencia__tarjeta-titulo">{item.titulo}</h3>
                  <div className="gerencia__tarjeta-meta">
                    <span className="gerencia__tag">{etiquetaTipo(item.tipo)}</span>
                    <span
                      className={`gerencia__tag${
                        item.estado === "hecho"
                          ? " gerencia__tag--hecho"
                          : eliminada
                            ? " gerencia__tag--eliminado"
                            : ""
                      }`}
                    >
                      {etiquetaEstado(item.estado)}
                    </span>
                    {!eliminada && (
                      <span className="gerencia__tag">{etiquetaTablero(item.tablero)}</span>
                    )}
                    {!eliminada && (
                      <span className={`gerencia__tag gerencia__tag--sla-${sem}`}>
                        {diasAbiertos(item)}d · {sem}
                      </span>
                    )}
                  </div>
                  {eliminada ? (
                    <p className="gerencia__aviso-eliminacion">
                      <strong>
                        {item.eliminado_por_nombre
                          ? `${item.eliminado_por_nombre} eliminó esta solicitud.`
                          : "Esta solicitud fue eliminada."}
                      </strong>
                      <br />
                      Motivo: {item.motivo_eliminacion || "Sin motivo registrado"}
                      {item.eliminado_en
                        ? ` · ${formatoFechaCorta(item.eliminado_en)}`
                        : ""}
                    </p>
                  ) : (
                    <>
                      <div className="gerencia__avance">
                        <span>
                          Avance {avance}% · desde {formatoFechaCorta(item.creado_en)}
                        </span>
                        <div className="gerencia__avance-barra">
                          <i style={{ width: `${avance}%` }} />
                        </div>
                      </div>
                      {formatoMontoCop(item.monto) && (
                        <p className="gerencia__tarjeta-detalle">{formatoMontoCop(item.monto)}</p>
                      )}
                      {item.notas && (
                        <p className="gerencia__tarjeta-detalle gerencia__tarjeta-detalle--clamp" title={item.notas}>
                          {item.notas}
                        </p>
                      )}
                    </>
                  )}
                  <div className="gerencia__tarjeta-acciones">
                    <button type="button" className="btn btn--primario" onClick={() => setDetalle(item)}>
                      Ver seguimiento
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>

      {eliminando && (
        <div className="gerencia__modal" role="dialog" aria-modal="true">
          <button
            type="button"
            className="gerencia__modal-fondo"
            aria-label="Cerrar"
            onClick={() => setEliminando(null)}
          />
          <form className="gerencia__modal-panel" onSubmit={(e) => void confirmarEliminar(e)}>
            <h2>Eliminar solicitud</h2>
            <p className="gerencia__modal-detalle">
              «{eliminando.titulo}» se quitará del tablero de Gerencia. Debes indicar el motivo.
            </p>
            <label className="gerencia__campo">
              ¿Por qué la eliminas? *
              <textarea
                value={motivoEliminacion}
                onChange={(e) => setMotivoEliminacion(e.target.value)}
                rows={4}
                placeholder="Ej. Ya no se necesita / se resolvió por otra vía / error al crear"
                required
              />
            </label>
            <div className="gerencia__modal-acciones">
              <button type="button" className="btn" onClick={() => setEliminando(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn--peligro" disabled={ocupado}>
                {ocupado ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {detalle && (
        <GerenciaItemDetalle
          item={detalle}
          puedeGestionar={false}
          onCerrar={() => setDetalle(null)}
          onActualizado={(actualizado) => {
            setItems((prev) => prev.map((i) => (i.id === actualizado.id ? actualizado : i)));
            setDetalle(actualizado);
          }}
        />
      )}
    </section>
  );
}

export default PedirGerenciaPage;
