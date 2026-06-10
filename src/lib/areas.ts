export const AREAS_SISTEMA = [
  "Laboratorio",
  "Confeccion",
  "Tejidos",
  "Plasticos",
  "Locativos",
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
