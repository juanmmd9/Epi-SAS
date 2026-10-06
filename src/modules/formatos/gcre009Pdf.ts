/**
 * Rellena la plantilla oficial GC-RE-009 con pdf-lib.
 * Coordenadas calibradas sobre public/templates/GC-RE-009-v2.pdf (A4, 596 x 842 pt).
 * El texto se ajusta dentro del cuadro sin montar las líneas.
 * Si no cabe a un tamaño legible, el texto completo va en una hoja anexa.
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

function drawTextSafe(
  page: PDFPage,
  text: string,
  opts: { x: number; y: number; size: number; font: PDFFont },
) {
  const limpio = textoCompatibleWinAnsi(text);
  if (!limpio) return;
  page.drawText(limpio, opts);
}

function anchoSeguro(font: PDFFont, text: string, fontSize: number): number {
  return font.widthOfTextAtSize(textoCompatibleWinAnsi(text), fontSize);
}

function sanitizarDatosNc(datos: RegistroNcDatos): RegistroNcDatos {
  const t = (v: string | undefined | null) => textoCompatibleWinAnsi(v ?? "");
  return {
    ...datos,
    area: t(datos.area),
    fechaDeteccion: t(datos.fechaDeteccion),
    origen: datos.origen,
    origenIndicador: datos.origenIndicador
      ? {
          ...datos.origenIndicador,
          area: t(datos.origenIndicador.area),
          indicador: t(datos.origenIndicador.indicador),
          meta: t(datos.origenIndicador.meta),
          valor: t(datos.origenIndicador.valor),
        }
      : null,
    descripcion: t(datos.descripcion),
    detectadaPorNombre: t(datos.detectadaPorNombre),
    detectadaPorCargo: t(datos.detectadaPorCargo),
    tratamientoInmediato: t(datos.tratamientoInmediato),
    tratamientoInmediatoPor: t(datos.tratamientoInmediatoPor),
    tratamientoInmediatoFecha: t(datos.tratamientoInmediatoFecha),
    herramientaCausa: t(datos.herramientaCausa),
    resumenCausa: t(datos.resumenCausa),
    analisisPor: t(datos.analisisPor),
    analisisFecha: t(datos.analisisFecha),
    requiereAccionFormal: datos.requiereAccionFormal,
    planAccion: (datos.planAccion ?? []).map((f) => ({
      actividad: t(f.actividad),
      responsable: t(f.responsable),
      fechaEntrega: t(f.fechaEntrega),
      evidencia: t(f.evidencia),
    })),
    seguimientoCumplimiento: t(datos.seguimientoCumplimiento),
    seguimientoEficacia: t(datos.seguimientoEficacia),
    seguimientoFilas: (datos.seguimientoFilas ?? []).map((f) => ({
      actividad: t(f.actividad),
      cumplido: f.cumplido,
      fueEficaz: f.fueEficaz,
      porque: t(f.porque),
    })),
    verificadoPorNombre: t(datos.verificadoPorNombre),
    verificadoPorCargo: t(datos.verificadoPorCargo),
    tratamientoEficaz: datos.tratamientoEficaz,
    tratamientoEficazPorque: t(datos.tratamientoEficazPorque),
  };
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
      if (anchoSeguro(font, prueba, fontSize) <= anchoMax) {
        linea = prueba;
        continue;
      }
      if (linea) lineas.push(linea);
      if (anchoSeguro(font, palabra, fontSize) <= anchoMax) {
        linea = palabra;
        continue;
      }
      let fragmento = "";
      for (const ch of palabra) {
        const t = fragmento + ch;
        if (anchoSeguro(font, t, fontSize) <= anchoMax) {
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
    drawTextSafe(page, linea, {
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
  /** Si el texto no cabe, la última línea avisa que sigue en la hoja anexa. */
  avisarAnexo?: boolean;
}

const NOTA_ANEXO = "(Continua en la hoja anexa.)";

interface AjusteCuadro {
  fontSize: number;
  lineHeight: number;
  lineas: string[];
  caben: number;
  yBottom: number;
}

/**
 * Escribe el texto en el cuadro. Baja la fuente, pero el interlineado
 * nunca es menor que la letra: así las líneas no se montan.
 * Devuelve true si parte del texto no cupo.
 */
