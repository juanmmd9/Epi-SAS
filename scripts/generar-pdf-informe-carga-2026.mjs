/**
 * Genera PDF del informe de carga 2026 para solicitud de personal.
 * Uso: node scripts/generar-pdf-informe-carga-2026.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const __dir = dirname(fileURLToPath(import.meta.url));
const dataPath = resolve(__dir, "informe-carga-2026-datos.json");
const outDir = resolve(__dir, "..", "presentacion");
const outPath = resolve(outDir, "informe-carga-personal-tejidos-2026.pdf");

const data = JSON.parse(readFileSync(dataPath, "utf8"));

function t(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "?");
}

const azul = rgb(0.12, 0.27, 0.55);
const gris = rgb(0.35, 0.38, 0.42);
const naranja = rgb(0.85, 0.45, 0.1);
const verde = rgb(0.12, 0.55, 0.3);
const rojo = rgb(0.75, 0.18, 0.18);
const azulClaro = rgb(0.2, 0.45, 0.75);
const grisLinea = rgb(0.82, 0.84, 0.87);

const AREAS = data.areas;
const CAT = data.categorias;
const coloresArea = {
  Tejidos: naranja,
  Confeccion: azulClaro,
  Locativos: gris,
  Administrativa: verde,
};

function drawLineChart(page, opts) {
  const { x, y, w, h, series, categories, font, title } = opts;
  page.drawText(t(title), { x, y: y + h + 14, size: 10, font, color: azul });

  page.drawRectangle({
    x,
    y,
    width: w,
    height: h,
    borderColor: grisLinea,
    borderWidth: 0.8,
    color: rgb(0.98, 0.98, 0.99),
  });

  const maxVal = Math.max(1, ...series.flatMap((s) => s.data));
  const padL = 28;
  const padB = 22;
  const padT = 10;
  const padR = 10;
  const plotW = w - padL - padR;
  const plotH = h - padB - padT;
  const n = categories.length;

  for (let i = 0; i <= 4; i++) {
    const gy = y + padB + (plotH * i) / 4;
    page.drawLine({
      start: { x: x + padL, y: gy },
      end: { x: x + w - padR, y: gy },
      thickness: 0.4,
      color: grisLinea,
    });
    const label = String(Math.round((maxVal * i) / 4));
    page.drawText(label, {
      x: x + 4,
      y: gy - 3,
      size: 7,
      font,
      color: gris,
    });
  }

  for (let i = 0; i < n; i++) {
    const cx = x + padL + (n === 1 ? plotW / 2 : (plotW * i) / (n - 1));
    page.drawText(t(categories[i]), {
      x: cx - 8,
      y: y + 6,
      size: 7,
      font,
      color: gris,
    });
  }

  for (const s of series) {
    const pts = s.data.map((v, i) => {
      const px = x + padL + (n === 1 ? plotW / 2 : (plotW * i) / (n - 1));
      const py = y + padB + (v / maxVal) * plotH;
      return { x: px, y: py };
    });
    for (let i = 1; i < pts.length; i++) {
      page.drawLine({
        start: pts[i - 1],
        end: pts[i],
        thickness: 1.6,
        color: s.color,
      });
    }
    for (const p of pts) {
      page.drawCircle({
        x: p.x,
        y: p.y,
        size: 2.2,
        color: s.color,
      });
    }
  }

  let lx = x;
  let ly = y - 12;
  for (const s of series) {
    page.drawCircle({ x: lx + 3, y: ly + 2, size: 2.5, color: s.color });
    page.drawText(t(s.name), { x: lx + 10, y: ly, size: 7, font, color: gris });
    lx += font.widthOfTextAtSize(t(s.name), 7) + 22;
    if (lx > x + w - 40) {
      lx = x;
      ly -= 11;
    }
  }
  return ly - 8;
}

function drawBarH(page, opts) {
  const { x, y, w, rows, font, title, color } = opts;
  page.drawText(t(title), { x, y: y + 8, size: 10, font, color: azul });
  let cy = y - 8;
  const max = Math.max(1, ...rows.map((r) => r.value));
  for (const r of rows) {
    page.drawText(t(r.label), { x, y: cy - 2, size: 8, font, color: gris });
    const barW = ((w - 90) * r.value) / max;
    page.drawRectangle({
      x: x + 78,
      y: cy - 3,
      width: Math.max(2, barW),
      height: 10,
      color,
    });
    page.drawText(String(r.value), {
      x: x + 78 + barW + 4,
      y: cy - 2,
      size: 8,
      font,
      color: azul,
    });
    cy -= 16;
  }
  return cy;
}

const doc = await PDFDocument.create();
const font = await doc.embedFont(StandardFonts.Helvetica);
const bold = await doc.embedFont(StandardFonts.HelveticaBold);

const page1 = doc.addPage([612, 792]);
const { width, height } = page1.getSize();
let y = height - 48;

page1.drawText(t("PORTAL MANTENIMIENTO EPI"), {
  x: 48,
  y,
  size: 9,
  font: bold,
  color: azul,
});
y -= 18;
page1.drawText(t("Informe de carga 2026 — Solicitud de personal"), {
  x: 48,
  y,
  size: 16,
  font: bold,
  color: azul,
});
y -= 14;
page1.drawText(
  t(
    `Comparativo Tejidos / Confeccion / Locativos / Administrativa  |  Corte: ${String(data.generadoEn).slice(0, 10)}  |  Meses: ${CAT.join("-")}`,
  ),
  { x: 48, y, size: 8, font, color: gris },
);
y -= 10;
page1.drawLine({
  start: { x: 48, y },
  end: { x: width - 48, y },
  thickness: 1,
  color: azul,
});
y -= 22;

page1.drawText(t("1. Resumen ejecutivo"), {
  x: 48,
  y,
  size: 12,
  font: bold,
  color: azul,
});
y -= 16;

const totales = data.totals;
const granTotal = AREAS.reduce((s, a) => s + totales.intervencionesAnio[a], 0);

const caja = [
  `Tejidos concentra ${totales.intervencionesAnio.Tejidos} intervenciones (${Math.round((totales.intervencionesAnio.Tejidos / granTotal) * 100)}% del total de las 4 areas: ${granTotal}).`,
  `Correctivos Tejidos: ${totales.correctivoAnio.Tejidos}. Tipologia MECANICA: ${data.tiposTejidos.find((x) => x.tipo === "MECANICA")?.cantidad ?? 0} (~${Math.round(((data.tiposTejidos.find((x) => x.tipo === "MECANICA")?.cantidad ?? 0) / Math.max(1, totales.correctivoAnio.Tejidos)) * 100)}%).`,
  `Abiertas al corte — Tejidos: ${totales.abiertasHoy.Tejidos} | Confeccion: ${totales.abiertasHoy.Confeccion} | Locativos: ${totales.abiertasHoy.Locativos} | Admin: ${totales.abiertasHoy.Administrativa}.`,
  "Solicitud: 1 mecanico + 1 soldador para el area de Tejidos.",
];
for (const line of caja) {
  const words = t(line).split(" ");
  let row = "";
  for (const w of words) {
    const test = row ? `${row} ${w}` : w;
    if (font.widthOfTextAtSize(test, 9) > width - 96) {
      page1.drawText(row, { x: 48, y, size: 9, font, color: rgb(0.15, 0.15, 0.15) });
      y -= 12;
      row = w;
    } else row = test;
  }
  if (row) {
    page1.drawText(row, { x: 48, y, size: 9, font, color: rgb(0.15, 0.15, 0.15) });
    y -= 14;
  }
}

y -= 6;
page1.drawText(t("2. Tabla comparativa YTD 2026"), {
  x: 48,
  y,
  size: 12,
  font: bold,
  color: azul,
});
y -= 18;

const headers = ["Area", "Correctivos", "Preventivos", "Total", "Abiertas", "% total"];
const colX = [48, 140, 230, 320, 390, 470];
for (let i = 0; i < headers.length; i++) {
  page1.drawText(t(headers[i]), { x: colX[i], y, size: 8, font: bold, color: gris });
}
y -= 4;
page1.drawLine({
  start: { x: 48, y },
  end: { x: width - 48, y },
  thickness: 0.6,
  color: grisLinea,
});
y -= 14;

for (const area of AREAS) {
  const tot = totales.intervencionesAnio[area];
  const pct = `${Math.round((tot / granTotal) * 100)}%`;
  const vals = [
    area,
    String(totales.correctivoAnio[area]),
    String(totales.preventivoAnio[area]),
    String(tot),
    String(totales.abiertasHoy[area]),
    pct,
  ];
  const f = area === "Tejidos" ? bold : font;
  const c = area === "Tejidos" ? naranja : rgb(0.15, 0.15, 0.15);
  for (let i = 0; i < vals.length; i++) {
    page1.drawText(t(vals[i]), { x: colX[i], y, size: 9, font: f, color: c });
  }
  y -= 14;
}

y -= 10;
page1.drawText(t("3. Curvas de carga"), {
  x: 48,
  y,
  size: 12,
  font: bold,
  color: azul,
});
y -= 28;

const seriesInterv = AREAS.map((a) => ({
  name: a,
  data: data.series.intervencionesPorMes[a],
  color: coloresArea[a],
}));
y = drawLineChart(page1, {
  x: 48,
  y: y - 150,
  w: 516,
  h: 150,
  series: seriesInterv,
  categories: CAT,
  font,
  title: "Intervenciones totales por mes (correctivo + preventivo)",
});

y -= 18;
const seriesCorr = AREAS.map((a) => ({
  name: a,
  data: data.series.correctivosPorMes[a],
  color: coloresArea[a],
}));
y = drawLineChart(page1, {
  x: 48,
  y: y - 140,
  w: 516,
  h: 140,
  series: seriesCorr,
  categories: CAT,
  font,
  title: "Correctivos solicitados por mes",
});

page1.drawText(t("Fuente: portal EPI (Supabase) · Agosto parcial al corte."), {
  x: 48,
  y: 28,
  size: 7,
  font,
  color: gris,
});
page1.drawText(t("Pagina 1 / 2"), {
  x: width - 90,
  y: 28,
  size: 7,
  font,
  color: gris,
});

// Página 2
const page2 = doc.addPage([612, 792]);
y = height - 48;
page2.drawText(t("Informe de carga 2026 — Continuacion"), {
  x: 48,
  y,
  size: 12,
  font: bold,
  color: azul,
});
y -= 28;

const seriesPm = ["Tejidos", "Confeccion", "Locativos"].map((a) => ({
  name: a,
  data: data.series.pmPorMes[a],
  color: coloresArea[a],
}));
y = drawLineChart(page2, {
  x: 48,
  y: y - 130,
  w: 250,
  h: 130,
  series: seriesPm,
  categories: CAT,
  font,
  title: "Preventivos ejecutados por mes",
});

const yRightStart = height - 76;
drawLineChart(page2, {
  x: 314,
  y: yRightStart - 130,
  w: 250,
  h: 130,
  series: AREAS.map((a) => ({
    name: a,
    data: data.series.abiertosPorMes[a],
    color: coloresArea[a],
  })),
  categories: CAT,
  font,
  title: "Correctivos abiertos (mes solicitud)",
});

y = Math.min(y, yRightStart - 130) - 40;

y = drawLineChart(page2, {
  x: 48,
  y: y - 130,
  w: 516,
  h: 130,
  series: [
    {
      name: "MECANICA Tejidos",
      data: data.series.mecanicaTejidos,
      color: rojo,
    },
    {
      name: "Correctivos Tejidos",
      data: data.series.correctivosPorMes.Tejidos,
      color: naranja,
    },
  ],
  categories: CAT,
  font,
  title: "Tejidos — tipología MECANICA vs correctivos totales",
});

y -= 20;
y = drawBarH(page2, {
  x: 48,
  y,
  w: 516,
  font,
  color: naranja,
  title: "Tipologias en Tejidos (YTD) — una solicitud puede tener varias",
  rows: data.tiposTejidos.slice(0, 6).map((r) => ({ label: r.tipo, value: r.cantidad })),
});

y -= 24;
page2.drawText(t("4. Conclusion y solicitud"), {
  x: 48,
  y,
  size: 12,
  font: bold,
  color: azul,
});
y -= 16;

const conclusiones = [
  `1) Tejidos es el area con mayor carga YTD (${totales.intervencionesAnio.Tejidos} intervenciones), por encima de Confeccion (${totales.intervencionesAnio.Confeccion}), Locativos (${totales.intervencionesAnio.Locativos}) y Administrativa (${totales.intervencionesAnio.Administrativa}).`,
  "2) El correctivo de Tejidos crece desde abril y se mantiene alto en mayo-julio (22, 26, 25), indicando presion continua, no un pico aislado.",
  `3) La tipología MECANICA domina Tejidos (${data.tiposTejidos.find((x) => x.tipo === "MECANICA")?.cantidad ?? 0} registros). Justifica contratar un mecanico dedicado a esa planta.`,
  `4) Persisten correctivos abiertos (${totales.abiertasHoy.Tejidos} en Tejidos al corte): el cierre no alcanza el ritmo de entrada.`,
  "5) En el maestro de personal del portal no hay personas activas con area/cargo de soldador o mecanico asignados a Tejidos, lo que refuerza la brecha de capacidad registrada.",
  "SOLICITUD: Autorizar para el area de Tejidos la vinculacion de 1 (un) mecanico y 1 (un) soldador, a fin de absorber la carga correctiva mecanica y reforzar especialidades de fabricacion/reparacion estructural asociadas a la planta.",
];

for (const line of conclusiones) {
  const words = t(line).split(" ");
  let row = "";
  const size = line.startsWith("SOLICITUD") ? 9 : 9;
  const f = line.startsWith("SOLICITUD") ? bold : font;
  const c = line.startsWith("SOLICITUD") ? azul : rgb(0.15, 0.15, 0.15);
  for (const w of words) {
    const test = row ? `${row} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) > width - 96) {
      page2.drawText(row, { x: 48, y, size, font: f, color: c });
      y -= 12;
      row = w;
    } else row = test;
  }
  if (row) {
    page2.drawText(row, { x: 48, y, size, font: f, color: c });
    y -= 14;
  }
  if (line.startsWith("SOLICITUD")) y -= 4;
}

y -= 20;
page2.drawText(t("______________________________"), { x: 48, y, size: 9, font, color: gris });
y -= 12;
page2.drawText(t("Firma / Vo.Bo. Mantenimiento"), { x: 48, y, size: 8, font, color: gris });
page2.drawText(t("______________________________"), { x: 320, y: y + 12, size: 9, font, color: gris });
page2.drawText(t("Firma / Vo.Bo. Direccion"), { x: 320, y, size: 8, font, color: gris });

page2.drawText(t("Fuente: portal EPI (Supabase) · Generado automaticamente."), {
  x: 48,
  y: 28,
  size: 7,
  font,
  color: gris,
});
page2.drawText(t("Pagina 2 / 2"), {
  x: width - 90,
  y: 28,
  size: 7,
  font,
  color: gris,
});

mkdirSync(outDir, { recursive: true });
const bytes = await doc.save();
writeFileSync(outPath, bytes);
console.log(JSON.stringify({ ok: true, outPath, bytes: bytes.length }, null, 2));
