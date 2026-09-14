import ExcelJS from "exceljs";
import type { Persona } from "../personal/types";
import { ETIQUETAS_ROL, type UsuarioPortal } from "./roles";

const ENCABEZADOS = [
  "Nombre",
  "Usuario (login)",
  "Correo Auth",
  "Rol",
  "Área",
  "Técnico vinculado",
  "Cargo técnico",
  "Cédula técnico",
  "Activo",
  "ID usuario",
] as const;

function mapaPersonal(personal: Persona[]): Map<string, Persona> {
  const map = new Map<string, Persona>();
  for (const p of personal) map.set(p.id, p);
  return map;
}

export async function generarExcelUsuariosPortal(
  usuarios: UsuarioPortal[],
  personal: Persona[],
): Promise<Blob> {
  const porId = mapaPersonal(personal);
  const libro = new ExcelJS.Workbook();
  libro.creator = "Portal Mantenimiento EPI";
  const hoja = libro.addWorksheet("Usuarios portal", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  const filaEnc = hoja.addRow([...ENCABEZADOS]);
  filaEnc.font = { bold: true, color: { argb: "FFFFFF" } };
  filaEnc.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "0B3D5C" },
  };
  filaEnc.alignment = { vertical: "middle", horizontal: "center" };

  for (const u of usuarios) {
    const tecnico = u.personal_id ? porId.get(u.personal_id) : undefined;
    hoja.addRow([
      u.nombre,
      u.usuario || "",
      u.email || "",
      ETIQUETAS_ROL[u.rol] ?? u.rol,
      u.area ?? "",
      tecnico?.nombre ?? "",
      tecnico?.cargo ?? "",
      tecnico?.cedula ?? "",
      u.activo ? "Sí" : "No",
      u.id,
    ]);
  }

  hoja.columns = [
    { width: 28 },
    { width: 18 },
    { width: 28 },
    { width: 20 },
    { width: 22 },
    { width: 28 },
    { width: 22 },
    { width: 14 },
    { width: 8 },
    { width: 38 },
  ];

  const out = await libro.xlsx.writeBuffer();
  return new Blob([new Uint8Array(out as ArrayBuffer)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function nombreArchivoUsuariosPortal(): string {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = String(hoy.getMonth() + 1).padStart(2, "0");
  const d = String(hoy.getDate()).padStart(2, "0");
  return `Usuarios-Portal-EPI_${y}-${m}-${d}.xlsx`;
}

export function descargarBlobExcel(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}
