import { readFileSync } from "node:fs";
import {
  prefillDesdeIndicador,
  type RegistroNcDatos,
} from "../src/modules/formatos/types";

function cargarEnv() {
  const texto = readFileSync(".env", "utf8");
  for (const linea of texto.split(/\r?\n/)) {
    const m = linea.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const k = m[1].trim();
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}
cargarEnv();

const { supabase } = await import("../src/services/supabase");

const datos: RegistroNcDatos = {
  ...prefillDesdeIndicador({
    area: "Confeccion",
    indicador:
      "PORCENTAJE DE HORAS PERDIDAS POR MANTENIMIENTO CORRECTIVO (CONFECCION)",
    meta: "1%",
    valor: "5.03%",
    mes: 9,
    anio: 2026,
    descripcion:
      "En septiembre de 2026 Confeccion perdio 128,7 horas por mantenimiento correctivo. Eso es el 5,03% de 2.558,5 horas programadas. La meta es 1%.\n\n" +
      "Esas horas salen de 22 solicitudes cerradas. Otras 7 quedaron sin cierre y no se cuentan. El tiempo es de reparacion o de espera. No fue porque se demoraran en atender.\n\n" +
      "104 horas son 13 solicitudes abiertas mas de 3 dias. El indicador solo cuenta 8 horas por cada una. Varias se cerraron juntas el 14 de septiembre.\n\n" +
      "Las que mas se repitieron:\n" +
      "- Maquina K-03, dos veces (326 y 328): saltos de costura y hilo enredado. Suman 16 horas.\n" +
      "- Selladora SLLA1, dos veces (339 y 341): se pega con las bolsas y se dano la correa y la cinta. Suman 16 horas.\n\n" +
      "Las otras 9 solicitudes tambien cuentan 8 horas cada una:\n" +
      "- 323, cuerda: clavija de la lampara.\n" +
      "- 324, K-04: resorte de la manguera.\n" +
      "- 338, K-08: hilo en el disco de atras.\n" +
      "- 340, K-11: la maquina se pausa.\n" +
      "- 342, corte de reata: no calienta.\n" +
      "- 343, K-01: saltos de costura.\n" +
      "- 348, K-13: aguja partida.\n" +
      "- 352, corte y alistamiento: tornillo de la loteadora.\n" +
      "- 353, G-15: se revienta el hilo.\n\n" +
      "Las otras 24,7 horas son paradas de uno o dos dias. Esas horas se cuentan completas:\n" +
      "- 378, corte y alistamiento: se zafo un tornillo de la maquina de sellos. 12,5 horas.\n" +
      "- 355, G-17: tornillo rodado del clan. 4,3 horas.\n" +
      "- 381, loteadora: se traba y hay que correrla a mano. 2,4 horas.\n" +
      "- 367, K-03: se quedo pausada. 2,2 horas.\n" +
      "- 375, plastico del area: 1,4 horas.\n" +
      "- 368, K-14: aguja partida. 0,6 horas.\n" +
      "- 380, I-01: cambio de aguja. 0,5 horas.\n" +
      "- 374, K-02: manguera de aire desconectada. 0,4 horas.\n" +
      "- 376, K-12: aguja partida. 0,4 horas.\n\n" +
      "104 horas mas 24,7 horas suman las 128,7 horas del mes.",
  }),
  fechaDeteccion: "2026-10-06",
  detectadaPorNombre: "Coordinacion de Mantenimiento",
  detectadaPorCargo: "Coordinador de Mantenimiento",
  tratamientoInmediato:
    "Se volvieron a revisar las solicitudes de septiembre. K-03 y la selladora SLLA1 siguen siendo las que mas se repiten entre las abiertas varios dias.",
  tratamientoInmediatoPor: "Mantenimiento / Confeccion",
  tratamientoInmediatoFecha: "2026-10-06",
  herramientaCausa: "Revision de solicitudes del mes",
  resumenCausa:
    "Las 128,7 horas del 5,03% se parten en dos. 104 horas son 13 solicitudes abiertas mas de 3 dias: el indicador solo cuenta 8 horas por cada una. K-03 fallo dos veces en ese grupo y la selladora SLLA1 dos veces. Las otras 24,7 horas son paradas de uno o dos dias, contadas completas. La mas larga es un tornillo de la maquina de sellos (12,5 horas). No fue por demora en atender.",
  analisisPor: "Coordinacion de Mantenimiento",
  analisisFecha: "2026-10-06",
  requiereAccionFormal: "si",
  planAccion: [
    {
      actividad: "Revisar K-03: saltos de costura y que se queda pausada.",
      responsable: "Mantenimiento Confeccion",
      fechaEntrega: "2026-10-17",
      evidencia: "Maquina cosiendo",
    },
    {
      actividad: "Cambiar bandas y cinta de la selladora SLLA1.",
      responsable: "Mantenimiento Confeccion",
      fechaEntrega: "2026-10-17",
      evidencia: "Selladora en marcha",
    },
    {
      actividad: "Cerrar el mismo dia las fallas de aguja o salto de costura.",
      responsable: "Mantenimiento Confeccion",
      fechaEntrega: "2026-10-31",
      evidencia: "Solicitudes del mes cerradas el mismo dia",
    },
  ],
  seguimientoCumplimiento: "",
  seguimientoEficacia: "",
  seguimientoFilas: [
    { actividad: "Revision K-03", cumplido: "", fueEficaz: "", porque: "" },
    { actividad: "Selladora SLLA1", cumplido: "", fueEficaz: "", porque: "" },
    { actividad: "Cierre el mismo dia", cumplido: "", fueEficaz: "", porque: "" },
  ],
  verificadoPorNombre: "",
  verificadoPorCargo: "",
  tratamientoEficaz: "",
  tratamientoEficazPorque: "",
};

const { data: existentes, error: errorLista } = await supabase
  .from("no_conformidades")
  .select("id, numero, datos");
if (errorLista) {
  console.error(errorLista.message);
  process.exit(1);
}

const ya = (existentes ?? []).find((fila) => {
  const d = fila.datos as RegistroNcDatos;
  return (
    d.area === "Confeccion" &&
    d.origenIndicador?.mes === 9 &&
    d.origenIndicador?.anio === 2026 &&
    (d.origenIndicador?.indicador ?? "").includes("HORAS PERDIDAS")
  );
});

if (ya) {
  const { error } = await supabase.from("no_conformidades").update({ datos }).eq("id", ya.id);
  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  console.log(`Actualizado GC-RE-009 N° ${ya.numero}`);
} else {
  const { data, error } = await supabase
    .from("no_conformidades")
    .insert({ datos })
    .select()
    .single();
  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  console.log(`Guardado GC-RE-009 N° ${data.numero}`);
}
