import { readFileSync } from "node:fs";

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

type Porques = [string, string, string, string, string];

function texto5Porques(pasos: Porques, conclusion: string): string {
  return [
    "5 PORQUÉS:",
    `1. ¿Por qué? ${pasos[0]}`,
    `2. ¿Por qué? ${pasos[1]}`,
    `3. ¿Por qué? ${pasos[2]}`,
    `4. ¿Por qué? ${pasos[3]}`,
    `5. ¿Por qué? ${pasos[4]}`,
    "",
    `Causa raíz: ${conclusion}`,
  ].join("\n");
}

const actualizaciones: Record<
  number,
  { porques: Porques; conclusion: string; contexto?: string }
> = {
  4: {
    contexto:
      "Indicador CUMPLIMIENTO A MANTENIMIENTOS PREVENTIVOS = 40% en agosto 2026 (meta 100%). Plasticos 100%; Laboratorio y Tejidos con citas pendientes/reprogramadas (IP-06, U-001, A-07).",
    porques: [
      "El % global de PM quedó en 40% (solo 2 de 5 citas del mes cumplidas).",
      "Laboratorio y Tejidos no tenían registro PM aprobado para las citas del mes (IP-06, U-001, A-07); varias quedaron solo reprogramadas.",
      "No se ejecutó/cerró a tiempo el preventivo programado ni se actualizó el cronograma hasta dejar la cita como cumplida.",
      "La operación priorizó correctivos y contingencias de planta sobre el cierre formal del PM del mes.",
      "Falta de seguimiento estricto al cronograma (ejecución + registro + aprobación) antes del cierre del periodo.",
    ],
    conclusion:
      "Debilidad en el control del ciclo PM (programar → ejecutar → registrar → aprobar) en Laboratorio y Tejidos, lo que deja citas pendientes/reprogramadas y baja el % global.",
  },
  5: {
    contexto:
      "Indicador % horas perdidas Confección = 2.92% (meta ≤ 1%) en agosto 2026.",
    porques: [
      "El % de horas perdidas de Confección superó la meta (2.92% > 1%).",
      "Hubo muchas horas de máquina fuera de producción / correctivo asociadas al traslado de equipos.",
      "Se bajó preventivamente cerca de la mitad de las máquinas al primer piso.",
      "Se tomó esa medida por seguridad ante el riesgo de otro sismo después del temblor de agosto.",
      "No existía un protocolo ágil de reubicación que minimizara tiempo de parada y reinstalación controlada.",
    ],
    conclusion:
      "Evento sísmico + decisión preventiva de bajar máquinas sin un procedimiento de reubicación que limite el impacto en horas perdidas.",
  },
  6: {
    contexto:
      "Indicador tiempo de respuesta Plásticos = 28.80 min (meta ≤ 10 min) en agosto 2026.",
    porques: [
      "El promedio de respuesta en Plásticos fue 28.80 minutos (por encima de 10).",
      "Las solicitudes no se atendieron de inmediato al reportarse.",
      "Había poca disponibilidad de personal de mantenimiento en el momento de las fallas.",
      "El personal estaba ocupado en contingencias del temblor y/o esperando repuestos no disponibles en stock.",
      "Varios repuestos debieron mandarse a fabricar (lead time de elaboración y entrega) y no había cobertura de turno suficiente para Plásticos.",
    ],
    conclusion:
      "Falta de capacidad de respuesta (personal) + dependencia de repuestos a fabricar, agravado por la contingencia del temblor.",
  },
  7: {
    contexto:
      "Indicador % horas perdidas Plásticos = 1.31% (meta ≤ 1%, alerta) en agosto 2026. Misma línea causal que el tiempo de respuesta.",
    porques: [
      "El % de horas perdidas en Plásticos quedó en 1.31% (sobre la meta del 1%).",
      "Las máquinas acumularon más tiempo paradas de lo esperado por correctivo.",
      "La atención y el cierre se demoraron (respuesta lenta y/o espera de piezas).",
      "Faltó personal disponible y hubo demora en repuestos fabricados a pedido, además de afectación por el temblor.",
      "No había stock/acuerdo de lead time para críticos ni cobertura mínima de personal para Plásticos en contingencia.",
    ],
    conclusion:
      "Mismas causas del indicador de respuesta: personal insuficiente + temblor + repuestos a fabricar, que alargan la parada y suben el % de horas perdidas.",
  },
  8: {
    contexto:
      "Indicador tiempo de respuesta Tejidos = 15.40 min (meta ≤ 10 min) en agosto 2026.",
    porques: [
      "El promedio de respuesta en Tejidos fue 15.40 minutos (sobre 10).",
      "Mantenimiento no llegó de inmediato a varias solicitudes del área.",
      "El personal de mantenimiento estaba ocupado en otras labores.",
      "Esas labores eran de apoyo/contingencia por el terremoto/temblor de agosto.",
      "No había una regla clara de quién deja la contingencia para atender correctivo prioritario de Tejidos.",
    ],
    conclusion:
      "Desvío del personal de mantenimiento hacia labores del temblor, sin prioridad formal para la respuesta correctiva de Tejidos.",
  },
  9: {
    contexto:
      "Indicador % horas perdidas Tejidos = 7.42% (meta ≤ 1%) en agosto 2026. Mayor impacto en trenzadoras de alma A-06 y A-07.",
    porques: [
      "El % de horas perdidas de Tejidos llegó a 7.42% (muy por encima de 1%).",
      "Hubo paradas prolongadas que concentraron gran parte de las horas.",
      "Las máquinas que más afectaron fueron las de alma A-06 y A-07.",
      "Esas fallas no se resolvieron con rapidez (demora de atención y/o de la reparación).",
      "El personal de mantenimiento estaba en labores del temblor y no había plan preventivo/repuestos críticos suficientes para A-06/A-07.",
    ],
    conclusion:
      "Paradas largas en trenzadoras de alma A-06 y A-07, agravadas por menor disponibilidad de mantenimiento tras el temblor y falta de anticipación de fallas/repuestos en esas máquinas.",
  },
};

const { data: filas, error: errList } = await supabase
  .from("no_conformidades")
  .select("id, numero, datos")
  .in("numero", [4, 5, 6, 7, 8, 9])
  .order("numero");

if (errList) {
  console.error(errList.message);
  process.exit(1);
}

for (const fila of filas ?? []) {
  const cfg = actualizaciones[fila.numero as number];
  if (!cfg) continue;
  const resumen =
    (cfg.contexto ? cfg.contexto + "\n\n" : "") +
    texto5Porques(cfg.porques, cfg.conclusion);
  const datos = {
    ...fila.datos,
    herramientaCausa: "5 porqués",
    resumenCausa: resumen,
  };
  const { error } = await supabase
    .from("no_conformidades")
    .update({ datos })
    .eq("id", fila.id);
  if (error) {
    console.error(`Fallo N° ${fila.numero}:`, error.message);
    process.exit(1);
  }
  console.log(`Actualizado GC-RE-009 N° ${fila.numero} con 5 porqués`);
}
