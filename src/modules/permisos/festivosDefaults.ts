import type { Festivo } from "./types";

export interface FestivoCatalogoInput {
  fecha: string;
  descripcion: string;
}

/** Festivos oficiales Colombia (ley emiliana aplicada). Ajustar por año en la UI. */
export function festivosColombiaAnio(anio: number): FestivoCatalogoInput[] {
  const mapa: Record<number, FestivoCatalogoInput[]> = {
    2026: [
      { fecha: "2026-01-01", descripcion: "Año Nuevo" },
      { fecha: "2026-01-12", descripcion: "Día de los Reyes Magos" },
      { fecha: "2026-03-23", descripcion: "Día de San José" },
      { fecha: "2026-04-02", descripcion: "Jueves Santo" },
      { fecha: "2026-04-03", descripcion: "Viernes Santo" },
      { fecha: "2026-05-01", descripcion: "Día del Trabajo" },
      { fecha: "2026-05-25", descripcion: "Ascensión del Señor" },
      { fecha: "2026-06-15", descripcion: "Corpus Christi" },
      { fecha: "2026-06-29", descripcion: "San Pedro y San Pablo" },
      { fecha: "2026-07-20", descripcion: "Día de la Independencia" },
      { fecha: "2026-08-07", descripcion: "Batalla de Boyacá" },
      { fecha: "2026-08-17", descripcion: "Asunción de la Virgen" },
      { fecha: "2026-10-12", descripcion: "Día de la Raza" },
      { fecha: "2026-11-02", descripcion: "Todos los Santos" },
      { fecha: "2026-11-16", descripcion: "Independencia de Cartagena" },
      { fecha: "2026-12-08", descripcion: "Inmaculada Concepción" },
      { fecha: "2026-12-25", descripcion: "Navidad" },
    ],
    2025: [
      { fecha: "2025-01-01", descripcion: "Año Nuevo" },
      { fecha: "2025-01-06", descripcion: "Día de los Reyes Magos" },
      { fecha: "2025-03-24", descripcion: "Día de San José" },
      { fecha: "2025-04-17", descripcion: "Jueves Santo" },
      { fecha: "2025-04-18", descripcion: "Viernes Santo" },
      { fecha: "2025-05-01", descripcion: "Día del Trabajo" },
      { fecha: "2025-06-02", descripcion: "Ascensión del Señor" },
      { fecha: "2025-06-23", descripcion: "Corpus Christi" },
      { fecha: "2025-06-30", descripcion: "San Pedro y San Pablo" },
      { fecha: "2025-07-20", descripcion: "Día de la Independencia" },
      { fecha: "2025-08-07", descripcion: "Batalla de Boyacá" },
      { fecha: "2025-08-18", descripcion: "Asunción de la Virgen" },
      { fecha: "2025-10-13", descripcion: "Día de la Raza" },
      { fecha: "2025-11-03", descripcion: "Todos los Santos" },
      { fecha: "2025-11-17", descripcion: "Independencia de Cartagena" },
      { fecha: "2025-12-08", descripcion: "Inmaculada Concepción" },
      { fecha: "2025-12-25", descripcion: "Navidad" },
    ],
  };

  return mapa[anio] ?? generarFestivosFijos(anio);
}

function generarFestivosFijos(anio: number): FestivoCatalogoInput[] {
  return [
    { fecha: `${anio}-01-01`, descripcion: "Año Nuevo" },
    { fecha: `${anio}-05-01`, descripcion: "Día del Trabajo" },
    { fecha: `${anio}-07-20`, descripcion: "Día de la Independencia" },
    { fecha: `${anio}-08-07`, descripcion: "Batalla de Boyacá" },
    { fecha: `${anio}-12-08`, descripcion: "Inmaculada Concepción" },
    { fecha: `${anio}-12-25`, descripcion: "Navidad" },
  ];
}

export function construirSetFestivos(festivos: Festivo[]): Set<string> {
  return new Set(festivos.map((f) => f.fecha.slice(0, 10)));
}
