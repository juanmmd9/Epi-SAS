/**
 * Rellena la plantilla oficial GC-RE-009 con pdf-lib.
 * Coordenadas calibradas sobre public/templates/GC-RE-009-v2.pdf (A4, 596 x 842 pt).
 */
import { PDFDocument, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";
import type { RegistroNc, RegistroNcDatos } from "./types";

const PAGE_H = 842;
const PLANTILLA_URL = "/templates/GC-RE-009-v2.pdf";

const ORIGEN_MARCAS: Record<string, { x: number; yTop: number }> = {
  auditoria: { x: 124, yTop: 167 },
  queja: { x: 194, yTop: 167 },
  producto: { x: 305, yTop: 167 },
  indicador: { x: 453, yTop: 167 },
  proceso: { x: 78, yTop: 182 },
};

let plantillaCache: ArrayBuffer | null = null;

function yDesdeArriba(yTop: number, fontSize = 9): number {
  return PAGE_H - yTop - fontSize;
}

function formatearFecha(fechaIso: string): string {
  if (!fechaIso) return "";
  const partes = fechaIso.split("-");
  if (partes.length !== 3) return fechaIso;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function textoSiNo(valor: string): string {
  if (valor === "si") return "SI";
  if (valor === "no") return "NO";
  return "";
}

async function cargarPlantilla(): Promise<ArrayBuffer> {
  if (plantillaCache) return plantillaCache;
  const respuesta = await fetch(PLANTILLA_URL);
  if (!respuesta.ok) throw new Error("No se pudo cargar la plantilla GC-RE-009.");
  plantillaCache = await respuesta.arrayBuffer();
  return plantillaCache;
}

function partirTexto(texto: string, font: PDFFont, fontSize: number, anchoMax: number): string[] {
  const palabras = String(texto || "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ");
  if (palabras.length === 0 || palabras[0] === "") return [];

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

interface Caja {
  x: number;
  yTop: number;
  width: number;
  fontSize?: number;
  lineHeight?: number;
  maxLines?: number;
}

function escribirEnCaja(page: PDFPage, font: PDFFont, texto: string, caja: Caja) {
  const fontSize = caja.fontSize ?? 8;
  const lineHeight = caja.lineHeight ?? 10;
  const maxLines = caja.maxLines ?? 8;
  const lineas = partirTexto(texto, font, fontSize, caja.width - 4).slice(0, maxLines);
  lineas.forEach((linea, indice) => {
    page.drawText(linea, {
      x: caja.x + 2,
      y: yDesdeArriba(caja.yTop + indice * lineHeight, fontSize),
      size: fontSize,
      font,
    });
  });
}

function marcarOrigen(page: PDFPage, font: PDFFont, origen: string) {
  const marca = ORIGEN_MARCAS[origen];
  if (!marca) return;
  page.drawText("X", { x: marca.x, y: yDesdeArriba(marca.yTop, 8), size: 8, font });
}

function marcarSiNo(page: PDFPage, font: PDFFont, valor: string, xSi: number, xNo: number, yTop: number) {
  if (valor === "si") {
    page.drawText("X", { x: xSi, y: yDesdeArriba(yTop, 8), size: 8, font });
  } else if (valor === "no") {
    page.drawText("X", { x: xNo, y: yDesdeArriba(yTop, 8), size: 8, font });
  }
}

function escribirPagina1(page: PDFPage, font: PDFFont, registro: RegistroNcDatos, numero: number) {
  escribirEnCaja(page, font, registro.area, { x: 118, yTop: 136, width: 95, fontSize: 9, maxLines: 1 });
  escribirEnCaja(page, font, formatearFecha(registro.fechaDeteccion), {
    x: 342, yTop: 136, width: 80, fontSize: 9, maxLines: 1,
  });
  escribirEnCaja(page, font, String(numero), { x: 453, yTop: 136, width: 68, fontSize: 9, maxLines: 1 });

  marcarOrigen(page, font, registro.origen);

  escribirEnCaja(page, font, registro.descripcion, {
    x: 68, yTop: 227, width: 458, fontSize: 8, lineHeight: 10, maxLines: 7,
  });

  const detectada = [registro.detectadaPorNombre, registro.detectadaPorCargo].filter(Boolean).join(" — ");
  escribirEnCaja(page, font, detectada, { x: 258, yTop: 305, width: 268, fontSize: 8, maxLines: 1 });

  escribirEnCaja(page, font, registro.tratamientoInmediato, {
    x: 68, yTop: 344, width: 458, fontSize: 8, lineHeight: 10, maxLines: 5,
  });
  escribirEnCaja(page, font, registro.tratamientoInmediatoPor, { x: 158, yTop: 399, width: 130, fontSize: 8, maxLines: 1 });
  escribirEnCaja(page, font, formatearFecha(registro.tratamientoInmediatoFecha), {
    x: 338, yTop: 399, width: 185, fontSize: 8, maxLines: 1,
  });
  escribirEnCaja(page, font, registro.herramientaCausa, {
    x: 187, yTop: 455, width: 340, fontSize: 8, lineHeight: 11, maxLines: 3,
  });
  escribirEnCaja(page, font, registro.resumenCausa, {
    x: 66, yTop: 511, width: 460, fontSize: 8, lineHeight: 10, maxLines: 6,
  });
  escribirEnCaja(page, font, registro.analisisPor, { x: 226, yTop: 580, width: 135, fontSize: 8, maxLines: 1 });
  escribirEnCaja(page, font, formatearFecha(registro.analisisFecha), {
    x: 412, yTop: 580, width: 115, fontSize: 8, maxLines: 1,
  });

  marcarSiNo(page, font, registro.requiereAccionFormal, 282, 313, 637);
}

function escribirFilaPlan(
  page: PDFPage,
  font: PDFFont,
  fila: RegistroNcDatos["planAccion"][number],
  yTop: number,
  maxLines: number,
) {
  const columnas = [
    { x: 56, width: 112 },
    { x: 176, width: 148 },
    { x: 332, width: 86 },
    { x: 426, width: 112 },
  ];
  const valores = [fila.actividad, fila.responsable, formatearFecha(fila.fechaEntrega), fila.evidencia];
  columnas.forEach((col, indice) => {
    escribirEnCaja(page, font, valores[indice], {
      x: col.x, yTop, width: col.width, fontSize: 7, lineHeight: 9, maxLines,
    });
  });
}

function escribirFilaSeguimiento(
  page: PDFPage,
  font: PDFFont,
  fila: RegistroNcDatos["seguimientoFilas"][number],
  yTop: number,
) {
  const columnas = [
    { x: 56, width: 134 },
    { x: 198, width: 42 },
    { x: 248, width: 118 },
    { x: 374, width: 165 },
  ];
  const valores = [fila.actividad, textoSiNo(fila.cumplido), textoSiNo(fila.fueEficaz), fila.porque];
  columnas.forEach((col, indice) => {
    escribirEnCaja(page, font, valores[indice], {
      x: col.x, yTop, width: col.width, fontSize: 7, lineHeight: 9, maxLines: 2,
    });
  });
}

function escribirPagina2(page: PDFPage, font: PDFFont, registro: RegistroNcDatos) {
  const filasPlan = [
    { yTop: 182, maxLines: 5 },
    { yTop: 238, maxLines: 4 },
  ];
  registro.planAccion.slice(0, filasPlan.length).forEach((fila, indice) => {
    escribirFilaPlan(page, font, fila, filasPlan[indice].yTop, filasPlan[indice].maxLines);
  });

  escribirEnCaja(page, font, registro.seguimientoCumplimiento, {
    x: 226, yTop: 336, width: 17, fontSize: 8, maxLines: 1,
  });
  escribirEnCaja(page, font, registro.seguimientoEficacia, {
    x: 290, yTop: 337, width: 245, fontSize: 8, maxLines: 1,
  });

  const filasSegY = [388, 444, 487];
  registro.seguimientoFilas.slice(0, filasSegY.length).forEach((fila, indice) => {
    escribirFilaSeguimiento(page, font, fila, filasSegY[indice]);
  });

  const verificado = [registro.verificadoPorNombre, registro.verificadoPorCargo]
    .filter(Boolean)
    .join(" — ");
  escribirEnCaja(page, font, verificado, { x: 250, yTop: 530, width: 285, fontSize: 8, lineHeight: 10, maxLines: 2 });

  marcarSiNo(page, font, registro.tratamientoEficaz, 242, 287, 584);

  escribirEnCaja(page, font, registro.tratamientoEficazPorque, {
    x: 71, yTop: 626, width: 465, fontSize: 8, lineHeight: 10, maxLines: 8,
  });
}

export async function generarPdfGcRe009(datos: RegistroNcDatos, numero: number): Promise<Uint8Array> {
  const plantillaBytes = await cargarPlantilla();
  const pdfDoc = await PDFDocument.load(plantillaBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const paginas = pdfDoc.getPages();

  if (paginas[0]) escribirPagina1(paginas[0], font, datos, numero);
  if (paginas[1]) escribirPagina2(paginas[1], font, datos);

  return pdfDoc.save();
}

export function nombreArchivoPdf(numero: number): string {
  const limpio = String(numero).replace(/[^\w.-]+/g, "_");
  return `GC-RE-009_No_${limpio}.pdf`;
}

export function pdfBytesABlob(pdfBytes: Uint8Array): Blob {
  const copia = pdfBytes.slice();
  return new Blob([copia], { type: "application/pdf" });
}

function bytesAPdfBlob(pdfBytes: Uint8Array): Blob {
  return pdfBytesABlob(pdfBytes);
}

export function abrirPdfEnNavegador(pdfBytes: Uint8Array) {
  const blob = bytesAPdfBlob(pdfBytes);
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.target = "_blank";
  enlace.rel = "noopener noreferrer";
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  setTimeout(() => URL.revokeObjectURL(url), 120_000);
}

export function descargarPdf(pdfBytes: Uint8Array, numero: number) {
  const blob = bytesAPdfBlob(pdfBytes);
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivoPdf(numero);
  enlace.click();
  URL.revokeObjectURL(url);
}

export function urlVistaPreviaPdf(pdfBytes: Uint8Array): string {
  return URL.createObjectURL(bytesAPdfBlob(pdfBytes));
}

export async function obtenerPdfRegistro(registro: RegistroNc): Promise<Uint8Array> {
  try {
    return await generarPdfGcRe009(registro.datos, registro.numero);
  } catch (error) {
    if (!registro.pdf_url) throw error;
    const respuesta = await fetch(registro.pdf_url);
    if (!respuesta.ok) throw error;
    return new Uint8Array(await respuesta.arrayBuffer());
  }
}
