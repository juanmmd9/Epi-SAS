/**
 * Genera íconos de launcher Android desde public/Image/EPI-Logo.png
 */
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const logoPath = join(root, "public", "Image", "EPI-Logo.png");
const androidRes = join(root, "android", "app", "src", "main", "res");
const assetsDir = join(root, "resources");

const densidades = {
  "mipmap-mdpi": { launcher: 48, foreground: 108 },
  "mipmap-hdpi": { launcher: 72, foreground: 162 },
  "mipmap-xhdpi": { launcher: 96, foreground: 216 },
  "mipmap-xxhdpi": { launcher: 144, foreground: 324 },
  "mipmap-xxxhdpi": { launcher: 192, foreground: 432 },
};

async function iconoCuadrado(size, { padRatio = 0.18 } = {}) {
  const pad = Math.round(size * padRatio);
  const inner = size - pad * 2;
  const logo = await sharp(logoPath)
    .resize({
      width: inner,
      height: inner,
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png()
    .toBuffer();
}

mkdirSync(assetsDir, { recursive: true });

const master = await iconoCuadrado(1024, { padRatio: 0.14 });
writeFileSync(join(assetsDir, "icon.png"), master);
writeFileSync(join(assetsDir, "icon-foreground.png"), await iconoCuadrado(1024, { padRatio: 0.22 }));

for (const [carpeta, sizes] of Object.entries(densidades)) {
  const dir = join(androidRes, carpeta);
  mkdirSync(dir, { recursive: true });

  const launcher = await iconoCuadrado(sizes.launcher, { padRatio: 0.14 });
  const foreground = await iconoCuadrado(sizes.foreground, { padRatio: 0.22 });

  writeFileSync(join(dir, "ic_launcher.png"), launcher);
  writeFileSync(join(dir, "ic_launcher_round.png"), launcher);
  writeFileSync(join(dir, "ic_launcher_foreground.png"), foreground);
  console.log("OK", carpeta);
}

writeFileSync(
  join(androidRes, "values", "ic_launcher_background.xml"),
  `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#000000</color>
</resources>
`,
);

// Fondo drawable también negro (por si se usa)
writeFileSync(
  join(androidRes, "drawable", "ic_launcher_background.xml"),
  `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#000000" />
</shape>
`,
);

console.log("Íconos EPI aplicados en android/app/src/main/res/mipmap-*");
console.log("Master: resources/icon.png");
