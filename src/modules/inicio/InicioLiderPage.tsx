import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { quitarCanalRealtime, suscribirPostgresChanges } from "../../lib/supabaseRealtime";
import { areaUsuario } from "../../lib/usuarioArea";
import { useAuth } from "../auth/AuthContext";
import EncargadosCampos from "../gerencia/EncargadosCampos";
import GerenciaItemDetalle from "../gerencia/GerenciaItemDetalle";
import {
  crearColumnaAreaLider,
  crearItemGerencia,
  eliminarColumnaGerencia,
  eliminarItemGerencia,
  enviarItemAGerencia,
  esTableroAreaLider,
  idColumnaBandejaArea,
  listarColumnasAreaLider,
  listarMisPedidosGerencia,
  tablaGerenciaLista,
} from "../gerencia/gerenciaService";
import {
  avancePorcentaje,
  diasAbiertos,
  formatoFechaCorta,
  formatoMontoCop,
  semaforoItem,
} from "../gerencia/gerenciaSla";
import {
  TIPOS_GERENCIA,
  URGENCIAS_GERENCIA,
  etiquetaEncargados,
  etiquetaEstado,
  etiquetaTablero,
  etiquetaTipo,
  normalizarListaEncargados,
  type ColumnaGerencia,
  type ItemGerencia,
  type TipoGerencia,
  type UrgenciaGerencia,
} from "../gerencia/types";
import "../gerencia/gerencia.css";

type FiltroVista = "tablero" | "en_gerencia" | "hechos" | "eliminados";

/**
 * Inicio del líder: tablero propio del área (crear/borrar columnas y cards)
 * y botón para enviar cada card a Gerencia.
 */
