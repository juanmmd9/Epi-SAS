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

const confeccionHoras: RegistroNcDatos = {
  ...prefillDesdeIndicador({
    area: "Confeccion",
    indicador:
      "PORCENTAJE DE HORAS PERDIDAS POR MANTENIMIENTO CORRECTIVO (CONFECCION)",
    meta: "1%",
    valor: "2.92%",
    mes: 8,
    anio: 2026,
    descripcion:
      'Indicador "PORCENTAJE DE HORAS PERDIDAS POR MANTENIMIENTO CORRECTIVO (CONFECCION)" no cumple la meta (1%). Valor obtenido: 2.92%. Periodo: Agosto 2026.',
  }),
  fechaDeteccion: "2026-09-09",
  detectadaPorNombre: "Coordinación de Mantenimiento",
  detectadaPorCargo: "Coordinador de Mantenimiento",
  tratamientoInmediato:
    "Tras el temblor de agosto se bajó preventivamente aproximadamente la mitad de las máquinas de Confección al primer piso para reducir riesgo ante otro sismo. Se coordinó el traslado, reubicación y posterior verificación de equipos para reanudar operación con seguridad.",
  tratamientoInmediatoPor: "Mantenimiento / Confección",
  tratamientoInmediatoFecha: "2026-08-31",
  herramientaCausa: "Análisis de causa (evento externo + decisión preventiva)",
  resumenCausa:
    "En agosto 2026 un temblor llevó a bajar al primer piso cerca de la mitad de las máquinas de Confección por prevención ante otro sismo. Ese traslado y la interrupción asociada elevaron las horas de parada/correctivo contabilizadas, llevando el % de horas perdidas a 2.92% (meta ≤ 1%).",
  analisisPor: "Coordinación de Mantenimiento",
  analisisFecha: "2026-09-09",
  requiereAccionFormal: "si",
  planAccion: [
    {
      actividad:
        "Documentar protocolo de evacuación/reubicación de equipos ante sismo en Confección (prioridad, piso seguro, responsables).",
      responsable: "Líder Confección / Coordinador de Mantenimiento",
      fechaEntrega: "2026-09-30",
      evidencia: "Procedimiento o instructivo publicado",
    },
    {
      actividad:
        "Verificar que las máquinas reubicadas o retornadas queden operativas y sin pendientes de correctivo abiertos por el traslado.",
      responsable: "Operarios Confección / Mantenimiento",
      fechaEntrega: "2026-09-20",
      evidencia: "Lista de equipos verificados / cierres en portal",
    },
  ],
  seguimientoCumplimiento: "",
  seguimientoEficacia: "",
  seguimientoFilas: [
    {
      actividad: "Protocolo ante sismo Confección",
      cumplido: "",
      fueEficaz: "",
      porque: "",
    },
    {
      actividad: "Verificación de equipos reubicados",
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

const plasticosRespuesta: RegistroNcDatos = {
  ...prefillDesdeIndicador({
    area: "Plasticos",
    indicador:
      "TIEMPO DE RESPUESTA PROMEDIO DEL SERVICIO DE MANTENIMIENTO CORRECTIVO (PLASTICOS)",
    meta: "10 MINUTOS",
    valor: "28.80 min",
    mes: 8,
    anio: 2026,
    descripcion:
      'Indicador "TIEMPO DE RESPUESTA PROMEDIO DEL SERVICIO DE MANTENIMIENTO CORRECTIVO (PLASTICOS)" no cumple la meta (10 MINUTOS). Valor obtenido: 28.80 min. Periodo: Agosto 2026.',
  }),
  fechaDeteccion: "2026-09-09",
  detectadaPorNombre: "Coordinación de Mantenimiento",
  detectadaPorCargo: "Coordinador de Mantenimiento",
  tratamientoInmediato:
    "Se priorizaron atenciones urgentes en Plásticos tras la afectación por el temblor. Se gestionó la fabricación/pedido de repuestos que no estaban en stock y se reforzó la cobertura de personal disponible para reducir demoras de respuesta.",
  tratamientoInmediatoPor: "Mantenimiento / Plásticos",
  tratamientoInmediatoFecha: "2026-08-31",
  herramientaCausa: "5 porqués / análisis de capacidad y suministro",
  resumenCausa:
    "El tiempo de respuesta promedio en Plásticos fue 28.80 min (meta ≤ 10 min) por: (1) falta de personal de mantenimiento en el periodo; (2) paradas y reorganización por el temblor de agosto; (3) repuestos que debieron mandarse a fabricar, con demora de elaboración y entrega antes de poder atender/cerrar la solicitud.",
  analisisPor: "Coordinación de Mantenimiento",
  analisisFecha: "2026-09-09",
  requiereAccionFormal: "si",
  planAccion: [
    {
      actividad:
        "Asegurar cobertura mínima de personal de mantenimiento para Plásticos (turnos / apoyo cruzado).",
      responsable: "Coordinador de Mantenimiento",
      fechaEntrega: "2026-09-30",
      evidencia: "Programación de turnos / asignación de operarios",
    },
    {
      actividad:
        "Identificar repuestos críticos de Plásticos de fabricación externa y definir stock mínimo o proveedor con lead time acordado.",
      responsable: "Mantenimiento / Compras",
      fechaEntrega: "2026-10-15",
      evidencia: "Listado de críticos + órdenes o stock",
    },
  ],
  seguimientoCumplimiento: "",
  seguimientoEficacia: "",
  seguimientoFilas: [
    {
      actividad: "Cobertura de personal Plásticos",
      cumplido: "",
      fueEficaz: "",
      porque: "",
    },
    {
      actividad: "Repuestos críticos / lead time",
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

await guardar(confeccionHoras, "Confección horas perdidas");
await guardar(plasticosRespuesta, "Plásticos tiempo respuesta");
