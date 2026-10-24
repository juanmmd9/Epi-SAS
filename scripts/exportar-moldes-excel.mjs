/**
 * Exporta hojas de vida del área Moldes a Excel (peso y medidas para completar).
 * Uso: node --env-file=.env scripts/exportar-moldes-excel.mjs
 */
import { createClient } from "@supabase/supabase-js";
import ExcelJS from "exceljs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);
const __dir = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(__dir, "..", "listado-moldes.xlsx");

function claveArea(area) {
  return String(area ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function parseDatos(datos) {
  if (!datos) return {};
  if (typeof datos === "string") {
    try {
      return JSON.parse(datos) ?? {};
    } catch {
      return {};
    }
  }
  return datos;
}

async function fetchHojas() {
  const page = 1000;
  let from = 0;
  const all = [];
  for (;;) {
    const { data, error } = await supabase
      .from("hojas_vida")
      .select("id, codigo, nombre, area, activa, foto_url, datos, creado_en")
      .range(from, from + page - 1);
    if (error) throw new Error(error.message);
    const batch = data ?? [];
    all.push(...batch);
    if (batch.length < page) break;
    from += page;
  }
  return all;
}

const hojas = await fetchHojas();
const moldes = hojas
  .filter((h) => claveArea(h.area) === "moldes")
  .map((h) => {
    const datos = parseDatos(h.datos);
    return {
      id: h.id,
      codigo: h.codigo ?? "",
      nombre: h.nombre ?? "",
      marca: datos.marca ?? "",
      ubicacion: datos.ubicacion ?? "",
      peso: datos.peso ?? "",
      medidas: datos.medidas ?? "",
      estado: h.activa === false ? "Fuera de circulación" : "En circulación",
      foto_url: h.foto_url ?? "",
      creado_en: (h.creado_en ?? "").slice(0, 10),
    };
  })
  .sort((a, b) => a.nombre.localeCompare(b.nombre, "es") || a.codigo.localeCompare(b.codigo, "es"));

const libro = new ExcelJS.Workbook();
libro.creator = "Portal Mantenimiento EPI";
libro.created = new Date();

const hoja = libro.addWorksheet("Moldes", {
  views: [{ state: "frozen", ySplit: 1 }],
});

hoja.columns = [
  { header: "ID", key: "id", width: 38 },
  { header: "Código", key: "codigo", width: 14 },
  { header: "Nombre", key: "nombre", width: 36 },
  { header: "Marca", key: "marca", width: 16 },
  { header: "Ubicación", key: "ubicacion", width: 22 },
  { header: "Peso del molde", key: "peso", width: 16 },
  { header: "Medidas del molde", key: "medidas", width: 28 },
  { header: "Estado", key: "estado", width: 20 },
  { header: "Foto URL", key: "foto_url", width: 40 },
  { header: "Registrado", key: "creado_en", width: 12 },
];

const header = hoja.getRow(1);
header.font = { bold: true, color: { argb: "FFFFFFFF" } };
header.fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1F4E79" },
};
header.alignment = { vertical: "middle", horizontal: "center" };

for (const molde of moldes) {
  const fila = hoja.addRow(molde);
  const faltaPeso = !String(molde.peso).trim();
  const faltaMedidas = !String(molde.medidas).trim();
  if (faltaPeso || faltaMedidas) {
    const fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFF2CC" },
    };
    if (faltaPeso) fila.getCell("peso").fill = fill;
    if (faltaMedidas) fila.getCell("medidas").fill = fill;
  }
}

hoja.autoFilter = {
  from: { row: 1, column: 1 },
  to: { row: Math.max(1, moldes.length + 1), column: 10 },
};

await libro.xlsx.writeFile(outPath);

const sinPeso = moldes.filter((m) => !String(m.peso).trim()).length;
const sinMedidas = moldes.filter((m) => !String(m.medidas).trim()).length;
console.log(`Moldes exportados: ${moldes.length}`);
console.log(`Sin peso: ${sinPeso} | Sin medidas: ${sinMedidas}`);
console.log(`Archivo: ${outPath}`);
