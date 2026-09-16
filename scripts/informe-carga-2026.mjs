/**
 * One-shot: extrae correctivo/preventivo/personal 2026 y escribe JSON de series.
 * Uso: node --env-file=.env scripts/informe-carga-2026.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ANIO = 2026;
const AREAS = ["Tejidos", "Confeccion", "Locativos", "Administrativa"];
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const AREAS_PM = new Set(["Tejidos", "Confeccion", "Locativos"]);

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);
const __dir = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(__dir, "informe-carga-2026-datos.json");

const hoy = new Date();
const mesMax =
  hoy.getFullYear() > ANIO ? 12 : hoy.getFullYear() < ANIO ? 0 : hoy.getMonth() + 1;

function mesDe(fecha) {
  if (!fecha || fecha.slice(0, 4) !== String(ANIO)) return null;
  const m = Number.parseInt(fecha.slice(5, 7), 10);
  return m >= 1 && m <= 12 ? m : null;
}

function zeros() {
  return Array.from({ length: 12 }, () => 0);
}

function serieArea() {
  const o = {};
  for (const a of AREAS) o[a] = zeros();
  return o;
}

async function fetchAll(tabla) {
  const page = 1000;
  let from = 0;
  const all = [];
  for (;;) {
    const { data, error } = await supabase
      .from(tabla)
      .select("*")
      .range(from, from + page - 1);
    if (error) throw new Error(`${tabla}: ${error.message}`);
    const batch = data ?? [];
    all.push(...batch);
    if (batch.length < page) break;
    from += page;
  }
  return all;
}

const [correctivo, preventivo, personal] = await Promise.all([
  fetchAll("correctivo"),
  fetchAll("preventivo"),
  fetchAll("personal"),
]);

const corrAnio = correctivo.filter((r) => mesDe(r.fecha) !== null);
const prevAnio = preventivo.filter((r) => mesDe(r.fecha) !== null);

const correctivosPorMes = serieArea();
const cerradosPorMes = serieArea();
const abiertosPorMes = serieArea();
const intervencionesPorMes = serieArea();
const pmPorMes = serieArea();
const mecanicaTejidos = zeros();
const tiposTejidos = {};

const abiertasHoy = Object.fromEntries(AREAS.map((a) => [a, 0]));
const totalCorrArea = Object.fromEntries(AREAS.map((a) => [a, 0]));
const totalPrevArea = Object.fromEntries(AREAS.map((a) => [a, 0]));

for (const r of corrAnio) {
  const area = AREAS.includes(r.area) ? r.area : null;
  if (!area) continue;
  const mes = mesDe(r.fecha);
  if (!mes) continue;
  correctivosPorMes[area][mes - 1] += 1;
  intervencionesPorMes[area][mes - 1] += 1;
  totalCorrArea[area] += 1;
  const cerrada = Boolean((r.datos?.fechaCierre || "").trim());
  if (cerrada) cerradosPorMes[area][mes - 1] += 1;
  else {
    abiertosPorMes[area][mes - 1] += 1;
    abiertasHoy[area] += 1;
  }
  if (area === "Tejidos") {
    for (const tipo of r.datos?.tiposSolicitud ?? []) {
      const t = String(tipo).toUpperCase();
      tiposTejidos[t] = (tiposTejidos[t] ?? 0) + 1;
      if (t.includes("MECANIC")) mecanicaTejidos[mes - 1] += 1;
    }
  }
}

for (const r of prevAnio) {
  const area = AREAS.includes(r.area) ? r.area : null;
  if (!area) continue;
  const mes = mesDe(r.fecha);
  if (!mes) continue;
  pmPorMes[area][mes - 1] += 1;
  intervencionesPorMes[area][mes - 1] += 1;
  totalPrevArea[area] += 1;
}

const personalActivo = (personal ?? []).filter((p) => p.activo !== false);
const personalPorArea = Object.fromEntries(AREAS.map((a) => [a, []]));
const cargosTejidos = [];

for (const p of personalActivo) {
  const area = AREAS.includes(p.area) ? p.area : null;
  if (area) personalPorArea[area].push({ nombre: p.nombre, cargo: p.cargo });
  const cargo = (p.cargo || "").toLowerCase();
  if (
    area === "Tejidos" ||
    cargo.includes("soldador") ||
    cargo.includes("mecanic") ||
    cargo.includes("técnico") ||
    cargo.includes("tecnico")
  ) {
    if (area === "Tejidos" || cargo.includes("soldador") || cargo.includes("mecanic")) {
      cargosTejidos.push({
        nombre: p.nombre,
        cargo: p.cargo,
        area: p.area,
      });
    }
  }
}

// Carga vinculada: contar ids personal en datos
function idsDe(registro) {
  const d = registro.datos || {};
  if (Array.isArray(d.personalIds) && d.personalIds.length) return d.personalIds;
  if (registro.personal_id) return [registro.personal_id];
  return [];
}

const cargaPorPersona = new Map();
for (const r of [...corrAnio, ...prevAnio]) {
  for (const id of idsDe(r)) {
    cargaPorPersona.set(id, (cargaPorPersona.get(id) ?? 0) + 1);
  }
}

const topCarga = personalActivo
  .map((p) => ({
    nombre: p.nombre,
    cargo: p.cargo,
    area: p.area,
    intervenciones: cargaPorPersona.get(p.id) ?? 0,
  }))
  .filter((p) => p.intervenciones > 0)
  .sort((a, b) => b.intervenciones - a.intervenciones)
  .slice(0, 15);

const categorias = MESES.slice(0, Math.max(mesMax, 1));

function recortar(serieObj) {
  const out = {};
  for (const a of AREAS) {
    out[a] = serieObj[a].slice(0, categorias.length);
  }
  return out;
}

const resumen = {
  generadoEn: hoy.toISOString(),
  anio: ANIO,
  mesHasta: mesMax,
  categorias,
  areas: AREAS,
  totals: {
    correctivoAnio: Object.fromEntries(AREAS.map((a) => [a, totalCorrArea[a]])),
    preventivoAnio: Object.fromEntries(AREAS.map((a) => [a, totalPrevArea[a]])),
    intervencionesAnio: Object.fromEntries(
      AREAS.map((a) => [a, totalCorrArea[a] + totalPrevArea[a]]),
    ),
    abiertasHoy,
    personalActivoPorArea: Object.fromEntries(
      AREAS.map((a) => [a, personalPorArea[a].length]),
    ),
  },
  series: {
    correctivosPorMes: recortar(correctivosPorMes),
    cerradosPorMes: recortar(cerradosPorMes),
    abiertosPorMes: recortar(abiertosPorMes),
    intervencionesPorMes: recortar(intervencionesPorMes),
    pmPorMes: recortar(pmPorMes),
    mecanicaTejidos: mecanicaTejidos.slice(0, categorias.length),
  },
  tiposTejidos: Object.entries(tiposTejidos)
    .map(([tipo, cantidad]) => ({ tipo, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad),
  personalPorArea,
  cargosRelevantes: cargosTejidos,
  topCarga,
  meta: {
    correctivoTotalRaw: correctivo.length,
    preventivoTotalRaw: preventivo.length,
    personalTotal: personal.length,
    corr2026: corrAnio.length,
    prev2026: prevAnio.length,
    areasPm: [...AREAS_PM],
  },
};

writeFileSync(outPath, JSON.stringify(resumen, null, 2), "utf8");
console.log(JSON.stringify({ ok: true, outPath, mesHasta: mesMax, totals: resumen.totals }, null, 2));
