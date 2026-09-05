import QRCode from "qrcode";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SALIDA = "presentacion/qr-acceso";
const LOGIN_BASE = "https://juanmmd9.github.io/Epi-SAS/login";

const PERFILES = [
  {
    id: "administrador",
    titulo: "Administrador",
    subtitulo: "Acceso completo al portal",
    email: "admin.mantenimiento@epi.com",
    clave: "EpiAdmin2026",
    color: "#1e40af",
    fondo: "#eff6ff",
  },
  {
    id: "usuario-area",
    titulo: "Usuario de área",
    subtitulo: "Reporta fallas y solicitudes",
    email: "solicitante.area@epi.com",
    clave: "EpiArea2026",
    color: "#166534",
    fondo: "#ecfdf5",
  },
];

function urlLogin(email, clave) {
  const url = new URL(LOGIN_BASE);
  url.searchParams.set("e", email);
  url.searchParams.set("p", clave);
  url.searchParams.set("auto", "1");
  return url.toString();
}

function tarjetaSvg(perfil, qrDataUrl, x, y, ancho) {
  const qr = 220;
  const pad = 28;
  const alto = 420;
  return `
  <g transform="translate(${x}, ${y})">
    <rect width="${ancho}" height="${alto}" rx="18" fill="${perfil.fondo}" stroke="${perfil.color}" stroke-width="2"/>
    <text x="${ancho / 2}" y="42" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="700" fill="${perfil.color}">${perfil.titulo}</text>
    <text x="${ancho / 2}" y="68" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="14" fill="#475569">${perfil.subtitulo}</text>
    <image href="${qrDataUrl}" x="${(ancho - qr) / 2}" y="88" width="${qr}" height="${qr}"/>
    <text x="${ancho / 2}" y="338" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="13" font-weight="600" fill="#0f172a">Correo</text>
    <text x="${ancho / 2}" y="358" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="12" fill="#334155">${perfil.email}</text>
    <text x="${ancho / 2}" y="382" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="13" font-weight="600" fill="#0f172a">Clave</text>
    <text x="${ancho / 2}" y="402" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="12" fill="#334155">${perfil.clave}</text>
  </g>`;
}

async function main() {
  mkdirSync(SALIDA, { recursive: true });

  const tarjetas = [];
  for (const perfil of PERFILES) {
    const enlace = urlLogin(perfil.email, perfil.clave);
    const qrDataUrl = await QRCode.toDataURL(enlace, {
      width: 440,
      margin: 1,
      errorCorrectionLevel: "M",
    });

    await QRCode.toFile(join(SALIDA, `qr-${perfil.id}.png`), enlace, {
      width: 512,
      margin: 2,
    });

    tarjetas.push({ perfil, qrDataUrl, enlace });
    writeFileSync(
      join(SALIDA, `${perfil.id}-info.txt`),
      `${perfil.titulo}\nCorreo: ${perfil.email}\nClave: ${perfil.clave}\nEnlace: ${enlace}\n`,
      "utf8",
    );
  }

  const anchoTarjeta = 300;
  const gap = 40;
  const anchoTotal = anchoTarjeta * 2 + gap + 80;
  const altoTotal = 520;

  const lamina = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${anchoTotal}" height="${altoTotal}" viewBox="0 0 ${anchoTotal} ${altoTotal}">
  <rect width="100%" height="100%" fill="#f8fafc"/>
  <text x="${anchoTotal / 2}" y="48" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="700" fill="#0f172a">Portal de Mantenimiento EPI</text>
  <text x="${anchoTotal / 2}" y="78" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="15" fill="#64748b">Escanea el QR — correo y clave se completan solos</text>
  ${tarjetaSvg(tarjetas[0].perfil, tarjetas[0].qrDataUrl, 40, 100, anchoTarjeta)}
  ${tarjetaSvg(tarjetas[1].perfil, tarjetas[1].qrDataUrl, 40 + anchoTarjeta + gap, 100, anchoTarjeta)}
  <text x="${anchoTotal / 2}" y="${altoTotal - 24}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="11" fill="#94a3b8">Demostración — reemplazar correos y claves por cuentas reales de Supabase Auth</text>
</svg>`;

  writeFileSync(join(SALIDA, "qr-presentacion-completa.svg"), lamina, "utf8");

  for (const { perfil, qrDataUrl } of tarjetas) {
    const solo = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="360" height="480" viewBox="0 0 360 480">
  <rect width="100%" height="100%" fill="#f8fafc"/>
  ${tarjetaSvg(perfil, qrDataUrl, 30, 30, 300)}
</svg>`;
    writeFileSync(join(SALIDA, `tarjeta-${perfil.id}.svg`), solo, "utf8");
  }

  console.log("Generado en:", SALIDA);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
