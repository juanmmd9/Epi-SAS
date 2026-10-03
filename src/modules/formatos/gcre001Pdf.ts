/**
 * GC-RE-001 — Acciones de mejora.
 * PDF generado en memoria con pdf-lib (sin plantilla externa).
 */
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import { textoCompatibleWinAnsi } from "../../lib/pdfTextoWinAnsi";
import { ORIGENES_MEJORA, type RegistroAm, type RegistroAmDatos } from "./gcre001Types";

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 40;

type OpcionesTexto = Parameters<PDFPage["drawText"]>[1];

function drawText(page: PDFPage, text: string, options: OpcionesTexto) {
  page.drawText(textoCompatibleWinAnsi(text), options);
}

function yTop(y: number, size = 9): number {
  return PAGE_H - y - size;
}

function formatearFecha(fechaIso: string): string {
  if (!fechaIso) return "";
  const [y, m, d] = fechaIso.split("-");
  return `${d}/${m}/${y}`;
}

function partirTexto(texto: string, font: PDFFont, fontSize: number, anchoMax: number): string[] {
  const palabras = textoCompatibleWinAnsi(texto)
    .replace(/\s+/g, " ")
    .trim()
    .split(" ");
  if (!palabras.length || palabras[0] === "") return [];

  const lineas: string[] = [];
  let linea = "";
  for (const palabra of palabras) {
    const prueba = linea ? `${linea} ${palabra}` : palabra;
    if (font.widthOfTextAtSize(prueba, fontSize) <= anchoMax) {
      linea = prueba;
    } else {
      if (linea) lineas.push(linea);
      linea = palabra;
    }
  }
  if (linea) lineas.push(linea);
  return lineas;
}

function escribirBloque(
  page: PDFPage,
  font: PDFFont,
  bold: PDFFont,
  titulo: string,
  texto: string,
  x: number,
  yInicio: number,
  ancho: number,
  fontSize = 8,
  lineHeight = 10,
  maxLines = 12,
): number {
  drawText(page, titulo, { x, y: yTop(yInicio, 9), size: 9, font: bold });
  let y = yInicio + 14;
  const lineas = partirTexto(texto, font, fontSize, ancho).slice(0, maxLines);
  for (const linea of lineas) {
    drawText(page, linea, { x, y: yTop(y, fontSize), size: fontSize, font });
    y += lineHeight;
  }
  return y + 6;
}

function marcarCheckbox(page: PDFPage, font: PDFFont, marcado: boolean, x: number, y: number) {
  drawText(page, marcado ? "[X]" : "[ ]", { x, y: yTop(y, 8), size: 8, font });
}

function etiquetaOrigen(clave: string): string {
  return ORIGENES_MEJORA.find((o) => o.clave === clave)?.etiqueta ?? clave;
}

