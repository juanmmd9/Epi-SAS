import type { HorarioLaboralInput } from "./types";

/** Horario estándar EPI: lun–vie 7:30–12:00 y 13:00–16:30; sáb 8:00–12:00 */
export function horarioEstandarAnio(anio: number): HorarioLaboralInput[] {
  const filas: HorarioLaboralInput[] = [];

  for (let dia = 1; dia <= 5; dia += 1) {
    filas.push(
      { anio, dia_semana: dia, turno: 1, hora_inicio: "07:30", hora_fin: "12:00", activo: true },
      { anio, dia_semana: dia, turno: 2, hora_inicio: "13:00", hora_fin: "16:30", activo: true },
    );
  }

  filas.push({
    anio,
    dia_semana: 6,
    turno: 1,
    hora_inicio: "08:00",
    hora_fin: "12:00",
    activo: true,
  });

  return filas;
}
