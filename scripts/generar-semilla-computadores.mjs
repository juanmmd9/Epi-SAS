import ExcelJS from "exceljs";
import fs from "fs";

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(
  "e:/2_MANTENIMIENTO/20_LOCAL/COMPUTADORES/Computadores Mantenimiento Preventivo.xlsx",
);
const hoja = wb.worksheets[0];

function cell(fila, col) {
  const c = fila.getCell(col);
  if (c.value instanceof Date) {
    const y = c.value.getUTCFullYear();
    const m = String(c.value.getUTCMonth() + 1).padStart(2, "0");
    const d = String(c.value.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (c.value && typeof c.value === "object" && c.value.result != null) {
    return String(c.value.result).trim();
  }
  return String(c.text ?? c.value ?? "").trim();
}

function parseFecha(v) {
  if (!v) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    let y = Number(m[3]);
    if (y < 100) y += 2000;
    return `${y}-${String(m[1]).padStart(2, "0")}-${String(m[2]).padStart(2, "0")}`;
  }
  return null;
}

function tipoNorm(t) {
  const x = t
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (x.includes("porta")) return "portatil";
  if (x.includes("mesa") || x.includes("escrit")) return "escritorio";
  return "otro";
}

const lines = [];
hoja.eachRow((fila, n) => {
  if (n <= 2) return;
  const item = cell(fila, 1);
  if (!/^\d+$/.test(item)) return;
  const ubicacion = cell(fila, 2).replace(/\s+/g, " ").trim();
  const tipoRaw = cell(fila, 3);
  const usuario = cell(fila, 4).replace(/\s+/g, " ").trim();
  const compra = cell(fila, 5);
  const ultimo = parseFecha(cell(fila, 6));
  const proximo = parseFecha(cell(fila, 7));
  const obs = cell(fila, 8);
  const siesa = cell(fila, 9).toUpperCase();
  const codigo = `PC ${String(item).padStart(2, "0")}`;
  const tipo = tipoNorm(tipoRaw);
  const d = {};
  if (obs) d.observaciones = obs;
  if (siesa) d.siesa = siesa;
  if (compra) d.compra = compra;
  if (tipoRaw) d.tipoDetalle = tipoRaw;
  lines.push(
    `  { codigo: ${JSON.stringify(codigo)}, ubicacion: ${JSON.stringify(ubicacion)}, tipo: ${JSON.stringify(tipo)}, usuario_asignado: ${JSON.stringify(usuario)}, frecuencia_pm_meses: 12, ultimo_pm: ${ultimo ? JSON.stringify(ultimo) : "null"}, proximo_pm: ${proximo ? JSON.stringify(proximo) : "null"}, datos: ${JSON.stringify(d)} },`,
  );
});

const out = `import type { ComputadorInput } from "./types";

/** Lista oficial del Excel actual de Computadores (51 equipos). */
export const SEMILLA_COMPUTADORES: ComputadorInput[] = [
${lines.join("\n")}
];
`;

fs.writeFileSync("src/modules/computadores/computadoresSemilla.ts", out);
console.log("ok", lines.length, lines[2]);