function escribirPagina1(
  page: PDFPage,
  font: PDFFont,
  bold: PDFFont,
  datos: RegistroAmDatos,
  numero: number,
) {
  let y = 36;
  drawText(page, "GC-RE-001 — ACCIONES DE MEJORA", {
    x: MARGIN,
    y: yTop(y, 14),
    size: 14,
    font: bold,
  });
  y += 22;
  drawText(page, `No. ${numero}  ·  Fecha de registro: ${formatearFecha(datos.fechaRegistro)}`, {
    x: MARGIN,
    y: yTop(y, 8),
    size: 8,
    font,
  });
  y += 22;

  drawText(page, "INFORMACIÓN GENERAL", { x: MARGIN, y: yTop(y, 9), size: 9, font: bold });
  y += 16;
  const info = [
    ["Proceso:", datos.proceso],
    ["Responsable del proceso:", datos.responsableProceso],
    ["Reportado por:", datos.reportadoPor],
    ["Cargo:", datos.reportadoCargo],
  ];
  for (const [etiq, val] of info) {
    drawText(page, etiq, { x: MARGIN, y: yTop(y, 8), size: 8, font: bold });
    drawText(page, val || "—", { x: MARGIN + 130, y: yTop(y, 8), size: 8, font });
    y += 13;
  }
  y += 6;

  drawText(page, "ORIGEN DE LA OPORTUNIDAD DE MEJORA", {
    x: MARGIN,
    y: yTop(y, 9),
    size: 9,
    font: bold,
  });
  y += 14;
  const origenTexto =
    datos.origen === "otro" && datos.origenOtro
      ? `Otro: ${datos.origenOtro}`
      : etiquetaOrigen(datos.origen);
  drawText(page, origenTexto, { x: MARGIN, y: yTop(y, 8), size: 8, font });
  y += 18;

  if (datos.origenRiesgo) {
    const r = datos.origenRiesgo;
    drawText(
      page,
      `Riesgo vinculado: P=${r.probabilidad} C=${r.consecuencia} Valor=${r.valor} (${r.nivel}) · ${r.tratamiento}`,
      { x: MARGIN, y: yTop(y, 7), size: 7, font },
    );
    y += 14;
  }

  y = escribirBloque(
    page,
    font,
    bold,
    "DESCRIPCIÓN DE LA OPORTUNIDAD DE MEJORA",
    datos.descripcion,
    MARGIN,
    y,
    PAGE_W - MARGIN * 2,
    8,
    10,
    10,
  );

  y = escribirBloque(
    page,
    font,
    bold,
    "BENEFICIO ESPERADO",
    datos.beneficioEsperado,
    MARGIN,
    y,
    PAGE_W - MARGIN * 2,
    8,
    10,
    6,
  );

  drawText(page, "EVALUACIÓN DE LA MEJORA", { x: MARGIN, y: yTop(y, 9), size: 9, font: bold });
  y += 14;
  drawText(page, "Recursos requeridos:", { x: MARGIN, y: yTop(y, 8), size: 8, font: bold });
  let xRec = MARGIN + 110;
  const recursos = [
    { label: "Humanos", ok: datos.recursosHumanos },
    { label: "Tecnológicos", ok: datos.recursosTecnologicos },
    { label: "Infraestructura", ok: datos.recursosInfraestructura },
    { label: "Económicos", ok: datos.recursosEconomicos },
    { label: "Otros", ok: datos.recursosOtros },
  ];
  for (const rec of recursos) {
    marcarCheckbox(page, font, rec.ok, xRec, y);
    drawText(page, rec.label, { x: xRec + 22, y: yTop(y, 7), size: 7, font });
    xRec += 95;
    if (xRec > PAGE_W - 80) {
      xRec = MARGIN + 110;
      y += 12;
    }
  }
  y += 18;

  y = escribirBloque(
    page,
    font,
    bold,
    "Descripción de recursos",
    datos.recursosDescripcion,
    MARGIN,
    y,
    PAGE_W - MARGIN * 2,
    8,
    10,
    4,
  );

  drawText(page, "Alineación con objetivos de calidad:", {
    x: MARGIN,
    y: yTop(y, 8),
    size: 8,
    font: bold,
  });
  drawText(page, datos.alineacionObjetivos || "—", {
    x: MARGIN + 165,
    y: yTop(y, 8),
    size: 8,
    font,
  });
  y += 16;

  const evalTexto =
    datos.evaluacion === "aprobada"
      ? "APROBADA"
      : datos.evaluacion === "no_aprobada"
        ? "NO APROBADA"
        : "—";
  drawText(page, `Resultado de la evaluación: ${evalTexto}`, {
    x: MARGIN,
    y: yTop(y, 8),
    size: 8,
    font: bold,
  });
  y += 14;
  escribirBloque(
    page,
    font,
    bold,
    "Justificación",
    datos.evaluacionJustificacion,
    MARGIN,
    y,
    PAGE_W - MARGIN * 2,
    8,
    10,
    5,
  );
}

