import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { veInventarioMantenimiento } from "../../lib/usuarioArea";
import { useAuth } from "../auth/AuthContext";
import {
  faltaTablaCompras,
  ingresarPedidoAlInventario,
  sembrarPedidosSiVacio,
  sincronizarComprasDrive,
  type PedidoCompraGuardado,
  type SituacionCompra,
} from "./comprasService";
import type { GrupoInventario } from "./inventarioDatos";
import {
  agregarItemInventario,
  cantidadNumero,
  eliminarItemInventario,
  faltaTablaInventario,
  registrarMovimiento,
  sembrarInventarioSiVacio,
  type ItemInventarioGuardado,
  type TipoInventario,
} from "./inventarioService";
import "./principal.css";

function sinAcento(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const formularioVacio = { descripcion: "", cantidad: "", unidad: "UND" };

type VistaInventario = TipoInventario | "pedidos";
type FiltroPedido = "todos" | SituacionCompra;

function fechaCorta(fecha: string | null): string {
  if (!fecha) return "—";
  const [anio, mes, dia] = fecha.slice(0, 10).split("-");
  if (!anio || !mes || !dia) return fecha;
  return `${dia}/${mes}/${anio}`;
}

function InventarioPage() {
  const { perfil } = useAuth();
  const [vista, setVista] = useState<VistaInventario>("herramientas");
  const [items, setItems] = useState<ItemInventarioGuardado[]>([]);
  const [pedidos, setPedidos] = useState<PedidoCompraGuardado[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroPedido, setFiltroPedido] = useState<FiltroPedido>("todos");
  const [campos, setCampos] = useState(formularioVacio);
  const [movimiento, setMovimiento] = useState<{
    id: string;
    tipo: "entrada" | "salida";
    cantidad: string;
  } | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avisoDrive, setAvisoDrive] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError(null);
    Promise.all([sembrarInventarioSiVacio(), sembrarPedidosSiVacio()])
      .then(async ([lista, compras]) => {
        if (!vigente) return;
        setItems(lista);
        setPedidos(compras);
        const sync = await sincronizarComprasDrive();
        if (!vigente) return;
        if (!sync.ok) setAvisoDrive(sync.error ?? "No se pudo actualizar el Drive de Compras.");
        else if ((sync.actualizados ?? 0) > 0 || (sync.nuevos ?? 0) > 0) {
          setAvisoDrive(
            `Drive actualizado: ${sync.nuevos ?? 0} nuevos y ${sync.actualizados ?? 0} con cambio de estado.`,
          );
          setPedidos(await sembrarPedidosSiVacio());
        } else setAvisoDrive(null);
      })
      .catch((e: Error) => {
        if (!vigente) return;
        setError(
          faltaTablaInventario(e.message) || faltaTablaCompras(e.message)
            ? "Falta crear las tablas del inventario en Supabase."
            : e.message,
        );
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, []);

  const grupos = useMemo(() => {
    const lista: { id: GrupoInventario["id"]; titulo: string; items: ItemInventarioGuardado[] }[] = [
      {
        id: "herramientas",
        titulo: "Herramientas",
        items: items.filter((item) => item.tipo === "herramientas"),
      },
      {
        id: "insumos",
        titulo: "Insumos y repuestos",
        items: items.filter((item) => item.tipo === "insumos"),
      },
    ];
    return lista;
  }, [items]);

  const grupo = grupos.find((item) => item.id === vista) ?? grupos[0];
  const consulta = sinAcento(busqueda.trim());
  const visibles = useMemo(() => {
    if (vista === "pedidos") return [];
    if (!consulta) return grupo.items;
    return grupo.items.filter((item) => sinAcento(item.descripcion).includes(consulta));
  }, [consulta, grupo.items, vista]);

  const pedidosVisibles = useMemo(() => {
    return pedidos.filter((pedido) => {
      if (filtroPedido !== "todos" && pedido.situacion !== filtroPedido) return false;
      if (!consulta) return true;
      const texto = `${pedido.descripcion} ${pedido.area} ${pedido.estado}`;
      return sinAcento(texto).includes(consulta);
    });
  }, [consulta, filtroPedido, pedidos]);

  const resumenPedidos = useMemo(() => {
    return {
      cumplido: pedidos.filter((pedido) => pedido.situacion === "cumplido").length,
      pendiente: pedidos.filter((pedido) => pedido.situacion === "pendiente").length,
      cancelado: pedidos.filter((pedido) => pedido.situacion === "cancelado").length,
    };
  }, [pedidos]);

  async function agregar(evento: FormEvent) {
    evento.preventDefault();
    if (vista === "pedidos") return;
    const descripcion = campos.descripcion.trim();
    if (!descripcion) {
      setError("Escribe el nombre de la herramienta o el insumo.");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const creado = await agregarItemInventario({
        tipo: vista,
        descripcion,
        cantidad: campos.cantidad.trim(),
        unidad: campos.unidad.trim() || "UND",
      });
      setItems((previos) =>
        [...previos, creado].sort((a, b) => a.descripcion.localeCompare(b.descripcion, "es")),
      );
      setCampos(formularioVacio);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  async function quitar(item: ItemInventarioGuardado) {
    if (!window.confirm(`¿Eliminar "${item.descripcion}" del inventario?`)) return;
    setError(null);
    try {
      await eliminarItemInventario(item.id);
      setItems((previos) => previos.filter((actual) => actual.id !== item.id));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function confirmarMovimiento(evento: FormEvent, item: ItemInventarioGuardado) {
    evento.preventDefault();
    if (!movimiento || movimiento.id !== item.id) return;
    const cantidad = Number(movimiento.cantidad.replace(",", "."));
    setGuardando(true);
    setError(null);
    try {
      const actualizado = await registrarMovimiento(item, movimiento.tipo, cantidad);
      setItems((previos) => previos.map((actual) => (actual.id === actualizado.id ? actualizado : actual)));
      setMovimiento(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  async function ingresar(pedido: PedidoCompraGuardado) {
    setGuardando(true);
    setError(null);
    try {
      const resultado = await ingresarPedidoAlInventario(pedido);
      setPedidos((previos) =>
        previos.map((actual) => (actual.id === resultado.pedido.id ? resultado.pedido : actual)),
      );
      setItems((previos) => {
        const existe = previos.some((item) => item.id === resultado.item.id);
        const lista = existe
          ? previos.map((item) => (item.id === resultado.item.id ? resultado.item : item))
          : [...previos, resultado.item];
        return lista.sort((a, b) => a.descripcion.localeCompare(b.descripcion, "es"));
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  if (!veInventarioMantenimiento(perfil)) {
    return <Navigate to="/principal" replace />;
  }

  return (
    <section className="principal">
      <header className="principal__cabecera">
        <Link to="/principal" className="btn">
          ← Principal
        </Link>
        <h1>Inventario de herramientas e insumos</h1>
        <p>
          Lo que hay en mantenimiento, lo pedido a Compras y el registro de lo que entra y sale.
        </p>
      </header>

      {avisoDrive && <p className="inventario__aviso">{avisoDrive}</p>}
      {error && <p className="inventario__error">{error}</p>}
      {cargando && <p>Cargando inventario...</p>}

      {!cargando && (
        <>
          <div className="inventario__grupos">
            {grupos.map((item) => (
              <button
                key={item.id}
                type="button"
                className={item.id === vista ? "btn btn--primario" : "btn"}
                onClick={() => {
                  setVista(item.id);
                  setMovimiento(null);
                }}
              >
                {item.titulo} ({item.items.length})
              </button>
            ))}
            <button
              type="button"
              className={vista === "pedidos" ? "btn btn--primario" : "btn"}
              onClick={() => setVista("pedidos")}
            >
              Pedidos a Compras ({pedidos.length})
            </button>
          </div>

          {vista !== "pedidos" && (
            <form className="inventario__alta" onSubmit={(e) => void agregar(e)}>
              <label>
                {vista === "herramientas" ? "Nueva herramienta" : "Nuevo insumo o repuesto"}
                <input
                  value={campos.descripcion}
                  onChange={(e) => setCampos((c) => ({ ...c, descripcion: e.target.value }))}
                  placeholder="Descripción"
                  required
                />
              </label>
              <label>
                Cantidad
                <input
                  value={campos.cantidad}
                  onChange={(e) => setCampos((c) => ({ ...c, cantidad: e.target.value }))}
                  placeholder="1"
                />
              </label>
              <label>
                Unidad
                <input
                  value={campos.unidad}
                  onChange={(e) => setCampos((c) => ({ ...c, unidad: e.target.value }))}
                  placeholder="UND"
                />
              </label>
              <button type="submit" className="btn btn--primario" disabled={guardando}>
                {guardando ? "Guardando..." : "Agregar"}
              </button>
            </form>
          )}

          <label className="inventario__buscar">
            Buscar
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder={vista === "pedidos" ? "Pedido, área o estado" : "Nombre de la herramienta o el insumo"}
            />
          </label>

          {vista === "pedidos" ? (
            <>
              <div className="inventario__grupos">
                {(
                  [
                    ["todos", `Todos (${pedidos.length})`],
                    ["pendiente", `Pendiente (${resumenPedidos.pendiente})`],
                    ["cumplido", `Cumplido (${resumenPedidos.cumplido})`],
                    ["cancelado", `Cancelado (${resumenPedidos.cancelado})`],
                  ] as const
                ).map(([clave, texto]) => (
                  <button
                    key={clave}
                    type="button"
                    className={filtroPedido === clave ? "btn btn--primario" : "btn"}
                    onClick={() => setFiltroPedido(clave)}
                  >
                    {texto}
                  </button>
                ))}
              </div>
              <p className="principal__nota">
                Pendiente es lo que todavía no entra. Cumplido ya lo entregó Compras: regístralo como entrada
                para sumarlo a lo que hay. Cancelado no entra al inventario.
              </p>
              {pedidosVisibles.length === 0 ? (
                <p className="principal__vacio">No hay pedidos con ese filtro.</p>
              ) : (
                <div className="inventario__tabla">
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Descripción</th>
                        <th>Cantidad</th>
                        <th>Área</th>
                        <th>Estado</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {pedidosVisibles.map((pedido) => (
                        <tr key={pedido.id}>
                          <td>{fechaCorta(pedido.fecha)}</td>
                          <td>
                            {pedido.descripcion}
                            {pedido.observacion ? (
                              <div className="inventario__detalle">{pedido.observacion}</div>
                            ) : null}
                          </td>
                          <td>{pedido.cantidad || "—"}</td>
                          <td>{pedido.area || "—"}</td>
                          <td>
                            <span className={`inventario__estado inventario__estado--${pedido.situacion}`}>
                              {pedido.situacion === "cumplido"
                                ? "Cumplido"
                                : pedido.situacion === "cancelado"
                                  ? "Cancelado"
                                  : "Pendiente"}
                            </span>
                          </td>
                          <td>
                            {pedido.ingresado ? (
                              <span className="inventario__estado inventario__estado--entro">Ya entró</span>
                            ) : pedido.situacion === "cumplido" ? (
                              <button
                                type="button"
                                className="btn btn--primario"
                                disabled={guardando}
                                onClick={() => void ingresar(pedido)}
                              >
                                Registrar entrada
                              </button>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="principal__nota">
                {visibles.length} de {grupo.items.length} en {grupo.titulo.toLowerCase()}. Entrada suma y
                salida resta. En cero no hay existencia.
              </p>
              {visibles.length === 0 ? (
                <p className="principal__vacio">No hay coincidencias con esa búsqueda.</p>
              ) : (
                <div className="inventario__tabla">
                  <table>
                    <thead>
                      <tr>
                        <th>Descripción</th>
                        <th>Cantidad</th>
                        <th>Unidad</th>
                        <th>Existencia</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {visibles.map((item) => {
                        const hay = cantidadNumero(item.cantidad) > 0;
                        return (
                          <tr key={item.id}>
                            <td>{item.descripcion}</td>
                            <td>{item.cantidad || "—"}</td>
                            <td>{item.unidad || "—"}</td>
                            <td>
                              <span
                                className={`inventario__estado ${hay ? "inventario__estado--entro" : "inventario__estado--pendiente"}`}
                              >
                                {hay ? "Hay" : "No hay"}
                              </span>
                            </td>
                            <td className="inventario__acciones">
                              {movimiento?.id === item.id ? (
                                <form onSubmit={(e) => void confirmarMovimiento(e, item)}>
                                  <input
                                    type="number"
                                    min="0.01"
                                    step="any"
                                    value={movimiento.cantidad}
                                    onChange={(e) =>
                                      setMovimiento((actual) =>
                                        actual ? { ...actual, cantidad: e.target.value } : actual,
                                      )
                                    }
                                    aria-label="Cantidad del movimiento"
                                  />
                                  <button type="submit" className="btn btn--primario" disabled={guardando}>
                                    {movimiento.tipo === "entrada" ? "Sumar" : "Restar"}
                                  </button>
                                  <button type="button" className="btn" onClick={() => setMovimiento(null)}>
                                    Cancelar
                                  </button>
                                </form>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    className="btn"
                                    onClick={() => setMovimiento({ id: item.id, tipo: "entrada", cantidad: "1" })}
                                  >
                                    Entrada
                                  </button>
                                  <button
                                    type="button"
                                    className="btn"
                                    onClick={() => setMovimiento({ id: item.id, tipo: "salida", cantidad: "1" })}
                                  >
                                    Salida
                                  </button>
                                  <button type="button" className="btn btn--peligro" onClick={() => void quitar(item)}>
                                    Eliminar
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}

export default InventarioPage;