function InicioLiderPage() {
  const { perfil } = useAuth();
  const area = areaUsuario(perfil) || perfil?.area?.trim() || "Sin área";
  const bandejaId = idColumnaBandejaArea(area);

  const [items, setItems] = useState<ItemGerencia[]>([]);
  const [columnas, setColumnas] = useState<ColumnaGerencia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [tablaOk, setTablaOk] = useState(true);
  const [filtro, setFiltro] = useState<FiltroVista>("tablero");
  const [detalle, setDetalle] = useState<ItemGerencia | null>(null);
  const [eliminando, setEliminando] = useState<ItemGerencia | null>(null);
  const [motivoEliminacion, setMotivoEliminacion] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [mostrarNuevaColumna, setMostrarNuevaColumna] = useState(false);
  const [nombreColumna, setNombreColumna] = useState("");
  const [mostrarNuevo, setMostrarNuevo] = useState(false);
  const [nuevoTablero, setNuevoTablero] = useState(bandejaId);
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevoTipo, setNuevoTipo] = useState<TipoGerencia>("proyecto");
  const [nuevaUrgencia, setNuevaUrgencia] = useState<UrgenciaGerencia>("media");
  const [nuevasNotas, setNuevasNotas] = useState("");
  const [nuevosEncargados, setNuevosEncargados] = useState<string[]>([""]);
  const [enviandoId, setEnviandoId] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!perfil?.id) return;
    setCargando(true);
    setError(null);
    try {
      const ok = await tablaGerenciaLista();
      setTablaOk(ok);
      if (!ok) {
        setItems([]);
        setColumnas([{ id: bandejaId, etiqueta: "Por enviar", orden: 10 }]);
        return;
      }
      const [lista, cols] = await Promise.all([
        listarMisPedidosGerencia(perfil.id),
        listarColumnasAreaLider(area),
      ]);
      setItems(lista);
      setColumnas(cols);
      setNuevoTablero((prev) => (cols.some((c) => c.id === prev) ? prev : cols[0]?.id || bandejaId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el tablero");
      setColumnas([{ id: bandejaId, etiqueta: "Por enviar", orden: 10 }]);
    } finally {
      setCargando(false);
    }
  }, [perfil?.id, area, bandejaId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    if (!perfil?.id || !tablaOk) return;
    const canal = suscribirPostgresChanges(`inicio-lider-area-${perfil.id}`, [
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
      {
        filter: { event: "*", schema: "public", table: "gerencia_tableros" },
        handler: () => {
          void listarColumnasAreaLider(area)
            .then(setColumnas)
            .catch(() => undefined);
        },
      },
    ]);
    return () => {
      quitarCanalRealtime(canal);
    };
  }, [perfil?.id, tablaOk, area]);

  const enTableroArea = useMemo(
    () =>
      items.filter(
        (i) =>
          esTableroAreaLider(i.tablero) && i.estado !== "hecho" && i.estado !== "eliminado",
      ),
    [items],
  );
  const enGerencia = useMemo(
    () =>
      items.filter(
        (i) =>
          !esTableroAreaLider(i.tablero) && i.estado !== "hecho" && i.estado !== "eliminado",
      ),
    [items],
  );
  const hechos = useMemo(() => items.filter((i) => i.estado === "hecho"), [items]);
  const eliminados = useMemo(() => items.filter((i) => i.estado === "eliminado"), [items]);

  const columnasVisibles = useMemo(() => {
    const base = [...columnas].sort((a, b) => a.orden - b.orden);
    const ids = new Set(base.map((c) => c.id));
    for (const item of enTableroArea) {
      if (!ids.has(item.tablero)) {
        base.push({ id: item.tablero, etiqueta: item.tablero, orden: 999 });
        ids.add(item.tablero);
      }
    }
    return base;
  }, [columnas, enTableroArea]);

  async function crearNuevaColumna(evento: FormEvent) {
    evento.preventDefault();
    setOcupado(true);
    setError(null);
    try {
      const creada = await crearColumnaAreaLider(area, nombreColumna);
      setColumnas((prev) =>
        [...prev.filter((c) => c.id !== creada.id), creada].sort((a, b) => a.orden - b.orden),
      );
      setNombreColumna("");
      setMostrarNuevaColumna(false);
      setMensaje(`Columna «${creada.etiqueta}» creada.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear la columna");
    } finally {
      setOcupado(false);
    }
  }

  async function borrarColumna(col: ColumnaGerencia) {
    if (col.id === bandejaId) {
      setError("No se puede eliminar «Por enviar».");
      return;
    }
    const n = enTableroArea.filter((i) => i.tablero === col.id).length;
    const aviso =
      n > 0
        ? `¿Eliminar «${col.etiqueta}»?\nSus ${n} card(s) pasarán a Por enviar.`
        : `¿Eliminar la columna «${col.etiqueta}»?`;
    if (!window.confirm(aviso)) return;
    try {
      const { movidos } = await eliminarColumnaGerencia(col, { bandejaArea: area });
      setColumnas((prev) => prev.filter((c) => c.id !== col.id));
      if (movidos > 0) setItems(await listarMisPedidosGerencia(perfil!.id));
      setMensaje(`Columna «${col.etiqueta}» eliminada.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar la columna");
    }
  }

  function abrirNuevoEn(tableroId: string) {
    setNuevoTablero(tableroId);
    setNuevoTitulo("");
    setNuevasNotas("");
    setNuevosEncargados([""]);
    setMostrarNuevo(true);
    setError(null);
    setMensaje(null);
  }

  async function crearCard(evento: FormEvent) {
    evento.preventDefault();
    if (!nuevoTitulo.trim()) {
      setError("Escribe un título.");
      return;
    }
    setOcupado(true);
    setError(null);
    try {
      const creado = await crearItemGerencia({
        titulo: nuevoTitulo,
        tipo: nuevoTipo,
        area,
        urgencia: nuevaUrgencia,
        notas: nuevasNotas,
        encargados: normalizarListaEncargados(nuevosEncargados),
        tablero: nuevoTablero || bandejaId,
        estado: "pendiente",
        origen: "solicitud",
        solicitante_id: perfil?.id ?? null,
        solicitante_nombre: perfil?.nombre || perfil?.usuario || "Líder",
      });
      setItems((prev) => [creado, ...prev]);
      setMostrarNuevo(false);
      setMensaje(`«${creado.titulo}» agregada al tablero. Envíala a Gerencia cuando esté lista.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear");
    } finally {
      setOcupado(false);
    }
  }

  async function enviarAGerencia(item: ItemGerencia) {
    if (
      !window.confirm(
        `¿Enviar «${item.titulo}» a Gerencia?\nQuedará en Por clasificar para que Gerencia la tome.`,
      )
    ) {
      return;
    }
    setEnviandoId(item.id);
    setError(null);
    try {
      const actualizado = await enviarItemAGerencia(item.id);
      setItems((prev) => prev.map((i) => (i.id === actualizado.id ? actualizado : i)));
      setMensaje(`«${actualizado.titulo}» enviada a Gerencia.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar");
    } finally {
      setEnviandoId(null);
    }
  }

  function abrirEliminar(item: ItemGerencia) {
    setEliminando(item);
    setMotivoEliminacion("");
    setError(null);
  }

  async function confirmarEliminar(evento: FormEvent) {
    evento.preventDefault();
    if (!eliminando || !motivoEliminacion.trim()) {
      setError("Indica por qué eliminas.");
      return;
    }
    setOcupado(true);
    try {
      const actualizado = await eliminarItemGerencia(
        eliminando.id,
        motivoEliminacion,
        perfil?.nombre || perfil?.usuario || "Líder",
      );
      setItems((prev) => prev.map((i) => (i.id === actualizado.id ? actualizado : i)));
      setEliminando(null);
      setMensaje(`«${actualizado.titulo}» eliminada.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar");
    } finally {
      setOcupado(false);
    }
  }

  function renderTarjeta(item: ItemGerencia, opts?: { mostrarEnviar?: boolean }) {
    const sem = semaforoItem(item);
    const avance = avancePorcentaje(item);
    const eliminada = item.estado === "eliminado";
    const enArea = esTableroAreaLider(item.tablero);
    return (
      <article
        key={item.id}
        className={`gerencia__tarjeta${eliminada ? " gerencia__tarjeta--eliminada" : ""}`}
      >
        {!eliminada && (
          <button
            type="button"
            className="gerencia__tarjeta-cerrar"
            title="Eliminar"
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
          {!enArea && !eliminada && (
            <span className="gerencia__tag">{etiquetaTablero(item.tablero, columnas)}</span>
          )}
          {!eliminada && (
            <span className={`gerencia__tag gerencia__tag--sla-${sem}`}>
              {diasAbiertos(item)}d · {sem}
            </span>
          )}
        </div>
        {eliminada ? (
          <p className="gerencia__aviso-eliminacion">
            Motivo: {item.motivo_eliminacion || "Sin motivo"}
          </p>
        ) : (
          <>
            <div className="gerencia__avance">
              <span>
                Avance {avance}% · {formatoFechaCorta(item.creado_en)}
              </span>
              <div className="gerencia__avance-barra">
                <i style={{ width: `${avance}%` }} />
              </div>
            </div>
            {formatoMontoCop(item.monto) && (
              <p className="gerencia__tarjeta-detalle">{formatoMontoCop(item.monto)}</p>
            )}
            {etiquetaEncargados(item) && (
              <p className="gerencia__tarjeta-detalle">
                Encargado{item.encargados.length > 1 ? "s" : ""}: {etiquetaEncargados(item)}
              </p>
            )}
            {item.notas && (
              <p
                className="gerencia__tarjeta-detalle gerencia__tarjeta-detalle--clamp"
                title={item.notas}
              >
                {item.notas}
              </p>
            )}
          </>
        )}
        <div className="gerencia__tarjeta-acciones">
          <button type="button" className="btn" onClick={() => setDetalle(item)}>
            Seguimiento
          </button>
          {opts?.mostrarEnviar && enArea && !eliminada && (
            <button
              type="button"
              className="btn btn--primario"
              disabled={enviandoId === item.id}
              onClick={() => void enviarAGerencia(item)}
            >
              {enviandoId === item.id ? "Enviando…" : "Enviar a Gerencia"}
            </button>
          )}
        </div>
      </article>
    );
  }

  return (
    <section className="gerencia">
      <header className="gerencia__cabecera">
        <div>
          <h1>Inicio · {area}</h1>
          <p className="gerencia__descripcion">
            Arma el tablero de tu área: crea columnas y cards. Cuando una esté lista, envíala a
            Gerencia.
          </p>
        </div>
        <div className="gerencia__acciones">
          <button
            type="button"
            className="btn btn--primario"
            onClick={() => abrirNuevoEn(bandejaId)}
            disabled={!tablaOk}
          >
            + Nueva card
          </button>
        </div>
      </header>

      <div className="gerencia__filtros">
        {(
          [
            ["tablero", "Mi tablero"],
            ["en_gerencia", "En Gerencia"],
            ["hechos", "Hechos"],
            ["eliminados", "Eliminados"],
          ] as const
        ).map(([id, etiqueta]) => (
          <button
            key={id}
            type="button"
            className={`gerencia__chip${filtro === id ? " gerencia__chip--activo" : ""}`}
            onClick={() => setFiltro(id)}
          >
            {etiqueta}
            {id === "tablero" ? ` (${enTableroArea.length})` : ""}
            {id === "en_gerencia" ? ` (${enGerencia.length})` : ""}
          </button>
        ))}
      </div>

      {!tablaOk && (
        <p className="gerencia__mensaje gerencia__mensaje--aviso">
          Ejecuta en SQL Editor <code>gerencia_setup_completo.sql</code> y{" "}
          <code>gerencia_tablero_area_lider.sql</code>.
        </p>
      )}
      {error && <p className="gerencia__mensaje gerencia__mensaje--error">{error}</p>}
      {mensaje && <p className="gerencia__mensaje gerencia__mensaje--ok">{mensaje}</p>}
      {cargando && <p>Cargando tablero...</p>}

      {!cargando && tablaOk && filtro === "tablero" && (
        <div className="gerencia__tablero">
          {columnasVisibles.map((col) => {
            const deColumna = enTableroArea
              .filter((i) => i.tablero === col.id)
              .sort((a, b) => a.orden - b.orden || b.creado_en.localeCompare(a.creado_en));
            return (
              <div key={col.id} className="gerencia__columna">
                <h2 className="gerencia__columna-titulo">
                  <span>{col.etiqueta}</span>
                  <span className="gerencia__columna-titulo-acciones">
                    <span className="gerencia__badge">{deColumna.length}</span>
                    {col.id !== bandejaId && (
                      <button
                        type="button"
                        className="gerencia__columna-cerrar"
                        title={`Eliminar columna ${col.etiqueta}`}
                        aria-label={`Eliminar columna ${col.etiqueta}`}
                        onClick={() => void borrarColumna(col)}
                      >
                        ×
                      </button>
                    )}
                  </span>
                </h2>
                <div className="gerencia__columna-cards">
                  {deColumna.length === 0 && <p className="gerencia__vacio">Sin ítems</p>}
                  {deColumna.map((item) => renderTarjeta(item, { mostrarEnviar: true }))}
                  <button
                    type="button"
                    className="btn"
                    style={{ flex: "0 0 auto", alignSelf: "flex-start" }}
                    onClick={() => abrirNuevoEn(col.id)}
                  >
                    + Card
                  </button>
                </div>
              </div>
            );
          })}
          <div className="gerencia__columna gerencia__columna--nueva">
            <button
              type="button"
              className="gerencia__nueva-columna"
              onClick={() => {
                setNombreColumna("");
                setMostrarNuevaColumna(true);
                setError(null);
              }}
            >
              <span>+</span>
              Nueva columna
              <small>Organiza tu área</small>
            </button>
          </div>
        </div>
      )}

      {!cargando && tablaOk && filtro === "en_gerencia" && (
        <div className="gerencia__hechos">
          <h2 className="gerencia__columna-titulo">
            <span>Ya en Gerencia</span>
            <span className="gerencia__badge">{enGerencia.length}</span>
          </h2>
          <p className="gerencia__descripcion" style={{ marginBottom: "0.75rem" }}>
            Solicitudes que enviaste. Gerencia las ubica en sus columnas.
          </p>
          {enGerencia.length === 0 ? (
            <p className="gerencia__vacio">Aún no has enviado nada a Gerencia.</p>
          ) : (
            <div className="gerencia__hechos-lista">
              {enGerencia.map((item) => renderTarjeta(item))}
            </div>
          )}
          <p style={{ marginTop: "0.75rem" }}>
            <Link to="/gerencia/pedir" className="btn">
              Ver formulario completo
            </Link>
          </p>
        </div>
      )}

      {!cargando && tablaOk && filtro === "hechos" && (
        <div className="gerencia__hechos">
          <div className="gerencia__hechos-lista">{hechos.map((i) => renderTarjeta(i))}</div>
          {hechos.length === 0 && <p className="gerencia__vacio">Sin hechos.</p>}
        </div>
      )}

      {!cargando && tablaOk && filtro === "eliminados" && (
        <div className="gerencia__hechos">
          <div className="gerencia__hechos-lista">{eliminados.map((i) => renderTarjeta(i))}</div>
          {eliminados.length === 0 && <p className="gerencia__vacio">Sin eliminados.</p>}
        </div>
      )}

      {mostrarNuevaColumna && (
        <div className="gerencia__modal" role="dialog" aria-modal="true">
          <button
            type="button"
            className="gerencia__modal-fondo"
            aria-label="Cerrar"
            onClick={() => setMostrarNuevaColumna(false)}
          />
          <form className="gerencia__modal-panel" onSubmit={(e) => void crearNuevaColumna(e)}>
            <h2>Nueva columna</h2>
            <label className="gerencia__campo">
              Nombre *
              <input
                value={nombreColumna}
                onChange={(e) => setNombreColumna(e.target.value)}
                placeholder="Ej. Prioridad alta, Cotizando…"
                required
              />
            </label>
            <div className="gerencia__modal-acciones">
              <button type="button" className="btn" onClick={() => setMostrarNuevaColumna(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn--primario" disabled={ocupado}>
                {ocupado ? "Creando..." : "Crear"}
              </button>
            </div>
          </form>
        </div>
      )}

      {mostrarNuevo && (
        <div className="gerencia__modal" role="dialog" aria-modal="true">
          <button
            type="button"
            className="gerencia__modal-fondo"
            aria-label="Cerrar"
            onClick={() => setMostrarNuevo(false)}
          />
          <form className="gerencia__modal-panel" onSubmit={(e) => void crearCard(e)}>
            <h2>Nueva card</h2>
            <p className="gerencia__modal-detalle">
              Queda en tu tablero de área. Usa <strong>Enviar a Gerencia</strong> cuando esté lista.
            </p>
            <div className="gerencia__form">
              <label className="gerencia__campo">
                Título *
                <input
                  value={nuevoTitulo}
                  onChange={(e) => setNuevoTitulo(e.target.value)}
                  required
                />
              </label>
              <label className="gerencia__campo">
                Tipo
                <select
                  value={nuevoTipo}
                  onChange={(e) => setNuevoTipo(e.target.value as TipoGerencia)}
                >
                  {TIPOS_GERENCIA.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.etiqueta}
                    </option>
                  ))}
                </select>
              </label>
              <label className="gerencia__campo">
                Columna
                <select value={nuevoTablero} onChange={(e) => setNuevoTablero(e.target.value)}>
                  {columnasVisibles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.etiqueta}
                    </option>
                  ))}
                </select>
              </label>
              <label className="gerencia__campo">
                Urgencia
                <select
                  value={nuevaUrgencia}
                  onChange={(e) => setNuevaUrgencia(e.target.value as UrgenciaGerencia)}
                >
                  {URGENCIAS_GERENCIA.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.etiqueta}
                    </option>
                  ))}
                </select>
              </label>
              <label className="gerencia__campo">
                Notas
                <textarea
                  value={nuevasNotas}
                  onChange={(e) => setNuevasNotas(e.target.value)}
                  rows={3}
                />
              </label>
              <EncargadosCampos
                valores={nuevosEncargados}
                onChange={setNuevosEncargados}
                etiqueta="Encargado(s) del proyecto"
              />
              <p className="gerencia__modal-detalle">
                Área: <strong>{area}</strong>
              </p>
            </div>
            <div className="gerencia__modal-acciones">
              <button type="button" className="btn" onClick={() => setMostrarNuevo(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn--primario" disabled={ocupado}>
                {ocupado ? "Guardando..." : "Agregar al tablero"}
              </button>
            </div>
          </form>
        </div>
      )}

      {eliminando && (
        <div className="gerencia__modal" role="dialog" aria-modal="true">
          <button
            type="button"
            className="gerencia__modal-fondo"
            aria-label="Cerrar"
            onClick={() => setEliminando(null)}
          />
          <form className="gerencia__modal-panel" onSubmit={(e) => void confirmarEliminar(e)}>
            <h2>Eliminar</h2>
            <label className="gerencia__campo">
              Motivo *
              <textarea
                value={motivoEliminacion}
                onChange={(e) => setMotivoEliminacion(e.target.value)}
                rows={3}
                required
              />
            </label>
            <div className="gerencia__modal-acciones">
              <button type="button" className="btn" onClick={() => setEliminando(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn--peligro" disabled={ocupado}>
                Eliminar
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

export default InicioLiderPage;
