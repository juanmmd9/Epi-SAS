import { createClient } from "@supabase/supabase-js";

/** Lee variables de entorno en Vite (navegador) o en scripts Node (tsx). */
function leerEnv(nombre: "VITE_SUPABASE_URL" | "VITE_SUPABASE_ANON_KEY"): string | undefined {
  const desdeVite = import.meta.env?.[nombre];
  if (typeof desdeVite === "string" && desdeVite.length > 0) return desdeVite;

  const proceso = globalThis as {
    process?: { env?: Record<string, string | undefined> };
  };
  const desdeNode = proceso.process?.env?.[nombre];
  if (typeof desdeNode === "string" && desdeNode.length > 0) return desdeNode;

  return undefined;
}

const supabaseUrlRemoto = leerEnv("VITE_SUPABASE_URL");
const supabaseAnonKey = leerEnv("VITE_SUPABASE_ANON_KEY");

if (!supabaseUrlRemoto || !supabaseAnonKey) {
  throw new Error(
    "Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el archivo .env",
  );
}

const urlRemoto: string = supabaseUrlRemoto;
const anonKey: string = supabaseAnonKey;

const enNavegadorDeDesarrollo =
  typeof window !== "undefined" && Boolean(import.meta.env?.DEV);
const supabaseUrl = enNavegadorDeDesarrollo
  ? `${window.location.origin}/sb`
  : urlRemoto;

/** Evita peticiones colgadas indefinidas cuando Auth/REST van lentos o unhealthy. */
const TIMEOUT_FETCH_MS = 15_000;
const CODIGOS_REINTENTO = new Set([502, 503, 504, 520, 521, 522, 523, 524]);

async function fetchUnaVez(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const ctrl = new AbortController();
  const externo = init?.signal;
  if (externo) {
    if (externo.aborted) ctrl.abort();
    else externo.addEventListener("abort", () => ctrl.abort(), { once: true });
  }
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_FETCH_MS);
  try {
    return await fetch(input, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Un reintento corto ante fallos de Cloudflare / origen (520, 521, 503…). */
async function fetchConTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  try {
    const res = await fetchUnaVez(input, init);
    if (!CODIGOS_REINTENTO.has(res.status)) return res;
    await new Promise((r) => setTimeout(r, 700));
    return fetchUnaVez(input, init);
  } catch (e) {
    if (init?.signal?.aborted) throw e;
    await new Promise((r) => setTimeout(r, 700));
    return fetchUnaVez(input, init);
  }
}

/** Mensaje legible cuando Cloudflare/Supabase responden 5xx o cortan la conexión. */
export function mensajeErrorSupabase(error: unknown, accion = "completar la operación"): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : String(error ?? "");
  if (/520|521|522|523|524|502|503|504|Cloudflare|upstream|Failed to fetch|AbortError|aborted/i.test(raw)) {
    return `Supabase no respondió a tiempo (${accion}). Espera unos segundos y vuelve a intentar.`;
  }
  return raw || `No se pudo ${accion}.`;
}

export const supabase = createClient(supabaseUrl, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
  global: {
    fetch: fetchConTimeout,
  },
});

/** Calienta la conexión a Auth (útil tras reinicios o redes lentas). */
export function calentarSupabase(): void {
  if (typeof window === "undefined") return;
  void fetchConTimeout(`${supabaseUrl}/auth/v1/health`, {
    headers: { apikey: anonKey },
  }).catch(() => undefined);
}