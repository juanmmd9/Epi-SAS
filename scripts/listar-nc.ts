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
const { data, error } = await supabase
  .from("no_conformidades")
  .select("id,numero,datos,creado_en")
  .order("numero", { ascending: false })
  .limit(30);
if (error) {
  console.error("ERR", error.message);
  process.exit(1);
}
console.log(
  JSON.stringify(
    (data ?? []).map((r) => ({
      numero: r.numero,
      area: r.datos?.area,
      origen: r.datos?.origen,
      indicador: r.datos?.origenIndicador,
      desc: String(r.datos?.descripcion ?? "").slice(0, 100),
      creado: r.creado_en,
    })),
    null,
    2,
  ),
);
