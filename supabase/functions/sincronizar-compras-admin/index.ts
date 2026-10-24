/**
 * Lee la hoja COMPRAS ADMIN del Drive y actualiza los pedidos de Mantenimiento.
 * Si Compras cambia el estado a cumplido o lo deja pendiente, el portal queda igual.
 *
 * La hoja tiene que estar compartida como lector para cualquier persona con el enlace.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const HOJA =
  "https://docs.google.com/spreadsheets/d/12t3tF21cMp87exwypf8K9Slm99thLb5i/export?format=csv&gid=382690054";

function corsHeaders(origin: string | null): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function json(status: number, body: unknown, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

function norm(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function esMantenimiento(area: string): boolean {
  const a = norm(area);
  if (!a) return false;
  return ["MANT", "MATEN", "MANTE", "MANET", "MANTN", "MANNTE"].some((clave) => a.includes(clave));
}

function clasificar(estado: string): "cumplido" | "pendiente" | "cancelado" {
  const e = norm(estado);
  if (e.startsWith("CUMPLIDO")) return "cumplido";
  if (e.includes("CANCEL") || e.includes("NO AUTORIZ")) return "cancelado";
  return "pendiente";
}

function cantidadTexto(valor: string): string {
  const limpio = valor.trim().replace(/\s+/g, " ");
  const numero = limpio.replace(",", ".");
  if (/^-?\d+(\.0+)?$/.test(numero)) return String(Number(numero));
  return limpio;
}

function fechaIso(valor: string): string {
  const texto = valor.trim();
  if (!texto) return "";
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const partes = texto.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
  if (!partes) return "";
  let dia = Number(partes[1]);
  let mes = Number(partes[2]);
  const anio = partes[3];
  if (dia > 12 && mes <= 12) {
    /* día/mes */
  } else if (mes > 12 && dia <= 12) {
    const tmp = dia;
    dia = mes;
    mes = tmp;
  }
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function parseCsv(texto: string): string[][] {
  const filas: string[][] = [];
  let fila: string[] = [];
  let celda = "";
  let comillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (comillas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          celda += '"';
          i++;
        } else comillas = false;
      } else celda += c;
      continue;
    }
    if (c === '"') comillas = true;
    else if (c === ",") {
      fila.push(celda);
      celda = "";
    } else if (c === "\n") {
      fila.push(celda);
      filas.push(fila);
      fila = [];
      celda = "";
    } else if (c !== "\r") celda += c;
  }
  if (celda.length > 0 || fila.length > 0) {
    fila.push(celda);
    filas.push(fila);
  }
  return filas;
}

interface PedidoHoja {
  clave: string;
  fecha: string | null;
  descripcion: string;
  cantidad: string;
  area: string;
  necesidad: string;
  estado: string;
  situacion: "cumplido" | "pendiente" | "cancelado";
  observacion: string;
}

