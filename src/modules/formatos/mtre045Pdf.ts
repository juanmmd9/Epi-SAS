/**
 * MT-RE-045 — Reporte de mantenimiento preventivo (Laboratorio).
 * Generado en memoria para vista previa e impresión (sin guardar en nube).
 */
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import { fechaPartes, type Mtre045Datos } from "./mtre045Types";

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 40;

function yTop(y: number, size = 9): number {
  return PAGE_H - y - size;
}

function rectBorde(
  page: PDFPage,
  opts: { x: number; y: number; width: number; height: number; borderWidth?: number },
) {
  page.drawRectangle({
    ...opts,
    borderColor: rgb(0, 0, 0),
    borderWidth: opts.borderWidth ?? 0.5,
    color: rgb(1, 1, 1),
  });
}

function marcarAn(page: PDFPage, font: PDFFont, valor: string, xA: number, xNa: number, y: number) {
  if (valor === "A") {
    page.drawText("X", { x: xA, y: yTop(y, 8), size: 8, font });
  } else if (valor === "NA") {
    page.drawText("X", { x: xNa, y: yTop(y, 8), size: 8, font });
  }
}

export function nombreArchivoMtre045(datos: Mtre045Datos): string {
  const ref = datos.numeroReporte || datos.equipo.slice(0, 15) || "reporte";
  return `MT-RE-045_${datos.fecha}_${ref.replace(/[^\w.-]+/g, "_")}.pdf`;
}

