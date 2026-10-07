export const PROYECTOS_DISENO = [
  {
    id: "alturas",
    titulo: "Proyectos de alturas",
    corto: "Alturas",
    imagen: "/Image/proyectos-alturas.jpg",
  },
  {
    id: "plasticos",
    titulo: "Proyectos plásticos",
    corto: "Plásticos",
    imagen: "/Image/proyectos-plasticos.jpg",
  },
  {
    id: "ingenieria",
    titulo: "Proyectos de ingeniería",
    corto: "Ingeniería",
    imagen: "/Image/proyectos-ingenieria.jpg",
  },
] as const;

export type IdProyectoDiseno = (typeof PROYECTOS_DISENO)[number]["id"];

export function proyectoDisenoPorId(id: string | undefined) {
  return PROYECTOS_DISENO.find((proyecto) => proyecto.id === id) ?? null;
}
