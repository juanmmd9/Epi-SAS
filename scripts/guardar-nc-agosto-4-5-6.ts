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

async function guardar(datos: RegistroNcDatos, etiqueta: string) {
  const { data, error } = await supabase
    .from("no_conformidades")
    .insert({ datos })
    .select()
    .single();
  if (error) {
    console.error(`FALLO ${etiqueta}:`, error.message);
    process.exit(1);
  }
  console.log(`OK ${etiqueta} → GC-RE-009 N° ${data.numero}`);
}

const plasticosHoras: RegistroNcDatos = {
  ...prefillDesdeIndicador({
    area: "Plasticos",
    indicador:
      "PORCENTAJE DE HORAS PERDIDAS POR MANTENIMIENTO CORRECTIVO (PLASTICOS)",
    meta: "1%",
    valor: "1.31%",
    mes: 8,
    anio: 2026,
    descripcion:
      'Indicador "PORCENTAJE DE HORAS PERDIDAS POR MANTENIMIENTO CORRECTIVO (PLASTICOS)" no cumple la meta (1%). Valor obtenido: 1.31%. Periodo: Agosto 2026. Severidad: alerta (amarillo).',
  }),
  fechaDeteccion: "2026-09-09",
  detectadaPorNombre: "Coordinación de Mantenimiento",
  detectadaPorCargo: "Coordinador de Mantenimiento",
  tratamientoInmediato:
    "Misma línea de acción que el indicador de tiempo de respuesta en Plásticos: priorizar atenciones, gestionar fabricación/entrega de repuestos y recuperar cobertura de personal tras el temblor.",
  tratamientoInmediatoPor: "Mantenimiento / Plásticos",
  tratamientoInmediatoFecha: "2026-08-31",
  herramientaCausa: "5 porqués / análisis de capacidad y suministro",
  resumenCausa:
    "El % de horas perdidas en Plásticos llegó a 1.31% (meta ≤ 1%, alerta). Misma causa raíz del tiempo de respuesta: falta de personal, afectación/paradas por el temblor de agosto y demora por repuestos mandados a fabricar (elaboración y entrega).",
  analisisPor: "Coordinación de Mantenimiento",
  analisisFecha: "2026-09-09",
  requiereAccionFormal: "si",
  planAccion: [
    {
      actividad:
        "Alinear con NC de tiempo de respuesta Plásticos: cobertura de personal y repuestos críticos con lead time definido.",
      responsable: "Coordinador de Mantenimiento / Compras",
      fechaEntrega: "2026-10-15",
      evidencia: "Turnos + listado de críticos",
    },
    {
      actividad:
        "Revisar en Indicadores el % de horas perdidas de Plásticos el mes siguiente hasta ≤ 1%.",
      responsable: "Coordinador de Mantenimiento",
      fechaEntrega: "2026-09-30",
      evidencia: "Tabla anual / captura del indicador",
    },
  ],
  seguimientoCumplimiento: "",
  seguimientoEficacia: "",
  seguimientoFilas: [
    {
      actividad: "Personal y repuestos Plásticos",
      cumplido: "",
      fueEficaz: "",
      porque: "",
    },
    {
      actividad: "Indicador horas perdidas ≤ 1%",
      cumplido: "",
      fueEficaz: "",
      porque: "",
    },
  ],
  verificadoPorNombre: "",
  verificadoPorCargo: "",
  tratamientoEficaz: "",
  tratamientoEficazPorque: "",
};

