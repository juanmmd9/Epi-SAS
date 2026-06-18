import { PDFDocument, StandardFonts } from "pdf-lib";
import { formatearTiempoConcedido } from "./permisosCalculo";
import type { EstadoPermiso, PermisoDatos, RegistroPermiso } from "./types";
import { MOTIVOS_PERMISO, TIPOS_REMUNERACION } from "./types";

const PAGE_W = 595;
const PAGE_H = 842;

function formatearFecha(fechaIso: string): string {
  if (!fechaIso) return "";
  const [y, m, d] = fechaIso.split("-");
  return `${d}/${m}/${y}`;
}

function partesFecha(fechaIso: string) {
  if (!fechaIso) return { dia: "", mes: "", anio: "" };
  const [y, m, d] = fechaIso.split("-");
  return { dia: d, mes: m, anio: y };
}

function etiquetaRemunerado(clave: string): string {
  return TIPOS_REMUNERACION.find((t) => t.clave === clave)?.etiqueta ?? clave;
}

function etiquetaMotivo(clave: string): string {
  return MOTIVOS_PERMISO.find((m) => m.clave === clave)?.etiqueta ?? clave;
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
  numero: number,
  estado: EstadoPermiso,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_W, PAGE_H]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const margin = 40;
  let y = PAGE_H - margin;

  const escribir = (texto: string, size = 9, negrita = false) => {
    page.drawText(texto, { x: margin, y, size, font: negrita ? bold : font });
    y -= size + 6;
  };

  const linea = (etiqueta: string, valor: string) => {
    page.drawText(etiqueta, { x: margin, y, size: 9, font: bold });
    page.drawText(valor || "—", { x: margin + 160, y, size: 9, font });
    y -= 14;
  };

  page.drawText("FORMATO SOLICITUD DE PERMISO", {
    x: margin,
    y,
    size: 14,
    font: bold,
  });
  y -= 22;
  page.drawText(`GH-RE-030  ·  No. ${numero}  ·  Estado: ${estado}`, {
    x: margin,
    y,
    size: 8,
    font,
  });
  y -= 24;

  escribir("DATOS DEL TRABAJADOR", 10, true);
  linea("Nombre y apellidos:", datos.nombreTrabajador);
  linea("No. cédula:", datos.cedula);

  const fe = partesFecha(datos.fechaElaboracion);
  linea(
    "Fecha elaboración:",
    `${fe.dia} / ${fe.mes} / ${fe.anio}`,
  );

  y -= 8;
  escribir("CONDICIONES DEL PERMISO", 10, true);

  const fd = partesFecha(datos.fechaDesde);
  const fh = partesFecha(datos.fechaHasta);
  linea("Fecha desde:", `${fd.dia} / ${fd.mes} / ${fd.anio}`);
  linea("Fecha hasta:", `${fh.dia} / ${fh.mes} / ${fh.anio}`);
  linea("Horario desde:", datos.horaDesde);
  linea("Horario hasta:", datos.horaHasta);
  linea(
    "Tiempo concedido:",
    formatearTiempoConcedido(datos.tiempoConcedidoMinutos),
  );
  linea("Hora salida GH:", datos.horaSalidaGh);
  linea("Hora llegada GH:", datos.horaLlegadaGh);

  y -= 8;
  linea("Tipo:", etiquetaRemunerado(datos.remunerado));
  linea("Motivo:", etiquetaMotivo(datos.motivo));

  y -= 8;
  escribir("DESCRIPCIÓN DEL PERMISO", 10, true);
  const desc = datos.descripcion || "—";
  page.drawText(desc.slice(0, 500), { x: margin, y, size: 9, font, maxWidth: PAGE_W - margin * 2 });
  y -= 40;

  escribir("OBSERVACIONES", 10, true);
  page.drawText((datos.observaciones || "—").slice(0, 300), {
    x: margin,
    y,
    size: 9,
    font,
    maxWidth: PAGE_W - margin * 2,
  });
  y -= 60;

  page.drawText("FIRMAS (solicitud / autorización / cierre)", {
    x: margin,
    y,
    size: 9,
    font: bold,
  });
  y -= 50;

  const firmas = [
    "Firma del trabajador",
    "Gerencia administrativa",
    "Jefe inmediato",
    "Gestión humana",
  ];
  firmas.forEach((firma, i) => {
    const x = margin + (i % 2) * 250;
    const fy = y - Math.floor(i / 2) * 55;
    page.drawLine({ start: { x, y: fy }, end: { x: x + 200, y: fy }, thickness: 0.5 });
    page.drawText(firma, { x, y: fy - 12, size: 7, font });
  });

  page.drawText(
    `Generado ${formatearFecha(new Date().toISOString().slice(0, 10))} — Portal Mantenimiento EPI`,
    { x: margin, y: 30, size: 7, font },
  );

  return doc.save();
}

export async function obtenerPdfPermiso(registro: RegistroPermiso): Promise<Uint8Array> {
  return generarPdfGhRe030(registro.datos, registro.numero, registro.estado);
}
