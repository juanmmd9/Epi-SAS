import QRCode from "qrcode";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const URL_PORTAL = "https://juanmmd9.github.io/Epi-SAS/login";
const SALIDA = "presentacion/qr-acceso";

async function main() {
  mkdirSync(SALIDA, { recursive: true });

  const qrPng = join(SALIDA, "qr-url-portal.png");
  await QRCode.toFile(qrPng, URL_PORTAL, {
    width: 640,
    margin: 2,
    errorCorrectionLevel: "M",
  });

  const qrDataUrl = await QRCode.toDataURL(URL_PORTAL, {
    width: 520,
    margin: 1,
    errorCorrectionLevel: "M",
  });

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="520" viewBox="0 0 420 520">
  <rect width="100%" height="100%" fill="#f8fafc"/>
  <text x="210" y="44" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="700" fill="#0f172a">Portal Mantenimiento EPI</text>
  <text x="210" y="72" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="13" fill="#64748b">Escanea para abrir el login</text>
  <image href="${qrDataUrl}" x="50" y="90" width="320" height="320"/>
  <text x="210" y="440" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="11" fill="#334155">${URL_PORTAL}</text>
</svg>`;

  writeFileSync(join(SALIDA, "qr-url-portal.svg"), svg, "utf8");
  writeFileSync(
    join(SALIDA, "url-portal.txt"),
    `URL del portal:\n${URL_PORTAL}\n`,
    "utf8",
  );

  console.log("QR generado:", qrPng);
  console.log("URL:", URL_PORTAL);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
