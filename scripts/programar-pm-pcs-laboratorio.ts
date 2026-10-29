/**
 * Programa próximo PM = 2026-05-21 en PCs de laboratorio.
 * Uso: npx tsx scripts/programar-pm-pcs-laboratorio.ts
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

const ULTIMO = "2025-05-21";
const PROXIMO = "2026-05-21";

async function main() {
  const { supabase } = await import("../src/services/supabase");
  const { data, error } = await supabase.from("computadores").select("*");
  if (error) throw new Error(error.message);

  const lab = (data ?? []).filter((pc) =>
    String(pc.ubicacion || "")
      .toUpperCase()
      .includes("LABORATORIO"),
  );

  if (lab.length === 0) {
    console.log("No hay computadores con ubicación LABORATORIO.");
    return;
  }

  for (const pc of lab) {
    const { error: errUp } = await supabase
      .from("computadores")
      .update({
        ultimo_pm: ULTIMO,
        proximo_pm: PROXIMO,
        frecuencia_pm_meses: Number(pc.frecuencia_pm_meses) || 12,
        actualizado_en: new Date().toISOString(),
      })
      .eq("id", pc.id);
    if (errUp) throw new Error(`${pc.codigo}: ${errUp.message}`);
    console.log(
      `OK ${pc.codigo || "—"} · ${pc.ubicacion} → último ${ULTIMO} / próximo ${PROXIMO}`,
    );
  }
  console.log(`Listo. ${lab.length} PC(s) de laboratorio programados.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
