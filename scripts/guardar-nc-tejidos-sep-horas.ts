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
    area: "Tejidos",
    indicador:
      "PORCENTAJE DE HORAS PERDIDAS POR MANTENIMIENTO CORRECTIVO (TEJIDOS)",
    meta: "1%",
    valor: "15.95%",
    mes: 9,
    anio: 2026,
    descripcion:
      "En Tejidos, las horas perdidas por correctivo superaron la meta del 1%. En septiembre de 2026 el resultado fue 15,95%: se perdieron 148 horas de las 927,7 horas programadas. Se cerraron 16 solicitudes.\n\n" +
      "La mayor parte (unas 70 h) son maquinas que estuvieron paradas 2 o 3 dias. Esas horas se cuentan completas:\n" +
      "- C-02, solicitud 356: se solto la cadena del carreto (18,4 h).\n" +
      "- B-02, solicitudes 337 y 370: no hacia el recorrido y se aflojaron los tornillos de la resistencia (16,4 h y 10,3 h).\n" +
      "- C-08, solicitud 372: la maquina quedo frenada (12,8 h).\n" +
      "- C-07, solicitud 364: se partieron tornillos de las bailarinas (12,5 h).\n\n" +
      "El resto (56 h) son 7 solicitudes abiertas mas de 3 dias por falta de repuesto. Cada una cuenta como maximo 8 h: A-05 (319), A-06 (321), A-07 (325), B-04 (331), C-06 (332) y A-03 (345 y 350).",
  }),
  fechaDeteccion: "2026-10-05",
  detectadaPorNombre: "Coordinacion de Mantenimiento",
  detectadaPorCargo: "Coordinador de Mantenimiento",
  tratamientoInmediato:
    "Se identificaron las solicitudes de septiembre que mas horas sumaron y se dejo pedido de repuestos pendientes de alma y de A-03.",
  tratamientoInmediatoPor: "Mantenimiento / Tejidos",
  tratamientoInmediatoFecha: "2026-10-05",
  herramientaCausa: "Revision de solicitudes del mes",
  resumenCausa:
    "El porcentaje subio a 15.95% porque varias maquinas quedaron paradas 2 o 3 dias (C-02, B-02, C-08 y C-07) y siete solicitudes esperaron repuesto mas de 3 dias. El tiempo de respuesta no fue la causa: casi todo el tiempo es de reparacion o espera.",
  analisisPor: "Coordinacion de Mantenimiento",
  analisisFecha: "2026-10-05",
  requiereAccionFormal: "si",
  planAccion: [
    {
      actividad: "Revisar la cadena del carreto de C-02 y dejar repuesto.",
      responsable: "Mantenimiento Tejidos",
      fechaEntrega: "2026-10-17",
      evidencia: "Solicitud cerrada o repuesto en stock",
    },
    {
      actividad: "Ajustar recorrido y tornillos de resistencia de B-02.",
      responsable: "Mantenimiento Tejidos",
      fechaEntrega: "2026-10-17",
      evidencia: "Maquina en marcha",
    },
    {
      actividad: "Pedir y montar repuestos de A-05, A-06, A-07 y sensores de A-03.",
      responsable: "Mantenimiento / Compras",
      fechaEntrega: "2026-10-31",
      evidencia: "Pedido y montaje",
    },
  ],
  seguimientoCumplimiento: "",
  seguimientoEficacia: "",
  seguimientoFilas: [
    { actividad: "Cadena C-02", cumplido: "", fueEficaz: "", porque: "" },
    { actividad: "Recorrido B-02", cumplido: "", fueEficaz: "", porque: "" },
    { actividad: "Repuestos alma y A-03", cumplido: "", fueEficaz: "", porque: "" },
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
    d.area === "Tejidos" &&
    d.origenIndicador?.mes === 9 &&
    d.origenIndicador?.anio === 2026 &&
    (d.origenIndicador?.indicador ?? "").includes("HORAS PERDIDAS")
  );
});

if (ya) {
  const { error } = await supabase
    .from("no_conformidades")
    .update({ datos })
    .eq("id", ya.id);
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
