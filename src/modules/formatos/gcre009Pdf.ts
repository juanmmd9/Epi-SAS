/**
 * Rellena la plantilla oficial GC-RE-009 con pdf-lib.
 * Coordenadas calibradas sobre public/templates/GC-RE-009-v2.pdf (A4, 596 x 842 pt).
 * Los textos largos se ajustan en el mismo cuadro (fuente y interlineado más chicos).
 */
import { PDFDocument, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";
import { textoCompatibleWinAnsi } from "../../lib/pdfTextoWinAnsi";
import { rutaPublica } from "../../lib/rutaPublica";
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
  const respuesta = await fetch(rutaPublica(PLANTILLA_URL));
  if (!respuesta.ok) {
    throw new Error("No se pudo cargar la plantilla GC-RE-009.");
  }
  const buffer = await respuesta.arrayBuffer();
  const marca = new TextDecoder("ascii").decode(new Uint8Array(buffer).slice(0, 5));
  if (marca !== "%PDF-") {
    throw new Error("No se pudo cargar la plantilla GC-RE-009.");
  }
  plantillaCache = buffer;
  return plantillaCache;
}

/** Respeta saltos de línea y envuelve por ancho. */
function partirTexto(texto: string, font: PDFFont, fontSize: number, anchoMax: number): string[] {
  const normalizado = textoCompatibleWinAnsi(texto).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (!normalizado.trim()) return [];

  const lineas: string[] = [];
  for (const parrafo of normalizado.split("\n")) {
    if (parrafo.trim() === "") {
      lineas.push("");
      continue;
    }
    const palabras = parrafo.replace(/[ \t]+/g, " ").trim().split(" ");
    let linea = "";
    for (const palabra of palabras) {
      const prueba = linea ? `${linea} ${palabra}` : palabra;
      if (font.widthOfTextAtSize(prueba, fontSize) <= anchoMax) {
        linea = prueba;
        continue;
      }
      if (linea) lineas.push(linea);
      if (font.widthOfTextAtSize(palabra, fontSize) <= anchoMax) {
        linea = palabra;
        continue;
      }
      let fragmento = "";
      for (const ch of palabra) {
        const t = fragmento + ch;
        if (font.widthOfTextAtSize(t, fontSize) <= anchoMax) {
          fragmento = t;
        } else {
          if (fragmento) lineas.push(fragmento);
          fragmento = ch;
        }
      }
      linea = fragmento;
    }
    if (linea) lineas.push(linea);
  }
  return lineas;
}

interface CajaFija {
  x: number;
  yTop: number;
  width: number;
  fontSize?: number;
  maxLines?: number;
  lineHeight?: number;
}

/** Texto corto en casilla fija (sin ampliar). */
function escribirEnCaja(page: PDFPage, font: PDFFont, texto: string, caja: CajaFija) {
  const fontSize = caja.fontSize ?? 8;
  const lineHeight = caja.lineHeight ?? fontSize + 2;
  const maxLines = caja.maxLines ?? 1;
  const lineas = partirTexto(texto ?? "", font, fontSize, caja.width - 4).slice(0, maxLines);
  lineas.forEach((linea, indice) => {
    page.drawText(linea, {
      x: caja.x + 2,
      y: yDesdeArriba(caja.yTop + indice * lineHeight, fontSize),
      size: fontSize,
      font,
    });
  });
}

interface CajaAmpliable {
  x: number;
  /** Borde superior del cuadro (desde arriba de la página). */
  yTop: number;
  /** Borde inferior nominal del cuadro. */
  yBottom: number;
  /**
   * Si el texto no cabe ni con la fuente mínima, el cuadro puede bajar
   * hasta este límite (sigue siendo el mismo bloque del formulario).
   */
  yBottomMax?: number;
  width: number;
  /** Fuente preferida; se reduce hasta que quepa todo. */
  fontSizeMax?: number;
  fontSizeMin?: number;
}

