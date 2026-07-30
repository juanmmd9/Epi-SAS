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

export interface QuitarReprogramacionInput {
  area: string;
  anio: number;
  maquinaId: string;
  /** Día donde está la cita reprogramada (destino) o el origen no_realizado. */
  mesVista: number;
  diaVista: number;
}

/**
 * Revierte una reprogramación: borra el `agregar` destino y el `no_realizado` del origen.
 * La cita automática vuelve a la fecha original (sin tocar hoja de vida).
 */
export async function quitarReprogramacionPm(
  excepciones: ExcepcionCronograma[],
  input: QuitarReprogramacionInput,
): Promise<void> {
  const { area, anio, maquinaId, mesVista, diaVista } = input;
  void area;

  const agregarEnVista = excepciones.find(
    (e) =>
      e.datos.tipo === "agregar" &&
      e.datos.maquinaId === maquinaId &&
      e.datos.anio === anio &&
      e.datos.mes === mesVista &&
      e.datos.dia === diaVista &&
      Boolean(e.datos.reprogramadoDesde),
  );

  let fechaOriginal = agregarEnVista?.datos.reprogramadoDesde ?? null;
  let idAgregar: string | null = agregarEnVista?.id ?? null;

  if (!fechaOriginal || !idAgregar) {
    // Vista en origen (no_realizado): buscar el agregar que apunta a esta fecha
    const destino = excepciones.find((e) => {
      const d = e.datos;
      const desde = d.reprogramadoDesde;
      return (
        d.tipo === "agregar" &&
        d.maquinaId === maquinaId &&
        Boolean(desde) &&
        desde!.anio === anio &&
        desde!.mes === mesVista &&
        desde!.dia === diaVista
      );
    });
    if (!destino?.datos.reprogramadoDesde) {
      throw new Error("No se encontró una reprogramación para quitar en esta cita.");
    }
    fechaOriginal = destino.datos.reprogramadoDesde;
    idAgregar = destino.id;
  }

  await eliminarExcepcion(idAgregar);

  const noRealizado = excepciones.find(
    (e) =>
      e.datos.tipo === "no_realizado" &&
      e.datos.maquinaId === maquinaId &&
      e.datos.anio === fechaOriginal.anio &&
      e.datos.mes === fechaOriginal.mes &&
      e.datos.dia === fechaOriginal.dia,
  );
  if (noRealizado) {
    await eliminarExcepcion(noRealizado.id);
  }
}
