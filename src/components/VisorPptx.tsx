import { useEffect, useRef, useState } from "react";
import "./visor-pptx.css";

function VisorPptx({ url }: { url: string }) {
  const caja = useRef<HTMLDivElement>(null);
  const [estado, setEstado] = useState<"cargando" | "listo" | "error">("cargando");
  const [detalle, setDetalle] = useState("");

  useEffect(() => {
    const nodo = caja.current;
    if (!nodo) return;
    let cancelado = false;
    let previewer: { preview: (archivo: ArrayBuffer) => Promise<unknown>; destroy: () => void } | null = null;
    nodo.replaceChildren();
    setEstado("cargando");
    setDetalle("");

    void (async () => {
      try {
        const respuesta = await fetch(url);
        if (!respuesta.ok) throw new Error("No se pudo cargar la presentación.");
        const buffer = await respuesta.arrayBuffer();
        if (cancelado) return;
        const { init } = await import("pptx-preview");
        const ancho = Math.max(320, Math.min(nodo.clientWidth || 960, 960));
        const alto = Math.round((ancho * 9) / 16);
        previewer = init(nodo, { width: ancho, height: alto, mode: "slide" });
        await previewer.preview(buffer);
        if (!cancelado) setEstado("listo");
      } catch (e) {
        if (!cancelado) {
          setEstado("error");
          setDetalle((e as Error).message);
        }
      }
    })();

    return () => {
      cancelado = true;
      previewer?.destroy();
    };
  }, [url]);

  return (
    <div className="visor-pptx">
      {estado === "cargando" && <p className="visor-pptx__aviso">Cargando la presentación...</p>}
      {estado === "error" && (
        <p className="visor-pptx__aviso">No se pudo mostrar la presentación. {detalle}</p>
      )}
      <div ref={caja} className="visor-pptx__lienzo" />
    </div>
  );
}

export default VisorPptx;