function escribirEnCuadroAmpliado(
  page: PDFPage,
  font: PDFFont,
  texto: string,
  caja: CajaAmpliable,
): boolean {
  const textoLimpio = textoCompatibleWinAnsi(texto ?? "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!textoLimpio) return false;

  const ancho = caja.width - 6;
  const fontMax = caja.fontSizeMax ?? 8;
  const fontMin = caja.fontSizeMin ?? 6.5;
  const yBottomLimite = caja.yBottomMax ?? caja.yBottom;

  const medir = (fs: number, yBottom: number): AjusteCuadro => {
    const alto = Math.max(8, yBottom - caja.yTop - 2);
    const lineHeight = fs + 1.8;
    const lineas = partirTexto(textoLimpio, font, fs, ancho);
    const caben = Math.max(1, Math.floor(alto / lineHeight));
    return { fontSize: fs, lineHeight, lineas, caben, yBottom };
  };

  const alturas = [caja.yBottom];
  if (yBottomLimite > caja.yBottom) {
    for (let yb = caja.yBottom + 4; yb <= yBottomLimite; yb += 4) alturas.push(yb);
  }

  let mejor = medir(fontMin, caja.yBottom);
  let cupo = false;
  for (const yBottom of alturas) {
    for (let fs = fontMax; fs >= fontMin - 0.01; fs -= 0.25) {
      const ajuste = medir(fs, yBottom);
      mejor = ajuste;
      if (ajuste.lineas.length <= ajuste.caben) {
        cupo = true;
        break;
      }
    }
    if (cupo) break;
  }

  let visibles = mejor.lineas;
  const sobro = visibles.length > mejor.caben;
  if (sobro) {
    const cupoTexto = caja.avisarAnexo ? Math.max(0, mejor.caben - 1) : mejor.caben;
    visibles = mejor.lineas.slice(0, cupoTexto);
    if (caja.avisarAnexo) visibles.push(NOTA_ANEXO);
  }

  visibles.forEach((linea, indice) => {
    const yTopLinea = caja.yTop + 2 + indice * mejor.lineHeight;
    if (yTopLinea + mejor.fontSize > mejor.yBottom + 1) return;
    drawTextSafe(page, linea || " ", {
      x: caja.x + 3,
      y: yDesdeArriba(yTopLinea, mejor.fontSize),
      size: mejor.fontSize,
      font,
    });
  });

  return sobro;
}

interface SeccionAnexo {
  titulo: string;
  texto: string;
}

function agregarHojasAnexo(
  pdfDoc: PDFDocument,
  font: PDFFont,
  fontBold: PDFFont,
  numero: number,
  secciones: SeccionAnexo[],
) {
  const pageW = 596;
  const marginX = 48;
  const headerTop = 36;
  const cuerpoTop = 78;
  const pieTop = PAGE_H - 36;
  const ancho = pageW - marginX * 2;

  const items: { text: string; size: number; bold: boolean; lh: number }[] = [];
  for (const seccion of secciones) {
    items.push({ text: seccion.titulo, size: 11, bold: true, lh: 16 });
    const cuerpo = textoCompatibleWinAnsi(seccion.texto).replace(/\n{3,}/g, "\n\n").trim();
    for (const linea of partirTexto(cuerpo, font, 10, ancho)) {
      items.push({ text: linea, size: 10, bold: false, lh: linea === "" ? 8 : 13 });
    }
    items.push({ text: "", size: 10, bold: false, lh: 10 });
  }

  let indice = 0;
  let hoja = 0;
  while (indice < items.length) {
    const page = pdfDoc.addPage([pageW, PAGE_H]);
    hoja += 1;
    drawTextSafe(page, "Equipos de Proteccion Individual", {
      x: marginX,
      y: yDesdeArriba(headerTop, 11),
      size: 11,
      font: fontBold,
    });
    drawTextSafe(page, `GC-RE-009 No. ${numero} - Continuacion`, {
      x: marginX,
      y: yDesdeArriba(headerTop + 16, 10),
      size: 10,
      font,
    });
    drawTextSafe(page, `Hoja anexa ${hoja}`, {
      x: pageW - marginX - 70,
      y: yDesdeArriba(headerTop + 16, 9),
      size: 9,
      font,
    });

    let yTop = cuerpoTop;
    while (indice < items.length) {
      const item = items[indice];
      if (yTop + item.lh > pieTop) break;
      if (item.text) {
        drawTextSafe(page, item.text, {
          x: marginX,
          y: yDesdeArriba(yTop, item.size),
          size: item.size,
          font: item.bold ? fontBold : font,
        });
      }
      yTop += item.lh;
      indice += 1;
    }

    drawTextSafe(page, "CODIGO GC-RE-009 - VERSION 2 - MAYO 2026", {
      x: marginX,
      y: yDesdeArriba(PAGE_H - 28, 8),
      size: 8,
      font,
    });
  }
}

function marcarOrigen(page: PDFPage, font: PDFFont, origen: string) {
  const marca = ORIGEN_MARCAS[origen];
  if (!marca) return;
  drawTextSafe(page, "X", { x: marca.x, y: yDesdeArriba(marca.yTop, 8), size: 8, font });
}

function marcarSiNo(page: PDFPage, font: PDFFont, valor: string, xSi: number, xNo: number, yTop: number) {
  if (valor === "si") {
    drawTextSafe(page, "X", { x: xSi, y: yDesdeArriba(yTop, 8), size: 8, font });
  } else if (valor === "no") {
    drawTextSafe(page, "X", { x: xNo, y: yDesdeArriba(yTop, 8), size: 8, font });
  }
}

function escribirPagina1(
  page: PDFPage,
  font: PDFFont,
  registro: RegistroNcDatos,
  numero: number,
  anexos: SeccionAnexo[],
) {
  escribirEnCaja(page, font, registro.area, { x: 118, yTop: 136, width: 95, fontSize: 9, maxLines: 1 });
  escribirEnCaja(page, font, formatearFecha(registro.fechaDeteccion), {
    x: 342, yTop: 136, width: 80, fontSize: 9, maxLines: 1,
  });
  escribirEnCaja(page, font, String(numero), { x: 453, yTop: 136, width: 68, fontSize: 9, maxLines: 1 });

  marcarOrigen(page, font, registro.origen);

  // Descripción: el cuadro es bajo. Si el texto no cabe, sigue en la hoja anexa.
  if (
    escribirEnCuadroAmpliado(page, font, registro.descripcion, {
      x: 68, yTop: 220, yBottom: 298, width: 458, fontSizeMax: 8, fontSizeMin: 7, avisarAnexo: true,
    })
  ) {
    anexos.push({ titulo: "Descripcion de la no conformidad", texto: registro.descripcion });
  }

  const detectada = [registro.detectadaPorNombre, registro.detectadaPorCargo].filter(Boolean).join(" - ");
  escribirEnCaja(page, font, detectada, { x: 258, yTop: 305, width: 268, fontSize: 8, maxLines: 1 });

  if (
    escribirEnCuadroAmpliado(page, font, registro.tratamientoInmediato, {
      x: 68, yTop: 338, yBottom: 392, width: 458, fontSizeMax: 8, fontSizeMin: 7, avisarAnexo: true,
    })
  ) {
    anexos.push({ titulo: "Tratamiento inmediato", texto: registro.tratamientoInmediato });
  }

  escribirEnCaja(page, font, registro.tratamientoInmediatoPor, {
    x: 158, yTop: 399, width: 130, fontSize: 8, maxLines: 1,
  });
  escribirEnCaja(page, font, formatearFecha(registro.tratamientoInmediatoFecha), {
    x: 338, yTop: 399, width: 185, fontSize: 8, maxLines: 1,
  });

  escribirEnCuadroAmpliado(page, font, registro.herramientaCausa, {
    x: 187, yTop: 448, yBottom: 492, width: 340, fontSizeMax: 8, fontSizeMin: 5,
  });

  // Resumen: cabe en su cuadro. No se baja sobre la fila de "Tratamiento ejecutado".
  if (
    escribirEnCuadroAmpliado(page, font, registro.resumenCausa, {
      x: 66,
      yTop: 508,
      yBottom: 568,
      width: 460,
      fontSizeMax: 8,
      fontSizeMin: 7,
      avisarAnexo: true,
    })
  ) {
    anexos.push({ titulo: "Resumen del analisis", texto: registro.resumenCausa });
  }

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

function escribirPagina2(
  page: PDFPage,
  font: PDFFont,
  registro: RegistroNcDatos,
  anexos: SeccionAnexo[],
) {
  // La plantilla trae dos filas de plan. La tercera se iba entre las tablas.
  const filasPlan = [
    { yTop: 178, yBottom: 230 },
    { yTop: 234, yBottom: 273 },
  ];
  registro.planAccion.slice(0, filasPlan.length).forEach((fila, indice) => {
    escribirFilaPlan(page, font, fila, filasPlan[indice].yTop, filasPlan[indice].yBottom);
  });
  const planExtra = registro.planAccion.slice(filasPlan.length).filter((fila) =>
    [fila.actividad, fila.responsable, fila.fechaEntrega, fila.evidencia].some((v) => v.trim()),
  );
  if (planExtra.length > 0) {
    const texto = planExtra
      .map(
        (fila) =>
          `${fila.actividad}\nResponsable: ${fila.responsable}\nFecha: ${formatearFecha(fila.fechaEntrega)}\nEvidencia: ${fila.evidencia}`,
      )
      .join("\n\n");
    anexos.push({ titulo: "Plan de accion (continuacion)", texto });
  }

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

  if (
    escribirEnCuadroAmpliado(page, font, registro.tratamientoEficazPorque, {
      x: 71, yTop: 620, yBottom: 720, width: 465, fontSizeMax: 8, fontSizeMin: 7, avisarAnexo: true,
    })
  ) {
    anexos.push({ titulo: "Por que el tratamiento fue o no eficaz", texto: registro.tratamientoEficazPorque });
  }
}

export async function generarPdfGcRe009(datos: RegistroNcDatos, numero: number): Promise<Uint8Array> {
  const datosPdf = sanitizarDatosNc(datos);
  const plantillaBytes = await cargarPlantilla();
  const pdfDoc = await PDFDocument.load(plantillaBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const paginas = pdfDoc.getPages();
  const anexos: SeccionAnexo[] = [];

  if (paginas[0]) escribirPagina1(paginas[0], font, datosPdf, numero, anexos);
  if (paginas[1]) escribirPagina2(paginas[1], font, datosPdf, anexos);
  if (anexos.length > 0) agregarHojasAnexo(pdfDoc, font, fontBold, numero, anexos);

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