const tejidosRespuesta: RegistroNcDatos = {
  ...prefillDesdeIndicador({
    area: "Tejidos",
    indicador:
      "TIEMPO DE RESPUESTA PROMEDIO DEL SERVICIO DE MANTENIMIENTO CORRECTIVO (TEJIDOS)",
    meta: "10 MINUTOS",
    valor: "15.40 min",
    mes: 8,
    anio: 2026,
    descripcion:
      'Indicador "TIEMPO DE RESPUESTA PROMEDIO DEL SERVICIO DE MANTENIMIENTO CORRECTIVO (TEJIDOS)" no cumple la meta (10 MINUTOS). Valor obtenido: 15.40 min. Periodo: Agosto 2026.',
  }),
  fechaDeteccion: "2026-09-09",
  detectadaPorNombre: "Coordinación de Mantenimiento",
  detectadaPorCargo: "Coordinador de Mantenimiento",
  tratamientoInmediato:
    "Se reordenaron prioridades de atención en Tejidos una vez estabilizada la respuesta al temblor, para recuperar tiempos de respuesta del correctivo.",
  tratamientoInmediatoPor: "Mantenimiento / Tejidos",
  tratamientoInmediatoFecha: "2026-08-31",
  herramientaCausa: "5 porqués",
  resumenCausa:
    "El tiempo de respuesta promedio en Tejidos fue 15.40 min (meta ≤ 10 min) porque el personal de mantenimiento estaba ocupado en otras labores derivadas del terremoto/temblor de agosto, retrasando la atención de las solicitudes correctivas del área.",
  analisisPor: "Coordinación de Mantenimiento",
  analisisFecha: "2026-09-09",
  requiereAccionFormal: "si",
  planAccion: [
    {
      actividad:
        "Definir rol de atención correctiva prioritaria en Tejidos aunque haya emergencias de planta (quién responde primero).",
      responsable: "Coordinador de Mantenimiento",
      fechaEntrega: "2026-09-30",
      evidencia: "Asignación / instructivo de prioridades",
    },
    {
      actividad:
        "Monitorear tiempo de respuesta Tejidos en Indicadores hasta ≤ 10 min.",
      responsable: "Coordinador de Mantenimiento",
      fechaEntrega: "2026-09-30",
      evidencia: "Captura indicador mes siguiente",
    },
  ],
  seguimientoCumplimiento: "",
  seguimientoEficacia: "",
  seguimientoFilas: [
    {
      actividad: "Prioridad correctivo Tejidos",
      cumplido: "",
      fueEficaz: "",
      porque: "",
    },
    {
      actividad: "Indicador respuesta ≤ 10 min",
      cumplido: "",
      fueEficaz: "",
      porque: "",
    },
  ],
  verificadoPorNombre: "",
  verificadoPorCargo: "",
  tratamientoEficaz: "",
  tratamientoEficazPorque: "",
};

const tejidosHoras: RegistroNcDatos = {
  ...prefillDesdeIndicador({
    area: "Tejidos",
    indicador:
      "PORCENTAJE DE HORAS PERDIDAS POR MANTENIMIENTO CORRECTIVO (TEJIDOS)",
    meta: "1%",
    valor: "7.42%",
    mes: 8,
    anio: 2026,
    descripcion:
      'Indicador "PORCENTAJE DE HORAS PERDIDAS POR MANTENIMIENTO CORRECTIVO (TEJIDOS)" no cumple la meta (1%). Valor obtenido: 7.42%. Periodo: Agosto 2026.',
  }),
  fechaDeteccion: "2026-09-09",
  detectadaPorNombre: "Coordinación de Mantenimiento",
  detectadaPorCargo: "Coordinador de Mantenimiento",
  tratamientoInmediato:
    "Se priorizó la atención y cierre de correctivos en las trenzadoras de alma A-06 y A-07, identificadas como las paradas que más impactaron las horas perdidas de Tejidos en agosto.",
  tratamientoInmediatoPor: "Mantenimiento / Tejidos",
  tratamientoInmediatoFecha: "2026-08-31",
  herramientaCausa: "Análisis de Pareto / revisión de solicitudes",
  resumenCausa:
    "El % de horas perdidas en Tejidos fue 7.42% (meta ≤ 1%). Las paradas que más afectaron fueron las máquinas de alma A-06 y A-07 (trenzadoras de alma). A esto se suma la menor disponibilidad de personal de mantenimiento por labores asociadas al temblor, lo que alargó tiempos de atención y de máquina parada.",
  analisisPor: "Coordinación de Mantenimiento",
  analisisFecha: "2026-09-09",
  requiereAccionFormal: "si",
  planAccion: [
    {
      actividad:
        "Plan de mantenimiento / revisión de fallas recurrentes en trenzadoras de alma A-06 y A-07.",
      responsable: "Operario Tejidos / Coordinador de Mantenimiento",
      fechaEntrega: "2026-09-30",
      evidencia: "PM o correctivos cerrados + checklist",
    },
    {
      actividad:
        "Asegurar repuestos o ajustes críticos de A-06/A-07 para evitar paradas prolongadas.",
      responsable: "Mantenimiento / Compras",
      fechaEntrega: "2026-10-15",
      evidencia: "Pedido o stock de críticos",
    },
  ],
  seguimientoCumplimiento: "",
  seguimientoEficacia: "",
  seguimientoFilas: [
    {
      actividad: "Plan A-06 / A-07",
      cumplido: "",
      fueEficaz: "",
      porque: "",
    },
    {
      actividad: "Repuestos críticos alma",
      cumplido: "",
      fueEficaz: "",
      porque: "",
    },
  ],
  verificadoPorNombre: "",
  verificadoPorCargo: "",
  tratamientoEficaz: "",
  tratamientoEficazPorque: "",
};

await guardar(plasticosHoras, "Plásticos horas perdidas");
await guardar(tejidosRespuesta, "Tejidos tiempo respuesta");
await guardar(tejidosHoras, "Tejidos horas perdidas");
