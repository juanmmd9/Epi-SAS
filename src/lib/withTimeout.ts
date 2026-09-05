/** Evita promesas colgadas (p. ej. getSession en red lenta). */
export function withTimeout<T>(
  promesa: Promise<T>,
  ms: number,
  mensaje = "Tiempo de espera agotado",
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(mensaje)), ms);
    promesa
      .then((valor) => {
        window.clearTimeout(timer);
        resolve(valor);
      })
      .catch((error: unknown) => {
        window.clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      });
  });
}
