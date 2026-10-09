/**
 * GH-RE-030 — Formato solicitud de permiso.
 * Layout alineado al formato oficial (logo EPI, grilla, firmas y pie).
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { textoCompatibleWinAnsi } from "../../lib/pdfTextoWinAnsi";
import { rutaPublica } from "../../lib/rutaPublica";
import { formatearTiempoConcedido } from "./permisosCalculo";
import { horaLocalAhora, type EstadoPermiso, type PermisoDatos, type RegistroPermiso } from "./types";

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 36;
const CONTENT_W = PAGE_W - MARGIN * 2;
const BLACK = rgb(0, 0, 0);
const GRAY = rgb(0.82, 0.82, 0.82);
/** Azul institucional EPI para el recuadro del logo. */
const AZUL_LOGO = rgb(0.05, 0.22, 0.55);
const LOGO_URL = "/Image/EPI-Logo.png";

type OpcionesTexto = Parameters<PDFPage["drawText"]>[1];

function drawText(page: PDFPage, text: string, options: OpcionesTexto) {
  page.drawText(textoCompatibleWinAnsi(text), options);
}

function yTop(y: number, size = 9): number {
  return PAGE_H - y - size;
}

function partesFecha(fechaIso: string) {
  if (!fechaIso) return { dia: "", mes: "", anio: "" };
  const [y, m, d] = fechaIso.split("-");
  return { dia: d ?? "", mes: m ?? "", anio: y ?? "" };
}

function horaDesdeIso(iso: string): string {
  if (!iso) return "";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "";
  return `${String(fecha.getHours()).padStart(2, "0")}:${String(fecha.getMinutes()).padStart(2, "0")}`;
}

/** Hora de elaboración para el PDF: guardada, o la del registro, o la actual. */
function resolverHoraElaboracion(datos: PermisoDatos, creadoEn?: string): string {
  const guardada = String(datos.horaElaboracion ?? "").trim();
  if (guardada) return guardada.slice(0, 5);
  const desdeCreacion = horaDesdeIso(creadoEn ?? "");
  if (desdeCreacion) return desdeCreacion;
  return horaLocalAhora();
}

function rect(
  page: PDFPage,
  x: number,
  yDesdeArriba: number,
  width: number,
  height: number,
  fill?: ReturnType<typeof rgb>,
) {
  page.drawRectangle({
    x,
    y: yTop(yDesdeArriba + height),
    width,
    height,
    borderColor: BLACK,
    borderWidth: 0.85,
    color: fill,
  });
}

function centrarTexto(
  page: PDFPage,
  texto: string,
  font: PDFFont,
  size: number,
  x: number,
  width: number,
  yBaseline: number,
) {
  const t = textoCompatibleWinAnsi(texto);
  if (!t) return;
  const tw = font.widthOfTextAtSize(t, size);
  drawText(page, t, {
    x: x + Math.max(1, (width - tw) / 2),
    y: yBaseline,
    size,
    font,
  });
}

/** Centra vertical y horizontalmente un texto dentro de un recuadro. */
function textoCentradoEnCaja(
  page: PDFPage,
  texto: string,
  font: PDFFont,
  size: number,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  centrarTexto(page, texto, font, size, x, w, yTop(y + h / 2 + size / 2, size));
}

