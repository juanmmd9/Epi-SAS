import { supabase } from "../../services/supabase";
import type {
  ComentarioGerencia,
  ColumnaGerencia,
  CotizacionGerencia,
  DashboardGerencia,
  EstadoGerencia,
  HistorialGerencia,
  ImpactoGerencia,
  ItemGerencia,
  ItemGerenciaInput,
  TableroGerencia,
  TipoGerencia,
  UrgenciaGerencia,
} from "./types";
import { TABLEROS_GERENCIA, normalizarListaEncargados } from "./types";
import { diasAbiertos, diasLimiteSla, semaforoItem } from "./gerenciaSla";

const TABLA = "gerencia_items";
const TABLA_HIST = "gerencia_historial";
const TABLA_COM = "gerencia_comentarios";
const TABLA_COT = "gerencia_cotizaciones";
const TABLA_COLS = "gerencia_tableros";
const BUCKET = "gerencia-cotizaciones";

function slugColumna(etiqueta: string): string {
  return etiqueta
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 48) || `col_${Date.now()}`;
}

/** Prefijo de columnas del tablero de área del líder (no aparecen en Gerencia). */
export function prefijoTableroArea(area: string): string {
  return `area_${slugColumna(area || "sin_area")}_`;
}

export function esTableroAreaLider(tablero: string): boolean {
  return tablero.startsWith("area_");
}

export function idColumnaBandejaArea(area: string): string {
  return `${prefijoTableroArea(area)}bandeja`;
}

function esTipo(v: string): v is TipoGerencia {
  return ["proyecto", "compra_internacional", "compra_local", "maquina", "otro"].includes(v);
}

function esEstado(v: string): v is EstadoGerencia {
  return ["pendiente", "en_proceso", "hecho", "pausado", "eliminado"].includes(v);
}

function esUrgencia(v: string): v is UrgenciaGerencia {
  return ["baja", "media", "alta"].includes(v);
}

function esImpacto(v: string): v is ImpactoGerencia {
  return ["bajo", "medio", "alto"].includes(v);
}

function parseEncargadosFila(fila: Record<string, unknown>): string[] {
  const raw = fila.encargados;
  if (Array.isArray(raw)) {
    return normalizarListaEncargados(raw.map((x) => String(x)));
  }
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return normalizarListaEncargados(parsed.map((x) => String(x)));
      }
    } catch {
      /* ignore */
    }
  }
  const resp = fila.responsable_nombre != null ? String(fila.responsable_nombre).trim() : "";
  return resp ? [resp] : [];
}

function normalizar(fila: Record<string, unknown>): ItemGerencia {
  const tipoRaw = String(fila.tipo ?? "proyecto");
  const estadoRaw = String(fila.estado ?? "pendiente");
  const urgenciaRaw = String(fila.urgencia ?? "media");
  const impactoRaw = String(fila.impacto ?? "medio");
  const origenRaw = String(fila.origen ?? "solicitud");
  const encargados = parseEncargadosFila(fila);
  return {
    id: String(fila.id),
    tablero: String(fila.tablero ?? "por_clasificar") || "por_clasificar",
    titulo: String(fila.titulo ?? ""),
    tipo: esTipo(tipoRaw) ? tipoRaw : "proyecto",
    area: fila.area != null ? String(fila.area) : null,
    solicitante_id: fila.solicitante_id != null ? String(fila.solicitante_id) : null,
    solicitante_nombre:
      fila.solicitante_nombre != null ? String(fila.solicitante_nombre) : null,
    estado: esEstado(estadoRaw) ? estadoRaw : "pendiente",
    orden: Number(fila.orden) || 0,
    urgencia: esUrgencia(urgenciaRaw) ? urgenciaRaw : "media",
    impacto: esImpacto(impactoRaw) ? impactoRaw : "medio",
    monto: fila.monto != null && fila.monto !== "" ? Number(fila.monto) : null,
    proveedor: fila.proveedor != null ? String(fila.proveedor) : null,
    notas: fila.notas != null ? String(fila.notas) : null,
    origen: origenRaw === "gerencia" ? "gerencia" : "solicitud",
    fecha_compromiso: fila.fecha_compromiso
      ? String(fila.fecha_compromiso).slice(0, 10)
      : null,
    responsable_nombre:
      encargados[0] ??
      (fila.responsable_nombre != null ? String(fila.responsable_nombre) : null),
    encargados,
    cerrado_en: fila.cerrado_en != null ? String(fila.cerrado_en) : null,
    confirmado_area: Boolean(fila.confirmado_area),
    motivo_eliminacion:
      fila.motivo_eliminacion != null ? String(fila.motivo_eliminacion) : null,
    eliminado_en: fila.eliminado_en != null ? String(fila.eliminado_en) : null,
    eliminado_por_nombre:
      fila.eliminado_por_nombre != null ? String(fila.eliminado_por_nombre) : null,
    creado_en: String(fila.creado_en ?? ""),
    actualizado_en: String(fila.actualizado_en ?? ""),
  };
}

