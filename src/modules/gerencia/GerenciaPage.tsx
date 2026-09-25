import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { AREAS_SOLICITUD_GERENCIA } from "../../lib/areas";
import { quitarCanalRealtime, suscribirPostgresChanges } from "../../lib/supabaseRealtime";
import { useAuth } from "../auth/AuthContext";
import GerenciaItemDetalle from "./GerenciaItemDetalle";
import {
  actualizarItemGerencia,
  borrarItemGerenciaDefinitivo,
  calcularDashboard,
  crearColumnaGerencia,
  crearItemGerencia,
  eliminarColumnaGerencia,
  eliminarItemGerencia,
  listarColumnasGerencia,
  listarItemsGerencia,
  tablaGerenciaLista,
} from "./gerenciaService";
import { diasAbiertos, formatoMontoCop, semaforoItem } from "./gerenciaSla";
import {
  IMPACTOS_GERENCIA,
  TABLEROS_GERENCIA,
  TIPOS_GERENCIA,
  URGENCIAS_GERENCIA,
  etiquetaEncargados,
  etiquetaTipo,
  type ColumnaGerencia,
  type ImpactoGerencia,
  type ItemGerencia,
  type TableroGerencia,
  type TipoGerencia,
  type UrgenciaGerencia,
} from "./types";
import "./gerencia.css";

type FiltroVista = "todos" | "por_clasificar" | "en_proceso" | "hechos" | "eliminados";

function columnasPorDefecto(): ColumnaGerencia[] {
  return TABLEROS_GERENCIA.map((t, i) => ({
    id: t.id,
    etiqueta: t.etiqueta,
    orden: (i + 1) * 10,
  }));
}

