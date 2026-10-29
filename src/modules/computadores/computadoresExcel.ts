import type { Computador } from "./types";
import { ETIQUETAS_TIPO_COMPUTADOR } from "./types";
import { compararCodigoPc } from "./computadoresUtil";

function numeroItem(codigo: string): number | string {
  const match = /PC\s*0*(\d+)/i.exec(codigo.trim());
  return match ? Number(match[1]) : codigo;
}

export async function generarExcelComputadores(lista: Computador[]): Promise<Blob> {
  const ExcelJS = (await import("exceljs")).default;
  const libro = new ExcelJS.Workbook();
  libro.creator = "Portal Mantenimiento EPI";
  libro.created = new Date();

  const hoja = libro.addWorksheet("Computadores", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  hoja.columns = [
    { header: "ITEM", key: "item", width: 8 },
    { header: "CÓDIGO", key: "codigo", width: 10 },
    { header: "UBICACIÓN", key: "ubicacion", width: 28 },
    { header: "TIPO", key: "tipo", width: 14 },
    { header: "USUARIO", key: "usuario", width: 24 },
    { header: "COMPRA", key: "compra", width: 14 },
    { header: "ÚLTIMO PM", key: "ultimo", width: 12 },
    { header: "PRÓXIMO PM", key: "proximo", width: 12 },
    { header: "FRECUENCIA (meses)", key: "frecuencia", width: 16 },
    { header: "ESTADO", key: "estado", width: 10 },
    { header: "SIESA", key: "siesa", width: 8 },
    { header: "MARCA", key: "marca", width: 14 },
    { header: "MODELO", key: "modelo", width: 16 },
    { header: "SERIAL", key: "serial", width: 18 },
    { header: "OBSERVACIONES", key: "obs", width: 36 },
  ];

  const header = hoja.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0B3D5C" },
  };
  header.alignment = { vertical: "middle", horizontal: "center" };

  const ordenados = [...lista].sort((a, b) => compararCodigoPc(a.codigo, b.codigo));
  for (const pc of ordenados) {
    hoja.addRow({
      item: numeroItem(pc.codigo),
      codigo: pc.codigo,
      ubicacion: pc.ubicacion,
      tipo: pc.datos.tipoDetalle || ETIQUETAS_TIPO_COMPUTADOR[pc.tipo] || pc.tipo,
      usuario: pc.usuario_asignado,
      compra: pc.datos.compra ?? "",
      ultimo: pc.ultimo_pm ?? "",
      proximo: pc.proximo_pm ?? "",
      frecuencia: pc.frecuencia_pm_meses,
      estado: pc.activa ? "Activo" : "Baja",
      siesa: pc.datos.siesa ?? "",
      marca: pc.datos.marca ?? "",
      modelo: pc.datos.modelo ?? "",
      serial: pc.datos.serial ?? "",
      obs: pc.datos.observaciones ?? "",
    });
  }

  hoja.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(1, ordenados.length + 1), column: 15 },
  };

  const out = await libro.xlsx.writeBuffer();
  return new Blob([new Uint8Array(out as ArrayBuffer)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function nombreArchivoComputadores(): string {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = String(hoy.getMonth() + 1).padStart(2, "0");
  const d = String(hoy.getDate()).padStart(2, "0");
  return `Computadores-EPI_${y}-${m}-${d}.xlsx`;
}

export function descargarBlobExcel(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}