function normalizarHist(fila: Record<string, unknown>): HistorialGerencia {
  return {
    id: String(fila.id),
    item_id: String(fila.item_id),
    tipo: String(fila.tipo ?? ""),
    detalle: fila.detalle != null ? String(fila.detalle) : null,
    autor_id: fila.autor_id != null ? String(fila.autor_id) : null,
    autor_nombre: fila.autor_nombre != null ? String(fila.autor_nombre) : null,
    creado_en: String(fila.creado_en ?? ""),
  };
}

function normalizarCom(fila: Record<string, unknown>): ComentarioGerencia {
  return {
    id: String(fila.id),
    item_id: String(fila.item_id),
    mensaje: String(fila.mensaje ?? ""),
    autor_id: fila.autor_id != null ? String(fila.autor_id) : null,
    autor_nombre: fila.autor_nombre != null ? String(fila.autor_nombre) : null,
    creado_en: String(fila.creado_en ?? ""),
  };
}

function normalizarCot(fila: Record<string, unknown>): CotizacionGerencia {
  return {
    id: String(fila.id),
    item_id: String(fila.item_id),
    proveedor: String(fila.proveedor ?? ""),
    monto: fila.monto != null && fila.monto !== "" ? Number(fila.monto) : null,
    moneda: String(fila.moneda ?? "COP"),
    vigencia: fila.vigencia ? String(fila.vigencia).slice(0, 10) : null,
    archivo_url: fila.archivo_url != null ? String(fila.archivo_url) : null,
    archivo_nombre: fila.archivo_nombre != null ? String(fila.archivo_nombre) : null,
    elegida: Boolean(fila.elegida),
    notas: fila.notas != null ? String(fila.notas) : null,
    autor_id: fila.autor_id != null ? String(fila.autor_id) : null,
    autor_nombre: fila.autor_nombre != null ? String(fila.autor_nombre) : null,
    creado_en: String(fila.creado_en ?? ""),
  };
}

export async function listarItemsGerencia(): Promise<ItemGerencia[]> {
  const { data, error } = await supabase
    .from(TABLA)
    .select("*")
    .order("orden", { ascending: true })
    .order("creado_en", { ascending: false });
  if (error) throw new Error(error.message);
  // Solo lo ya enviado a Gerencia (no borradores del tablero de área del líder)
  return (data ?? [])
    .map((f) => normalizar(f as Record<string, unknown>))
    .filter((i) => !esTableroAreaLider(i.tablero));
}

