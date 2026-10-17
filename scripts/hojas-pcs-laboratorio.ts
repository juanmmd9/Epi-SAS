/**
 * Crea/actualiza hojas de vida en área Laboratorio a partir de los PCs
 * con ubicación LABORATORIO (módulo Computadores).
 * Primer PM: 2026-05-21, frecuencia 12 meses.
 *
 * Uso: npx tsx scripts/hojas-pcs-laboratorio.ts
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

const AREA = "Laboratorio";
const PRIMER_PM = "2026-05-21";
const FRECUENCIA = 12;

async function main() {
  const { supabase } = await import("../src/services/supabase");

  const [{ data: pcs, error: e1 }, { data: hojas, error: e2 }] = await Promise.all([
    supabase.from("computadores").select("*").eq("activa", true),
    supabase.from("hojas_vida").select("id, codigo, nombre, area, primer_pm"),
  ]);
  if (e1) throw new Error(e1.message);
  if (e2) throw new Error(e2.message);

  const labPcs = (pcs ?? []).filter((pc) =>
    String(pc.ubicacion || "")
      .toUpperCase()
      .includes("LABORATORIO"),
  );

  if (labPcs.length === 0) {
    console.log("No hay computadores activos con ubicación LABORATORIO.");
    return;
  }

  const porCodigo = new Map(
    (hojas ?? [])
      .filter((h) => h.codigo)
      .map((h) => [String(h.codigo).trim().toUpperCase(), h]),
  );

  let creadas = 0;
  let actualizadas = 0;

  for (const pc of labPcs) {
    const codigo = String(pc.codigo || "").trim() || `PC-${String(pc.id).slice(0, 8)}`;
    const clave = codigo.toUpperCase();
    const ubicacion = String(pc.ubicacion || "").trim();
    const usuario = String(pc.usuario_asignado || "").trim();
    const nombre = [
      `Computador ${codigo}`,
      ubicacion ? `(${ubicacion})` : "",
      usuario ? `— ${usuario}` : "",
    ]
      .filter(Boolean)
      .join(" ");

    const datos = {
      marca: pc.datos?.marca || "",
      modelo: pc.datos?.modelo || pc.datos?.tipoDetalle || "",
      serial: pc.datos?.serial || "",
      ubicacion,
      observaciones: `Equipo de cómputo (módulo Computadores). Tipo: ${pc.tipo || "escritorio"}.`,
    };

    const existente = porCodigo.get(clave);
    const payload = {
      codigo,
      nombre,
      area: AREA,
      frecuencia_pm_meses: FRECUENCIA,
      primer_pm: PRIMER_PM,
      activa: true,
      datos,
      actualizado_en: new Date().toISOString(),
    };

    if (existente) {
      const { error } = await supabase
        .from("hojas_vida")
        .update(payload)
        .eq("id", existente.id);
      if (error) throw new Error(`${codigo}: ${error.message}`);
      actualizadas += 1;
      console.log(`Actualizada hoja ${codigo} → ${AREA} · primer PM ${PRIMER_PM}`);
    } else {
      const { error } = await supabase.from("hojas_vida").insert({
        ...payload,
        foto_url: null,
      });
      if (error) throw new Error(`${codigo}: ${error.message}`);
      creadas += 1;
      console.log(`Creada hoja ${codigo} → ${AREA} · primer PM ${PRIMER_PM}`);
    }
  }

  console.log(
    `Listo. Creadas: ${creadas}. Actualizadas: ${actualizadas}. Ver Cronograma → Laboratorio → mayo 2026.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
