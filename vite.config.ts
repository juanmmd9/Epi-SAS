import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import https from "node:https";

const agenteHttp1 = new https.Agent({
  keepAlive: true,
  ALPNProtocols: ["http/1.1"],
});

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const supabaseUrl = env.VITE_SUPABASE_URL;

  return {
    // Capacitor (APK) necesita rutas relativas; en GitHub Pages la app vive en /Epi-SAS/; local/Vercel usan /.
    base:
      process.env.CAPACITOR === "true"
        ? "./"
        : process.env.GITHUB_PAGES === "true"
          ? "/Epi-SAS/"
          : "/",
    plugins: [react()],
    server: {
      host: true,
      port: 5500,
      allowedHosts: true,
      // En esta red HTTP/2 hacia Supabase no contesta. El navegador habla con
      // el host local y aquí se reenvía por HTTP/1.1.
      proxy: supabaseUrl
        ? {
            "/sb": {
              target: supabaseUrl,
              changeOrigin: true,
              secure: true,
              ws: true,
              agent: agenteHttp1,
              rewrite: (path) => path.replace(/^\/sb/, ""),
            },
          }
        : undefined,
    },
  };
});
