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
      "Indicador % horas perdidas Confección = 2.92% (meta ≤ 1%) en agosto 2026. Ranking: K-04 23.8%, G-17 13.8%, lote máquinas 12.8%, K-08/K-14/K-09 traslados; ~62.7 h / 2152 h prog.",
    porques: [
      "El % de horas perdidas de Confección quedó en 2,92% (> 1%).",
      "Se acumularon ~62,7 h de parada/correctivo válidas, concentradas en K-04, G-17 y traslados de K/ lote confección.",
      "Esas horas corresponden sobre todo a bajar/subir e instalar máquinas tras el temblor, no a una falla crónica única.",
      "Se bajó preventivamente cerca de la mitad de las máquinas al primer piso por seguridad ante otro sismo.",
      "No había un protocolo de reubicación que limitara el tiempo de parada y la reinstalación controlada.",
    ],
    conclusion:
      "Evento sísmico + reubicación masiva de máquinas de Confección sin procedimiento que contenga el impacto en horas perdidas (corroborado por ranking K-04 / traslados / sol. 299).",
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
      "Indicador % horas perdidas Plásticos = 1.31% (meta ≤ 1%, alerta) en agosto 2026. I-05 aporta ~58% (2 ints.); CH 03 ~22%; molde minero ~15%.",
    porques: [
      "El % de horas perdidas en Plásticos quedó en 1,31% (sobre 1%).",
      "I-05 concentró ~58% de las horas (sols. 276 y 317); CH 03 y molde minero suman el resto relevante.",
      "La sol. 317 alargó mucho el tiempo de reparación (H alto; tope de jornada en el indicador).",
      "La atención/cierre se demoró por disponibilidad de personal y/o piezas no stock.",
      "Repuestos a fabricar + contingencia del temblor + cobertura insuficiente de personal para Plásticos.",
    ],
    conclusion:
      "Pocas intervenciones pero de alto impacto (sobre todo I-05 molde/resistencia), agravadas por lead time de piezas y menor capacidad de respuesta en agosto.",
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
      "Indicador % horas perdidas Tejidos = 7.42% (meta ≤ 1%) en agosto 2026. Desglose: C-07 39% + T-03 31% de las horas; A-06/A-07 NO figuran; A-01 solo ~7%.",
    porques: [
      "El % de horas perdidas de Tejidos llegó a 7.42% (muy por encima de 1%).",
      "Casi 30 h de indicador se concentran en C-07 (guía de cuerda) y T-03 (soporte/peine), no en A-06/A-07.",
      "Esas dos reparaciones tuvieron H muy altos (709 y 554 min laborales) con una sola intervención cada una.",
      "La reparación se alargó (diagnóstico, piezas, o personal ocupado en otras labores de planta/temblor).",
      "No había anticipación (repuesto/ajuste preventivo) para guías/soportes críticos de C-07 y T-03, y la baja base de horas programadas (408 h) amplifica el %.",
    ],
    conclusion:
      "Paradas unitarias pero prolongadas en C-07 y T-03 (~70% del indicador); A-01 aporta poco; A-06/A-07 no figuran en agosto. Causa raíz: fallas mecánicas de alta duración de reparación + base horaria programada baja del área.",
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
