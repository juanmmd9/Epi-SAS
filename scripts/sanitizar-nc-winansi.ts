/**
 * Reemplaza ≤/≥ y otros no-WinAnsi en textos de NC ya guardadas.
 * Uso: npx tsx scripts/sanitizar-nc-winansi.ts
 */
import { readFileSync } from "node:fs";
import { textoCompatibleWinAnsi } from "../src/lib/pdfTextoWinAnsi";

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

function sanitizarValor(v: unknown): unknown {
  if (typeof v === "string") return textoCompatibleWinAnsi(v);
  if (Array.isArray(v)) return v.map(sanitizarValor);
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      out[k] = sanitizarValor(val);
    }
    return out;
  }
  return v;
}

async function main() {
  const { supabase } = await import("../src/services/supabase");
  const { data, error } = await supabase.from("no_conformidades").select("id, numero, datos");
  if (error) throw new Error(error.message);

  let n = 0;
  for (const fila of data ?? []) {
    const antes = JSON.stringify(fila.datos);
    const despuesObj = sanitizarValor(fila.datos);
    const despues = JSON.stringify(despuesObj);
    if (antes === despues) continue;
    const { error: errUp } = await supabase
      .from("no_conformidades")
      .update({ datos: despuesObj })
      .eq("id", fila.id);
    if (errUp) throw new Error(`N° ${fila.numero}: ${errUp.message}`);
    n += 1;
    console.log(`Sanitizado GC-RE-009 N° ${fila.numero}`);
  }
  console.log(`Listo. ${n} registro(s) actualizados.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
