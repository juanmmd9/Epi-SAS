/**
 * Rellena la plantilla oficial GC-RE-009 con pdf-lib.
 * Coordenadas calibradas sobre templates/GC-RE-009-v2.pdf (A4, 596 x 842 pt).
 */
const GCRE009_PAGE_H = 842;
const GCRE009_PAGE_W = 596;
const GCRE009_PLANTILLA_URL = "templates/GC-RE-009-v2.pdf";

const GCRE009_ORIGEN_MARCAS = {
  auditoria: { x: 124, yTop: 167 },
  queja: { x: 194, yTop: 167 },
  producto: { x: 305, yTop: 167 },
  indicador: { x: 453, yTop: 167 },
  proceso: { x: 78, yTop: 182 },
};

let plantillaGcRe009Cache = null;

function gcre009YDesdeArriba(yTop, fontSize = 9) {
  return GCRE009_PAGE_H - yTop - fontSize;
}

function formatearFechaGcRe009(fechaIso) {
  if (!fechaIso) return "";
  const partes = fechaIso.split("-");
  if (partes.length !== 3) return fechaIso;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function textoSiNoGcRe009(valor) {
  if (valor === "si") return "SI";
  if (valor === "no") return "NO";
  return "";
}

async function cargarPlantillaGcRe009() {
  if (plantillaGcRe009Cache) return plantillaGcRe009Cache;
  const respuesta = await fetch(GCRE009_PLANTILLA_URL);
  if (!respuesta.ok) {
    throw new Error("No se pudo cargar la plantilla GC-RE-009.");
  }
  plantillaGcRe009Cache = await respuesta.arrayBuffer();
  return plantillaGcRe009Cache;
}

function partirTextoGcRe009(texto, font, fontSize, anchoMax) {
  const palabras = String(texto || "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ");
  if (palabras.length === 0 || palabras[0] === "") return [];

  const lineas = [];
  let linea = "";
  palabras.forEach((palabra) => {
    const prueba = linea ? `${linea} ${palabra}` : palabra;
    const ancho = font.widthOfTextAtSize(prueba, fontSize);
    if (ancho <= anchoMax) {
      linea = prueba;
    } else {
      if (linea) lineas.push(linea);
      linea = palabra;
    }
  });
  if (linea) lineas.push(linea);
  return lineas;
}

function escribirEnCaja(page, font, texto, caja) {
  const {
    x,
    yTop,
    width,
    fontSize = 8,
    lineHeight = 10,
    maxLines = 8,
  } = caja;
  const lineas = partirTextoGcRe009(texto, font, fontSize, width - 4).slice(0, maxLines);
  lineas.forEach((linea, indice) => {
    page.drawText(linea, {
      x: x + 2,
      y: gcre009YDesdeArriba(yTop + indice * lineHeight, fontSize),
      size: fontSize,
      font,
    });
  });
}

function marcarOrigenGcRe009(page, font, origen) {
  const marca = GCRE009_ORIGEN_MARCAS[origen];
  if (!marca) return;
  page.drawText("X", {
    x: marca.x,
    y: gcre009YDesdeArriba(marca.yTop, 8),
    size: 8,
    font,
  });
}

function marcarSiNoEnLinea(page, font, valor, xSi, xNo, yTop) {
  if (valor === "si") {
    page.drawText("X", { x: xSi, y: gcre009YDesdeArriba(yTop, 8), size: 8, font });
  } else if (valor === "no") {
    page.drawText("X", { x: xNo, y: gcre009YDesdeArriba(yTop, 8), size: 8, font });
  }
}

function escribirPagina1GcRe009(page, font, registro) {
  // Fila AREA / Fecha / No. — los valores van DESPUES de cada etiqueta.
  escribirEnCaja(page, font, registro.area, { x: 118, yTop: 136, width: 95, fontSize: 9, maxLines: 1 });
  escribirEnCaja(page, font, formatearFechaGcRe009(registro.fechaDeteccion), {
    x: 342,
    yTop: 136,
    width: 80,
    fontSize: 9,
    maxLines: 1,
  });
  escribirEnCaja(page, font, registro.numero, { x: 453, yTop: 136, width: 68, fontSize: 9, maxLines: 1 });

  marcarOrigenGcRe009(page, font, registro.origen);

  // Caja de descripcion: inicia bajo el titulo de seccion (y=222).
  escribirEnCaja(page, font, registro.descripcion, {
    x: 68,
    yTop: 227,
    width: 458,
    fontSize: 8,
    lineHeight: 10,
    maxLines: 7,
  });

  const detectada = [registro.detectadaPorNombre, registro.detectadaPorCargo]
    .filter(Boolean)
    .join(" — ");
  escribirEnCaja(page, font, detectada, { x: 258, yTop: 305, width: 268, fontSize: 8, maxLines: 1 });

  // Texto del tratamiento bajo la etiqueta (etiqueta termina en y=341).
  escribirEnCaja(page, font, registro.tratamientoInmediato, {
    x: 68,
    yTop: 344,
    width: 458,
    fontSize: 8,
    lineHeight: 10,
    maxLines: 5,
  });

  escribirEnCaja(page, font, registro.tratamientoInmediatoPor, {
    x: 158,
    yTop: 399,
    width: 130,
    fontSize: 8,
    maxLines: 1,
  });
  escribirEnCaja(page, font, formatearFechaGcRe009(registro.tratamientoInmediatoFecha), {
    x: 338,
    yTop: 399,
    width: 185,
    fontSize: 8,
    maxLines: 1,
  });

  escribirEnCaja(page, font, registro.herramientaCausa, {
    x: 187,
    yTop: 455,
    width: 340,
    fontSize: 8,
    lineHeight: 11,
    maxLines: 3,
  });
  // Resumen bajo la etiqueta "Resumen del analisis:" (termina en y=508).
  escribirEnCaja(page, font, registro.resumenCausa, {
    x: 66,
    yTop: 511,
    width: 460,
    fontSize: 8,
    lineHeight: 10,
    maxLines: 6,
  });
  escribirEnCaja(page, font, registro.analisisPor, { x: 226, yTop: 580, width: 135, fontSize: 8, maxLines: 1 });
  escribirEnCaja(page, font, formatearFechaGcRe009(registro.analisisFecha), {
    x: 412,
    yTop: 580,
    width: 115,
    fontSize: 8,
    maxLines: 1,
  });

  // Casillas "( ) Si | ( ) NO" en y=634-649.
  marcarSiNoEnLinea(page, font, registro.requiereAccionFormal, 282, 313, 637);
}

function escribirFilaTablaPlan(page, font, fila, yTop, maxLines) {
  // Columnas de la tabla plan de accion: lineas verticales en 53|172|328|422|542.
  const columnas = [
    { x: 56, width: 112 },
    { x: 176, width: 148 },
    { x: 332, width: 86 },
    { x: 426, width: 112 },
  ];
  const valores = [
    fila.actividad,
    fila.responsable,
    formatearFechaGcRe009(fila.fechaEntrega),
    fila.evidencia,
  ];
  columnas.forEach((col, indice) => {
    escribirEnCaja(page, font, valores[indice], {
      x: col.x,
      yTop,
      width: col.width,
      fontSize: 7,
      lineHeight: 9,
      maxLines,
    });
  });
}

function escribirFilaTablaSeguimiento(page, font, fila, yTop) {
  // Columnas tabla seguimiento: lineas verticales en 52|194|244|370|543.
  const columnas = [
    { x: 56, width: 134 },
    { x: 198, width: 42 },
    { x: 248, width: 118 },
    { x: 374, width: 165 },
  ];
  const valores = [
    fila.actividad,
    textoSiNoGcRe009(fila.cumplido),
    textoSiNoGcRe009(fila.fueEficaz),
    fila.porque,
  ];
  columnas.forEach((col, indice) => {
    escribirEnCaja(page, font, valores[indice], {
      x: col.x,
      yTop,
      width: col.width,
      fontSize: 7,
      lineHeight: 9,
      maxLines: 2,
    });
  });
}

function escribirPagina2GcRe009(page, font, registro) {
  // El encabezado de la tabla termina en y=177; filas de datos: 177-233 y 233-276.
  const filasPlan = [
    { yTop: 182, maxLines: 5 },
    { yTop: 238, maxLines: 4 },
  ];
  (registro.planAccion || []).slice(0, filasPlan.length).forEach((fila, indice) => {
    escribirFilaTablaPlan(page, font, fila, filasPlan[indice].yTop, filasPlan[indice].maxLines);
  });

  // Respuesta corta (SI/NO) junto a cada pregunta.
  escribirEnCaja(page, font, registro.seguimientoCumplimiento, {
    x: 226,
    yTop: 336,
    width: 17,
    fontSize: 8,
    maxLines: 1,
  });
  escribirEnCaja(page, font, registro.seguimientoEficacia, {
    x: 290,
    yTop: 337,
    width: 245,
    fontSize: 8,
    maxLines: 1,
  });

  // Encabezado tabla seguimiento termina en y=383; filas: 383-439, 439-482, 482-525.
  const filasSegY = [388, 444, 487];
  (registro.seguimientoFilas || []).slice(0, filasSegY.length).forEach((fila, indice) => {
    escribirFilaTablaSeguimiento(page, font, fila, filasSegY[indice]);
  });

  // Celda derecha junto a "Tratamiento Verificado Por" (fila y=525-553).
  const verificado = [registro.verificadoPorNombre, registro.verificadoPorCargo]
    .filter(Boolean)
    .join(" — ");
  escribirEnCaja(page, font, verificado, { x: 250, yTop: 530, width: 285, fontSize: 8, lineHeight: 10, maxLines: 2 });

  // "Si" termina en x=238 y "No" en x=283 (linea y=581-595).
  marcarSiNoEnLinea(page, font, registro.tratamientoEficaz, 242, 287, 584);

  // Respuesta bajo la etiqueta "¿Por que?" (termina en y=622).
  escribirEnCaja(page, font, registro.tratamientoEficazPorque, {
    x: 71,
    yTop: 626,
    width: 465,
    fontSize: 8,
    lineHeight: 10,
    maxLines: 8,
  });
}

async function generarPdfGcRe009(registro) {
  if (!window.PDFLib) {
    throw new Error("La libreria pdf-lib no esta cargada.");
  }

  const { PDFDocument, StandardFonts } = PDFLib;
  const plantillaBytes = await cargarPlantillaGcRe009();
  const pdfDoc = await PDFDocument.load(plantillaBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const paginas = pdfDoc.getPages();

  if (paginas[0]) escribirPagina1GcRe009(paginas[0], font, registro);
  if (paginas[1]) escribirPagina2GcRe009(paginas[1], font, registro);

  return pdfDoc.save();
}

function nombreArchivoPdfGcRe009(registro) {
  const numero = String(registro.numero || "sin-numero").replace(/[^\w.-]+/g, "_");
  return `GC-RE-009_No_${numero}.pdf`;
}

function abrirPdfGcRe009EnNavegador(pdfBytes, registro) {
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const ventana = window.open(url, "_blank", "noopener,noreferrer");
  if (!ventana) {
    alert("Permite ventanas emergentes para ver el PDF generado.");
  }
  setTimeout(() => URL.revokeObjectURL(url), 120000);
  return url;
}

function mostrarPdfGcRe009EnIframe(pdfBytes) {
  const iframe = document.getElementById("iframePdfGcRe009");
  const panel = document.getElementById("panelVistaPdfGcRe009");
  if (!iframe || !panel) return null;

  if (iframe.dataset.urlActual) {
    URL.revokeObjectURL(iframe.dataset.urlActual);
  }

  const url = URL.createObjectURL(new Blob([pdfBytes], { type: "application/pdf" }));
  iframe.src = url;
  iframe.dataset.urlActual = url;
  panel.hidden = false;
  panel.scrollIntoView({ behavior: "smooth", block: "start" });
  return url;
}

async function obtenerPdfGcRe009Registro(registro) {
  if (typeof leerPdfGcRe009DesdeIdb === "function") {
    const guardado = await leerPdfGcRe009DesdeIdb(registro.id);
    if (guardado) return guardado;
  }
  return generarPdfGcRe009(registro);
}

window.generarPdfGcRe009 = generarPdfGcRe009;
window.obtenerPdfGcRe009Registro = obtenerPdfGcRe009Registro;
window.abrirPdfGcRe009EnNavegador = abrirPdfGcRe009EnNavegador;
window.mostrarPdfGcRe009EnIframe = mostrarPdfGcRe009EnIframe;
window.nombreArchivoPdfGcRe009 = nombreArchivoPdfGcRe009;
