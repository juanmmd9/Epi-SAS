import { supabase } from "../../services/supabase";
import { PEDIDOS_COMPRA_MANTENIMIENTO } from "./comprasMantenimiento";
import {
  agregarItemInventario,
  cantidadNumero,
  cantidadTexto,
  listarInventario,
  registrarMovimiento,
  type ItemInventarioGuardado,
} from "./inventarioService";

const TABLA = "compras_mantenimiento";

export type SituacionCompra = "cumplido" | "pendiente" | "cancelado";

export interface PedidoCompraGuardado {
  id: string;
  fecha: string | null;
  descripcion: string;
  cantidad: string;
  area: string;
  necesidad: string;
  estado: string;
  situacion: SituacionCompra;
  observacion: string;
  origen: string;
  ingresado: boolean;
}

function esSituacion(valor: string): valor is SituacionCompra {
  return valor === "cumplido" || valor === "pendiente" || valor === "cancelado";
}

export function faltaTablaCompras(mensaje: string): boolean {
  return /compras_mantenimiento|schema cache|relation.*does not exist/i.test(mensaje);
}

export async function sincronizarComprasDrive(): Promise<{
  ok: boolean;
  error?: string;
  privada?: boolean;
  leidos?: number;
  nuevos?: number;
  actualizados?: number;
}> {
  const { data, error } = await supabase.functions.invoke("sincronizar-compras-admin", { body: {} });
  if (error) {
    return { ok: false, error: "No se pudo consultar el Drive de Compras." };
  }
  return (data ?? { ok: false, error: "Sin respuesta del Drive." }) as {
    ok: boolean;
    error?: string;
    privada?: boolean;
    leidos?: number;
    nuevos?: number;
    actualizados?: number;
  };
}

export async function listarPedidosCompra(): Promise<PedidoCompraGuardado[]> {
  const { data, error } = await supabase
    .from(TABLA)
    .select("id, fecha, descripcion, cantidad, area, necesidad, estado, situacion, observacion, origen, ingresado")
    .order("fecha", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as PedidoCompraGuardado[]).filter((pedido) => esSituacion(pedido.situacion));
}

export async function sembrarPedidosSiVacio(): Promise<PedidoCompraGuardado[]> {
  const actuales = await listarPedidosCompra();
  if (actuales.length > 0) return actuales;

  const filas = PEDIDOS_COMPRA_MANTENIMIENTO.map((pedido) => ({
    fecha: pedido.fecha || null,
    descripcion: pedido.descripcion,
    cantidad: pedido.cantidad,
    area: pedido.area,
    necesidad: pedido.necesidad,
    estado: pedido.estado,
    situacion: pedido.situacion,
    observacion: pedido.observacion,
    origen: pedido.origen,
    ingresado: false,
  }));

  for (let inicio = 0; inicio < filas.length; inicio += 200) {
    const { error } = await supabase.from(TABLA).insert(filas.slice(inicio, inicio + 200));
    if (error) throw new Error(error.message);
  }

  return listarPedidosCompra();
}

function clave(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** El pedido cumplido entra al inventario: suma si ya existe o crea el insumo. */
export async function ingresarPedidoAlInventario(
  pedido: PedidoCompraGuardado,
): Promise<{ item: ItemInventarioGuardado; pedido: PedidoCompraGuardado }> {
  if (pedido.ingresado) throw new Error("Ese pedido ya entró al inventario.");
  if (pedido.situacion !== "cumplido") {
    throw new Error("Solo entra al inventario lo que Compras ya cumplió.");
  }
  const cantidad = cantidadNumero(pedido.cantidad);
  if (!(cantidad > 0)) throw new Error("El pedido no tiene una cantidad para sumar.");

  const items = await listarInventario();
  const buscada = clave(pedido.descripcion);
  const existente = items.find((item) => clave(item.descripcion) === buscada);
  const item = existente
    ? await registrarMovimiento(existente, "entrada", cantidad)
    : await agregarItemInventario({
        tipo: "insumos",
        descripcion: pedido.descripcion,
        cantidad: cantidadTexto(cantidad),
        unidad: "UND",
      });

  const { data, error } = await supabase
    .from(TABLA)
    .update({ ingresado: true })
    .eq("id", pedido.id)
    .select("id, fecha, descripcion, cantidad, area, necesidad, estado, situacion, observacion, origen, ingresado")
    .single();
  if (error) throw new Error(error.message);
  return { item, pedido: data as PedidoCompraGuardado };
}
