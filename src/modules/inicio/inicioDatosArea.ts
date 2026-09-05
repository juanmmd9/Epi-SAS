import { AREAS_CON_PM, coincideArea } from "../../lib/areas";
import { NOMBRES_MESES, valorFecha } from "../../lib/fechas";
import { mapaCitasDelAnio } from "../cronograma/cronogramaCalculo";
import { evaluarEstadoCitaPm, type EstadoCitaPm } from "../cronograma/cronogramaEstadoCita";
import type { CitaCronograma, ExcepcionCronograma } from "../cronograma/types";
import { hojaEstaActiva } from "../hojas/hojasFiltro";
import type { HojaVida } from "../hojas/types";
import { indicesPmCompletado, vincularPreventivoConHojas } from "../preventivo/pmCompletado";
import type { RegistroPreventivo } from "../preventivo/types";

export interface CitaMes extends CitaCronograma {
  dia: number;
  estado: EstadoCitaPm;
  reprogramadoA: { anio: number; mes: number; dia: number } | null;
}

export interface BloqueMes {
  mes: number;
  citas: CitaMes[];
  completadas: number;
}

export interface DatosArea {
  area: string;
  totalMaquinas: number;
  maquinasActivas: number;
  totalCitas: number;
  citasCompletadas: number;
  porMes: BloqueMes[];
  proximaCita: { nombre: string; codigo: string; dia: number; mes: number } | null;
}

export function construirDatosArea(
  area: string,
  anio: number,
  maquinas: HojaVida[],
  excepciones: ExcepcionCronograma[],
  preventivo: RegistroPreventivo[],
): DatosArea {
  const maquinasArea = maquinas.filter((m) => coincideArea(m.area, area));
  const maquinasPorId = new Map(maquinasArea.map((m) => [m.id, m]));
  const mapa = mapaCitasDelAnio(maquinas, excepciones, area, anio);
  const indicesCompletado = indicesPmCompletado(
    vincularPreventivoConHojas(preventivo, maquinas),
    anio,
    maquinas,
  );

  const hoy = new Date();
  const valorHoy = valorFecha(hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate());

  const porMes: BloqueMes[] = [];
  let totalCitas = 0;
  let citasCompletadas = 0;
  let proximaCita: DatosArea["proximaCita"] = null;

  for (let mes = 1; mes <= 12; mes++) {
    const citasMes: CitaMes[] = [];
    for (const [clave, citas] of mapa) {
      const [mesClave, diaClave] = clave.split("|").map(Number);
      if (mesClave !== mes) continue;
      for (const cita of citas) {
        const maquina = maquinasPorId.get(cita.maquinaId);

        const resultado = evaluarEstadoCitaPm(
          cita.maquinaId,
          area,
          anio,
          mes,
          diaClave,
          cita.origen,
          excepciones,
          indicesCompletado,
          valorHoy,
          maquina,
        );
        citasMes.push({
          ...cita,
          dia: diaClave,
          estado: resultado.estado,
          reprogramadoA: resultado.reprogramadoA,
        });
        totalCitas += 1;
        if (resultado.estado === "completada") citasCompletadas += 1;
        if (
          (resultado.estado === "programada" || resultado.estado === "reprogramada") &&
          valorFecha(anio, mes, diaClave) >= valorHoy &&
          (!proximaCita ||
            valorFecha(anio, mes, diaClave) <
              valorFecha(anio, proximaCita.mes, proximaCita.dia))
        ) {
          proximaCita = { nombre: cita.nombre, codigo: cita.codigo, dia: diaClave, mes };
        }
      }
    }
    if (citasMes.length > 0) {
      citasMes.sort((a, b) => a.dia - b.dia);
      porMes.push({
        mes,
        citas: citasMes,
        completadas: citasMes.filter((c) => c.estado === "completada").length,
      });
    }
  }

  return {
    area,
    totalMaquinas: maquinasArea.length,
    maquinasActivas: maquinasArea.filter((m) => hojaEstaActiva(m)).length,
    totalCitas,
    citasCompletadas,
    porMes,
    proximaCita,
  };
}

export function construirDatosTodasAreas(
  anio: number,
  maquinas: HojaVida[],
  excepciones: ExcepcionCronograma[],
  preventivo: RegistroPreventivo[],
): DatosArea[] {
  return AREAS_CON_PM.map((area) =>
    construirDatosArea(area, anio, maquinas, excepciones, preventivo),
  );
}

export function etiquetaMesCorto(mes: number): string {
  return NOMBRES_MESES[mes - 1]?.slice(0, 3) ?? "";
}
