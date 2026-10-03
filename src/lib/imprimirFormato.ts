const ID_FORMATO = "mtre045-formato-impresion";

/** Imprime el formato HTML tal como se ve en pantalla (igual al PDF oficial). */
export function imprimirFormatoHtml(idFormato = ID_FORMATO): void {
  const nodo = document.getElementById(idFormato);
  if (!nodo) {
    throw new Error("No se encontró la vista previa del formato para imprimir.");
  }

  const limpiar = () => {
    document.body.classList.remove("imprimiendo-formato");
    window.removeEventListener("afterprint", limpiar);
  };

  document.body.classList.add("imprimiendo-formato");
  window.addEventListener("afterprint", limpiar);
  // Fallback si el navegador no dispara afterprint
  window.setTimeout(limpiar, 60_000);
  window.print();
}

export { ID_FORMATO };
