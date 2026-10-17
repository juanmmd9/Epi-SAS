/** Ruta a archivos en /public (respeta BASE_URL en GitHub Pages / Capacitor). */
export function rutaPublica(ruta: string): string {
  const base = import.meta.env.BASE_URL || "/";
  const limpia = ruta.replace(/^\//, "");
  // base "./" → "./Image/..." ; base "/Epi-SAS/" → "/Epi-SAS/Image/..."
  if (base === "./" || base === ".") return `./${limpia}`;
  return `${base}${limpia}`;
}
