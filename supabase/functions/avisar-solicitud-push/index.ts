/**
 * Edge Function: avisa por FCM cuando se crea una solicitud correctiva.
 *
 * Secretos (Supabase → Edge Functions → Secrets):
 *   FIREBASE_SERVICE_ACCOUNT_JSON  = JSON completo de la cuenta de servicio Firebase
 *
 * Despliegue:
 *   supabase functions deploy avisar-solicitud-push --no-verify-jwt
 *
 * Webhook (Dashboard → Database → Webhooks):
 *   Table: correctivo  Event: INSERT
 *   URL: https://<PROJECT>.supabase.co/functions/v1/avisar-solicitud-push
 *   Headers: Authorization: Bearer <SERVICE_ROLE_KEY>
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

type ServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

type CorrectivoPayload = {
  type?: string;
  table?: string;
  record?: {
    id?: string;
    area?: string;
    datos?: {
      numeroSolicitud?: number;
      maquinaEquipoLocacion?: string;
      nombreSolicitante?: string;
      fechaCierre?: string;
    };
  };
  // Llamada directa de prueba
  area?: string;
  numero?: number;
  maquina?: string;
  solicitante?: string;
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
): Promise<{ ok: boolean; stale?: boolean; detail?: string }> {
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
            channelId: "solicitudes",
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
  return { ok: false, stale, detail };
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
      return new Response(
        JSON.stringify({
          error: "Faltan secretos FIREBASE_SERVICE_ACCOUNT_JSON / SUPABASE_*",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const sa = JSON.parse(saRaw) as ServiceAccount;
    const body = (await req.json()) as CorrectivoPayload;
    const record = body.record;

    if (record?.datos?.fechaCierre) {
      return new Response(JSON.stringify({ skipped: "cerrada" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const area = record?.area || body.area || "Área";
    const numero = record?.datos?.numeroSolicitud ?? body.numero ?? 0;
    const maquina =
      record?.datos?.maquinaEquipoLocacion || body.maquina || "Sin máquina";
    const solicitante =
      record?.datos?.nombreSolicitante || body.solicitante || "Solicitante";

    const titulo = `Nueva en bandeja #${numero || "—"}`;
    const cuerpo = `${area} · ${maquina} — ${solicitante}`;

    const supabase = createClient(supabaseUrl, serviceKey);
    const registroId = record?.id || "";

    // Admins + operarios del área (modelo bandeja).
    const { data: admins, error: errAdmins } = await supabase
      .from("usuarios_portal")
      .select("id")
      .eq("activo", true)
      .eq("rol", "admin");
    if (errAdmins) throw new Error(errAdmins.message);

    const userIds = new Set<string>((admins ?? []).map((u) => u.id as string));

    const { data: personalArea, error: errArea } = await supabase.rpc(
      "operarios_por_area",
      { p_area: area },
    );
    if (errArea && !/does not exist|function/i.test(errArea.message)) {
      throw new Error(errArea.message);
    }
    const personalIds = ((personalArea ?? []) as { personal_id: string }[]).map(
      (row) => row.personal_id,
    );
    if (personalIds.length) {
      const { data: ops, error: errOps } = await supabase
        .from("usuarios_portal")
        .select("id")
        .eq("activo", true)
        .eq("rol", "operador")
        .in("personal_id", personalIds);
      if (errOps) throw new Error(errOps.message);
      for (const u of ops ?? []) userIds.add(u.id as string);
    }

    if (userIds.size === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: "sin usuarios" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: tokens, error: errTokens } = await supabase
      .from("push_tokens")
      .select("id, token")
      .eq("activo", true)
      .in("user_id", [...userIds]);

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
        registroId,
        tipo: "nueva_solicitud",
      });
      if (result.ok) sent += 1;
      else if (result.stale) staleIds.push(row.id);
    }

    if (staleIds.length) {
      await supabase.from("push_tokens").update({ activo: false }).in("id", staleIds);
    }

    return new Response(
      JSON.stringify({ sent, tokens: lista.length, destinatarios: userIds.size }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
