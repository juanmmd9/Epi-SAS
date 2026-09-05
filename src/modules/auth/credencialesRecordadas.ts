import { usuarioDesdeEmailAuth } from "./loginUsuario";

const CLAVE_STORAGE = "epi-portal-recordar-credenciales";

export interface CredencialesRecordadas {
  usuario: string;
  password: string;
}

export function leerCredencialesRecordadas(): CredencialesRecordadas | null {
  try {
    const raw = localStorage.getItem(CLAVE_STORAGE);
    if (!raw) return null;
    const datos = JSON.parse(raw) as {
      usuario?: string;
      email?: string;
      password?: string;
    };
    if (!datos.password) return null;

    if (datos.usuario?.trim()) {
      return { usuario: datos.usuario.trim().toLowerCase(), password: datos.password };
    }

    // Formato anterior (correo): migrar a usuario si era @epi.local
    if (datos.email?.trim()) {
      const desdeAuth = usuarioDesdeEmailAuth(datos.email);
      const usuario =
        desdeAuth ?? datos.email.trim().split("@")[0]?.toLowerCase() ?? "";
      if (!usuario) return null;
      return { usuario, password: datos.password };
    }

    return null;
  } catch {
    return null;
  }
}

export function guardarCredencialesRecordadas(usuario: string, password: string): void {
  localStorage.setItem(
    CLAVE_STORAGE,
    JSON.stringify({ usuario: usuario.trim().toLowerCase(), password }),
  );
}

export function borrarCredencialesRecordadas(): void {
  localStorage.removeItem(CLAVE_STORAGE);
}
