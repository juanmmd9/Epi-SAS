/** Imprime un elemento HTML tal como se ve en pantalla (vista previa del formato). */
export function imprimirElementoHtml(elemento: HTMLElement, titulo = "Formato"): void {
  const ventana = window.open("", "_blank", "width=900,height=700");
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
    .mtre045-an { display: inline-flex; gap: 12px; font-weight: 600; align-items: center; }
    .mtre045-an__opcion { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; }
    .mtre045-an__caja { display: inline-flex; align-items: center; justify-content: center; width: 12px; height: 12px; border: 1.5px solid #222; font-size: 10px; font-weight: 700; line-height: 1; }
    .mtre045-preview__lista-num--horizontal { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px 8px; list-style: none; padding: 2px; margin: 0; counter-reset: repuesto; }
    .mtre045-preview__lista-num--horizontal li { min-height: 14px; counter-increment: repuesto; display: flex; align-items: baseline; gap: 3px; border-bottom: 1px dotted #666; font-size: 10px; }
    .mtre045-preview__lista-num--horizontal li::before { content: counter(repuesto) "."; font-weight: 600; }
    .mtre045-preview__leyenda { font-size: 10px; margin: 8px 0; }
    .mtre045-preview__firmas { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 24px; }
    .mtre045-preview__linea-firma { border-bottom: 1px solid #222; height: 28px; margin-bottom: 4px; }
    .mtre045-preview__firmas small { color: #444; font-size: 9px; }
    .formato-hoja { background: #fff; color: #111; font-family: Arial, Helvetica, sans-serif; font-size: 12px; }
    .formato-hoja table { width: 100%; border-collapse: collapse; }
    .formato-hoja td { border: 1px solid #111; padding: 4px 6px; vertical-align: top; }
    .formato-hoja__logo { width: 28%; text-align: center; }
    .formato-hoja__logo img { display: block; max-width: 160px; max-height: 64px; margin: 0 auto; }
    .formato-hoja__proceso, .formato-hoja__titulo, .formato-hoja__titulo-celda { text-align: center; font-weight: 700; text-transform: uppercase; }
    .formato-hoja__titulo-celda, .formato-hoja__etiqueta { background: #f3f4f6 !important; font-weight: 700; }
    .formato-hoja__grilla { margin-top: -1px; }
    .formato-hoja__diligencia { min-height: 28px; white-space: pre-wrap; }
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
  const cerrar = () => {
    ventana.removeEventListener("afterprint", cerrar);
    ventana.close();
  };
  ventana.addEventListener("afterprint", cerrar);
  window.setTimeout(() => {
    ventana.print();
  }, 300);
}