/**
 * Escribe TODO el texto en el mismo cuadro: reduce fuente e interlineado
 * y, si hace falta, amplía el alto usable del cuadro hasta yBottomMax.
 */
function escribirEnCuadroAmpliado(
  page: PDFPage,
  font: PDFFont,
  texto: string,
  caja: CajaAmpliable,
) {
  const textoLimpio = textoCompatibleWinAnsi(texto ?? "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!textoLimpio) return;

  const ancho = caja.width - 4;
  const fontMax = caja.fontSizeMax ?? 8;
  const fontMin = caja.fontSizeMin ?? 4;
  const yBottomLimite = caja.yBottomMax ?? caja.yBottom;

  let yBottomUsado = caja.yBottom;
  let elegido = {
    fontSize: fontMin,
    lineHeight: fontMin + 1,
    lineas: partirTexto(textoLimpio, font, fontMin, ancho),
  };

  const intentar = (yBottom: number) => {
    const alto = Math.max(8, yBottom - caja.yTop);
    for (let fs = fontMax; fs >= fontMin - 0.01; fs -= 0.25) {
      const lineHeight = Math.max(fs + 0.8, fs * 1.12);
      const lineas = partirTexto(textoLimpio, font, fs, ancho);
      if (lineas.length * lineHeight <= alto + 0.5) {
        return { ok: true as const, fontSize: fs, lineHeight, lineas, yBottom };
      }
      elegido = { fontSize: fs, lineHeight, lineas };
    }
    const lineHeight = Math.max(elegido.fontSize * 0.92, alto / Math.max(1, elegido.lineas.length));
    return {
      ok: elegido.lineas.length * lineHeight <= alto + 0.5,
      fontSize: elegido.fontSize,
      lineHeight,
      lineas: elegido.lineas,
      yBottom,
    };
  };

  let resultado = intentar(caja.yBottom);
  if (!resultado.ok && yBottomLimite > caja.yBottom) {
    // Ampliar el cuadro hacia abajo hasta lograr caber el texto.
    for (let yb = caja.yBottom + 4; yb <= yBottomLimite; yb += 4) {
      resultado = intentar(yb);
      yBottomUsado = yb;
      if (resultado.ok) break;
    }
  } else {
    yBottomUsado = resultado.yBottom;
  }

  resultado.lineas.forEach((linea, indice) => {
    const yTopLinea = caja.yTop + indice * resultado.lineHeight;
    if (yTopLinea + resultado.fontSize > yBottomUsado + 1.5) return;
    page.drawText(linea || " ", {
      x: caja.x + 2,
      y: yDesdeArriba(yTopLinea, resultado.fontSize),
      size: resultado.fontSize,
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

  // Descripción: todo el bloque hasta "detectada por"
  escribirEnCuadroAmpliado(page, font, registro.descripcion, {
    x: 68, yTop: 220, yBottom: 298, width: 458, fontSizeMax: 8, fontSizeMin: 4.5,
  });

  const detectada = [registro.detectadaPorNombre, registro.detectadaPorCargo].filter(Boolean).join(" - ");
  escribirEnCaja(page, font, detectada, { x: 258, yTop: 305, width: 268, fontSize: 8, maxLines: 1 });

  escribirEnCuadroAmpliado(page, font, registro.tratamientoInmediato, {
    x: 68, yTop: 338, yBottom: 392, width: 458, fontSizeMax: 8, fontSizeMin: 4.5,
  });

  escribirEnCaja(page, font, registro.tratamientoInmediatoPor, {
    x: 158, yTop: 399, width: 130, fontSize: 8, maxLines: 1,
  });
  escribirEnCaja(page, font, formatearFecha(registro.tratamientoInmediatoFecha), {
    x: 338, yTop: 399, width: 185, fontSize: 8, maxLines: 1,
  });

  escribirEnCuadroAmpliado(page, font, registro.herramientaCausa, {
    x: 187, yTop: 448, yBottom: 492, width: 340, fontSizeMax: 8, fontSizeMin: 5,
  });

  // Resumen de causa: mismo cuadro; baja fuente y, si hace falta, amplía el alto
  escribirEnCuadroAmpliado(page, font, registro.resumenCausa, {
    x: 66,
    yTop: 500,
    yBottom: 576,
    yBottomMax: 628,
    width: 460,
    fontSizeMax: 8,
    fontSizeMin: 3.5,
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
  yBottom: number,
) {
  const columnas = [
    { x: 56, width: 112 },
    { x: 176, width: 148 },
    { x: 332, width: 86 },
    { x: 426, width: 112 },
  ];
  const valores = [fila.actividad, fila.responsable, formatearFecha(fila.fechaEntrega), fila.evidencia];
  columnas.forEach((col, indice) => {
    escribirEnCuadroAmpliado(page, font, valores[indice], {
      x: col.x,
      yTop,
      yBottom,
      width: col.width,
      fontSizeMax: 7,
      fontSizeMin: 4.5,
    });
  });
}

function escribirFilaSeguimiento(
  page: PDFPage,
  font: PDFFont,
  fila: RegistroNcDatos["seguimientoFilas"][number],
  yTop: number,
  yBottom: number,
) {
  const columnas = [
    { x: 56, width: 134 },
    { x: 198, width: 42 },
    { x: 248, width: 118 },
    { x: 374, width: 165 },
  ];
  const valores = [fila.actividad, textoSiNo(fila.cumplido), textoSiNo(fila.fueEficaz), fila.porque];
  columnas.forEach((col, indice) => {
    escribirEnCuadroAmpliado(page, font, valores[indice], {
      x: col.x, yTop, yBottom, width: col.width, fontSizeMax: 7, fontSizeMin: 4.5,
    });
  });
}

function escribirPagina2(page: PDFPage, font: PDFFont, registro: RegistroNcDatos) {
  // Tres filas de plan en el área de la tabla (antes solo 2 y se perdía texto).
  const filasPlan = [
    { yTop: 175, yBottom: 228 },
    { yTop: 230, yBottom: 278 },
    { yTop: 280, yBottom: 322 },
  ];
  registro.planAccion.slice(0, filasPlan.length).forEach((fila, indice) => {
    escribirFilaPlan(page, font, fila, filasPlan[indice].yTop, filasPlan[indice].yBottom);
  });

  escribirEnCaja(page, font, registro.seguimientoCumplimiento, {
    x: 226, yTop: 336, width: 17, fontSize: 8, maxLines: 1,
  });
  escribirEnCaja(page, font, registro.seguimientoEficacia, {
    x: 290, yTop: 337, width: 245, fontSize: 8, maxLines: 1,
  });

  const filasSeg = [
    { yTop: 382, yBottom: 430 },
    { yTop: 432, yBottom: 475 },
    { yTop: 477, yBottom: 518 },
  ];
  registro.seguimientoFilas.slice(0, filasSeg.length).forEach((fila, indice) => {
    escribirFilaSeguimiento(page, font, fila, filasSeg[indice].yTop, filasSeg[indice].yBottom);
  });

  const verificado = [registro.verificadoPorNombre, registro.verificadoPorCargo]
    .filter(Boolean)
    .join(" - ");
  escribirEnCaja(page, font, verificado, {
    x: 250, yTop: 530, width: 285, fontSize: 8, lineHeight: 10, maxLines: 2,
  });

  marcarSiNo(page, font, registro.tratamientoEficaz, 242, 287, 584);

  escribirEnCuadroAmpliado(page, font, registro.tratamientoEficazPorque, {
    x: 71, yTop: 620, yBottom: 720, width: 465, fontSizeMax: 8, fontSizeMin: 4.5,
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
  return generarPdfGcRe009(registro.datos, registro.numero);
}
