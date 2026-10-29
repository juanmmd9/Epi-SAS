import { supabase } from "../../services/supabase";
import { INVENTARIO_MANTENIMIENTO, type GrupoInventario } from "./inventarioDatos";

const TABLA = "inventario_mantenimiento";

export type TipoInventario = GrupoInventario["id"];

export interface ItemInventarioGuardado {
  id: string;
  tipo: TipoInventario;
  descripcion: string;
  cantidad: string;
  unidad: string;
}

export function faltaTablaInventario(mensaje: string): boolean {
  return /inventario_mantenimiento|schema cache|relation.*does not exist/i.test(mensaje);
}

function esTipo(valor: string): valor is TipoInventario {
  return valor === "herramientas" || valor === "insumos";
}

export async function listarInventario(): Promise<ItemInventarioGuardado[]> {
  const { data, error } = await supabase
    .from(TABLA)
    .select("id, tipo, descripcion, cantidad, unidad")
    .order("descripcion", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as ItemInventarioGuardado[]).filter((item) => esTipo(item.tipo));
}

export async function sembrarInventarioSiVacio(): Promise<ItemInventarioGuardado[]> {
  const actuales = await listarInventario();
  if (actuales.length > 0) return actuales;

  const filas = INVENTARIO_MANTENIMIENTO.flatMap((grupo) =>
    grupo.items.map((item) => ({
      tipo: grupo.id,
      descripcion: item.descripcion,
      cantidad: item.cantidad,
      unidad: item.unidad,
    })),
  );

  for (let inicio = 0; inicio < filas.length; inicio += 200) {
    const { error } = await supabase.from(TABLA).insert(filas.slice(inicio, inicio + 200));
    if (error) throw new Error(error.message);
  }

  return listarInventario();
}

export async function agregarItemInventario(input: {
  tipo: TipoInventario;
  descripcion: string;
  cantidad: string;
  unidad: string;
}): Promise<ItemInventarioGuardado> {
  const { data, error } = await supabase
    .from(TABLA)
    .insert({
      tipo: input.tipo,
      descripcion: input.descripcion,
      cantidad: input.cantidad,
      unidad: input.unidad,
    })
    .select("id, tipo, descripcion, cantidad, unidad")
    .single();
  if (error) throw new Error(error.message);
  return data as ItemInventarioGuardado;
}

export async function eliminarItemInventario(id: string): Promise<void> {
  const { error } = await supabase.from(TABLA).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export function cantidadNumero(texto: string): number {
  const coincidencia = texto.replace(",", ".").match(/-?\d+(?:\.\d+)?/);
  if (!coincidencia) return 0;
  const valor = Number(coincidencia[0]);
  return Number.isFinite(valor) ? valor : 0;
}

export function cantidadTexto(valor: number): string {
  const redondo = Math.round(valor * 100) / 100;
  return Number.isInteger(redondo) ? String(redondo) : String(redondo);
}

export async function registrarMovimiento(
  item: ItemInventarioGuardado,
  tipo: "entrada" | "salida",
  cantidad: number,
): Promise<ItemInventarioGuardado> {
  if (!(cantidad > 0)) throw new Error("La cantidad debe ser mayor que cero.");
  const actual = cantidadNumero(item.cantidad);
  const siguiente = tipo === "entrada" ? actual + cantidad : actual - cantidad;
  if (siguiente < 0) {
    throw new Error(`No alcanza. En inventario hay ${cantidadTexto(actual)}.`);
  }
  const nueva = cantidadTexto(siguiente);
  const { data, error } = await supabase
    .from(TABLA)
    .update({ cantidad: nueva })
    .eq("id", item.id)
    .select("id, tipo, descripcion, cantidad, unidad")
    .single();
  if (error) throw new Error(error.message);
  const { error: errorMovimiento } = await supabase.from("inventario_movimientos").insert({
    item_id: item.id,
    tipo,
    cantidad,
  });
  if (errorMovimiento && !faltaTablaInventario(errorMovimiento.message)) {
    throw new Error(errorMovimiento.message);
  }
  return data as ItemInventarioGuardado;
}
