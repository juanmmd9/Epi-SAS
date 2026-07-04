import { supabase } from "../../services/supabase";
import { aFechaIso } from "../../lib/fechas";
import type { ExcepcionCronograma, ExcepcionDatos } from "./types";

const TABLA = "cronograma_excepciones";

export async function listarExcepciones(): Promise<ExcepcionCronograma[]> {
  const { data, error } = await supabase.from(TABLA).select("*");
  if (error) throw new Error(error.message);
  return (data ?? []) as ExcepcionCronograma[];
}

export async function crearExcepcion(
  datos: ExcepcionDatos,
  motivo?: string,
): Promise<ExcepcionCronograma> {
  const { data, error } = await supabase
    .from(TABLA)
    .insert({
      fecha: aFechaIso(datos.anio, datos.mes, datos.dia),
      motivo: motivo ?? null,
      datos,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ExcepcionCronograma;
}

export async function eliminarExcepcion(id: string): Promise<void> {
  const { error } = await supabase.from(TABLA).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export interface ReprogramarCitaInput {
  area: string;
  anio: number;
  maquinaId: string;
  origenMes: number;
  origenDia: number;
  origenAutomatica: boolean;
  destinoMes: number;
  destinoDia: number;
}

/** Marca no realizado en fecha original y crea cita en nueva fecha (sin tocar hoja de vida). */
export async function reprogramarCitaPm(
  excepciones: ExcepcionCronograma[],
  input: ReprogramarCitaInput,
): Promise<ExcepcionCronograma[]> {
  const {
    area,
    anio,
    maquinaId,
    origenMes,
    origenDia,
    origenAutomatica,
    destinoMes,
    destinoDia,
  } = input;

  if (origenMes === destinoMes && origenDia === destinoDia) {
    throw new Error("Elige una fecha distinta a la programada.");
  }

  let fechaOriginal: ExcepcionDatos["reprogramadoDesde"] = {
    anio,
    mes: origenMes,
    dia: origenDia,
  };

  const nuevas: ExcepcionCronograma[] = [];

  if (origenAutomatica) {
    const yaMarcada = excepciones.some(
      (e) =>
        e.datos.tipo === "no_realizado" &&
        e.datos.maquinaId === maquinaId &&
        e.datos.anio === anio &&
        e.datos.mes === origenMes &&
        e.datos.dia === origenDia,
    );
    if (!yaMarcada) {
      nuevas.push(
        await crearExcepcion(
          {
            tipo: "no_realizado",
            area,
            maquinaId,
            anio,
            mes: origenMes,
            dia: origenDia,
          },
          "No se pudo en la fecha programada",
        ),
      );
    }
  } else {
    const anterior = excepciones.find(
      (e) =>
        e.datos.tipo === "agregar" &&
        e.datos.maquinaId === maquinaId &&
        e.datos.anio === anio &&
        e.datos.mes === origenMes &&
        e.datos.dia === origenDia,
    );
    if (anterior?.datos.reprogramadoDesde) {
      fechaOriginal = anterior.datos.reprogramadoDesde;
    }
    if (anterior) {
      await eliminarExcepcion(anterior.id);
    }
  }

  const destinoAnterior = excepciones.find(
    (e) =>
      e.datos.tipo === "agregar" &&
      e.datos.maquinaId === maquinaId &&
      e.datos.reprogramadoDesde?.anio === fechaOriginal.anio &&
      e.datos.reprogramadoDesde?.mes === fechaOriginal.mes &&
      e.datos.reprogramadoDesde?.dia === fechaOriginal.dia &&
      !(e.datos.mes === origenMes && e.datos.dia === origenDia && !origenAutomatica),
  );
  if (destinoAnterior) {
    await eliminarExcepcion(destinoAnterior.id);
  }

  nuevas.push(
    await crearExcepcion(
      {
        tipo: "agregar",
        area,
        maquinaId,
        anio,
        mes: destinoMes,
        dia: destinoDia,
        reprogramadoDesde: fechaOriginal,
      },
      "Reprogramado desde cronograma",
    ),
  );

  return nuevas;
}
