/**
 * Reescribe NC de horas perdidas agosto 2026 con desglose corroborado
 * (máquinas, intervenciones, aporte %). Sustituye la narrativa incorrecta A-06/A-07.
 * Uso: npx tsx scripts/actualizar-nc-horas-desglose.ts
 */
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

function texto5Porques(
  pasos: [string, string, string, string, string],
  conclusion: string,
): string {
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

const { supabase } = await import("../src/services/supabase");

const actualizaciones: Record<
  number,
  {
    resumenCausa: string;
    tratamientoInmediato?: string;
    extrasDatos?: Record<string, unknown>;
  }
> = {
  5: {
    resumenCausa: [
      "CORROBORACIÓN AGOSTO 2026 (misma fórmula del módulo Indicadores):",
      "• Confección: 20 solicitudes en el mes; 15 con tiempos válidos (solicitud/respuesta/cierre); 5 sin tiempos completos (no entran al %).",
      "• Horas programadas efectivas: 2.152 h. Horas perdidas indicador: 62,73 h. % = 2,92% (meta ≤ 1%).",
      "",
      "RANKING POR MÁQUINA (intervenciones / horas indicador / aporte al total de horas perdidas):",
      "1. K-04 — 3 intervenciones — 14,90 h (23,8%) — sols. 270, 283, 298 (traslados/reconexión por temblor).",
      "2. G-17 — 1 intervención — 8,68 h (13,8%) — sol. 292 (reinstalación máquina de cuerda).",
      "3. MAQUINAS CONFECCION — 1 — 8,00 h (12,8%, con tope de jornada) — sol. 299 (subir máquinas del 1er piso).",
      "4. K-08 — 2 — 7,37 h (11,7%) — sols. 281, 285 (traslado por temblor).",
      "5. K-14 — 1 — 7,00 h (11,2%) — sol. 284 (traslado).",
      "6. K-09 — 1 — 7,00 h (11,2%) — sol. 286 (traslado).",
      "7. CR-01 — 2 — 5,33 h (8,5%) — sols. 279, 287 (falla de proceso/temperatura).",
      "Resto: K-12, empaque, resistencias, etc. con menor aporte.",
      "",
      "Lectura: ~70%+ de las horas perdidas válidas están ligadas a traslados/reinstalación por el temblor (K-04, K-08, K-09, K-14, G-17, lote MAQUINAS CONFECCION), no a fallas repetitivas de una sola máquina de producción estable.",
      "",
      texto5Porques(
        [
          "El % de horas perdidas de Confección quedó en 2,92% (> 1%).",
          "Se acumularon ~62,7 h de parada/correctivo válidas, concentradas en K-04, G-17 y traslados de K/ lote confección.",
          "Esas horas corresponden sobre todo a bajar/subir e instalar máquinas tras el temblor, no a una falla crónica única.",
          "Se bajó preventivamente cerca de la mitad de las máquinas al primer piso por seguridad ante otro sismo.",
          "No había un protocolo de reubicación que limitara el tiempo de parada y la reinstalación controlada.",
        ],
        "Evento sísmico + reubicación masiva de máquinas de Confección sin procedimiento que contenga el impacto en horas perdidas (corroborado por ranking K-04 / traslados / sol. 299).",
      ),
    ].join("\n"),
    tratamientoInmediato:
      "Priorizar cierre de pendientes de reinstalación post-temblor; documentar protocolo de reubicación (orden, conexiones, tiempos) para futuros eventos.",
  },
  7: {
    resumenCausa: [
      "CORROBORACIÓN AGOSTO 2026 (fórmula Indicadores):",
      "• Plásticos: 7 solicitudes; 5 con tiempos válidos; 2 sin cierre/tiempos (no entran al %).",
      "• Horas programadas: 1.413 h. Horas perdidas indicador: 18,48 h. % = 1,31% (meta ≤ 1%, alerta).",
      "",
      "RANKING POR MÁQUINA:",
      "1. I-05 — 2 intervenciones — 10,70 h (57,9%) — sols. 276 (resistencia) y 317 (molde correas casco minero; H largo con tope de jornada).",
      "2. CH 03 — 1 — 4,03 h (21,8%) — sol. 296 (instalación nuevo chiller; G=88 min de respuesta).",
      "3. MOLDE MINERO — 1 — 2,75 h (14,9%) — sol. 336 (postizo).",
      "4. I-04 — 2 — 1,00 h (5,4%) — sols. 334, 335 (boquilla).",
      "5. YIZUMI 530 — 1 — 0 h en indicador (sin tiempos válidos completos) — sol. 277.",
      "",
      "Lectura: más de la mitad del indicador lo aporta I-05 (falla de molde/resistencia con reparación larga). El resto es instalación de chiller y moldes. No hay patrón de muchas intervenciones en la misma máquina; el impacto es pocas solicitudes con H alto.",
      "",
      texto5Porques(
        [
          "El % de horas perdidas en Plásticos quedó en 1,31% (sobre 1%).",
          "I-05 concentró ~58% de las horas (sols. 276 y 317); CH 03 y molde minero suman el resto relevante.",
          "La sol. 317 alargó mucho el tiempo de reparación (H alto; tope de jornada en el indicador).",
          "La atención/cierre se demoró por disponibilidad de personal y/o piezas no stock.",
          "Repuestos a fabricar + contingencia del temblor + cobertura insuficiente de personal para Plásticos.",
        ],
        "Pocas intervenciones pero de alto impacto (sobre todo I-05 molde/resistencia), agravadas por lead time de piezas y menor capacidad de respuesta en agosto.",
      ),
    ].join("\n"),
  },
  9: {
    resumenCausa: [
      "CORROBORACIÓN AGOSTO 2026 (fórmula Indicadores) — SE CORRIGE narrativa previa de alma A-06/A-07:",
      "En el mes NO aparecen correctivos de A-06 ni A-07 en el cálculo de horas perdidas de Tejidos.",
      "• Tejidos: 6 solicitudes; 5 con tiempos válidos; 1 sin tiempos (encarretadora cuerda 13, sol. 294).",
      "• Horas programadas: 408 h. Horas perdidas indicador: 30,28 h. % = 7,42% (meta ≤ 1%).",
      "",
      "RANKING POR MÁQUINA (intervenciones / horas / aporte):",
      "1. C-07 — 1 intervención — 11,82 h (39,0%) — sol. 289: «La guía de la cuerda se dañó» (G≈0, H=709 min).",
      "2. T-03 — 1 — 9,32 h (30,8%) — sol. 291: soporte del peine / tornillos que no ajustan (G=5, H=554).",
      "3. E03 — 1 — 4,33 h (14,3%) — sol. 280: no enrolla el hilo (G=5, H=255).",
      "4. C-05 — 1 — 2,63 h (8,7%) — sol. 290: tornillo de eje del carrete rodado (G=66, H=92).",
      "5. A-01 — 1 — 2,18 h (7,2%) — sol. 295: alma enredada con la guía (única solicitud de alma del mes; impacto menor).",
      "6. Encarretadora cuerda 13 — 1 — 0 h en indicador (sin tiempos válidos).",
      "",
      "Lectura exhaustiva:",
      "• C-07 + T-03 concentran ~70% de las horas perdidas (2 fallas mecánicas con reparación muy larga).",
      "• Cada máquina intervenida solo 1 vez en el mes: el problema no es recurrencia, sino duración de la reparación (H).",
      "• A-01 (alma) aporta solo ~7%; no justifica atribuir el 7,42% a «almas A-06/A-07».",
      "• La base de horas programadas de Tejidos (408 h) es baja vs otras áreas, por lo que pocas horas de parada disparan el %.",
      "",
      texto5Porques(
        [
          "El % de horas perdidas de Tejidos llegó a 7,42% (>> 1%).",
          "Casi 30 h de indicador se concentran en C-07 (guía de cuerda) y T-03 (soporte/peine), no en A-06/A-07.",
          "Esas dos reparaciones tuvieron H muy altos (709 y 554 min laborales) con una sola intervención cada una.",
          "La reparación se alargó (diagnóstico, piezas, o personal ocupado en otras labores de planta/temblor).",
          "No había anticipación (repuesto/ajuste preventivo) para guías/soportes críticos de C-07 y T-03, y la baja base de horas programadas amplifica el %.",
        ],
        "Paradas unitarias pero prolongadas en C-07 y T-03 (~70% del indicador); A-01 aporta poco; A-06/A-07 no figuran en agosto. Causa raíz: fallas mecánicas de alta duración de reparación + base horaria programada baja del área.",
      ),
    ].join("\n"),
    tratamientoInmediato:
      "Revisar estado de guía de cuerda C-07 y fijación soporte/peine T-03; definir repuestos/ajustes críticos. Descartar foco A-06/A-07 para este mes (sin correctivos en el indicador).",
    extrasDatos: {
      planAccion: [
        {
          actividad:
            "Inspección y estandarización de guía de cuerda en C-07; stock o lead time de repuesto de guía.",
          responsable: "Mantenimiento / Tejidos",
          fechaEntrega: "2026-10-15",
          evidencia: "Acta de inspección + solicitud de compra si aplica",
        },
        {
          actividad:
            "Revisión de tornillería/soporte de peine en T-03 (y similares); checklist de apriete en PM.",
          responsable: "Mantenimiento / Tejidos",
          fechaEntrega: "2026-10-15",
          evidencia: "Checklist PM actualizado / foto antes-después",
        },
        {
          actividad:
            "Seguir % horas perdidas Tejidos el mes siguiente hasta ≤ 1%; no atribuir desviación a A-06/A-07 sin datos.",
          responsable: "Coordinador de Mantenimiento",
          fechaEntrega: "2026-09-30",
          evidencia: "Captura Indicadores + desglose por máquina",
        },
      ],
    },
  },
};

const { data: filas, error: errList } = await supabase
  .from("no_conformidades")
  .select("id, numero, datos")
  .in("numero", [5, 7, 9])
  .order("numero");

if (errList) {
  console.error(errList.message);
  process.exit(1);
}

for (const fila of filas ?? []) {
  const cfg = actualizaciones[fila.numero as number];
  if (!cfg) continue;
  const prev = (fila.datos ?? {}) as Record<string, unknown>;
  const datos = {
    ...prev,
    ...cfg.extrasDatos,
    herramientaCausa: "5 porqués + desglose por máquina (correctivos del mes)",
    resumenCausa: cfg.resumenCausa,
    ...(cfg.tratamientoInmediato
      ? { tratamientoInmediato: cfg.tratamientoInmediato }
      : {}),
  };
  const { error } = await supabase
    .from("no_conformidades")
    .update({ datos })
    .eq("id", fila.id);
  if (error) {
    console.error(`Fallo N° ${fila.numero}:`, error.message);
    process.exit(1);
  }
  console.log(`Actualizado GC-RE-009 N° ${fila.numero}`);
}

// Mantener sincronizado el script de 5 porqués para no reintroducir A-06/A-07
console.log("Listo. Corroboración aplicada a N° 5, 7 y 9.");
