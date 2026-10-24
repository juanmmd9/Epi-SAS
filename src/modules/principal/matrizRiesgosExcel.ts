import type { CellValue, ConditionalFormattingRule, Worksheet } from "exceljs";
import { nivelDe, valorDe, type DocumentoMatriz, type FilaMatriz } from "./matrizRiesgos";

function formulaNivel(valor: string, tipo: string): string {
  return `IF(${valor}="","",IF(${valor}<=15,"Bajo",IF(${valor}<=28,"Moderado",IF(${valor}<=40,"Alto",IF(${tipo}="Oportunidad","Alcanzable","Extremo")))))`;
}

function colorValor(valor: number | null): { fondo: string; letra: string } | null {
  if (valor == null) return null;
  if (valor <= 15) return { fondo: "FF4A86E8", letra: "FFFFFFFF" };
  if (valor <= 28) return { fondo: "FFFFFF00", letra: "FF000000" };
  return { fondo: "FFFF0000", letra: "FFFFFFFF" };
}

export async function descargarMatrizExcel(doc: DocumentoMatriz): Promise<void> {
  const ExcelJS = (await import("exceljs")).default;
  const libro = new ExcelJS.Workbook();
  libro.creator = "Portal Mantenimiento EPI";
  const hoja = libro.addWorksheet("MANTENIMIENTO", {
    views: [{ state: "frozen", ySplit: 6 }],
  });

  hoja.mergeCells("A1:C1");
  hoja.getCell("A1").value = "FECHA ÚLTIMA REVISIÓN";
  hoja.mergeCells("D1:E1");
  hoja.getCell("D1").value = doc.fechaRevision;
  hoja.getCell("J1").value = "ALTO/ALCANZABLE";
  hoja.getCell("J2").value = "MEDIO";
  hoja.getCell("J3").value = "BAJO";
  hoja.getCell("J1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFF0000" } };
  hoja.getCell("J1").font = { bold: true, color: { argb: "FFFFFFFF" } };
  hoja.getCell("J2").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } };
  hoja.getCell("J2").font = { bold: true };
  hoja.getCell("J3").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4A86E8" } };
  hoja.getCell("J3").font = { bold: true, color: { argb: "FFFFFFFF" } };

  hoja.mergeCells("P3:S3");
  hoja.getCell("P3").value = doc.anio;
  hoja.mergeCells("P4:S4");
  hoja.getCell("P4").value = "NUEVA CALIFICACION";
  hoja.getCell("P3").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF92D050" } };
  hoja.getCell("P4").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF92D050" } };
  hoja.getCell("P3").font = { bold: true };
  hoja.getCell("P4").font = { bold: true };

  const grupos: [string, string][] = [
    ["A5", "IDENTIFICACIÓN"],
    ["F5", "ANÁLISIS"],
    ["H5", "EVALUACIÓN"],
    ["J5", "TRATAMIENTO"],
    ["N5", "MONITOREO (ESTADO DEL RIESGO/OPORTUNIDAD)"],
    ["O5", "Fecha de seguimiento"],
    ["P5", "ANÁLISIS"],
    ["R5", "EVALUACIÓN"],
    ["T5", "Eficacia de las acciones tomadas"],
    ["U5", "Evaluador"],
    ["V5", "OBSERVACION"],
  ];
  hoja.mergeCells("A5:E5");
  hoja.mergeCells("F5:G5");
  hoja.mergeCells("H5:I5");
  hoja.mergeCells("J5:M5");
  hoja.mergeCells("N5:N6");
  hoja.mergeCells("O5:O6");
  hoja.mergeCells("P5:Q5");
  hoja.mergeCells("R5:S5");
  hoja.mergeCells("T5:T6");
  hoja.mergeCells("U5:U6");
  hoja.mergeCells("V5:V6");
  for (const [celda, texto] of grupos) hoja.getCell(celda).value = texto;

  const sub = [
    ["A6", "Proceso"],
    ["B6", "Riesgos/Oportunidad"],
    ["E6", "Tipo"],
    ["F6", "P"],
    ["G6", "C"],
    ["H6", "Valor"],
    ["I6", "Nivel"],
    ["J6", "Tipo"],
    ["K6", "ACCIONES A TOMAR"],
    ["L6", "RESPONSABLE"],
    ["M6", "INDICADOR"],
    ["P6", "P"],
    ["Q6", "C"],
    ["R6", "Valor"],
    ["S6", "Nivel"],
  ] as const;
  hoja.mergeCells("B6:D6");
  for (const [celda, texto] of sub) hoja.getCell(celda).value = texto;

  for (let fila = 5; fila <= 6; fila++) {
    for (let col = 1; col <= 22; col++) {
      const celda = hoja.getCell(fila, col);
      celda.font = { bold: true, size: 10 };
      celda.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      celda.border = borde();
      celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9E2F3" } };
    }
  }

  doc.filas.forEach((item, indice) => {
    const r = 7 + indice;
    escribirFila(hoja, r, item);
  });

  const ultima = Math.max(7, 6 + doc.filas.length);
  hoja.addConditionalFormatting({
    ref: `H7:H${ultima}`,
    rules: reglasColor(),
  });
  hoja.addConditionalFormatting({
    ref: `R7:R${ultima}`,
    rules: reglasColor(),
  });

  const hasta = Math.max(ultima, 40);
  lista(hoja, `E7:E${hasta}`, '"Riesgo,Oportunidad"');
  lista(hoja, `F7:F${hasta}`, '"3,7,10"');
  lista(hoja, `P7:P${hasta}`, '"3,7,10"');
  lista(hoja, `G7:G${hasta}`, '"1,2,3,4,5"');
  lista(hoja, `Q7:Q${hasta}`, '"1,2,3,4,5"');
  lista(
    hoja,
    `J7:J${hasta}`,
    '"Asumir,Eliminar,Evitar,Transferir,Controlar,Evaluar,Formular,Analizar,Considerar"',
  );
  lista(
    hoja,
    `N7:N${hasta}`,
    '"En gestión,Mitigación activa,Seguimiento activado,Resuelto (Riesgo u oportunidad sin prioridad),Asumido,Mitigación finalizada,Seguimiento finalizado,Mitigación no satisfactoria,Seguimiento no satisfatorio"',
  );
  lista(hoja, `T7:T${hasta}`, '"Eficaz,Aceptable,Regular,No se ha gestionado,No eficaz"');

  hoja.getCell(`A${ultima + 2}`).value = "GC-DO-007   VERSION 6   MAYO DE 2026";

  const anchos = [18, 28, 14, 12, 14, 8, 8, 10, 14, 14, 46, 28, 42, 26, 18, 8, 8, 10, 14, 22, 24, 42];
  anchos.forEach((ancho, i) => {
    hoja.getColumn(i + 1).width = ancho;
  });

  const buffer = await libro.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = "GC-DO-007 MATRIZ DE RIESGOS Y OPORTUNIDADES V6 - MANTENIMIENTO.xlsx";
  enlace.click();
  URL.revokeObjectURL(url);
}

