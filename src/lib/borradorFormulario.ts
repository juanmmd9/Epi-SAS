/** Guarda borradores de formularios en sessionStorage para no perder lo escrito. */

export function leerBorrador<T>(clave: string): T | null {
  try {
    const raw = sessionStorage.getItem(clave);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function guardarBorrador(clave: string, valor: unknown): void {
  try {
    sessionStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // Cuota llena o modo privado: no bloquear el formulario.
  }
}

export function borrarBorrador(clave: string): void {
  try {
    sessionStorage.removeItem(clave);
  } catch {
    // ignore
  }
}