export async function listarMisPedidosGerencia(userId: string): Promise<ItemGerencia[]> {
  const { data, error } = await supabase
    .from(TABLA)
    .select("*")
    .eq("solicitante_id", userId)
    .order("creado_en", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((f) => normalizar(f as Record<string, unknown>));
}

export async function obtenerItemGerencia(id: string): Promise<ItemGerencia | null> {
  const { data, error } = await supabase.from(TABLA).select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalizar(data as Record<string, unknown>) : null;
}

export async function crearItemGerencia(input: ItemGerenciaInput): Promise<ItemGerencia> {
  const encargados = normalizarListaEncargados(
    input.encargados ?? (input.responsable_nombre ? [input.responsable_nombre] : []),
  );
  const payload = {
    titulo: input.titulo.trim(),
    tipo: input.tipo,
    area: input.area?.trim() || null,
    urgencia: input.urgencia ?? "media",
    impacto: input.impacto ?? "medio",
    monto: input.monto ?? null,
    notas: input.notas?.trim() || null,
    tablero: input.tablero ?? "por_clasificar",
    estado: input.estado ?? "pendiente",
    orden: input.orden ?? 0,
    proveedor: input.proveedor?.trim() || null,
    origen: input.origen ?? "solicitud",
    solicitante_id: input.solicitante_id ?? null,
    solicitante_nombre: input.solicitante_nombre?.trim() || null,
    fecha_compromiso: input.fecha_compromiso || null,
    responsable_nombre: encargados[0] ?? (input.responsable_nombre?.trim() || null),
    encargados,
    actualizado_en: new Date().toISOString(),
  };
  const { data, error } = await supabase.from(TABLA).insert(payload).select("*").single();
  if (error) throw new Error(error.message);
  return normalizar(data as Record<string, unknown>);
}

export async function actualizarItemGerencia(
  id: string,
  cambios: Partial<ItemGerenciaInput> & {
    estado?: EstadoGerencia;
    tablero?: TableroGerencia;
    confirmado_area?: boolean;
  },
): Promise<ItemGerencia> {
  const payload: Record<string, unknown> = {
    actualizado_en: new Date().toISOString(),
  };
  if (cambios.titulo != null) payload.titulo = cambios.titulo.trim();
  if (cambios.tipo != null) payload.tipo = cambios.tipo;
  if (cambios.area !== undefined) payload.area = cambios.area?.trim() || null;
  if (cambios.urgencia != null) payload.urgencia = cambios.urgencia;
  if (cambios.impacto != null) payload.impacto = cambios.impacto;
  if (cambios.monto !== undefined) payload.monto = cambios.monto;
  if (cambios.notas !== undefined) payload.notas = cambios.notas?.trim() || null;
  if (cambios.tablero != null) payload.tablero = cambios.tablero;
  if (cambios.estado != null) payload.estado = cambios.estado;
  if (cambios.orden != null) payload.orden = cambios.orden;
  if (cambios.proveedor !== undefined) payload.proveedor = cambios.proveedor?.trim() || null;
  if (cambios.fecha_compromiso !== undefined) {
    payload.fecha_compromiso = cambios.fecha_compromiso || null;
  }
  if (cambios.encargados !== undefined) {
    const lista = normalizarListaEncargados(cambios.encargados);
    payload.encargados = lista;
    payload.responsable_nombre = lista[0] ?? null;
  } else if (cambios.responsable_nombre !== undefined) {
    const nombre = cambios.responsable_nombre?.trim() || null;
    payload.responsable_nombre = nombre;
    payload.encargados = nombre ? [nombre] : [];
  }
  if (cambios.confirmado_area != null) payload.confirmado_area = cambios.confirmado_area;

  const { data, error } = await supabase
    .from(TABLA)
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return normalizar(data as Record<string, unknown>);
}

export async function eliminarItemGerencia(
  id: string,
  motivo: string,
  eliminadoPorNombre?: string | null,
): Promise<ItemGerencia> {
  const texto = motivo.trim();
  if (!texto) throw new Error("Indica por qué se elimina la solicitud.");
  const { data, error } = await supabase
    .from(TABLA)
    .update({
      estado: "eliminado",
      motivo_eliminacion: texto,
      eliminado_en: new Date().toISOString(),
      eliminado_por_nombre: eliminadoPorNombre?.trim() || null,
      actualizado_en: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  const item = normalizar(data as Record<string, unknown>);
  await supabase.from(TABLA_HIST).insert({
    item_id: id,
    tipo: "eliminacion",
    detalle: `${eliminadoPorNombre?.trim() || "Usuario"} eliminó la solicitud: ${texto}`,
    autor_nombre: eliminadoPorNombre?.trim() || null,
  });
  return item;
}

/** Borra del todo (solo gerencia/admin). Usar en la vista Eliminados. */
export async function borrarItemGerenciaDefinitivo(id: string): Promise<void> {
  const { error } = await supabase.from(TABLA).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listarHistorial(itemId: string): Promise<HistorialGerencia[]> {
  const { data, error } = await supabase
    .from(TABLA_HIST)
    .select("*")
    .eq("item_id", itemId)
    .order("creado_en", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((f) => normalizarHist(f as Record<string, unknown>));
}

export async function listarComentarios(itemId: string): Promise<ComentarioGerencia[]> {
  const { data, error } = await supabase
    .from(TABLA_COM)
    .select("*")
    .eq("item_id", itemId)
    .order("creado_en", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((f) => normalizarCom(f as Record<string, unknown>));
}

export async function agregarComentario(
  itemId: string,
  mensaje: string,
  autorId: string | null,
  autorNombre: string,
): Promise<ComentarioGerencia> {
  const texto = mensaje.trim();
  if (!texto) throw new Error("Escribe un comentario.");
  const { data, error } = await supabase
    .from(TABLA_COM)
    .insert({
      item_id: itemId,
      mensaje: texto,
      autor_id: autorId,
      autor_nombre: autorNombre,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await supabase.from(TABLA_HIST).insert({
    item_id: itemId,
    tipo: "comentario",
    detalle: `Comentario de ${autorNombre}`,
    autor_id: autorId,
    autor_nombre: autorNombre,
  });
  return normalizarCom(data as Record<string, unknown>);
}

export async function listarCotizaciones(itemId: string): Promise<CotizacionGerencia[]> {
  const { data, error } = await supabase
    .from(TABLA_COT)
    .select("*")
    .eq("item_id", itemId)
    .order("creado_en", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((f) => normalizarCot(f as Record<string, unknown>));
}

export async function subirArchivoCotizacion(
  itemId: string,
  archivo: File,
): Promise<{ url: string; nombre: string }> {
  const ext = archivo.name.split(".").pop() || "pdf";
  const path = `${itemId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, archivo, {
    upsert: false,
    contentType: archivo.type || undefined,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, nombre: archivo.name };
}

export async function crearCotizacion(input: {
  itemId: string;
  proveedor: string;
  monto: number | null;
  moneda?: string;
  vigencia?: string | null;
  archivo?: File | null;
  notas?: string | null;
  autorId: string | null;
  autorNombre: string;
}): Promise<CotizacionGerencia> {
  let archivo_url: string | null = null;
  let archivo_nombre: string | null = null;
  if (input.archivo) {
    const subido = await subirArchivoCotizacion(input.itemId, input.archivo);
    archivo_url = subido.url;
    archivo_nombre = subido.nombre;
  }
  const { data, error } = await supabase
    .from(TABLA_COT)
    .insert({
      item_id: input.itemId,
      proveedor: input.proveedor.trim(),
      monto: input.monto,
      moneda: input.moneda || "COP",
      vigencia: input.vigencia || null,
      archivo_url,
      archivo_nombre,
      notas: input.notas?.trim() || null,
      autor_id: input.autorId,
      autor_nombre: input.autorNombre,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await supabase.from(TABLA_HIST).insert({
    item_id: input.itemId,
    tipo: "cotizacion",
    detalle: `Cotización de ${input.proveedor.trim()}`,
    autor_id: input.autorId,
    autor_nombre: input.autorNombre,
  });
  return normalizarCot(data as Record<string, unknown>);
}

export async function marcarCotizacionElegida(
  itemId: string,
  cotizacionId: string,
  proveedor: string,
  monto: number | null,
): Promise<void> {
  const { error: e1 } = await supabase
    .from(TABLA_COT)
    .update({ elegida: false })
    .eq("item_id", itemId);
  if (e1) throw new Error(e1.message);
  const { error: e2 } = await supabase
    .from(TABLA_COT)
    .update({ elegida: true })
    .eq("id", cotizacionId);
  if (e2) throw new Error(e2.message);
  await actualizarItemGerencia(itemId, {
    proveedor,
    monto: monto ?? undefined,
  });
  await supabase.from(TABLA_HIST).insert({
    item_id: itemId,
    tipo: "cotizacion_elegida",
    detalle: `Cotización elegida: ${proveedor}`,
  });
}

export function calcularDashboard(items: ItemGerencia[]): DashboardGerencia {
  const ahora = new Date();
  let porClasificar = 0;
  let enProceso = 0;
  let hechos = 0;
  let vencidas = 0;
  let enRojo = 0;
  let montoAbierto = 0;
  const activos = items.filter((i) => i.estado !== "eliminado");
  for (const item of activos) {
    if (item.tablero === "por_clasificar" && item.estado !== "hecho") porClasificar += 1;
    if (item.estado === "hecho") hechos += 1;
    else if (item.estado === "en_proceso" || item.estado === "pendiente") enProceso += 1;
    if (item.estado !== "hecho") {
      if (diasAbiertos(item, ahora) > diasLimiteSla(item.urgencia)) vencidas += 1;
      if (semaforoItem(item, ahora) === "rojo") enRojo += 1;
      if (item.monto != null) montoAbierto += item.monto;
    }
  }
  return {
    total: activos.length,
    porClasificar,
    enProceso,
    hechos,
    vencidas,
    enRojo,
    montoAbierto,
  };
}

export async function tablaGerenciaLista(): Promise<boolean> {
  const { error } = await supabase.from(TABLA).select("id").limit(1);
  if (!error) return true;
  if (error.message.toLowerCase().includes("does not exist")) return false;
  if (error.code === "42P01") return false;
  return true;
}

export async function tablasSeguimientoListas(): Promise<boolean> {
  const { error } = await supabase.from(TABLA_COM).select("id").limit(1);
  if (!error) return true;
  if (error.message.toLowerCase().includes("does not exist")) return false;
  if (error.code === "42P01") return false;
  return true;
}

export async function listarColumnasGerencia(): Promise<ColumnaGerencia[]> {
  const base: ColumnaGerencia[] = TABLEROS_GERENCIA.map((t, i) => ({
    id: t.id,
    etiqueta: t.etiqueta,
    orden: (i + 1) * 10,
  }));

  try {
    const { data, error } = await supabase
      .from(TABLA_COLS)
      .select("id, etiqueta, orden, activo")
      .order("orden", { ascending: true });

    if (error) {
      return base;
    }

    const filas = data ?? [];
    if (filas.length === 0) {
      return base;
    }

    const porId = new Map<string, ColumnaGerencia & { activo: boolean }>();
    for (const col of base) {
      porId.set(col.id, { ...col, activo: true });
    }
    for (const f of filas) {
      const id = String((f as { id: string }).id);
      const activo = (f as { activo?: boolean }).activo !== false;
      porId.set(id, {
        id,
        etiqueta: String((f as { etiqueta: string }).etiqueta),
        orden: Number((f as { orden: number }).orden) || 100,
        activo,
      });
    }

    return Array.from(porId.values())
      .filter((c) => c.activo && !esTableroAreaLider(c.id))
      .map(({ id, etiqueta, orden }) => ({ id, etiqueta, orden }))
      .sort((a, b) => a.orden - b.orden || a.etiqueta.localeCompare(b.etiqueta));
  } catch {
    return base;
  }
}

export async function listarColumnasAreaLider(area: string): Promise<ColumnaGerencia[]> {
  const prefijo = prefijoTableroArea(area);
  const bandejaId = idColumnaBandejaArea(area);
  const bandeja: ColumnaGerencia = { id: bandejaId, etiqueta: "Por enviar", orden: 10 };

  try {
    const { data, error } = await supabase
      .from(TABLA_COLS)
      .select("id, etiqueta, orden, activo")
      .like("id", `${prefijo}%`)
      .order("orden", { ascending: true });

    if (error) return [bandeja];

    const cols = (data ?? [])
      .filter((f) => (f as { activo?: boolean }).activo !== false)
      .map((f) => ({
        id: String((f as { id: string }).id),
        etiqueta: String((f as { etiqueta: string }).etiqueta),
        orden: Number((f as { orden: number }).orden) || 100,
      }));

    if (!cols.some((c) => c.id === bandejaId)) {
      // Asegura columna bandeja en BD
      await supabase.from(TABLA_COLS).upsert(
        { id: bandejaId, etiqueta: "Por enviar", orden: 10, activo: true },
        { onConflict: "id" },
      );
      cols.unshift(bandeja);
    }

    return cols.sort((a, b) => a.orden - b.orden || a.etiqueta.localeCompare(b.etiqueta));
  } catch {
    return [bandeja];
  }
}

export async function crearColumnaAreaLider(
  area: string,
  etiqueta: string,
): Promise<ColumnaGerencia> {
  const nombre = etiqueta.trim();
  if (!nombre) throw new Error("Escribe el nombre de la columna.");
  const prefijo = prefijoTableroArea(area);
  let id = `${prefijo}${slugColumna(nombre)}`;
  if (id === idColumnaBandejaArea(area)) id = `${prefijo}col_${Date.now()}`;

  const existentes = await listarColumnasAreaLider(area);
  const maxOrden = existentes.reduce((m, c) => Math.max(m, c.orden), 10);
  const orden = maxOrden + 10;

  const { data, error } = await supabase
    .from(TABLA_COLS)
    .upsert({ id, etiqueta: nombre, orden, activo: true }, { onConflict: "id" })
    .select("id, etiqueta, orden")
    .single();

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("does not exist") || error.code === "42P01") {
      throw new Error(
        "Falta crear la tabla de columnas. Ejecuta en SQL Editor: supabase/migrations/gerencia_tableros.sql",
      );
    }
    if (msg.includes("policy") || msg.includes("permission") || msg.includes("rls")) {
      throw new Error(
        "Sin permiso para crear columnas. Ejecuta supabase/migrations/gerencia_tablero_area_lider.sql",
      );
    }
    throw new Error(error.message);
  }

  return {
    id: String(data?.id ?? id),
    etiqueta: String(data?.etiqueta ?? nombre),
    orden: Number(data?.orden) || orden,
  };
}

/** Envía una card del tablero de área a la bandeja de Gerencia (Por clasificar). */
export async function enviarItemAGerencia(id: string): Promise<ItemGerencia> {
  const { data, error } = await supabase
    .from(TABLA)
    .update({
      tablero: "por_clasificar",
      estado: "pendiente",
      origen: "solicitud",
      actualizado_en: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  const item = normalizar(data as Record<string, unknown>);
  await supabase.from(TABLA_HIST).insert({
    item_id: id,
    tipo: "envio_gerencia",
    detalle: "Enviado a Gerencia · Por clasificar",
  });
  return item;
}

export async function crearColumnaGerencia(etiqueta: string): Promise<ColumnaGerencia> {
  const nombre = etiqueta.trim();
  if (!nombre) throw new Error("Escribe el nombre de la columna.");
  let id = slugColumna(nombre);
  if (id === "por_clasificar") id = `col_${Date.now()}`;

  const { data: existentes } = await supabase.from(TABLA_COLS).select("orden");
  const maxOrden = (existentes ?? []).reduce(
    (m, f) => Math.max(m, Number((f as { orden: number }).orden) || 0),
    80,
  );
  const orden = maxOrden + 10;
  const local: ColumnaGerencia = { id, etiqueta: nombre, orden };

  const { data, error } = await supabase
    .from(TABLA_COLS)
    .upsert({ id, etiqueta: nombre, orden, activo: true }, { onConflict: "id" })
    .select("id, etiqueta, orden")
    .single();

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("does not exist") || error.code === "42P01") {
      throw new Error(
        "Falta crear la tabla de columnas. Ejecuta en SQL Editor: supabase/migrations/gerencia_tableros.sql",
      );
    }
    throw new Error(error.message);
  }

  if (!data) return local;
  return {
    id: String(data.id),
    etiqueta: String(data.etiqueta),
    orden: Number(data.orden) || orden,
  };
}

/** Soft-delete de columna. No permite borrar «Por clasificar». Mueve ítems activos a Por clasificar. */
export async function eliminarColumnaGerencia(
  columna: ColumnaGerencia,
  opciones?: { bandejaArea?: string },
): Promise<{ movidos: number }> {
  if (columna.id === "por_clasificar") {
    throw new Error("No se puede eliminar la columna «Por clasificar».");
  }
  if (opciones?.bandejaArea && columna.id === idColumnaBandejaArea(opciones.bandejaArea)) {
    throw new Error("No se puede eliminar la columna «Por enviar».");
  }

  const destino =
    opciones?.bandejaArea != null
      ? idColumnaBandejaArea(opciones.bandejaArea)
      : "por_clasificar";

  const { data: itemsCol, error: errItems } = await supabase
    .from(TABLA)
    .select("id, estado")
    .eq("tablero", columna.id);
  if (errItems) throw new Error(errItems.message);

  const aMover = (itemsCol ?? []).filter(
    (f) => String((f as { estado: string }).estado) !== "eliminado",
  );
  if (aMover.length > 0) {
    const ids = aMover.map((f) => String((f as { id: string }).id));
    const { error: errMove } = await supabase
      .from(TABLA)
      .update({
        tablero: destino,
        actualizado_en: new Date().toISOString(),
      })
      .in("id", ids);
    if (errMove) throw new Error(errMove.message);
  }

  const { error } = await supabase.from(TABLA_COLS).upsert(
    {
      id: columna.id,
      etiqueta: columna.etiqueta,
      orden: columna.orden,
      activo: false,
    },
    { onConflict: "id" },
  );
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("does not exist") || error.code === "42P01") {
      throw new Error(
        "Falta crear la tabla de columnas. Ejecuta en SQL Editor: supabase/migrations/gerencia_tableros.sql",
      );
    }
    throw new Error(error.message);
  }

  return { movidos: aMover.length };
}
