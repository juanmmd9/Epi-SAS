import { AREAS_SISTEMA } from "../../lib/areas";
import { supabase } from "../../services/supabase";
import { cargosDeArea } from "./cargosArea";
import type { RolPortal } from "./roles";

/** Roles que la persona puede elegir. Administrador no: esa cuenta corrige los demás. */
export const ROLES_REGISTRO_PROPIO = [
  "solicitante",
  "lider",
  "operador",
  "consulta",
  "gerencia",
] as const satisfies readonly RolPortal[];

export type RolRegistroPropio = (typeof ROLES_REGISTRO_PROPIO)[number];

const RE_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function correoRegistroValido(valor: string): boolean {
  const correo = valor.trim().toLowerCase();
  if (!RE_CORREO.test(correo)) return false;
  if (correo.endsWith("@epi.local")) return false;
  return true;
}

export async function registrarPerfilPropio(input: {
  nombre: string;
  correo: string;
  password: string;
  area: string;
  rol: RolRegistroPropio;
}): Promise<"entro" | "confirmar-correo"> {
  const nombre = input.nombre.trim();
  const correo = input.correo.trim().toLowerCase();
  const area = input.area.trim();
  if (!nombre) throw new Error("Escribe el nombre.");
  if (!correoRegistroValido(correo)) {
    throw new Error("Usa el correo de Outlook. No sirve el usuario interno del portal.");
  }
  if (input.password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres.");
  }
  if (!AREAS_SISTEMA.includes(area as (typeof AREAS_SISTEMA)[number])) {
    throw new Error("Elige el área.");
  }
  const cargo = cargosDeArea(area).find((item) => item.rol === input.rol);
  if (!cargo) {
    throw new Error("Ese cargo no corresponde a esta área.");
  }

  const { data, error } = await supabase.auth.signUp({
    email: correo,
    password: input.password,
    options: {
      data: {
        registro_propio: "1",
        nombre,
        rol: input.rol,
        area,
      },
    },
  });

  if (error) throw new Error(error.message);
  if (data.user && (data.user.identities?.length ?? 0) === 0) {
    throw new Error("Ese correo ya está registrado. Entra con él o pide al administrador que lo revise.");
  }
  if (data.session) return "entro";
  return "confirmar-correo";
}
