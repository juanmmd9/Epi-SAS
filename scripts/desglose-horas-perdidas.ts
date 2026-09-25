/**
 * Desglose exhaustivo de horas perdidas por área/máquina (mes).
 * Uso: npx tsx scripts/desglose-horas-perdidas.ts [mes] [anio]
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
    calcularTiemposCorrectivo,
    filtrarCorrectivos,
    horasProgramadasEfectivas,
    minutosEfectivosHorasPerdidas,
    solicitudConTopeHorasPerdidas,
    AREAS_CORRECTIVO_TABLA,
  } = await import("../src/modules/indicadores/indicadoresCalculo");
  const { resolverHorariosAnio } = await import("../src/modules/permisos/horasLaborables");
  const { coincideArea, normalizarArea } = await import("../src/lib/areas");
  const { supabase } = await import("../src/services/supabase");

  const [{ data: correctivos, error: e1 }, { data: horas }, { data: hDb }, { data: fDb }] =
    await Promise.all([
      supabase.from("correctivo").select("*"),
      supabase.from("horas_programadas").select("*"),
      supabase.from("horario_laboral").select("*"),
      supabase.from("festivos").select("*").eq("anio", anio),
    ]);
  if (e1) throw new Error(e1.message);

  const horarios = resolverHorariosAnio(anio, (hDb ?? []) as never);
  const festivos = (fDb ?? []) as never;

  type FilaOut = {
    numero: number | string;
    codigo: string;
    maquina: string;
    claveMaquina: string;
    fecha: string;
    cierre: string;
    gMin: number | null;
    hMin: number | null;
    iMin: number | null;
    iIndicadorMin: number;
    iIndicadorHoras: number;
    tope: boolean;
    valido: boolean;
    desc: string;
  };

  function claveMaquina(d: Record<string, unknown>): string {
    const codigo = String(d.codigoMaquina || "").trim().toUpperCase();
    const nombre = String(d.maquinaEquipoLocacion || "").trim().toUpperCase();
    if (codigo) return codigo;
    if (nombre) return nombre;
    return "SIN MÁQUINA";
  }

  const reporte: Record<string, unknown> = {};

  for (const areaCanon of AREAS_CORRECTIVO_TABLA) {
    const regsArea = (correctivos ?? []).filter((r) =>
      coincideArea(String(r.area || ""), areaCanon),
    );
    const regs = regsArea.map((r) => ({ ...r, area: areaCanon }));
    const delMes = filtrarCorrectivos(regs as never, areaCanon, anio, mes, "");

    const filas: FilaOut[] = [];
    for (const registro of delMes) {
      const d = registro.datos as Record<string, unknown>;
      const tiempos = calcularTiemposCorrectivo(registro as never, horarios, festivos);
      const fila = { registro: registro as never, tiempos };
      const iInd = minutosEfectivosHorasPerdidas(fila, horarios, festivos);
      filas.push({
        numero: (d.numeroSolicitud as number) ?? "—",
        codigo: String(d.codigoMaquina || "").trim() || "—",
        maquina: String(d.maquinaEquipoLocacion || "").trim() || "—",
        claveMaquina: claveMaquina(d),
        fecha: String(registro.fecha).slice(0, 10),
        cierre: String(d.fechaCierre || "").slice(0, 10),
        gMin: tiempos.g,
        hMin: tiempos.h,
        iMin: tiempos.i,
        iIndicadorMin: iInd,
        iIndicadorHoras: Math.round((iInd / 60) * 1000) / 1000,
        tope: solicitudConTopeHorasPerdidas(registro as never),
        valido: tiempos.valido,
        desc: String(d.descripcionSolicitud || "").slice(0, 90),
      });
    }

    const validas = filas.filter((f) => f.valido);
    const totalIIndMin = validas.reduce((s, f) => s + f.iIndicadorMin, 0);
    const horasInd = totalIIndMin / 60;
    const horasProg = horasProgramadasEfectivas(
      (horas ?? []) as never,
      anio,
      mes,
      areaCanon,
      horarios,
      festivos,
    );
    const pct = horasProg && validas.length ? (horasInd / horasProg) * 100 : null;

    const porMaquina = new Map<
      string,
      { intervenciones: number; validas: number; horasInd: number; numeros: string[] }
    >();
    for (const f of filas) {
      const prev = porMaquina.get(f.claveMaquina) ?? {
        intervenciones: 0,
        validas: 0,
        horasInd: 0,
        numeros: [],
      };
      prev.intervenciones += 1;
      prev.numeros.push(String(f.numero));
      if (f.valido) {
        prev.validas += 1;
        prev.horasInd += f.iIndicadorHoras;
      }
      porMaquina.set(f.claveMaquina, prev);
    }

    const ranking = [...porMaquina.entries()]
      .map(([clave, v]) => ({
        maquina: clave,
        intervenciones: v.intervenciones,
        conTiemposValidos: v.validas,
        horasPerdidasIndicador: Math.round(v.horasInd * 1000) / 1000,
        aportePct:
          pct !== null && horasInd > 0
            ? Math.round((v.horasInd / horasInd) * 1000) / 10
            : null,
        solicitudes: v.numeros.join(", "),
      }))
      .sort((a, b) => b.horasPerdidasIndicador - a.horasPerdidasIndicador);

    const invalidas = filas.filter((f) => !f.valido);

    reporte[areaCanon] = {
      area: areaCanon,
      areaNormalizada: normalizarArea(areaCanon),
      solicitudesEnMes: filas.length,
      conTiemposValidos: validas.length,
      sinTiemposCompletos: invalidas.length,
      horasProgramadas: horasProg,
      horasPerdidasIndicador: Math.round(horasInd * 1000) / 1000,
      porcentajeHorasPerdidas: pct === null ? null : Math.round(pct * 100) / 100,
      meta: "1%",
      rankingMaquinas: ranking,
      detalleSolicitudes: filas
        .slice()
        .sort((a, b) => b.iIndicadorHoras - a.iIndicadorHoras),
      solicitudesSinCierreOHoras: invalidas.map((f) => ({
        numero: f.numero,
        codigo: f.codigo,
        maquina: f.maquina,
        fecha: f.fecha,
        cierre: f.cierre,
        desc: f.desc,
      })),
    };
  }

  console.log(JSON.stringify({ periodo: { mes, anio }, areas: reporte }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
