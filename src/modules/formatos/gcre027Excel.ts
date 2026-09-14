import ExcelJS from "exceljs";
import { rutaPublica } from "../../lib/rutaPublica";
import type { RegistroGc027Datos } from "./gcre027Types";

const PLANTILLA_URL = "/templates/GC-RE-027.xlsx";

function parseFecha(valor: string): Date | string {
  const t = valor.trim();
  if (!t) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  return t;
}

function setCelda(
  hoja: ExcelJS.Worksheet,
  fila: number,
  col: number,
  valor: string | Date | number,
) {
  const celda = hoja.getCell(fila, col);
  celda.value = valor;
  if (typeof valor === "string" && valor.includes("\n")) {
    celda.alignment = { ...(celda.alignment ?? {}), wrapText: true, vertical: "top" };
  }
}

export async function generarExcelGcRe027(
  datos: RegistroGc027Datos,
  numero?: number | null,
): Promise<Blob> {
  const respuesta = await fetch(rutaPublica(PLANTILLA_URL));
  if (!respuesta.ok) throw new Error("No se pudo cargar la plantilla GC-RE-027.");
  const buffer = await respuesta.arrayBuffer();

  const libro = new ExcelJS.Workbook();
  await libro.xlsx.load(buffer);
  const hoja = libro.worksheets[0];
  if (!hoja) throw new Error("La plantilla GC-RE-027 no tiene hojas.");

  setCelda(hoja, 5, 4, parseFecha(datos.fechaDiligenciamiento));
  setCelda(hoja, 5, 7, datos.proceso || "");
  setCelda(hoja, 5, 10, datos.responsable || "");
  setCelda(hoja, 6, 2, parseFecha(datos.fechaUltimaRevision) || "dd/mm/aaaa");

  setCelda(hoja, 9, 1, datos.descripcion || "");
  setCelda(hoja, 11, 1, datos.riesgos || "");
  setCelda(hoja, 13, 1, datos.oportunidades || "");
  setCelda(hoja, 15, 1, datos.requisitosLegales || "");
  setCelda(hoja, 17, 1, datos.impacto || "");

  const filasPlan = [20, 21, 22, 23, 24, 25];
  datos.plan.forEach((fila, i) => {
    const row = filasPlan[i];
    if (!row) return;
    setCelda(hoja, row, 1, fila.actividad || "");
    setCelda(hoja, row, 4, fila.responsable || "");
    setCelda(hoja, row, 6, fila.comunicar || "");
    setCelda(hoja, row, 8, parseFecha(fila.fechaEjecucion));
    setCelda(hoja, row, 10, parseFecha(fila.fechaSeguimiento));
  });

  const out = await libro.xlsx.writeBuffer();
  void numero;
  return new Blob([new Uint8Array(out as ArrayBuffer)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function nombreArchivoGc027(numero?: number | null): string {
  const n = numero != null ? String(numero) : "borrador";
  return `GC-RE-027_No_${n}.xlsx`;
}

export function descargarBlob(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}
