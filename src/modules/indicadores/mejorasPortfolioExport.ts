import type { Persona } from "../personal/types";
import { etiquetaEstadoMejora, type MejoraPortfolio } from "./mejorasPortfolioTypes";

function celda(valor: unknown): string {
  const texto = String(valor ?? "");
  return '"' + texto.replaceAll('"', '""') + '"';
}

export function exportarMejorasExcel(
  mejoras: MejoraPortfolio[],
  personalPorId: Map<string, Persona>,
  anio: number,
): void {
  const columnas = [
    "Fecha",
    "Título",
    "Área",
    "Estado",
    "Destacada",
    "Situación inicial",
    "Acción realizada",
    "Beneficio",
    "Equipo de mantenimiento",
    "Nº GC-RE-001",
    "Foto antes",
    "Foto después",
    "Fotos adicionales",
  ] as const;

  const filas = mejoras.map((m) => {
    const equipo = m.datos.personalIds
      .map((id) => {
        const p = personalPorId.get(id);
        return p ? p.nombre : null;
      })
      .filter((nombre): nombre is string => Boolean(nombre))
      .join(" / ");

    return [
      m.fecha,
      m.titulo,
      m.area ?? "",
      etiquetaEstadoMejora(m.datos.estado),
      m.datos.destacada ? "Sí" : "No",
      m.datos.situacion,
      m.datos.accion,
      m.datos.beneficio,
      equipo,
      m.datos.numeroAm ?? "",
      m.datos.fotoAntesUrl ?? "",
      m.datos.fotoDespuesUrl ?? "",
      m.datos.fotosExtras.join(" | "),
    ].map(celda).join(";");
  });

  const contenido = "\uFEFF" + [columnas.map(celda).join(";"), ...filas].join("\r\n");
  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `acciones_mejora_${anio}_${new Date().toISOString().slice(0, 10)}.csv`;
  enlace.click();
  URL.revokeObjectURL(url);
}
