import type { ConteoRespaldo, DatosRespaldoV2, RespaldoV2 } from "./types";

export function parseRespaldoJson(texto: string): RespaldoV2 {
  const datos = JSON.parse(texto) as RespaldoV2 | unknown[];

  if (Array.isArray(datos)) {
    return {
      version: 1,
      data: { preventivo: datos as RespaldoV2["data"]["preventivo"] },
    };
  }

  if (!datos || typeof datos !== "object") {
    throw new Error("El archivo no tiene un formato JSON valido.");
  }

  const respaldo = datos as RespaldoV2;
  if (respaldo.data && typeof respaldo.data === "object") {
    return respaldo;
  }

  // Respaldo muy antiguo: objeto con claves sueltas sin envoltorio data
  const legacy = datos as unknown as Record<string, unknown>;
  if (
    Array.isArray(legacy.preventivo) ||
    Array.isArray(legacy.hojasDeVida) ||
    Array.isArray(legacy.correctivo)
  ) {
    return {
      version: legacy.version as number | undefined,
      exportadoEn: legacy.exportadoEn as string | undefined,
      data: legacy as DatosRespaldoV2,
    };
  }

  throw new Error("No se reconoce la estructura del respaldo.");
}

export function respaldoTieneDatos(data: DatosRespaldoV2): boolean {
  const c = contarRespaldo(data);
  return (
    c.preventivo +
      c.hojas +
      c.correctivo +
      c.excepciones +
      c.noConformidades >
    0
  );
}

export function contarRespaldo(data: DatosRespaldoV2): ConteoRespaldo {
  const horas = data.indicadores?.horasProgramadas ?? {};
  return {
    preventivo: data.preventivo?.length ?? 0,
    hojas: data.hojasDeVida?.length ?? 0,
    correctivo: data.correctivo?.length ?? 0,
    excepciones: data.excepcionesCronograma?.length ?? 0,
    cronogramaManual: data.cronogramaPreventivo?.length ?? 0,
    horasProgramadas: Object.keys(horas).length,
    noConformidades: data.noConformidades?.length ?? 0,
  };
}
