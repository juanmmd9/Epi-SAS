/**
 * Edge Function: crea usuario en Auth + fila en usuarios_portal.
 *
 * Body JSON:
 *   { usuario, password, nombre, rol, personal_id?, area? }
 *
 * Requiere JWT de un admin activo del portal.
 *
 * Despliegue:
 *   supabase functions deploy crear-usuario-portal
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const DOMINIO = "epi.local";
const RE_USUARIO = /^[a-z0-9][a-z0-9._-]{1,62}$/;
const ROLES = new Set(["admin", "operador", "consulta", "solicitante"]);

type Body = {
  usuario?: string;
  password?: string;
  nombre?: string;
  rol?: string;
  personal_id?: string | null;
  area?: string | null;
};

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

function normalizarUsuario(valor: string): string {
  return valor.trim().toLowerCase();
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) });
  }

  if (req.method !== "POST") {
    return json(405, { error: "Método no permitido" }, origin);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json(500, { error: "Faltan variables de entorno de Supabase" }, origin);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json(401, { error: "No autenticado" }, origin);
  }

  const supabaseUser = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await supabaseUser.auth.getUser();
  if (userError || !user) {
    return json(401, { error: "Sesión inválida" }, origin);
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: perfilAdmin, error: perfilError } = await admin
    .from("usuarios_portal")
    .select("rol, activo")
    .eq("id", user.id)
    .maybeSingle();

  if (perfilError) {
    return json(500, { error: perfilError.message }, origin);
  }
  if (!perfilAdmin?.activo || perfilAdmin.rol !== "admin") {
    return json(403, { error: "Solo un administrador puede crear usuarios" }, origin);
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return json(400, { error: "JSON inválido" }, origin);
  }

  const usuario = normalizarUsuario(body.usuario ?? "");
  const password = body.password ?? "";
  const nombre = (body.nombre ?? "").trim();
  const rol = (body.rol ?? "").trim();
  const personalId = body.personal_id?.trim() || null;
  const area = body.area?.trim() || null;

  if (!RE_USUARIO.test(usuario)) {
    return json(
      400,
      {
        error:
          "Usuario inválido. Usa 2–63 caracteres: letras minúsculas, números, punto, guion o guion bajo; debe empezar con letra o número.",
      },
      origin,
    );
  }
  if (password.length < 6) {
    return json(400, { error: "La contraseña debe tener al menos 6 caracteres" }, origin);
  }
  if (!nombre) {
    return json(400, { error: "El nombre es obligatorio" }, origin);
  }
  if (!ROLES.has(rol)) {
    return json(400, { error: "Rol no válido" }, origin);
  }

  const email = `${usuario}@${DOMINIO}`;

  const { data: existente } = await admin
    .from("usuarios_portal")
    .select("id")
    .eq("usuario", usuario)
    .maybeSingle();
  if (existente) {
    return json(409, { error: `Ya existe el usuario "${usuario}"` }, origin);
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { usuario, nombre },
  });

  if (createError || !created.user) {
    return json(400, { error: createError?.message ?? "No se pudo crear en Auth" }, origin);
  }

  const { error: insertError } = await admin.from("usuarios_portal").insert({
    id: created.user.id,
    usuario,
    email,
    nombre,
    rol,
    personal_id: personalId,
    area,
    activo: true,
  });

  if (insertError) {
    await admin.auth.admin.deleteUser(created.user.id).catch(() => undefined);
    return json(400, { error: insertError.message }, origin);
  }

  return json(
    200,
    {
      ok: true,
      id: created.user.id,
      usuario,
      email,
      nombre,
      rol,
    },
    origin,
  );
});
