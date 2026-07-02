/** Ruta a archivos en /public (respeta BASE_URL en GitHub Pages). */
export function rutaPublica(ruta: string): string {
  const base = import.meta.env.BASE_URL;
  const limpia = ruta.replace(/^\//, "");
  return `${base}${limpia}`;
}
