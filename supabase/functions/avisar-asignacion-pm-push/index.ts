/**
 * Edge Function: avisa por FCM al operario cuando le asignan un PM.
 *
 * Despliegue:
 *   supabase functions deploy avisar-asignacion-pm-push --no-verify-jwt
 *
 * Webhook: supabase/migrations/webhook_avisar_asignacion_pm_push.sql
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

type ServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

type AsignacionPayload = {
  type?: string;
  table?: string;
  record?: {
    id?: string;
    hoja_id?: string;
    area?: string;
    fecha_programada?: string;
    personal_id?: string;
  };
  old_record?: {
    personal_id?: string;
  };
};

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const raw = atob(b64);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
  return buf.buffer;
}

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const enc = new TextEncoder();
  const b64json = (obj: unknown) => bytesToBase64Url(enc.encode(JSON.stringify(obj)));

  const unsigned = `${b64json(header)}.${b64json(claim)}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    enc.encode(unsigned),
  );
  const jwt = `${unsigned}.${bytesToBase64Url(new Uint8Array(sig))}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!tokenRes.ok) {
    throw new Error(`OAuth FCM: ${await tokenRes.text()}`);
  }
  const json = (await tokenRes.json()) as { access_token: string };
  return json.access_token;
}

async function enviarFcm(
  accessToken: string,
  projectId: string,
  deviceToken: string,
  titulo: string,
  cuerpo: string,
  data: Record<string, string>,
): Promise<{ ok: boolean; stale?: boolean }> {
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        token: deviceToken,
        notification: { title: titulo, body: cuerpo },
        data,
        android: {
          priority: "HIGH",
          notification: {
            channelId: "preventivo",
            sound: "default",
            icon: "ic_notification",
            color: "#0B3D5C",
          },
        },
      },
    }),
  });
  if (res.ok) return { ok: true };
  const detail = await res.text();
  const stale = /UNREGISTERED|NOT_FOUND|INVALID_ARGUMENT/i.test(detail);
  return { ok: false, stale };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  try {
    const saRaw = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!saRaw || !supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: "Faltan secretos" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const sa = JSON.parse(saRaw) as ServiceAccount;
    const body = (await req.json()) as AsignacionPayload;
    const record = body.record;
    const personalId = record?.personal_id;
    if (!personalId) {
      return new Response(JSON.stringify({ skipped: "sin personal_id" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (
      body.type === "UPDATE" &&
      body.old_record?.personal_id === personalId
    ) {
      return new Response(JSON.stringify({ skipped: "mismo operario" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const area = record?.area || "Área";
    const fecha = record?.fecha_programada || "";

    let maquina = "Equipo";
    let codigo = "";
    if (record?.hoja_id) {
      const { data: hoja } = await supabase
        .from("hojas_vida")
        .select("nombre, codigo")
        .eq("id", record.hoja_id)
        .maybeSingle();
      maquina = hoja?.nombre || maquina;
      codigo = hoja?.codigo || "";
    }

    const titulo = "PM asignado";
    const cuerpo = `${area} · ${maquina}${codigo ? ` (${codigo})` : ""} — ${fecha}`;

    const { data: usuarios, error: errUsers } = await supabase
      .from("usuarios_portal")
      .select("id")
      .eq("activo", true)
      .eq("personal_id", personalId)
      .in("rol", ["admin", "operador"]);

    if (errUsers) throw new Error(errUsers.message);
    const userIds = (usuarios ?? []).map((u) => u.id);
    if (userIds.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: "sin usuario portal" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: tokens, error: errTokens } = await supabase
      .from("push_tokens")
      .select("id, token")
      .eq("activo", true)
      .in("user_id", userIds);

    if (errTokens) throw new Error(errTokens.message);
    const lista = tokens ?? [];
    if (lista.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: "sin tokens" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const accessToken = await getAccessToken(sa);
    let sent = 0;
    const staleIds: string[] = [];

    for (const row of lista) {
      const result = await enviarFcm(accessToken, sa.project_id, row.token, titulo, cuerpo, {
        area,
        hojaId: record?.hoja_id || "",
        fechaProgramada: fecha,
        tipo: "pm_asignado",
      });
      if (result.ok) sent += 1;
      else if (result.stale) staleIds.push(row.id);
    }

    if (staleIds.length) {
      await supabase.from("push_tokens").update({ activo: false }).in("id", staleIds);
    }

    return new Response(JSON.stringify({ sent, tokens: lista.length }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