function pedidosDeLaHoja(csv: string): PedidoHoja[] {
  const filas = parseCsv(csv);
  const encabezado = filas.findIndex((fila) => {
    const nombres = fila.map((c) => norm(c));
    return nombres.includes("FECHA") && nombres.includes("DESCRIPCION") && nombres.includes("AREA") && nombres.includes("ESTADO");
  });
  if (encabezado < 0) return [];
  const nombres = filas[encabezado].map((c) => norm(c));
  const col = (nombre: string) => nombres.indexOf(nombre);
  const iFecha = col("FECHA");
  const iDesc = col("DESCRIPCION");
  const iCant = col("CANTIDAD");
  const iArea = col("AREA");
  const iNec = col("NECESIDAD");
  const iEstado = col("ESTADO");
  const iObs = nombres.findIndex((n) => n.startsWith("OBSERVACIONES"));
  const pedidos: PedidoHoja[] = [];
  for (const fila of filas.slice(encabezado + 1)) {
    const descripcion = (fila[iDesc] ?? "").replace(/\s+/g, " ").trim();
    const area = (fila[iArea] ?? "").replace(/\s+/g, " ").trim();
    if (!descripcion || !esMantenimiento(area)) continue;
    const fecha = fechaIso(fila[iFecha] ?? "");
    const cantidad = cantidadTexto(fila[iCant] ?? "");
    const estado = (fila[iEstado] ?? "").replace(/\s+/g, " ").trim();
    const clave = [fecha, norm(descripcion), norm(cantidad), norm(area)].join("|");
    pedidos.push({
      clave,
      fecha: fecha || null,
      descripcion,
      cantidad,
      area,
      necesidad: (fila[iNec] ?? "").replace(/\s+/g, " ").trim(),
      estado,
      situacion: clasificar(estado),
      observacion: iObs >= 0 ? (fila[iObs] ?? "").replace(/\s+/g, " ").trim() : "",
    });
  }
  return pedidos;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (req.method !== "POST") return json(405, { ok: false, error: "Método no permitido" }, origin);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json(500, { ok: false, error: "Faltan variables de Supabase" }, origin);
  }
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json(401, { ok: false, error: "No autenticado" }, origin);
  }
  const usuario = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: sesion, error: errorSesion } = await usuario.auth.getUser();
  if (errorSesion || !sesion.user) return json(401, { ok: false, error: "Sesión inválida" }, origin);

  const respuesta = await fetch(HOJA, { redirect: "manual" });
  if (respuesta.status >= 300 && respuesta.status < 400) {
    return json(200, {
      ok: false,
      privada: true,
      error:
        "La hoja COMPRAS ADMIN está privada. En Drive, Compártela como Lector para cualquier persona con el enlace. Así el portal ve cuando Compras marca cumplido o pendiente.",
    }, origin);
  }
  if (!respuesta.ok) {
    return json(200, { ok: false, error: "No se pudo leer la hoja de Compras." }, origin);
  }
  const csv = await respuesta.text();
  if (csv.trimStart().startsWith("<!")) {
    return json(200, {
      ok: false,
      privada: true,
      error:
        "La hoja COMPRAS ADMIN está privada. Compártela como Lector para cualquier persona con el enlace.",
    }, origin);
  }

  const pedidos = [...new Map(pedidosDeLaHoja(csv).map((pedido) => [pedido.clave, pedido])).values()];
  const admin = createClient(supabaseUrl, serviceKey);
  const { data: actuales, error: errorLista } = await admin
    .from("compras_mantenimiento")
    .select("id, fecha, descripcion, cantidad, area, estado, situacion, observacion, necesidad, clave");
  if (errorLista) return json(200, { ok: false, error: errorLista.message }, origin);

  const porClave = new Map<string, { id: string; estado: string; situacion: string; observacion: string; necesidad: string; clave: string | null }>();
  for (const fila of actuales ?? []) {
    const fecha = String(fila.fecha ?? "").slice(0, 10);
    const clave = fila.clave || [fecha, norm(fila.descripcion ?? ""), norm(cantidadTexto(fila.cantidad ?? "")), norm(fila.area ?? "")].join("|");
    porClave.set(clave, fila);
  }

  let nuevos = 0;
  let actualizados = 0;
  const inserciones = [];
  const cambios = [];
  for (const pedido of pedidos) {
    const existe = porClave.get(pedido.clave);
    if (!existe) {
      inserciones.push({ ...pedido, origen: "compras-admin", ingresado: false });
      nuevos++;
      continue;
    }
    const cambio =
      existe.clave !== pedido.clave ||
      (existe.estado ?? "") !== pedido.estado ||
      existe.situacion !== pedido.situacion ||
      (existe.observacion ?? "") !== pedido.observacion ||
      (existe.necesidad ?? "") !== pedido.necesidad;
    if (cambio) {
      cambios.push({ id: existe.id, pedido });
      actualizados++;
    }
  }

  for (let i = 0; i < inserciones.length; i += 200) {
    const { error } = await admin.from("compras_mantenimiento").insert(inserciones.slice(i, i + 200));
    if (error) return json(200, { ok: false, error: error.message }, origin);
  }
  for (let i = 0; i < cambios.length; i += 20) {
    await Promise.all(
      cambios.slice(i, i + 20).map(({ id, pedido }) =>
        admin
          .from("compras_mantenimiento")
          .update({
            clave: pedido.clave,
            estado: pedido.estado,
            situacion: pedido.situacion,
            observacion: pedido.observacion,
            necesidad: pedido.necesidad,
          })
          .eq("id", id),
      ),
    );
  }

  return json(200, { ok: true, leidos: pedidos.length, nuevos, actualizados }, origin);
});
