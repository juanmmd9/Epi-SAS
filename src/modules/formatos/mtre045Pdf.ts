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

  const textoSinMarcaVacia = (valor: string | undefined): string => {
    const limpio = (valor ?? "").trim();
    const plano = limpio
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    if (!limpio || plano === "na" || plano === "noaplica") return "";
    return limpio;
  };
  const unirBloque = (principal: string, extra: string) => {
    const segundo = textoSinMarcaVacia(extra);
    if (!segundo) return principal || "";
    if (!(principal || "").trim()) return `Correctivo: ${segundo}`;
    return `${principal}\nCorrectivo: ${segundo}`;
  };
  const dibujarBloqueAncho = (titulo: string, texto: string) => {
    const ancho = PAGE_W - MARGIN * 2;
    const lineas = (texto || "").slice(0, 900).match(/.{1,92}/g) ?? [];
    const alto = Math.max(28, lineas.length * 11 + 8);
    rectBorde(page, {
      x: MARGIN,
      y: yTop(y + 14),
      width: ancho,
      height: 14,
    });
    page.drawText(titulo, { x: MARGIN + 4, y: yTop(y + 9, 7), size: 7, font: bold });
    y += 16;
    rectBorde(page, {
      x: MARGIN,
      y: yTop(y + alto),
      width: ancho,
      height: alto,
    });
    lineas.forEach((linea, li) => {
      page.drawText(linea, { x: MARGIN + 4, y: yTop(y + 12 + li * 11, 8), size: 8, font });
    });
    y += alto + 4;
  };

  dibujarBloqueAncho(
    "ACTIVIDAD REALIZADA",
    unirBloque(datos.actividadRealizada, datos.actividadCorrectivo),
  );
  dibujarBloqueAncho(
    "CAMBIO DE REPUESTOS O INSUMOS",
    unirBloque(datos.cambioRepuestos, datos.cambioRepuestosCorrectivo),
  );
  dibujarBloqueAncho(
    "VERIFICACIÓN DEL EQUIPO",
    unirBloque(datos.verificacionEquipoPm, datos.verificacionCorrectivo),
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
  const altoVerif = 48;
  rectBorde(page, {
    x: MARGIN,
    y: yTop(y + altoVerif),
    width: colW,
    height: altoVerif,
  });
  rectBorde(page, {
    x: MARGIN + colW,
    y: yTop(y + altoVerif),
    width: colW,
    height: altoVerif,
  });
  const dibujarDetalleVerif = (texto: string, xBase: number) => {
    const lineas = (texto || "").slice(0, 220).match(/.{1,42}/g) ?? [];
    lineas.slice(0, 3).forEach((linea, li) => {
      page.drawText(linea, {
        x: xBase + 4,
        y: yTop(y + 10 + li * 9, 7),
        size: 7,
        font,
      });
    });
  };
  dibujarDetalleVerif(datos.detalleInspeccionVisual ?? "", MARGIN);
  dibujarDetalleVerif(datos.detallePruebasFuncionamiento ?? "", MARGIN + colW);
  page.drawText("A", { x: MARGIN + colW * 0.72, y: yTop(y + altoVerif - 8, 8), size: 8, font });
  page.drawText("NA", { x: MARGIN + colW * 0.86, y: yTop(y + altoVerif - 8, 8), size: 8, font });
  page.drawText("A", { x: MARGIN + colW * 1.72, y: yTop(y + altoVerif - 8, 8), size: 8, font });
  page.drawText("NA", { x: MARGIN + colW * 1.86, y: yTop(y + altoVerif - 8, 8), size: 8, font });
  marcarAn(
    page,
    font,
    datos.inspeccionVisual,
    MARGIN + colW * 0.69,
    MARGIN + colW * 0.83,
    y + altoVerif - 16,
  );
  marcarAn(
    page,
    font,
    datos.pruebasFuncionamiento,
    MARGIN + colW * 1.69,
    MARGIN + colW * 1.83,
    y + altoVerif - 16,
  );
  y += altoVerif + 8;

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
