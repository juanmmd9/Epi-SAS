import { supabase } from "../../services/supabase";
import { CATALOGO_MECANICO } from "./matrizCatalogo";
import { faltaTablaMatriz } from "./matrizSetup";
import type { CompetenciaMatriz, HojaMatriz, ValorMatrizCelda } from "./types";

const TABLA_COMPETENCIAS = "competencias_matriz";
const TABLA_VALORES = "matriz_conocimiento";

export async function existeTablaMatriz(): Promise<boolean> {
  const { error } = await supabase.from(TABLA_COMPETENCIAS).select("id").limit(1);
  if (!error) return true;
  if (faltaTablaMatriz(error.message)) return false;
  throw new Error(error.message);
}

export async function listarCompetencias(hoja: HojaMatriz): Promise<CompetenciaMatriz[]> {
  const { data, error } = await supabase
    .from(TABLA_COMPETENCIAS)
    .select("*")
    .eq("hoja", hoja)
    .eq("activa", true)
    .order("orden", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as CompetenciaMatriz[];
}

export async function listarValoresMatriz(hoja: HojaMatriz): Promise<ValorMatrizCelda[]> {
  const competencias = await listarCompetencias(hoja);
  const ids = competencias.map((c) => c.id);
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from(TABLA_VALORES)
    .select("*")
    .in("competencia_id", ids);
  if (error) throw new Error(error.message);
  return (data ?? []) as ValorMatrizCelda[];
}

export async function inicializarCatalogoMecanico(): Promise<number> {
  const existentes = await listarCompetencias("MECANICO");
  if (existentes.length > 0) return existentes.length;

  const filas = CATALOGO_MECANICO.map((item) => ({
    hoja: "MECANICO",
    orden: item.orden,
    numero: item.numero,
    categoria: item.categoria,
    descripcion: item.descripcion,
    meta_d: item.meta_d,
    experto: item.experto || null,
    herramienta: item.herramienta || null,
    estado_capacitacion: item.estado_capacitacion || null,
    activa: true,
  }));

  const { error } = await supabase.from(TABLA_COMPETENCIAS).insert(filas);
  if (error) throw new Error(error.message);
  return filas.length;
}

export async function guardarValorMatriz(
  valor: ValorMatrizCelda,
): Promise<ValorMatrizCelda> {
  const payload = {
    personal_id: valor.personal_id,
    competencia_id: valor.competencia_id,
    nivel_i: valor.nivel_i,
    nivel_d: valor.nivel_d,
    nivel_h: valor.nivel_h,
    actualizado_en: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(TABLA_VALORES)
    .upsert(payload, { onConflict: "personal_id,competencia_id" })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ValorMatrizCelda;
}

export async function aplicarMetasPorDefecto(
  hoja: HojaMatriz,
  personalIds: string[],
): Promise<number> {
  const competencias = await listarCompetencias(hoja);
  const valores = await listarValoresMatriz(hoja);
  const existentes = new Set(
    valores.map((v) => `${v.personal_id}:${v.competencia_id}`),
  );

  const pendientes: Omit<ValorMatrizCelda, "id">[] = [];
  competencias.forEach((competencia) => {
    personalIds.forEach((personalId) => {
      const clave = `${personalId}:${competencia.id}`;
      if (existentes.has(clave)) return;
      pendientes.push({
        personal_id: personalId,
        competencia_id: competencia.id,
        nivel_i: 1,
        nivel_d: competencia.meta_d,
        nivel_h: 0,
      });
    });
  });

  if (pendientes.length === 0) return 0;

  const { error } = await supabase.from(TABLA_VALORES).insert(pendientes);
  if (error) throw new Error(error.message);
  return pendientes.length;
}
