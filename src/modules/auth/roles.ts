export type RolPortal = "admin" | "operador" | "consulta" | "solicitante";

export interface UsuarioPortal {
  id: string;
  email: string;
  nombre: string;
  rol: RolPortal;
  personal_id: string | null;
  /** Área de planta (obligatoria para rol solicitante). */
  area: string | null;
  activo: boolean;
}

export const ETIQUETAS_ROL: Record<RolPortal, string> = {
  admin: "Administrador",
  operador: "Operador",
  consulta: "Consulta",
  solicitante: "Solicitante de área",
};

export type Permiso =
  | "ver.inicio"
  | "ver.preventivo"
  | "ver.correctivo"
  | "ver.solicitudes"
  | "ver.hojas"
  | "ver.indicadores"
  | "ver.formatos"
  | "ver.personal"
  | "ver.permisos"
  | "ver.matriz"
  | "ver.horario"
  | "editar.hojas"
  | "editar.personal"
  | "editar.horario"
  | "editar.indicadores"
  | "editar.matriz.catalogo"
  | "editar.matriz.celdas"
  | "crear.preventivo"
  | "crear.correctivo"
  | "crear.solicitudes"
  | "crear.repuestos"
  | "eliminar.registros"
  | "gestionar.usuarios";

const MATRIZ_PERMISOS: Record<Permiso, RolPortal[]> = {
  "ver.inicio": ["admin", "operador", "consulta"],
  "ver.preventivo": ["admin", "operador", "consulta"],
  "ver.correctivo": ["admin", "operador", "consulta"],
  "ver.solicitudes": ["admin", "operador", "consulta", "solicitante"],
  "ver.hojas": ["admin", "operador", "consulta"],
  "ver.indicadores": ["admin", "consulta"],
  "ver.formatos": ["admin", "operador"],
  "ver.personal": ["admin"],
  "ver.permisos": ["admin"],
  "ver.matriz": ["admin"],
  "ver.horario": ["admin"],
  "editar.hojas": ["admin", "operador"],
  "editar.personal": ["admin"],
  "editar.horario": ["admin"],
  "editar.indicadores": ["admin"],
  "editar.matriz.catalogo": ["admin"],
  "editar.matriz.celdas": ["admin"],
  "crear.preventivo": ["admin", "operador"],
  "crear.correctivo": ["admin", "operador"],
  "crear.solicitudes": ["admin", "operador", "solicitante"],
  "crear.repuestos": ["admin", "operador", "solicitante"],
  "eliminar.registros": ["admin"],
  "gestionar.usuarios": ["admin"],
};

export function puede(rol: RolPortal | null | undefined, permiso: Permiso): boolean {
  if (!rol) return false;
  return MATRIZ_PERMISOS[permiso]?.includes(rol) ?? false;
}

export interface EnlaceNav {
  ruta: string;
  texto: string;
  permiso: Permiso;
}

export const ENLACES_NAV: EnlaceNav[] = [
  { ruta: "/", texto: "Inicio", permiso: "ver.inicio" },
  { ruta: "/preventivo", texto: "Mant. preventivo", permiso: "ver.preventivo" },
  { ruta: "/correctivo", texto: "Mant. correctivo", permiso: "ver.correctivo" },
  { ruta: "/solicitudes", texto: "Solicitudes", permiso: "ver.solicitudes" },
  { ruta: "/hojas-de-vida", texto: "Hojas de vida", permiso: "ver.hojas" },
  { ruta: "/indicadores", texto: "Indicadores", permiso: "ver.indicadores" },
  { ruta: "/formatos", texto: "Formatos", permiso: "ver.formatos" },
  { ruta: "/personal", texto: "Personal", permiso: "ver.personal" },
  { ruta: "/personal/usuarios", texto: "Usuarios portal", permiso: "gestionar.usuarios" },
  { ruta: "/personal/permisos", texto: "Permisos", permiso: "ver.permisos" },
  { ruta: "/personal/matriz", texto: "Matriz conocimientos", permiso: "ver.matriz" },
];

export function enlacesParaRol(rol: RolPortal | null | undefined): EnlaceNav[] {
  return ENLACES_NAV.filter((enlace) => puede(rol, enlace.permiso));
}

/** Ruta de inicio según rol (solicitante entra directo a su área). */
export function rutaInicioParaRol(
  rol: RolPortal | null | undefined,
  area: string | null | undefined,
): string {
  if (rol === "solicitante" && area) {
    return `/solicitudes/area/${encodeURIComponent(area)}`;
  }
  return "/";
}
