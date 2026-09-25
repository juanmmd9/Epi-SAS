import type { RolPortal, EnlaceNav, Permiso } from "../../modules/auth/roles";
import { enlacesParaRol, puede } from "../../modules/auth/roles";

export type IconoNav =
  | "inicio"
  | "preventivo"
  | "aprobar"
  | "correctivo"
  | "solicitudes"
  | "hojas"
  | "computadores"
  | "indicadores"
  | "formatos"
  | "personal"
  | "usuarios"
  | "permisos"
  | "matriz"
  | "gerencia"
  | "mas";

export interface ItemNav extends EnlaceNav {
  icono: IconoNav;
  /** Texto corto para la barra inferior */
  etiquetaCorta: string;
}

const ICONOS_POR_RUTA: Record<string, IconoNav> = {
  "/": "inicio",
  "/gerencia": "gerencia",
  "/gerencia/pedir": "gerencia",
  "/preventivo": "preventivo",
  "/preventivo/aprobaciones": "aprobar",
  "/correctivo": "correctivo",
  "/solicitudes": "solicitudes",
  "/hojas-de-vida": "hojas",
  "/computadores": "computadores",
  "/indicadores": "indicadores",
  "/formatos": "formatos",
  "/personal": "personal",
  "/personal/usuarios": "usuarios",
  "/personal/permisos": "permisos",
  "/personal/matriz": "matriz",
};

const ETIQUETA_CORTA: Record<string, string> = {
  "/": "Inicio",
  "/gerencia": "Gerencia",
  "/gerencia/pedir": "A Gerencia",
  "/preventivo": "Preventivo",
  "/preventivo/aprobaciones": "Aprobar",
  "/correctivo": "Correctivo",
  "/solicitudes": "Solicitudes",
  "/hojas-de-vida": "Hojas",
  "/computadores": "PCs",
  "/indicadores": "Indicadores",
  "/formatos": "Formatos",
  "/personal": "Personal",
  "/personal/usuarios": "Usuarios",
  "/personal/permisos": "Permisos",
  "/personal/matriz": "Matriz",
};

/** Orden preferido de los 3 tabs fijos (el 4.º es siempre «Más»). */
const PRIORIDAD_TABS = [
  "/",
  "/preventivo/aprobaciones",
  "/preventivo",
  "/solicitudes",
  "/hojas-de-vida",
  "/correctivo",
] as const;

/** Líder: Inicio (tablero área) + Aprobar PM + Solicitar a Gerencia. */
const PRIORIDAD_TABS_LIDER = [
  "/",
  "/preventivo/aprobaciones",
  "/gerencia/pedir",
  "/solicitudes",
  "/hojas-de-vida",
] as const;

function enriquecer(enlace: EnlaceNav): ItemNav {
  return {
    ...enlace,
    icono: ICONOS_POR_RUTA[enlace.ruta] ?? "mas",
    etiquetaCorta: ETIQUETA_CORTA[enlace.ruta] ?? enlace.texto,
  };
}

export function itemsNavParaRol(rol: RolPortal | null | undefined): {
  tabs: ItemNav[];
  mas: ItemNav[];
} {
  const todos = enlacesParaRol(rol).map(enriquecer);
  const porRuta = new Map(todos.map((i) => [i.ruta, i]));
  const tabs: ItemNav[] = [];
  const usados = new Set<string>();
  const prioridad = rol === "lider" ? PRIORIDAD_TABS_LIDER : PRIORIDAD_TABS;

  for (const ruta of prioridad) {
    if (tabs.length >= 3) break;
    const item = porRuta.get(ruta);
    if (!item) continue;
    tabs.push(item);
    usados.add(ruta);
  }

  // Si aún faltan tabs (roles con pocos módulos), completar con el resto en orden.
  if (tabs.length < 3) {
    for (const item of todos) {
      if (tabs.length >= 3) break;
      if (usados.has(item.ruta)) continue;
      tabs.push(item);
      usados.add(item.ruta);
    }
  }

  const mas = todos.filter((i) => !usados.has(i.ruta));
  return { tabs, mas };
}

/** True si la ruta actual pertenece a este ítem (o a un submódulo). */
export function rutaActiva(pathname: string, rutaItem: string): boolean {
  if (rutaItem === "/") return pathname === "/" || pathname === "";
  if (rutaItem === "/preventivo") {
    return (
      pathname === "/preventivo" ||
      pathname.startsWith("/preventivo/cronograma")
    );
  }
  if (rutaItem === "/solicitudes") {
    return pathname === "/solicitudes" || pathname.startsWith("/solicitudes/");
  }
  if (rutaItem === "/hojas-de-vida") {
    return pathname === "/hojas-de-vida" || pathname.startsWith("/hojas-de-vida/");
  }
  if (rutaItem === "/computadores") {
    return pathname === "/computadores" || pathname.startsWith("/computadores/");
  }
  if (rutaItem === "/formatos") {
    return pathname === "/formatos" || pathname.startsWith("/formatos/");
  }
  if (rutaItem === "/personal") {
    return pathname === "/personal";
  }
  if (rutaItem === "/gerencia") {
    return pathname === "/gerencia";
  }
  if (rutaItem === "/gerencia/pedir") {
    return pathname === "/gerencia/pedir" || pathname.startsWith("/gerencia/pedir/");
  }
  return pathname === rutaItem || pathname.startsWith(`${rutaItem}/`);
}

export function algunMasActivo(pathname: string, mas: ItemNav[]): boolean {
  return mas.some((i) => rutaActiva(pathname, i.ruta));
}

export function puedeVerNav(rol: RolPortal | null | undefined, permiso: Permiso): boolean {
  return puede(rol, permiso);
}