function escribirTablaPlan(
  page: PDFPage,
  font: PDFFont,
  bold: PDFFont,
  datos: RegistroAmDatos,
) {
  let y = 50;
  drawText(page, "PLAN DE ACCIÓN", { x: MARGIN, y: yTop(y, 10), size: 10, font: bold });
  y += 20;

  const cols = [
    { x: MARGIN, w: 175, titulo: "ACTIVIDAD" },
    { x: MARGIN + 178, w: 95, titulo: "RESPONSABLE" },
    { x: MARGIN + 276, w: 72, titulo: "FECHA ENTREGA" },
    { x: MARGIN + 351, w: PAGE_W - MARGIN - 351, titulo: "EVIDENCIA" },
  ];

  const altoFila = 52;
  page.drawRectangle({
    x: MARGIN,
    y: yTop(y + 14),
    width: PAGE_W - MARGIN * 2,
    height: 14,
    borderColor: rgb(0, 0, 0),
    borderWidth: 0.5,
    color: rgb(0.92, 0.92, 0.92),
  });
  for (const col of cols) {
    drawText(page, col.titulo, { x: col.x + 3, y: yTop(y + 10, 7), size: 7, font: bold });
  }
  y += 16;

  const filas = datos.planAccion.filter(
    (f) => f.actividad || f.responsable || f.fechaEntrega || f.evidencia,
  );
  const aMostrar = filas.length ? filas : datos.planAccion.slice(0, 4);

  for (const fila of aMostrar) {
    page.drawRectangle({
      x: MARGIN,
      y: yTop(y + altoFila),
      width: PAGE_W - MARGIN * 2,
      height: altoFila,
      borderColor: rgb(0, 0, 0),
      borderWidth: 0.5,
    });
    const valores = [
      fila.actividad,
      fila.responsable,
      formatearFecha(fila.fechaEntrega),
      fila.evidencia,
    ];
    cols.forEach((col, indice) => {
      const lineas = partirTexto(valores[indice], font, 7, col.w - 6).slice(0, 5);
      lineas.forEach((linea, li) => {
        drawText(page, linea, {
          x: col.x + 3,
          y: yTop(y + 10 + li * 9, 7),
          size: 7,
          font,
        });
      });
    });
    y += altoFila;
  }

  y += 24;
  drawText(page, "APROBACIÓN DEL PLAN", { x: MARGIN, y: yTop(y, 9), size: 9, font: bold });
  y += 18;
  const aprob = [
    ["Responsable del proceso:", datos.aprobacionResponsable, datos.aprobacionResponsableFecha],
    ["Líder SGC:", datos.aprobacionLiderSgc, datos.aprobacionLiderSgcFecha],
  ];
  for (const [etiq, nombre, fecha] of aprob) {
    drawText(page, etiq, { x: MARGIN, y: yTop(y, 8), size: 8, font: bold });
    drawText(page, nombre || "_______________________", {
      x: MARGIN + 130,
      y: yTop(y, 8),
      size: 8,
      font,
    });
    drawText(page, `Fecha: ${formatearFecha(fecha)}`, {
      x: MARGIN + 340,
      y: yTop(y, 8),
      size: 8,
      font,
    });
    y += 28;
    drawText(page, "Firma: _______________________", {
      x: MARGIN + 130,
      y: yTop(y, 8),
      size: 8,
      font,
    });
    y += 22;
  }
}

export async function generarPdfGcRe001(datos: RegistroAmDatos, numero: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const pagina1 = doc.addPage([PAGE_W, PAGE_H]);
  escribirPagina1(pagina1, font, bold, datos, numero);

  const pagina2 = doc.addPage([PAGE_W, PAGE_H]);
  escribirTablaPlan(pagina2, font, bold, datos);

  return doc.save();
}

export function nombreArchivoGcRe001(numero: number): string {
  return `GC-RE-001_No_${String(numero).replace(/[^\w.-]+/g, "_")}.pdf`;
}

export function pdfBytesABlob(pdfBytes: Uint8Array): Blob {
  const copia = pdfBytes.slice();
  return new Blob([copia], { type: "application/pdf" });
}

export function urlVistaPreviaPdf(pdfBytes: Uint8Array): string {
  return URL.createObjectURL(pdfBytesABlob(pdfBytes));
}

export async function obtenerPdfRegistroAm(registro: RegistroAm): Promise<Uint8Array> {
  return generarPdfGcRe001(registro.datos, registro.numero);
}
