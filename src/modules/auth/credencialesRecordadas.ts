const CLAVE_STORAGE = "epi-portal-recordar-credenciales";

export interface CredencialesRecordadas {
  email: string;
  password: string;
}

export function leerCredencialesRecordadas(): CredencialesRecordadas | null {
  try {
    const raw = localStorage.getItem(CLAVE_STORAGE);
    if (!raw) return null;
    const datos = JSON.parse(raw) as CredencialesRecordadas;
    if (!datos.email || !datos.password) return null;
    return datos;
  } catch {
    return null;
  }
}

export function guardarCredencialesRecordadas(email: string, password: string): void {
  localStorage.setItem(CLAVE_STORAGE, JSON.stringify({ email, password }));
}

export function borrarCredencialesRecordadas(): void {
  localStorage.removeItem(CLAVE_STORAGE);
}
