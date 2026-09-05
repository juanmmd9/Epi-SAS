const ID_FORMATO = "mtre045-formato-impresion";

/** Imprime el formato HTML tal como se ve en pantalla (igual al PDF oficial). */
export function imprimirFormatoHtml(idFormato = ID_FORMATO): void {
  const nodo = document.getElementById(idFormato);
  if (!nodo) {
    throw new Error("No se encontró la vista previa del formato para imprimir.");
  }

  document.body.classList.add("imprimiendo-formato");
  window.print();
  window.setTimeout(() => document.body.classList.remove("imprimiendo-formato"), 500);
}

export { ID_FORMATO };
