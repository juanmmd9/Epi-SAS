/**
 * Lista metas incumplidas (rojo/amarillo) para un mes.
 * Uso: npx tsx scripts/analizar-metas-rojo.ts [mes] [anio]
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

const mes = Number(process.argv[2] || 8);
const anio = Number(process.argv[3] || 2026);

async function main() {
  const {
    metasIncumplidasMes,
    cumplimientoPreventivoArea,
    clasificarCitasPreventivas,
  } = await import("../src/modules/indicadores/indicadoresCalculo");
  const { AREAS_CON_PM } = await import("../src/lib/areas");
  const { resolverHorariosAnio } = await import("../src/modules/permisos/horasLaborables");
  const { esPendienteAprobacionPm, pmCuentaParaCronograma } = await import(
    "../src/modules/preventivo/aprobacionPm"
  );
  const { supabase } = await import("../src/services/supabase");

  async function fetchAll(tabla: string) {
    const { data, error } = await supabase.from(tabla).select("*");
    if (error) throw new Error(`${tabla}: ${error.message}`);
    return data ?? [];
  }

  const [maquinas, excepciones, preventivo, correctivos, horas] = await Promise.all([
    fetchAll("hojas_vida"),
    fetchAll("cronograma_excepciones"),
    fetchAll("preventivo"),
    fetchAll("correctivo"),
    fetchAll("horas_programadas"),
  ]);

  let horarios: ReturnType<typeof resolverHorariosAnio> = [];
  let festivos: Array<{ id: string; anio: number; fecha: string; nombre: string }> = [];
  try {
    const { data: h } = await supabase.from("horario_laboral").select("*");
    const { data: f } = await supabase.from("festivos").select("*").eq("anio", anio);
    horarios = resolverHorariosAnio(anio, (h ?? []) as never);
    festivos = (f ?? []) as never;
  } catch (e) {
    console.warn("Horario/festivos parcial:", (e as Error).message);
  }

  const incumplidas = metasIncumplidasMes(
    maquinas as never,
    excepciones as never,
    preventivo as never,
    correctivos as never,
    horas as never,
    anio,
    mes,
    "",
    "",
    horarios,
    festivos,
  );

  console.log(
    JSON.stringify({ periodo: { mes, anio }, total: incumplidas.length, incumplidas }, null, 2),
  );

  const detallePm = [];
  for (const area of AREAS_CON_PM) {
    const datos = clasificarCitasPreventivas(
      maquinas as never,
      excepciones as never,
      preventivo as never,
      area,
      anio,
      mes,
    );
    const pct = cumplimientoPreventivoArea(
      maquinas as never,
      excepciones as never,
      preventivo as never,
      area,
      anio,
      mes,
    );
    detallePm.push({
      area,
      pct,
      cumplidas: datos.cumplidas.length,
      pendientes: datos.pendientes.length,
      enAprobacion: datos.enAprobacion?.length ?? 0,
      reprogramadas: datos.reprogramadas.length,
      total: datos.total,
      listaPendientes: datos.pendientes
        .slice(0, 20)
        .map((c) => `${c.codigo || "—"} ${c.nombre} (día ${c.dia})`),
      listaEnAprobacion: (datos.enAprobacion ?? [])
        .slice(0, 20)
        .map((c) => `${c.codigo || "—"} ${c.nombre} (día ${c.dia})`),
    });
  }

  const prefijo = `${anio}-${String(mes).padStart(2, "0")}`;
  const pmMes = (
    preventivo as {
      fecha: string;
      hoja_id: string | null;
      datos: Record<string, unknown>;
      area: string;
    }[]
  ).filter((r) => r.fecha?.startsWith(prefijo));

  const resumenRegistros = {
    total: pmMes.length,
    cuentan: pmMes.filter((r) => pmCuentaParaCronograma(r as never)).length,
    pendientesAprobacion: pmMes.filter((r) => esPendienteAprobacionPm(r as never)).length,
  };

  console.log("\n=== DETALLE PM ===");
  console.log(JSON.stringify({ resumenRegistros, detallePm }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
