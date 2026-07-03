export const AREAS_SISTEMA = [
  "Laboratorio",
  "Confeccion",
  "Tejidos",
  "Plasticos",
  "Locativos",
  "Logistica",
  "Moldes",
] as const;

export type Area = (typeof AREAS_SISTEMA)[number];

export const AREAS_SOLO_CORRECTIVO: Area[] = ["Moldes"];

export const AREAS_CON_PM = AREAS_SISTEMA.filter(
  (area) => !AREAS_SOLO_CORRECTIVO.includes(area),
);

export function areaTienePreventivo(area: string): boolean {
  return Boolean(area) && !AREAS_SOLO_CORRECTIVO.includes(area as Area);
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
