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
const { data, error } = await supabase.from("correctivo").select("*");
if (error) throw new Error(error.message);

const mes = "2026-08";
const areas = ["Tejidos", "Plasticos", "Confeccion"];

for (const area of areas) {
  const regs = (data ?? []).filter((r) => {
    const a = String(r.area || "");
    const fecha = String(r.fecha || "").slice(0, 7);
    const cierre = String(r.datos?.fechaCierre || "").slice(0, 7);
    return (
      a.toLowerCase().includes(area.toLowerCase()) &&
      (fecha === mes || cierre === mes)
    );
  });
  console.log(`\n=== ${area} (${regs.length}) ===`);
  for (const r of regs.slice(0, 12)) {
    const d = r.datos || {};
    console.log(
      `#${d.numeroSolicitud ?? "—"} | ${String(r.fecha).slice(0, 10)} | ${d.codigoMaquina || ""} ${d.maquinaEquipoLocacion || ""} | G? ${d.horaSolicitud || ""}→${d.horaRespuesta || ""} | cierre ${String(d.fechaCierre || "").slice(0, 10)} | ${String(d.descripcionSolicitud || "").slice(0, 70)}`,
    );
  }
}