/** Varias líneas centradas en bloque dentro de la caja. */
function textoMultilineaCentrado(
  page: PDFPage,
  lineas: string[],
  font: PDFFont,
  size: number,
  x: number,
  y: number,
  w: number,
  h: number,
  lineHeight = size + 2,
) {
  if (!lineas.length) return;
  const bloque = lineas.length * lineHeight;
  const yInicio = y + (h - bloque) / 2 + size;
  lineas.forEach((linea, i) => {
    centrarTexto(page, linea, font, size, x, w, yTop(yInicio + i * lineHeight, size));
  });
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

/** Celda con etiqueta arriba y valor centrado abajo. */
function celdaEtiquetaValor(
  page: PDFPage,
  font: PDFFont,
  bold: PDFFont,
  x: number,
  y: number,
  w: number,
  h: number,
  etiqueta: string,
  valor: string,
) {
  rect(page, x, y, w, h);
  const hEtiqueta = Math.min(12, h * 0.38);
  centrarTexto(page, etiqueta, bold, 6, x, w, yTop(y + hEtiqueta - 2, 6));
  textoCentradoEnCaja(page, valor, font, 10, x, y + hEtiqueta, w, h - hEtiqueta);
}

function checkbox(page: PDFPage, font: PDFFont, x: number, yCentro: number, marcado: boolean) {
  const size = 9;
  const boxY = yCentro - size / 2;
  page.drawRectangle({
    x,
    y: boxY,
    width: size,
    height: size,
    borderColor: BLACK,
    borderWidth: 0.85,
  });
  if (marcado) {
    drawText(page, "X", { x: x + 1.6, y: boxY + 1.2, size: 8, font });
  }
}

let logoCache: Uint8Array | null = null;
let logoAzulCache: Uint8Array | null = null;

async function cargarLogo(): Promise<Uint8Array | null> {
  if (logoCache) return logoCache;
  try {
    const respuesta = await fetch(rutaPublica(LOGO_URL));
    if (!respuesta.ok) return null;
    logoCache = new Uint8Array(await respuesta.arrayBuffer());
    return logoCache;
  } catch {
    return null;
  }
}

/** Sustituye el fondo negro del logo por azul institucional (mantiene icono y texto blancos). */
async function cargarLogoFondoAzul(): Promise<Uint8Array | null> {
  if (logoAzulCache) return logoAzulCache;
  const original = await cargarLogo();
  if (!original) return null;

  try {
    const blob = new Blob([original.slice()], { type: "image/png" });
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return original;

    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    const imagen = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imagen.data;
    // Azul institucional ≈ rgb(13, 56, 140)
    const br = 13;
    const bg = 56;
    const bb = 140;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      // Píxeles casi negros / gris muy oscuro del fondo
      if (max < 45 && max - min < 18) {
        data[i] = br;
        data[i + 1] = bg;
        data[i + 2] = bb;
      }
    }
    ctx.putImageData(imagen, 0, 0);

    const outBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png"),
    );
    if (!outBlob) return original;
    logoAzulCache = new Uint8Array(await outBlob.arrayBuffer());
    return logoAzulCache;
  } catch {
    return original;
  }
}

export function nombreArchivoPermiso(numero: number): string {
  return `GH-RE-030-${String(numero).padStart(4, "0")}.pdf`;
}

export function pdfBytesABlob(bytes: Uint8Array): Blob {
  const copia = bytes.slice();
  return new Blob([copia], { type: "application/pdf" });
}

export function urlVistaPreviaPdf(bytes: Uint8Array): string {
  return URL.createObjectURL(pdfBytesABlob(bytes));
}