function GerenciaPage() {
  const { perfil } = useAuth();
  const [items, setItems] = useState<ItemGerencia[]>([]);
  const [columnas, setColumnas] = useState<ColumnaGerencia[]>(columnasPorDefecto);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [tablaOk, setTablaOk] = useState(true);
  const [filtro, setFiltro] = useState<FiltroVista>("todos");
  const [clasificando, setClasificando] = useState<ItemGerencia | null>(null);
  const [tableroDestino, setTableroDestino] = useState<TableroGerencia>("lucro_cesante");
  const [ordenDestino, setOrdenDestino] = useState("0");
  const [notasClasificar, setNotasClasificar] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [mostrarNuevo, setMostrarNuevo] = useState(false);
  const [mostrarNuevaColumna, setMostrarNuevaColumna] = useState(false);
  const [nombreColumna, setNombreColumna] = useState("");
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevoTipo, setNuevoTipo] = useState<TipoGerencia>("proyecto");
  const [nuevoArea, setNuevoArea] = useState("");
  const [nuevaUrgencia, setNuevaUrgencia] = useState<UrgenciaGerencia>("media");
  const [nuevoImpacto, setNuevoImpacto] = useState<ImpactoGerencia>("medio");
  const [nuevasNotas, setNuevasNotas] = useState("");
  const [nuevoTablero, setNuevoTablero] = useState<TableroGerencia>("por_clasificar");
  const [detalle, setDetalle] = useState<ItemGerencia | null>(null);
  const [eliminando, setEliminando] = useState<ItemGerencia | null>(null);
  const [motivoEliminacion, setMotivoEliminacion] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    setColumnas(columnasPorDefecto());
    try {
      const ok = await tablaGerenciaLista();
      setTablaOk(ok);
      if (!ok) {
        setItems([]);
        return;
      }
      const lista = await listarItemsGerencia();
      setItems(lista);
      try {
        setColumnas(await listarColumnasGerencia());
      } catch {
        setColumnas(columnasPorDefecto());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el tablero");
      setColumnas(columnasPorDefecto());
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    if (!tablaOk) return;
    const canal = suscribirPostgresChanges("gerencia-items-tablero", [
      {
        filter: { event: "*", schema: "public", table: "gerencia_items" },
        handler: () => {
          void listarItemsGerencia()
            .then(setItems)
            .catch(() => undefined);
        },
      },
      {
        filter: { event: "*", schema: "public", table: "gerencia_tableros" },
        handler: () => {
          void listarColumnasGerencia()
            .then(setColumnas)
            .catch(() => undefined);
        },
      },
    ]);
    return () => {
      quitarCanalRealtime(canal);
    };
  }, [tablaOk]);

  const porClasificar = useMemo(
    () =>
      items.filter(
        (i) => i.tablero === "por_clasificar" && i.estado !== "hecho" && i.estado !== "eliminado",
      ).length,
    [items],
  );

  const dashboard = useMemo(() => calcularDashboard(items), [items]);

  const itemsFiltrados = useMemo(() => {
    if (filtro === "eliminados") {
      return items.filter((i) => i.estado === "eliminado");
    }
    if (filtro === "hechos") {
      return items.filter((i) => i.estado === "hecho");
    }
    const abiertos = items.filter((i) => i.estado !== "hecho" && i.estado !== "eliminado");
    if (filtro === "por_clasificar") {
      return abiertos.filter((i) => i.tablero === "por_clasificar");
    }
    if (filtro === "en_proceso") {
      return abiertos.filter(
        (i) =>
          i.tablero !== "por_clasificar" &&
          (i.estado === "en_proceso" || i.estado === "pendiente" || i.estado === "pausado"),
      );
    }
    return abiertos;
  }, [items, filtro]);

  const hechos = useMemo(
    () =>
      items
        .filter((i) => i.estado === "hecho")
        .sort((a, b) => (b.cerrado_en || b.actualizado_en).localeCompare(a.cerrado_en || a.actualizado_en)),
    [items],
  );

  const eliminados = useMemo(
    () =>
      items
        .filter((i) => i.estado === "eliminado")
        .sort((a, b) =>
          (b.eliminado_en || b.actualizado_en).localeCompare(a.eliminado_en || a.actualizado_en),
        ),
    [items],
  );

  const columnasVisibles = useMemo(() => {
    if (filtro === "hechos" || filtro === "eliminados") return [] as ColumnaGerencia[];
    const base = [...columnas].sort((a, b) => a.orden - b.orden);
    const ids = new Set(base.map((c) => c.id));
    for (const item of itemsFiltrados) {
      if (!ids.has(item.tablero)) {
        base.push({ id: item.tablero, etiqueta: item.tablero, orden: 999 });
        ids.add(item.tablero);
      }
    }
    return base;
  }, [columnas, itemsFiltrados, filtro]);

  function etiquetaCol(id: string): string {
    return columnas.find((c) => c.id === id)?.etiqueta ?? id;
  }

  function abrirClasificar(item: ItemGerencia) {
    setClasificando(item);
    setTableroDestino(
      item.tablero === "por_clasificar"
        ? columnas.find((c) => c.id !== "por_clasificar")?.id || "lucro_cesante"
        : item.tablero,
    );
    setOrdenDestino(String(item.orden || 0));
    setNotasClasificar(item.notas ?? "");
    setMensaje(null);
    setError(null);
  }

  async function confirmarClasificar(evento: FormEvent) {
    evento.preventDefault();
    if (!clasificando) return;
    setOcupado(true);
    setError(null);
    try {
      const actualizado = await actualizarItemGerencia(clasificando.id, {
        tablero: tableroDestino,
        orden: Number(ordenDestino) || 0,
        notas: notasClasificar,
        estado: clasificando.estado === "hecho" ? "hecho" : "en_proceso",
      });
      setItems((prev) => prev.map((i) => (i.id === actualizado.id ? actualizado : i)));
      setClasificando(null);
      setMensaje("Solicitud clasificada.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo clasificar");
    } finally {
      setOcupado(false);
    }
  }

  async function marcarHecho(item: ItemGerencia, hecho: boolean) {
    setError(null);
    try {
      const actualizado = await actualizarItemGerencia(item.id, {
        estado: hecho ? "hecho" : "en_proceso",
      });
      setItems((prev) => prev.map((i) => (i.id === actualizado.id ? actualizado : i)));
      if (hecho) {
        // Se quita del tablero activo; las columnas originales siguen visibles.
        setMensaje(`«${item.titulo}» pasó a Hechos. Ábrelo con el filtro «Hechos».`);
      } else {
        setFiltro("todos");
        setMensaje(`«${item.titulo}» volvió al tablero activo.`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar");
    }
  }

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
      setError("Indica por qué se elimina, para que el área lo vea.");
      return;
    }
    setOcupado(true);
    setError(null);
    try {
      const actualizado = await eliminarItemGerencia(
        eliminando.id,
        motivoEliminacion,
        perfil?.nombre || perfil?.usuario || "Gerencia",
      );
      setItems((prev) => prev.map((i) => (i.id === actualizado.id ? actualizado : i)));
      setEliminando(null);
      setMotivoEliminacion("");
      setMensaje(
        `«${actualizado.titulo}» eliminada. El área verá el motivo en Solicitar a Gerencia.`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar");
    } finally {
      setOcupado(false);
    }
  }

  async function borrarDefinitivo(item: ItemGerencia) {
    if (
      !window.confirm(
        `¿Borrar definitivamente «${item.titulo}»?\nSe quitará para siempre (no se puede deshacer).`,
      )
    ) {
      return;
    }
    setError(null);
    try {
      await borrarItemGerenciaDefinitivo(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      if (detalle?.id === item.id) setDetalle(null);
      setMensaje(`«${item.titulo}» se borró definitivamente.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo borrar");
    }
  }

  async function borrarColumna(col: ColumnaGerencia) {
    if (col.id === "por_clasificar") {
      setError("No se puede eliminar «Por clasificar»: es la bandeja de entrada.");
      return;
    }
    const n = items.filter(
      (i) => i.tablero === col.id && i.estado !== "eliminado" && i.estado !== "hecho",
    ).length;
    const aviso =
      n > 0
        ? `¿Eliminar la columna «${col.etiqueta}»?\nSus ${n} solicitud(es) activas pasarán a Por clasificar.`
        : `¿Eliminar la columna «${col.etiqueta}»?`;
    if (!window.confirm(aviso)) return;
    setError(null);
    try {
      const { movidos } = await eliminarColumnaGerencia(col);
      setColumnas((prev) => prev.filter((c) => c.id !== col.id));
      if (movidos > 0) {
        setItems(await listarItemsGerencia());
      }
      setMensaje(
        movidos > 0
          ? `Columna «${col.etiqueta}» eliminada. ${movidos} solicitud(es) fueron a Por clasificar.`
          : `Columna «${col.etiqueta}» eliminada.`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar la columna");
    }
  }

  function abrirNuevoEn(tablero: TableroGerencia) {
    setNuevoTablero(tablero);
    setNuevoTitulo("");
    setNuevasNotas("");
    setMostrarNuevo(true);
    setError(null);
    setMensaje(null);
  }

  async function crearNuevaColumna(evento: FormEvent) {
    evento.preventDefault();
    setOcupado(true);
    setError(null);
    try {
      const creada = await crearColumnaGerencia(nombreColumna);
      setColumnas((prev) => {
        if (prev.some((c) => c.id === creada.id)) {
          return prev.map((c) => (c.id === creada.id ? creada : c));
        }
        return [...prev, creada].sort((a, b) => a.orden - b.orden);
      });
      setMostrarNuevaColumna(false);
      setNombreColumna("");
      setFiltro("todos");
      setMensaje(`Columna «${creada.etiqueta}» agregada al tablero.`);
      abrirNuevoEn(creada.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear la columna");
    } finally {
      setOcupado(false);
    }
  }

  async function crearDesdeGerencia(evento: FormEvent) {
    evento.preventDefault();
    if (!nuevoTitulo.trim()) {
      setError("Escribe un título.");
      return;
    }
    setOcupado(true);
    setError(null);
    try {
      const etiqueta = etiquetaCol(nuevoTablero);
      const creado = await crearItemGerencia({
        titulo: nuevoTitulo,
        tipo: nuevoTipo,
        area: nuevoArea || null,
        urgencia: nuevaUrgencia,
        impacto: nuevoImpacto,
        notas: nuevasNotas,
        tablero: nuevoTablero,
        estado: nuevoTablero === "por_clasificar" ? "pendiente" : "en_proceso",
        origen: "gerencia",
        solicitante_id: perfil?.id ?? null,
        solicitante_nombre: perfil?.nombre || perfil?.usuario || "Gerencia",
      });
      setItems((prev) => {
        if (prev.some((i) => i.id === creado.id)) return prev;
        return [creado, ...prev];
      });
      setMostrarNuevo(false);
      setNuevoTitulo("");
      setNuevasNotas("");
      setNuevoTablero("por_clasificar");
      setFiltro("todos");
      setMensaje(`Ítem agregado en «${etiqueta}».`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <section className="gerencia">
      <header className="gerencia__cabecera">
        <div>
          <h1>Gerencia</h1>
          <p className="gerencia__descripcion">
            Tablero de proyectos, compras y máquinas. Clasifica lo que piden las áreas y marca lo
            hecho.
          </p>
        </div>
        <div className="gerencia__acciones">
          <span
            className={`gerencia__badge${porClasificar > 0 ? " gerencia__badge--titila" : ""}`}
            title="Por clasificar"
          >
            {porClasificar} por clasificar
          </span>
          <button
            type="button"
            className="btn btn--primario"
            onClick={() => abrirNuevoEn("por_clasificar")}
          >
            + Nueva solicitud
          </button>
        </div>
      </header>

      <div className="gerencia__filtros">
        {(
          [
            ["todos", "Todos"],
            ["por_clasificar", "Por clasificar"],
            ["en_proceso", "En proceso"],
            ["hechos", "Hechos"],
            ["eliminados", "Eliminados"],
          ] as const
        ).map(([id, etiqueta]) => (
          <button
            key={id}
            type="button"
            className={`gerencia__chip${filtro === id ? " gerencia__chip--activo" : ""}${
              id === "por_clasificar" && porClasificar > 0 ? " gerencia__chip--titila" : ""
            }`}
            onClick={() => setFiltro(id)}
          >
            {etiqueta}
            {id === "por_clasificar" && porClasificar > 0 ? ` (${porClasificar})` : ""}
          </button>
        ))}
      </div>

      {!cargando && tablaOk && (
        <div className="gerencia__dashboard">
          <article>
            <span>Total</span>
            <strong>{dashboard.total}</strong>
          </article>
          <article>
            <span>Por clasificar</span>
            <strong>{dashboard.porClasificar}</strong>
          </article>
          <article>
            <span>En proceso</span>
            <strong>{dashboard.enProceso}</strong>
          </article>
          <article>
            <span>Hechos</span>
            <strong>{dashboard.hechos}</strong>
          </article>
          <article className={dashboard.vencidas > 0 ? "gerencia__dashboard--alerta" : ""}>
            <span>Vencidas SLA</span>
            <strong>{dashboard.vencidas}</strong>
          </article>
          <article>
            <span>Monto abierto</span>
            <strong>{formatoMontoCop(dashboard.montoAbierto) ?? "$ 0"}</strong>
          </article>
        </div>
      )}

      {!tablaOk && (
        <p className="gerencia__mensaje gerencia__mensaje--aviso">
          Falta crear la tabla en Supabase. Ejecuta en SQL Editor el archivo{" "}
          <code>supabase/migrations/gerencia_items.sql</code>.
        </p>
      )}
      {error && <p className="gerencia__mensaje gerencia__mensaje--error">{error}</p>}
      {mensaje && <p className="gerencia__mensaje gerencia__mensaje--ok">{mensaje}</p>}
      {cargando && <p>Cargando tablero...</p>}

      {!cargando && tablaOk && filtro === "hechos" && (
        <div className="gerencia__hechos">
          <h2 className="gerencia__columna-titulo">
            <span>Hechos</span>
            <span className="gerencia__badge">{hechos.length}</span>
          </h2>
          {hechos.length === 0 ? (
            <p className="gerencia__vacio">Aún no hay solicitudes marcadas como hechas.</p>
          ) : (
            <div className="gerencia__hechos-lista">
              {hechos.map((item) => (
                <article key={item.id} className="gerencia__tarjeta">
                  <button
                    type="button"
                    className="gerencia__tarjeta-cerrar"
                    title="Eliminar"
                    aria-label={`Eliminar ${item.titulo}`}
                    onClick={() => abrirEliminar(item)}
                  >
                    ×
                  </button>
                  <h3 className="gerencia__tarjeta-titulo">{item.titulo}</h3>
                  <div className="gerencia__tarjeta-meta">
                    <span className="gerencia__tag gerencia__tag--hecho">Hecho</span>
                    <span className="gerencia__tag">{etiquetaTipo(item.tipo)}</span>
                    {item.area && <span className="gerencia__tag">{item.area}</span>}
                    <span className="gerencia__tag">{etiquetaCol(item.tablero)}</span>
                  </div>
                  {item.solicitante_nombre && (
                    <p className="gerencia__tarjeta-detalle">Pidió: {item.solicitante_nombre}</p>
                  )}
                  <label className="gerencia__check">
                    <input
                      type="checkbox"
                      checked
                      onChange={(e) => void marcarHecho(item, e.target.checked)}
                    />
                    Hecho (desmarcar para devolver al tablero)
                  </label>
                  <div className="gerencia__tarjeta-acciones">
                    <button type="button" className="btn" onClick={() => setDetalle(item)}>
                      Seguimiento
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {!cargando && tablaOk && filtro === "eliminados" && (
        <div className="gerencia__hechos">
          <h2 className="gerencia__columna-titulo">
            <span>Eliminados</span>
            <span className="gerencia__badge">{eliminados.length}</span>
          </h2>
          {eliminados.length === 0 ? (
            <p className="gerencia__vacio">No hay solicitudes eliminadas.</p>
          ) : (
            <div className="gerencia__hechos-lista">
              {eliminados.map((item) => (
                <article key={item.id} className="gerencia__tarjeta gerencia__tarjeta--eliminada">
                  <button
                    type="button"
                    className="gerencia__tarjeta-cerrar"
                    title="Borrar definitivamente"
                    aria-label={`Borrar definitivamente ${item.titulo}`}
                    onClick={() => void borrarDefinitivo(item)}
                  >
                    ×
                  </button>
                  <h3 className="gerencia__tarjeta-titulo">{item.titulo}</h3>
                  <div className="gerencia__tarjeta-meta">
                    <span className="gerencia__tag gerencia__tag--eliminado">Eliminado</span>
                    <span className="gerencia__tag">{etiquetaTipo(item.tipo)}</span>
                    {item.area && <span className="gerencia__tag">{item.area}</span>}
                  </div>
                  {item.solicitante_nombre && (
                    <p className="gerencia__tarjeta-detalle">Pidió: {item.solicitante_nombre}</p>
                  )}
                  <p className="gerencia__aviso-eliminacion">
                    <strong>Motivo:</strong> {item.motivo_eliminacion || "Sin motivo registrado"}
                    {item.eliminado_por_nombre ? ` · ${item.eliminado_por_nombre}` : ""}
                  </p>
                  <div className="gerencia__tarjeta-acciones">
                    <button type="button" className="btn" onClick={() => setDetalle(item)}>
                      Seguimiento
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {!cargando && tablaOk && filtro !== "hechos" && filtro !== "eliminados" && (
        <div className="gerencia__tablero">
          {columnasVisibles.map((col) => {
            const deColumna = itemsFiltrados
              .filter((i) => i.tablero === col.id)
              .sort((a, b) => a.orden - b.orden || b.creado_en.localeCompare(a.creado_en));
            return (
              <div key={col.id} className="gerencia__columna">
                <h2 className="gerencia__columna-titulo">
                  <span>{col.etiqueta}</span>
                  <span className="gerencia__columna-titulo-acciones">
                    <span className="gerencia__badge">{deColumna.length}</span>
                    {col.id !== "por_clasificar" && (
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
                  {deColumna.length === 0 && (
                    <p className="gerencia__vacio">Sin ítems</p>
                  )}
                  {deColumna.map((item) => {
                    const sem = semaforoItem(item);
                    return (
                    <article key={item.id} className="gerencia__tarjeta">
                      <button
                        type="button"
                        className="gerencia__tarjeta-cerrar"
                        title="Eliminar"
                        aria-label={`Eliminar ${item.titulo}`}
                        onClick={() => abrirEliminar(item)}
                      >
                        ×
                      </button>
                      <h3 className="gerencia__tarjeta-titulo">
                        {item.orden > 0 ? `${item.orden}. ` : ""}
                        {item.titulo}
                      </h3>
                      <div className="gerencia__tarjeta-meta">
                        <span className="gerencia__tag">{etiquetaTipo(item.tipo)}</span>
                        {item.area && <span className="gerencia__tag">{item.area}</span>}
                        {item.urgencia === "alta" && (
                          <span className="gerencia__tag gerencia__tag--alta">Urgente</span>
                        )}
                        <span className={`gerencia__tag gerencia__tag--sla-${sem}`}>
                          {diasAbiertos(item)}d · {sem}
                        </span>
                      </div>
                    {item.solicitante_nombre && (
                      <p className="gerencia__tarjeta-detalle">
                        Pidió: {item.solicitante_nombre}
                      </p>
                    )}
                    {etiquetaEncargados(item) && (
                      <p className="gerencia__tarjeta-detalle">
                        Encargado{item.encargados.length > 1 ? "s" : ""}: {etiquetaEncargados(item)}
                      </p>
                    )}
                    {formatoMontoCop(item.monto) && (
                      <p className="gerencia__tarjeta-detalle">{formatoMontoCop(item.monto)}</p>
                    )}
                    {item.notas && (
                      <p className="gerencia__tarjeta-detalle gerencia__tarjeta-detalle--clamp" title={item.notas ?? undefined}>
                        {item.notas}
                      </p>
                    )}
                      <label className="gerencia__check">
                        <input
                          type="checkbox"
                          checked={item.estado === "hecho"}
                          onChange={(e) => void marcarHecho(item, e.target.checked)}
                        />
                        Hecho
                      </label>
                      <div className="gerencia__tarjeta-acciones">
                        <button type="button" className="btn" onClick={() => setDetalle(item)}>
                          Seguimiento
                        </button>
                        <button type="button" className="btn" onClick={() => abrirClasificar(item)}>
                          Clasificar
                        </button>
                      </div>
                    </article>
                    );
                  })}
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
              <small>Se suma a las que ya existen</small>
            </button>
          </div>
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
          <form className="gerencia__modal-panel" onSubmit={(e) => void crearDesdeGerencia(e)}>
            <h2>Nueva solicitud</h2>
            <p className="gerencia__modal-detalle">
              Se agregará en <strong>{etiquetaCol(nuevoTablero)}</strong>.
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
                Área
                <select value={nuevoArea} onChange={(e) => setNuevoArea(e.target.value)}>
                  <option value="">—</option>
                  {AREAS_SOLICITUD_GERENCIA.map((a) => (
                    <option key={a} value={a}>
                      {a}
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
                Impacto
                <select
                  value={nuevoImpacto}
                  onChange={(e) => setNuevoImpacto(e.target.value as ImpactoGerencia)}
                >
                  {IMPACTOS_GERENCIA.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.etiqueta}
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
            </div>
            <div className="gerencia__modal-acciones">
              <button type="button" className="btn" onClick={() => setMostrarNuevo(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn--primario" disabled={ocupado}>
                {ocupado ? "Guardando..." : "Crear"}
              </button>
            </div>
          </form>
        </div>
      )}

      {clasificando && (
        <div className="gerencia__modal" role="dialog" aria-modal="true">
          <button
            type="button"
            className="gerencia__modal-fondo"
            aria-label="Cerrar"
            onClick={() => setClasificando(null)}
          />
          <form className="gerencia__modal-panel" onSubmit={(e) => void confirmarClasificar(e)}>
            <h2>Clasificar solicitud</h2>
            <p className="gerencia__modal-detalle">
              <strong>{clasificando.titulo}</strong>
              {clasificando.area ? ` · ${clasificando.area}` : ""}
              {" · "}
              {etiquetaTipo(clasificando.tipo)}
            </p>
            <div className="gerencia__form">
              <label className="gerencia__campo">
                Tablero destino
                <select
                  value={tableroDestino}
                  onChange={(e) => setTableroDestino(e.target.value as TableroGerencia)}
                >
                  {columnas
                    .filter((t) => t.id !== "por_clasificar")
                    .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.etiqueta}
                    </option>
                  ))}
                </select>
              </label>
              <label className="gerencia__campo">
                Orden (1, 2, 3…)
                <input
                  type="number"
                  min={0}
                  value={ordenDestino}
                  onChange={(e) => setOrdenDestino(e.target.value)}
                />
              </label>
              <label className="gerencia__campo">
                Notas
                <textarea
                  value={notasClasificar}
                  onChange={(e) => setNotasClasificar(e.target.value)}
                  rows={3}
                />
              </label>
            </div>
            <div className="gerencia__modal-acciones">
              <button type="button" className="btn" onClick={() => setClasificando(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn--primario" disabled={ocupado}>
                {ocupado ? "Guardando..." : "Clasificar"}
              </button>
            </div>
          </form>
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
            <p className="gerencia__modal-detalle">
              Las columnas actuales (Por clasificar, China, Compras Cali, etc.) se mantienen. Esta
              solo se agrega al final (ej. Ventas).
            </p>
            <label className="gerencia__campo">
              Nombre de la columna *
              <input
                value={nombreColumna}
                onChange={(e) => setNombreColumna(e.target.value)}
                placeholder="Ej. Ventas"
                required
                autoFocus
              />
            </label>
            <div className="gerencia__modal-acciones">
              <button type="button" className="btn" onClick={() => setMostrarNuevaColumna(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn--primario" disabled={ocupado}>
                {ocupado ? "Creando..." : "Crear columna"}
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
            <h2>Eliminar solicitud</h2>
            <p className="gerencia__modal-detalle">
              «{eliminando.titulo}» saldrá del tablero. El área / líder verá el motivo en{" "}
              <strong>Solicitar a Gerencia</strong>.
            </p>
            <label className="gerencia__campo">
              ¿Por qué se elimina? *
              <textarea
                value={motivoEliminacion}
                onChange={(e) => setMotivoEliminacion(e.target.value)}
                rows={4}
                placeholder="Ej. No aplica este año / ya se resolvió por otra vía / presupuesto no autorizado"
                required
              />
            </label>
            <div className="gerencia__modal-acciones">
              <button type="button" className="btn" onClick={() => setEliminando(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn--peligro" disabled={ocupado}>
                {ocupado ? "Eliminando..." : "Eliminar y notificar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {detalle && (
        <GerenciaItemDetalle
          item={detalle}
          puedeGestionar
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

export default GerenciaPage;