export async function generarPdfMtre045(datos: Mtre045Datos): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_W, PAGE_H]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const { dia, mes, anio } = fechaPartes(datos.fecha);

  page.drawText("MT-RE-045", {
    x: MARGIN,
    y: yTop(36, 8),
    size: 8,
    font,
  });
  page.drawText("REPORTE DE MANTENIMIENTO PREVENTIVO — LABORATORIO", {
    x: MARGIN,
    y: yTop(52, 12),
    size: 12,
    font: bold,
  });

  // Encabezado número y fecha
  let y = 78;
  rectBorde(page, {
    x: MARGIN,
    y: yTop(y + 22),
    width: PAGE_W - MARGIN * 2,
    height: 22,
    borderWidth: 0.8,
  });
  page.drawText("NÚMERO DE REPORTE", { x: MARGIN + 4, y: yTop(y + 14, 8), size: 8, font: bold });
  page.drawText(datos.numeroReporte || "—", {
    x: MARGIN + 110,
    y: yTop(y + 14, 9),
    size: 9,
    font,
  });
  page.drawText("FECHA:", { x: 320, y: yTop(y + 14, 8), size: 8, font: bold });
  page.drawText(`${dia} / ${mes} / ${anio}`, {
    x: 365,
    y: yTop(y + 14, 9),
    size: 9,
    font,
  });

  // Información del equipo
  y = 108;
  const dibujarFilaEquipo = (etiqueta: string, valor: string, filaY: number) => {
    rectBorde(page, {
      x: MARGIN,
      y: yTop(filaY + 18),
      width: PAGE_W - MARGIN * 2,
      height: 18,
    });
    page.drawText(etiqueta, { x: MARGIN + 4, y: yTop(filaY + 12, 8), size: 8, font: bold });
    page.drawText(valor || "", { x: MARGIN + 90, y: yTop(filaY + 12, 9), size: 9, font });
  };

  rectBorde(page, {
    x: MARGIN,
    y: yTop(y + 18),
    width: PAGE_W - MARGIN * 2,
    height: 18,
    borderWidth: 0.8,
  });
  page.drawText("INFORMACIÓN DEL EQUIPO", {
    x: MARGIN + 4,
    y: yTop(y + 12, 9),
    size: 9,
    font: bold,
  });
  y += 22;
  dibujarFilaEquipo("EQUIPO", datos.equipo, y);
  y += 20;
  dibujarFilaEquipo("MARCA", datos.marca, y);
  y += 20;
  dibujarFilaEquipo("SERIE", datos.serie, y);
  y += 20;
  dibujarFilaEquipo("ÁREA", datos.area, y);
  y += 28;

  // Diagnóstico — encabezado columnas
  page.drawText("DIAGNÓSTICO DE MANTENIMIENTO PREVENTIVO", {
    x: MARGIN,
    y: yTop(y, 9),
    size: 9,
    font: bold,
  });
  y += 16;
  const colW = (PAGE_W - MARGIN * 2) / 3;
  const cols = ["MANTENIMIENTO PREVENTIVO", "MANTENIMIENTO CORRECTIVO", "VERIFICACIÓN"];
  cols.forEach((titulo, i) => {
    const x = MARGIN + i * colW;
    rectBorde(page, {
      x,
      y: yTop(y + 16),
      width: colW,
      height: 16,
    });
    page.drawText(titulo, { x: x + 4, y: yTop(y + 10, 7), size: 7, font: bold });
  });
  y += 20;

  const dibujarBloque3Col = (titulo: string, v1: string, v2: string, v3: string, alto: number) => {
    rectBorde(page, {
      x: MARGIN,
      y: yTop(y + 14),
      width: PAGE_W - MARGIN * 2,
      height: 14,
    });
    page.drawText(titulo, { x: MARGIN + 4, y: yTop(y + 9, 7), size: 7, font: bold });
    y += 16;
    [v1, v2, v3].forEach((texto, i) => {
      const x = MARGIN + i * colW;
      rectBorde(page, {
        x,
        y: yTop(y + alto),
        width: colW,
        height: alto,
      });
      const lineas = (texto || "").slice(0, 200).match(/.{1,38}/g) ?? [];
      lineas.slice(0, 4).forEach((linea, li) => {
        page.drawText(linea, { x: x + 4, y: yTop(y + 10 + li * 10, 8), size: 8, font });
      });
    });
    y += alto + 4;
  };

  dibujarBloque3Col(
    "ACTIVIDAD REALIZADA",
    datos.actividadRealizada,
    datos.actividadCorrectivo,
    "",
    52,
  );
  dibujarBloque3Col(
    "CAMBIO DE REPUESTOS O INSUMOS",
    datos.cambioRepuestos,
    datos.cambioRepuestosCorrectivo,
    "",
    40,
  );
  dibujarBloque3Col(
    "VERIFICACIÓN DEL EQUIPO",
    datos.verificacionEquipoPm,
    datos.verificacionCorrectivo,
    "",
    40,
  );

  // Inspección visual / pruebas
  rectBorde(page, {
    x: MARGIN,
    y: yTop(y + 14),
    width: PAGE_W - MARGIN * 2,
    height: 14,
  });
  page.drawText("INSPECCIÓN VISUAL", { x: MARGIN + 4, y: yTop(y + 9, 7), size: 7, font: bold });
  page.drawText("PRUEBAS DE FUNCIONAMIENTO", {
    x: MARGIN + colW + 4,
    y: yTop(y + 9, 7),
    size: 7,
    font: bold,
  });
  y += 18;
  rectBorde(page, {
    x: MARGIN,
    y: yTop(y + 20),
    width: colW,
    height: 20,
  });
  rectBorde(page, {
    x: MARGIN + colW,
    y: yTop(y + 20),
    width: colW,
    height: 20,
  });
  page.drawText("A", { x: MARGIN + colW * 0.35, y: yTop(y + 12, 8), size: 8, font });
  page.drawText("NA", { x: MARGIN + colW * 0.55, y: yTop(y + 12, 8), size: 8, font });
  page.drawText("A", { x: MARGIN + colW * 1.35, y: yTop(y + 12, 8), size: 8, font });
  page.drawText("NA", { x: MARGIN + colW * 1.55, y: yTop(y + 12, 8), size: 8, font });
  marcarAn(page, font, datos.inspeccionVisual, MARGIN + colW * 0.32, MARGIN + colW * 0.52, y + 4);
  marcarAn(
    page,
    font,
    datos.pruebasFuncionamiento,
    MARGIN + colW * 1.32,
    MARGIN + colW * 1.52,
    y + 4,
  );
  y += 28;

  page.drawText("A: aprobado / NA: no aprobado", {
    x: MARGIN,
    y: yTop(y, 7),
    size: 7,
    font,
  });
  page.drawText(`No aprobó: ${datos.noAprobo || "—"}`, {
    x: 280,
    y: yTop(y, 8),
    size: 8,
    font,
  });
  y += 36;

  // Firmas
  const firmaW = (PAGE_W - MARGIN * 2 - 20) / 2;
  [0, 1].forEach((i) => {
    const x = MARGIN + i * (firmaW + 20);
    page.drawLine({
      start: { x, y: yTop(y) },
      end: { x: x + firmaW, y: yTop(y) },
      thickness: 0.5,
    });
    page.drawText("Firma", { x, y: yTop(y + 14, 7), size: 7, font });
    const nombre = i === 0 ? datos.responsableMantenimiento : datos.responsableVerificacion;
    const etiqueta =
      i === 0
        ? "Nombre del responsable del mantenimiento"
        : "Nombre del responsable de la verificación";
    page.drawText(nombre || "_________________________", {
      x,
      y: yTop(y + 28, 8),
      size: 8,
      font,
    });
    page.drawText(etiqueta, { x, y: yTop(y + 40, 6), size: 6, font });
  });

  return doc.save();
}

export function pdfBytesABlob(bytes: Uint8Array): Blob {
  return new Blob([bytes.slice()], { type: "application/pdf" });
}

export function urlVistaPreviaPdf(bytes: Uint8Array): string {
  return URL.createObjectURL(pdfBytesABlob(bytes));
}
