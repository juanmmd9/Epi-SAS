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

const supabaseUrl = leerEnv("VITE_SUPABASE_URL");
const supabaseAnonKey = leerEnv("VITE_SUPABASE_ANON_KEY");

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el archivo .env",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Evita que un refresh en segundo plano dispare limpiezas agresivas de UI.
    flowType: "pkce",
  },
});