function borde() {
  const lado = { style: "thin" as const, color: { argb: "FF000000" } };
  return { top: lado, left: lado, bottom: lado, right: lado };
}

function reglasColor(): ConditionalFormattingRule[] {
  const rojo = {
    type: "pattern" as const,
    pattern: "solid" as const,
    bgColor: { argb: "FFFF0000" },
  };
  const amarillo = {
    type: "pattern" as const,
    pattern: "solid" as const,
    bgColor: { argb: "FFFFFF00" },
  };
  const azul = {
    type: "pattern" as const,
    pattern: "solid" as const,
    bgColor: { argb: "FF4A86E8" },
  };
  return [
    {
      type: "cellIs",
      operator: "greaterThan",
      priority: 1,
      formulae: ["28"],
      style: { fill: rojo, font: { bold: true, color: { argb: "FFFFFFFF" } } },
    },
    {
      type: "cellIs",
      operator: "between",
      priority: 2,
      formulae: ["16", "28"],
      style: { fill: amarillo, font: { bold: true } },
    },
    {
      type: "cellIs",
      operator: "lessThan",
      priority: 3,
      formulae: ["16"],
      style: { fill: azul, font: { bold: true, color: { argb: "FFFFFFFF" } } },
    },
  ];
}

function lista(hoja: Worksheet, rango: string, formula: string) {
  const conListas = hoja as Worksheet & {
    dataValidations: { add: (sqref: string, regla: object) => void };
  };
  conListas.dataValidations.add(rango, {
    type: "list",
    allowBlank: true,
    formulae: [formula],
    showErrorMessage: true,
    error: "Use un valor de la lista.",
  });
}

function fechaExcel(iso: string): Date | null {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!partes) return null;
  return new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]));
}

function escribirFila(hoja: Worksheet, r: number, item: FilaMatriz) {
  hoja.mergeCells(`B${r}:D${r}`);
  const valores: unknown[] = [
    item.proceso,
    item.riesgo,
    "",
    "",
    item.tipo,
    item.p === "" ? null : item.p,
    item.c === "" ? null : item.c,
    { formula: `IF(OR(F${r}="",G${r}=""),"",F${r}*G${r})`, result: valorDe(item.p, item.c) ?? "" },
    { formula: formulaNivel(`H${r}`, `E${r}`), result: nivelDe(valorDe(item.p, item.c), item.tipo) },
    item.tratamiento,
    item.acciones,
    item.responsable,
    item.indicador,
    item.monitoreo,
    fechaExcel(item.fechaSeguimiento),
    item.pNueva === "" ? null : item.pNueva,
    item.cNueva === "" ? null : item.cNueva,
    {
      formula: `IF(OR(P${r}="",Q${r}=""),"",P${r}*Q${r})`,
      result: valorDe(item.pNueva, item.cNueva) ?? "",
    },
    {
      formula: formulaNivel(`R${r}`, `E${r}`),
      result: nivelDe(valorDe(item.pNueva, item.cNueva), item.tipo),
    },
    item.eficacia,
    item.evaluador,
    item.observacion,
  ];
  valores.forEach((valor, indice) => {
    const celda = hoja.getCell(r, indice + 1);
    celda.value = valor as CellValue;
    celda.border = borde();
    celda.alignment = {
      vertical: "middle",
      wrapText: true,
      horizontal: indice >= 4 && indice <= 9 || indice >= 13 && indice <= 20 ? "center" : "left",
    };
    celda.font = { size: 10 };
  });
  pintar(hoja, r, 8, valorDe(item.p, item.c));
  pintar(hoja, r, 9, valorDe(item.p, item.c));
  pintar(hoja, r, 18, valorDe(item.pNueva, item.cNueva));
  pintar(hoja, r, 19, valorDe(item.pNueva, item.cNueva));
  if (item.fechaSeguimiento) hoja.getCell(r, 15).numFmt = "DD/MM/YYYY";
}

function pintar(hoja: Worksheet, fila: number, col: number, valor: number | null) {
  const color = colorValor(valor);
  if (!color) return;
  const celda = hoja.getCell(fila, col);
  celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color.fondo } };
  celda.font = { bold: true, size: 10, color: { argb: color.letra } };
}
