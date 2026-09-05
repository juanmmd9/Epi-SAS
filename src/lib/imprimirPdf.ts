/** Abre el diálogo de impresión del navegador con un PDF generado en memoria. */
export function imprimirPdf(pdfBytes: Uint8Array): void {
  const copia = pdfBytes.slice();
  const url = URL.createObjectURL(new Blob([copia], { type: "application/pdf" }));
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:none";
  iframe.src = url;
  document.body.appendChild(iframe);
  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      iframe.remove();
      URL.revokeObjectURL(url);
    }, 60_000);
  };
}

/** Abre el PDF en una pestaña nueva y lanza el diálogo de impresión del navegador. */
export function imprimirPdfEnPestana(pdfBytes: Uint8Array): void {
  const copia = pdfBytes.slice();
  const url = URL.createObjectURL(new Blob([copia], { type: "application/pdf" }));
  const ventana = window.open(url, "_blank", "noopener,noreferrer");
  if (!ventana) {
    URL.revokeObjectURL(url);
    throw new Error("Permite ventanas emergentes para ver e imprimir el PDF.");
  }
  ventana.focus();
  window.setTimeout(() => {
    try {
      ventana.print();
    } catch {
      /* El visor PDF del navegador puede bloquear print() hasta que cargue */
    }
  }, 800);
  window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
}