export async function generarPdfGhRe030(
  datos: PermisoDatos,
  _numero: number,
  _estado: EstadoPermiso,
  creadoEn?: string,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_W, PAGE_H]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const horaElaboracion = resolverHoraElaboracion(datos, creadoEn);

  // —— Encabezado: logo (fondo azul) + título ——
  let y = 28;
  const hHeader = 52;
  const wLogo = 118;

  rect(page, MARGIN, y, wLogo, hHeader, AZUL_LOGO);
  rect(page, MARGIN + wLogo, y, CONTENT_W - wLogo, hHeader);

  const logoBytes = await cargarLogoFondoAzul();
  if (logoBytes) {
    try {
      const logo = await doc.embedPng(logoBytes);
      const pad = 6;
      const maxW = wLogo - pad * 2;
      const maxH = hHeader - pad * 2;
      const scale = Math.min(maxW / logo.width, maxH / logo.height);
      const w = logo.width * scale;
      const h = logo.height * scale;
      page.drawImage(logo, {
        x: MARGIN + (wLogo - w) / 2,
        y: yTop(y + (hHeader - h) / 2 + h),
        width: w,
        height: h,
      });
    } catch {
      textoCentradoEnCaja(page, "E.P.I.", bold, 14, MARGIN, y, wLogo, hHeader);
    }
  } else {
    textoCentradoEnCaja(page, "E.P.I.", bold, 14, MARGIN, y, wLogo, hHeader);
  }

  textoCentradoEnCaja(
    page,
    "FORMATO SOLICITUD DE PERMISO",
    bold,
    13,
    MARGIN + wLogo,
    y,
    CONTENT_W - wLogo,
    hHeader,
  );

  // —— Identificación trabajador ——
  y += hHeader;
  const hLab = 20;
  const hVal = 26;
  const wNombre = 220;
  const wCedula = 95;
  const wFecha = CONTENT_W - wNombre - wCedula;
  const wDia = 34;
  const wMes = 34;
  const wAnio = 48;
  const wHora = wFecha - wDia - wMes - wAnio;
  const anchosFecha = [wDia, wMes, wAnio, wHora];

  rect(page, MARGIN, y, wNombre, hLab, GRAY);
  textoCentradoEnCaja(
    page,
    "NOMBRE Y APELLIDOS DEL TRABAJADOR/A",
    bold,
    7,
    MARGIN,
    y,
    wNombre,
    hLab,
  );

  rect(page, MARGIN + wNombre, y, wCedula, hLab, GRAY);
  textoCentradoEnCaja(page, "No. CÉDULA", bold, 7, MARGIN + wNombre, y, wCedula, hLab);

  rect(page, MARGIN + wNombre + wCedula, y, wFecha, hLab, GRAY);
  textoCentradoEnCaja(
    page,
    "FECHA / HORA DE ELABORACIÓN",
    bold,
    7,
    MARGIN + wNombre + wCedula,
    y,
    wFecha,
    hLab * 0.55,
  );
  let xFechaLab = MARGIN + wNombre + wCedula;
  ["DIA", "MES", "AÑO", "HORA"].forEach((lab, i) => {
    centrarTexto(page, lab, bold, 6, xFechaLab, anchosFecha[i], yTop(y + hLab - 3, 6));
    xFechaLab += anchosFecha[i];
  });

  y += hLab;
  const fe = partesFecha(datos.fechaElaboracion);
  rect(page, MARGIN, y, wNombre, hVal);
  textoCentradoEnCaja(page, datos.nombreTrabajador || "", font, 10, MARGIN, y, wNombre, hVal);

  rect(page, MARGIN + wNombre, y, wCedula, hVal);
  textoCentradoEnCaja(page, datos.cedula || "", font, 10, MARGIN + wNombre, y, wCedula, hVal);

  const valoresFecha = [fe.dia, fe.mes, fe.anio, horaElaboracion];
  let xFechaVal = MARGIN + wNombre + wCedula;
  valoresFecha.forEach((val, i) => {
    rect(page, xFechaVal, y, anchosFecha[i], hVal);
    textoCentradoEnCaja(page, val, font, i === 3 ? 9 : 10, xFechaVal, y, anchosFecha[i], hVal);
    xFechaVal += anchosFecha[i];
  });

  // —— Condiciones del permiso ——
  y += hVal;
  const hCondTit = 16;
  rect(page, MARGIN, y, CONTENT_W, hCondTit, GRAY);
  textoCentradoEnCaja(page, "CONDICIONES DEL PERMISO", bold, 9, MARGIN, y, CONTENT_W, hCondTit);

  y += hCondTit;
  const hCondFila = 34;
  const hCondTotal = hCondFila * 2;

  // Grilla: fecha | horario | tiempo concedido (unificado) | hora GH
  const cLabF = 42;
  const cDia = 36;
  const cMes = 36;
  const cAnio = 46;
  const cLabH = 42;
  const cHora = 54;
  const cTiempo = 108;
  const cHoraGh =
    CONTENT_W - (cLabF + cDia + cMes + cAnio + cLabH + cHora + cTiempo);

  const x0 = MARGIN;
  const xDia = x0 + cLabF;
  const xMes = xDia + cDia;
  const xAnio = xMes + cMes;
  const xLabH = xAnio + cAnio;
  const xHora = xLabH + cLabH;
  const xTiempo = xHora + cHora;
  const xHoraGh = xTiempo + cTiempo;

  const fd = partesFecha(datos.fechaDesde);
  const fh = partesFecha(datos.fechaHasta);
  const minutos = Math.max(0, datos.tiempoConcedidoMinutos || 0);

  // Fila DESDE
  rect(page, x0, y, cLabF, hCondFila);
  textoCentradoEnCaja(page, "DESDE", bold, 7, x0, y, cLabF, hCondFila);

  celdaEtiquetaValor(page, font, bold, xDia, y, cDia, hCondFila, "DIA", fd.dia);
  celdaEtiquetaValor(page, font, bold, xMes, y, cMes, hCondFila, "MES", fd.mes);
  celdaEtiquetaValor(page, font, bold, xAnio, y, cAnio, hCondFila, "AÑO", fd.anio);

  rect(page, xLabH, y, cLabH, hCondFila);
  textoCentradoEnCaja(page, "DESDE", bold, 7, xLabH, y, cLabH, hCondFila);
  celdaEtiquetaValor(page, font, bold, xHora, y, cHora, hCondFila, "HORA", datos.horaDesde || "");

  // Tiempo concedido: un solo recuadro alineado (ambas filas)
  rect(page, xTiempo, y, cTiempo, hCondTotal);
  textoMultilineaCentrado(
    page,
    ["TIEMPO", "CONCEDIDO"],
    bold,
    7,
    xTiempo,
    y,
    cTiempo,
    hCondTotal * 0.48,
  );
  textoCentradoEnCaja(
    page,
    formatearTiempoConcedido(minutos),
    font,
    11,
    xTiempo,
    y + hCondTotal * 0.42,
    cTiempo,
    hCondTotal * 0.5,
  );

  // Hora confirmación salida GH
  rect(page, xHoraGh, y, cHoraGh, hCondTotal);
  textoMultilineaCentrado(
    page,
    partirTexto("HORA CONFIRMACIÓN SALIDA DE GESTIÓN HUMANA", bold, 6, cHoraGh - 8),
    bold,
    6,
    xHoraGh,
    y,
    cHoraGh,
    hCondTotal * 0.55,
    8,
  );
  textoCentradoEnCaja(
    page,
    datos.horaSalidaGh || "",
    font,
    12,
    xHoraGh,
    y + hCondTotal * 0.5,
    cHoraGh,
    hCondTotal * 0.42,
  );

  // Fila HASTA
  const yHasta = y + hCondFila;
  rect(page, x0, yHasta, cLabF, hCondFila);
  textoCentradoEnCaja(page, "HASTA", bold, 7, x0, yHasta, cLabF, hCondFila);

  celdaEtiquetaValor(page, font, bold, xDia, yHasta, cDia, hCondFila, "DIA", fh.dia);
  celdaEtiquetaValor(page, font, bold, xMes, yHasta, cMes, hCondFila, "MES", fh.mes);
  celdaEtiquetaValor(page, font, bold, xAnio, yHasta, cAnio, hCondFila, "AÑO", fh.anio);

  rect(page, xLabH, yHasta, cLabH, hCondFila);
  textoCentradoEnCaja(page, "HASTA", bold, 7, xLabH, yHasta, cLabH, hCondFila);
  celdaEtiquetaValor(
    page,
    font,
    bold,
    xHora,
    yHasta,
    cHora,
    hCondFila,
    "HORA",
    datos.horaHasta || "",
  );

  y = yHasta + hCondFila;

  // —— Tipos de permiso ——
  const hTipos = 26;
  rect(page, MARGIN, y, CONTENT_W, hTipos);
  const tipos = [
    { etiqueta: "PERMISO REMUNERADO", marcado: datos.remunerado === "remunerado" },
    { etiqueta: "NO REMUNERADO", marcado: datos.remunerado === "no_remunerado" },
    { etiqueta: "Permiso Personal", marcado: datos.motivo === "personal" },
    { etiqueta: "Salida Laboral", marcado: datos.motivo === "salida_laboral" },
  ];
  const colTipo = CONTENT_W / 4;
  const yCheck = yTop(y + hTipos / 2 + 4, 8);
  tipos.forEach((tipo, i) => {
    const x = MARGIN + i * colTipo;
    checkbox(page, bold, x + 10, yCheck + 3.5, tipo.marcado);
    drawText(page, tipo.etiqueta, {
      x: x + 24,
      y: yCheck,
      size: 7,
      font: bold,
    });
  });

  // —— Descripción ——
  y += hTipos;
  const hDescLab = 15;
  const hDesc = 88;
  rect(page, MARGIN, y, CONTENT_W, hDescLab, GRAY);
  textoCentradoEnCaja(page, "DESCRIPCIÓN DE PERMISO", bold, 8, MARGIN, y, CONTENT_W, hDescLab);
  y += hDescLab;
  rect(page, MARGIN, y, CONTENT_W, hDesc);
  partirTexto(datos.descripcion || "", font, 9, CONTENT_W - 14)
    .slice(0, 8)
    .forEach((linea, i) => {
      drawText(page, linea, {
        x: MARGIN + 7,
        y: yTop(y + 14 + i * 11, 9),
        size: 9,
        font,
      });
    });

  // —— Observaciones ——
  y += hDesc;
  const hObsLab = 15;
  const hObs = 70;
  rect(page, MARGIN, y, CONTENT_W, hObsLab, GRAY);
  textoCentradoEnCaja(page, "OBSERVACIONES", bold, 8, MARGIN, y, CONTENT_W, hObsLab);
  y += hObsLab;
  rect(page, MARGIN, y, CONTENT_W, hObs);
  partirTexto(datos.observaciones || "", font, 9, CONTENT_W - 14)
    .slice(0, 6)
    .forEach((linea, i) => {
      drawText(page, linea, {
        x: MARGIN + 7,
        y: yTop(y + 14 + i * 11, 9),
        size: 9,
        font,
      });
    });

  // —— Firmas ——
  y += hObs;
  const hFirmaTit = 26;
  const hFirmaCuerpo = 108;
  const wFirma = CONTENT_W / 4;
  const firmasCabecera = [
    "FIRMA DEL TRABAJADOR",
    "FIRMA DE GERENCIA ADMINISTRATIVA -AUTORIZADO-",
    "FIRMA JEFE INMEDIATO",
    "FIRMA GESTIÓN HUMANA",
  ];

  firmasCabecera.forEach((titulo, i) => {
    const x = MARGIN + i * wFirma;
    rect(page, x, y, wFirma, hFirmaTit, GRAY);
    textoMultilineaCentrado(
      page,
      partirTexto(titulo, bold, 6, wFirma - 8),
      bold,
      6,
      x,
      y,
      wFirma,
      hFirmaTit,
      8,
    );
  });

  y += hFirmaTit;
  const hMitad = hFirmaCuerpo / 2;

  rect(page, MARGIN, y, wFirma, hMitad);
  drawText(page, "1. Solicitud", {
    x: MARGIN + 5,
    y: yTop(y + 11, 7),
    size: 7,
    font,
  });
  rect(page, MARGIN, y + hMitad, wFirma, hMitad);
  drawText(page, "2. Cierre", {
    x: MARGIN + 5,
    y: yTop(y + hMitad + 11, 7),
    size: 7,
    font,
  });

  rect(page, MARGIN + wFirma, y, wFirma, hFirmaCuerpo);
  rect(page, MARGIN + wFirma * 2, y, wFirma, hFirmaCuerpo);

  rect(page, MARGIN + wFirma * 3, y, wFirma, hMitad);
  drawText(page, "Firma 1. Autoriza", {
    x: MARGIN + wFirma * 3 + 5,
    y: yTop(y + 11, 7),
    size: 7,
    font,
  });
  rect(page, MARGIN + wFirma * 3, y + hMitad, wFirma, hMitad);
  drawText(page, "Firma 2. Cierre (Hora Llegada)", {
    x: MARGIN + wFirma * 3 + 5,
    y: yTop(y + hMitad + 11, 7),
    size: 7,
    font,
  });
  if (datos.horaLlegadaGh) {
    textoCentradoEnCaja(
      page,
      datos.horaLlegadaGh,
      font,
      11,
      MARGIN + wFirma * 3,
      y + hMitad + 14,
      wFirma,
      hMitad - 14,
    );
  }

  // —— Pie ——
  y += hFirmaCuerpo;
  const hPie = 16;
  const pieCols = [
    { texto: "GH-RE-030", w: 110 },
    { texto: "VERSIÓN 1", w: 110 },
    { texto: "SEPTIEMBRE 2021", w: 180 },
    { texto: "Página 1 de 1", w: CONTENT_W - 110 - 110 - 180 },
  ];
  let xPie = MARGIN;
  for (const col of pieCols) {
    rect(page, xPie, y, col.w, hPie, GRAY);
    textoCentradoEnCaja(page, col.texto, bold, 7, xPie, y, col.w, hPie);
    xPie += col.w;
  }

  return doc.save();
}

export async function obtenerPdfPermiso(registro: RegistroPermiso): Promise<Uint8Array> {
  return generarPdfGhRe030(registro.datos, registro.numero, registro.estado, registro.creado_en);
}
