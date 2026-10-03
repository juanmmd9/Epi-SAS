/** Guarda borradores de formularios en localStorage (sobrevive recargas y cambio de pestaña). */

export function leerBorrador<T>(clave: string): T | null {
  try {
    const raw = localStorage.getItem(clave) ?? sessionStorage.getItem(clave);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function guardarBorrador(clave: string, valor: unknown): void {
  try {
    const raw = JSON.stringify(valor);
    localStorage.setItem(clave, raw);
    sessionStorage.removeItem(clave);
  } catch {
    try {
      sessionStorage.setItem(clave, JSON.stringify(valor));
    } catch {
      // Cuota llena o modo privado: no bloquear el formulario.
    }
  }
}

export function borrarBorrador(clave: string): void {
  try {
    localStorage.removeItem(clave);
    sessionStorage.removeItem(clave);
  } catch {
    // ignore
  }
}
