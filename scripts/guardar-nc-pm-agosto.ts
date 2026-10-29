import { readFileSync } from "node:fs";
import { prefillDesdeIndicador, type RegistroNcDatos } from "../src/modules/formatos/types";

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

const datosBase = prefillDesdeIndicador({
  area: "Todas las areas PM",
  indicador: "CUMPLIMIENTO A MANTENIMIENTOS PREVENTIVOS",
  meta: "100%",
  valor: "40%",
  mes: 8,
  anio: 2026,
  descripcion:
    "Indicador \"CUMPLIMIENTO A MANTENIMIENTOS PREVENTIVOS\" no cumple la meta (100%). Valor obtenido: 40%. Periodo: Agosto 2026.",
});

const datos: RegistroNcDatos = {
  ...datosBase,
  fechaDeteccion: "2026-09-09",
  detectadaPorNombre: "Coordinación de Mantenimiento",
  detectadaPorCargo: "Coordinador de Mantenimiento",
  tratamientoInmediato:
    "Se revisó el cronograma de agosto 2026 por área. Se identificaron citas pendientes en Laboratorio (IP-06) y Tejidos (U-001, A-07). Plasticos cumplió al 100%. Se prioriza ejecutar/registrar y aprobar los PM pendientes y cerrar reprogramaciones abiertas.",
  tratamientoInmediatoPor: "Coordinación de Mantenimiento",
  tratamientoInmediatoFecha: "2026-09-09",
  herramientaCausa: "5 porqués / revisión de cronograma vs registros PM",
  resumenCausa:
    "En agosto 2026 había 5 citas programadas con PM (cumplidas 2 / pendientes 3 = 40%). Plasticos: 2/2 cumplidas. Laboratorio: 0/1 (IP-06 EQUIPO DE IMPACTO Y PENETRACIÓN, día 26, con reprogramación). Tejidos: 0/2 (U-001 URDIDORA día 19 y A-07 TRENZADORA DE ALMA PARA CUERDA día 15, ambas reprogramadas). Confeccion, Locativos y Logistica sin citas en el mes. No hay PM de agosto pendientes de aprobación: el incumplimiento se debe a citas del cronograma sin registro PM aprobado (o solo reprogramadas sin cumplimiento).",
  analisisPor: "Coordinación de Mantenimiento",
  analisisFecha: "2026-09-09",
  requiereAccionFormal: "si",
  planAccion: [
    {
      actividad:
        "Ejecutar y registrar el PM de Laboratorio IP-06 (impacto y penetración) y gestionar su aprobación.",
      responsable: "Operario Laboratorio / Líder de área",
      fechaEntrega: "2026-09-20",
      evidencia: "Registro MT-RE-045 aprobado en portal",
    },
    {
      actividad:
        "Ejecutar y registrar PM de Tejidos U-001 y A-07; cerrar o reprogramar formalmente en cronograma si aplica.",
      responsable: "Operario Tejidos / Líder de área",
      fechaEntrega: "2026-09-20",
      evidencia: "Registros PM aprobados y cronograma actualizado",
    },
    {
      actividad:
        "Seguimiento semanal del % de cumplimiento PM en Indicadores hasta recuperar 100% en el mes en curso.",
      responsable: "Coordinador de Mantenimiento",
      fechaEntrega: "2026-09-30",
      evidencia: "Captura tabla anual / panel preventivo",
    },
  ],
  seguimientoCumplimiento: "",
  seguimientoEficacia: "",
  seguimientoFilas: [
    { actividad: "PM Laboratorio IP-06", cumplido: "", fueEficaz: "", porque: "" },
    { actividad: "PM Tejidos U-001 y A-07", cumplido: "", fueEficaz: "", porque: "" },
  ],
  verificadoPorNombre: "",
  verificadoPorCargo: "",
  tratamientoEficaz: "",
  tratamientoEficazPorque: "",
};

const { data, error } = await supabase.from("no_conformidades").insert({ datos }).select().single();
if (error) {
  console.error("NO SE PUDO GUARDAR:", error.message, error.code, error.details);
  process.exit(1);
}
console.log("GUARDADO OK", JSON.stringify({ id: data.id, numero: data.numero }, null, 2));
