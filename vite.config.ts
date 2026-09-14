import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Capacitor: rutas relativas. Dominio custom (mantenimiento.episafety.com) y local: /.
  base: process.env.CAPACITOR === "true" ? "./" : "/",
  plugins: [react()],
  server: {
    host: true,
    port: 5500,
    allowedHosts: true,
  },
})
