import { coincideArea } from "../../lib/areas";
import { ETIQUETAS_ROL, etiquetaRol, type RolPortal } from "./roles";

export interface CargoArea {
  rol: Exclude<RolPortal, "admin" | "consulta">;
  etiqueta: string;
}

/** Cargos que se pueden elegir en esa área. El valor guardado sigue siendo el rol del portal. */
export function cargosDeArea(area: string): CargoArea[] {
  if (coincideArea(area, "Mantenimiento")) {
    return [
      { rol: "operador", etiqueta: "Técnico de mantenimiento" },
      { rol: "lider", etiqueta: "Líder de mantenimiento" },
    ];
  }
  if (coincideArea(area, "Diseno y Desarrollo")) {
    return [
      { rol: "solicitante", etiqueta: "Auxiliar de diseño" },
      { rol: "lider", etiqueta: "Director de diseño" },
    ];
  }
  if (coincideArea(area, "Gerencia General")) {
    return [{ rol: "gerencia", etiqueta: "Gerencia" }];
  }
  if (!area.trim()) return [];
  return [
    { rol: "solicitante", etiqueta: "Personal del área" },
    { rol: "lider", etiqueta: "Líder del área" },
  ];
}

/** Nombre visible del cargo. No modifica el rol guardado. */
export function etiquetaCargo(
  rol: RolPortal | string | null | undefined,
  area: string | null | undefined,
): string {
  if (rol === "admin") return ETIQUETAS_ROL.admin;
  const cargo = cargosDeArea(area ?? "").find((item) => item.rol === rol);
  if (cargo) return cargo.etiqueta;
  return etiquetaRol(rol);
}
