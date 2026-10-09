/** Áreas de planta / máquinas (PM, correctivo, hojas, solicitudes de falla). */
export const AREAS_PLANTA = [
  "Laboratorio",
  "Confeccion",
  "Tejidos",
  "Plasticos",
  "Locativos",
  "Logistica",
  "Moldes",
  "Administrativa",
] as const;

export type AreaPlanta = (typeof AREAS_PLANTA)[number];

/**
 * Áreas del mapa de procesos EPI (planeadores → solicitudes a Gerencia).
 * Incluye Mantenimiento como proceso de apoyo.
 */
export const AREAS_MAPA_PROCESOS = [
  "Gerencia General",
  "Sistema Gestion Calidad",
  "Comercial y Mercadeo",
  "Diseno y Desarrollo",
  "Comercio Exterior",
  "Produccion Textiles",
  "Produccion Plasticos",
  "Produccion Confeccion",
  "Produccion Maquila",
  "Control de Calidad",
  "Almacen y Despacho",
  "Gestion Humana",
  "SST",
  "Gestion Financiera",
  "Mantenimiento",
] as const;

export type AreaMapaProcesos = (typeof AREAS_MAPA_PROCESOS)[number];

/** Catálogo completo para usuarios portal, gerencia y personal. */
export const AREAS_SISTEMA = [
  ...AREAS_PLANTA,
  ...AREAS_MAPA_PROCESOS,
] as const;

export type Area = (typeof AREAS_SISTEMA)[number];

/** Áreas que no se ofrecen al solicitar a Gerencia (ya tienen líder / no aplican). */
const AREAS_OCULTAS_SOLICITUD_GERENCIA = new Set<string>([
  "Produccion Textiles",
  "Produccion Plasticos",
  "Produccion Confeccion",
  "Locativos",
  "Moldes",
]);

/** Áreas disponibles en formularios de solicitud / clasificación a Gerencia. */
export const AREAS_SOLICITUD_GERENCIA = AREAS_SISTEMA.filter(
  (area) => !AREAS_OCULTAS_SOLICITUD_GERENCIA.has(area),
);

/** Planta: solo correctivo (sin PM programado). */
export const AREAS_SOLO_CORRECTIVO: AreaPlanta[] = ["Moldes", "Administrativa"];

/** Planta con mantenimiento preventivo. */
export const AREAS_CON_PM = AREAS_PLANTA.filter(
  (area) => !AREAS_SOLO_CORRECTIVO.includes(area),
);

export function areaTienePreventivo(area: string): boolean {
  const n = normalizarArea(area);
  return AREAS_CON_PM.some((a) => a === n);
}

function claveArea(area: string): string {
  return area
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const ALIAS_AREAS: Record<string, Area> = {
  laboratorio: "Laboratorio",
  confeccion: "Confeccion",
  tejidos: "Tejidos",
  plasticos: "Plasticos",
  locativos: "Locativos",
  logistica: "Logistica",
  moldes: "Moldes",
  administrativa: "Administrativa",
  "area administrativa": "Administrativa",
  "gerencia general": "Gerencia General",
  gerencia: "Gerencia General",
  "sistema gestion calidad": "Sistema Gestion Calidad",
  sgc: "Sistema Gestion Calidad",
  calidad: "Sistema Gestion Calidad",
  "comercial y mercadeo": "Comercial y Mercadeo",
  comercial: "Comercial y Mercadeo",
  mercadeo: "Comercial y Mercadeo",
  "diseno y desarrollo": "Diseno y Desarrollo",
  diseno: "Diseno y Desarrollo",
  "comercio exterior": "Comercio Exterior",
  "produccion textiles": "Produccion Textiles",
  textiles: "Produccion Textiles",
  "produccion plasticos": "Produccion Plasticos",
  "produccion confeccion": "Produccion Confeccion",
  "produccion maquila": "Produccion Maquila",
  maquila: "Produccion Maquila",
  "control de calidad": "Control de Calidad",
  "almacen y despacho": "Almacen y Despacho",
  almacen: "Almacen y Despacho",
  despacho: "Almacen y Despacho",
  "gestion humana": "Gestion Humana",
  rrhh: "Gestion Humana",
  sst: "SST",
  "seguridad y salud": "SST",
  "gestion financiera": "Gestion Financiera",
  financiera: "Gestion Financiera",
  mantenimiento: "Mantenimiento",
};

/** Unifica tildes, mayúsculas y alias legacy al catálogo del sistema. */
export function normalizarArea(area: string | null | undefined): string {
  if (!area) return "";
  const limpio = area.trim();
  if (!limpio) return "";
  const canonica = ALIAS_AREAS[claveArea(limpio)];
  if (canonica) return canonica;
  const coincide = AREAS_SISTEMA.find((item) => claveArea(item) === claveArea(limpio));
  return coincide ?? limpio;
}

export function coincideArea(areaA: string, areaB: string): boolean {
  return normalizarArea(areaA) === normalizarArea(areaB);
}

export function esAreaValida(area: string): boolean {
  return AREAS_SISTEMA.includes(normalizarArea(area) as Area);
}

export function esAreaPlanta(area: string): boolean {
  const n = normalizarArea(area);
  return AREAS_PLANTA.some((a) => a === n);
}

/** Sugerencias de planeadores (mapa de procesos). Mantenimiento = admin/coordinador (no va aquí). */
export const USUARIOS_PLANEADOR_SUGERIDOS: ReadonlyArray<{
  area: Area;
  usuario: string;
  nombre: string;
  rol: "lider" | "gerencia";
  cargo: string;
}> = [
  {
    area: "Sistema Gestion Calidad",
    usuario: "lider.sgc",
    nombre: "Líder SGC",
    rol: "lider",
    cargo: "Líder Sistema Gestión Calidad",
  },
  {
    area: "Comercial y Mercadeo",
    usuario: "lider.comercial",
    nombre: "Líder Comercial y Mercadeo",
    rol: "lider",
    cargo: "Líder Comercial y Mercadeo",
  },
  {
    area: "Diseno y Desarrollo",
    usuario: "lider.diseno",
    nombre: "Líder Diseño y Desarrollo",
    rol: "lider",
    cargo: "Líder Diseño y Desarrollo",
  },
  {
    area: "Comercio Exterior",
    usuario: "lider.comex",
    nombre: "Líder Comercio Exterior",
    rol: "lider",
    cargo: "Líder Comercio Exterior",
  },
  {
    area: "Produccion Maquila",
    usuario: "lider.maquila",
    nombre: "Líder Producción Maquila",
    rol: "lider",
    cargo: "Líder Producción Maquila",
  },
  {
    area: "Control de Calidad",
    usuario: "lider.calidad",
    nombre: "Líder Control de Calidad",
    rol: "lider",
    cargo: "Líder Control de Calidad",
  },
  {
    area: "Almacen y Despacho",
    usuario: "lider.almacen",
    nombre: "Líder Almacén y Despacho",
    rol: "lider",
    cargo: "Líder Almacén y Despacho",
  },
  {
    area: "Gestion Humana",
    usuario: "lider.humana",
    nombre: "Líder Gestión Humana",
    rol: "lider",
    cargo: "Líder Gestión Humana",
  },
  {
    area: "SST",
    usuario: "lider.sst",
    nombre: "Líder SST",
    rol: "lider",
    cargo: "Líder SST",
  },
  {
    area: "Gestion Financiera",
    usuario: "lider.financiera",
    nombre: "Líder Gestión Financiera",
    rol: "lider",
    cargo: "Líder Gestión Financiera",
  },
];
