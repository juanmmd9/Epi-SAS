export const ESTADOS_MEJORA_PORTFOLIO = [
  { clave: "planificada", etiqueta: "Planificada" },
  { clave: "en_progreso", etiqueta: "En progreso" },
  { clave: "completada", etiqueta: "Completada" },
] as const;

export type EstadoMejoraPortfolio = (typeof ESTADOS_MEJORA_PORTFOLIO)[number]["clave"];

export interface MejoraPortfolioDatos {
  /** Problema o situación inicial (antes). */
  situacion: string;
  /** Qué se hizo en la mejora. */
  accion: string;
  /** Beneficio obtenido o esperado. */
  beneficio: string;
  personalIds: string[];
  fotoAntesUrl: string | null;
  fotoDespuesUrl: string | null;
  fotosExtras: string[];
  estado: EstadoMejoraPortfolio;
  /** Número GC-RE-001 vinculado, si existe. */
  numeroAm: number | null;
  destacada: boolean;
}

export interface MejoraPortfolio {
  id: string;
  titulo: string;
  area: string | null;
  fecha: string;
  datos: MejoraPortfolioDatos;
  creado_en: string;
}

export interface MejoraPortfolioInput {
  titulo: string;
  area: string | null;
  fecha: string;
  datos: MejoraPortfolioDatos;
}

export function datosMejoraVacio(): MejoraPortfolioDatos {
  return {
    situacion: "",
    accion: "",
    beneficio: "",
    personalIds: [],
    fotoAntesUrl: null,
    fotoDespuesUrl: null,
    fotosExtras: [],
    estado: "completada",
    numeroAm: null,
    destacada: false,
  };
}

export function normalizarDatosMejora(parcial: Partial<MejoraPortfolioDatos>): MejoraPortfolioDatos {
  const base = datosMejoraVacio();
  return {
    ...base,
    ...parcial,
    personalIds: parcial.personalIds ?? base.personalIds,
    fotosExtras: parcial.fotosExtras ?? base.fotosExtras,
  };
}

export function etiquetaEstadoMejora(estado: EstadoMejoraPortfolio): string {
  return ESTADOS_MEJORA_PORTFOLIO.find((e) => e.clave === estado)?.etiqueta ?? estado;
}
