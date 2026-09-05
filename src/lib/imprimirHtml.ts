/** Imprime un elemento HTML tal como se ve en pantalla (vista previa del formato). */
export function imprimirElementoHtml(elemento: HTMLElement, titulo = "Formato"): void {
  const ventana = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
  if (!ventana) {
    window.alert("Permite ventanas emergentes para imprimir el formato.");
    return;
  }

  const estilos = `
    * { box-sizing: border-box; }
    body { margin: 12mm; font-family: Arial, Helvetica, sans-serif; color: #111; background: #fff; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #222; padding: 6px 8px; vertical-align: top; text-align: left; background: #fff !important; color: #000 !important; }
    th { background: #f3f4f6 !important; font-weight: 700; }
    h2, h3 { margin: 0.5rem 0; }
    .mtre045-preview__titulo { text-align: center; margin-bottom: 12px; }
    .mtre045-preview__titulo h2 { font-size: 14px; text-transform: uppercase; }
    .mtre045-preview__codigo { font-size: 10px; color: #444; }
    .mtre045-preview__subtitulo { font-size: 11px; text-transform: uppercase; margin: 12px 0 6px; }
    .mtre045-preview__fila-titulo { background: #e5e7eb !important; font-weight: 700; font-size: 10px; text-transform: uppercase; }
    .mtre045-preview__fecha-cajas { display: inline-flex; gap: 6px; align-items: center; }
    .mtre045-preview__fecha-caja { min-width: 2rem; text-align: center; border-bottom: 1px solid #222; padding: 0 4px; }
    .mtre045-preview__fecha-caja--anio { min-width: 3rem; }
    .mtre045-preview__celda-texto { min-height: 2.5rem; white-space: pre-wrap; }
    .mtre045-an { display: inline-flex; gap: 12px; font-weight: 600; }
    .mtre045-an--activo { border: 2px solid #000; padding: 0 6px; background: #fff !important; }
    .mtre045-preview__leyenda { font-size: 10px; margin: 8px 0; }
    .mtre045-preview__firmas { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 24px; }
    .mtre045-preview__linea-firma { border-bottom: 1px solid #222; height: 28px; margin-bottom: 4px; }
    .mtre045-preview__firmas small { color: #444; font-size: 9px; }
    @page { margin: 12mm; }
  `;

  ventana.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${titulo}</title>
  <style>${estilos}</style>
</head>
<body>${elemento.outerHTML}</body>
</html>`);
  ventana.document.close();
  ventana.focus();
  setTimeout(() => {
    ventana.print();
    ventana.close();
  }, 250);
}
