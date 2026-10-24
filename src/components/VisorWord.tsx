import { useEffect, useRef, useState } from "react";
import "./visor-word.css";

function VisorWord({ url }: { url: string }) {
  const estilos = useRef<HTMLDivElement>(null);
  const hojas = useRef<HTMLDivElement>(null);
  const [estado, setEstado] = useState<"cargando" | "listo" | "error">("cargando");
  const [cantidad, setCantidad] = useState(0);
  const [detalle, setDetalle] = useState("");

  useEffect(() => {
    const destino = hojas.current;
    const cajaEstilos = estilos.current;
    if (!destino || !cajaEstilos) return;
    let cancelado = false;
    destino.replaceChildren();
    cajaEstilos.replaceChildren();
    setEstado("cargando");
    setCantidad(0);
    setDetalle("");

    void (async () => {
      try {
        const respuesta = await fetch(url);
        if (!respuesta.ok) throw new Error("No se pudo cargar el documento.");
        const buffer = await respuesta.arrayBuffer();
        if (cancelado) return;
        const { renderAsync } = await import("docx-preview");
        await renderAsync(buffer, destino, cajaEstilos, {
          className: "docx",
          inWrapper: true,
          breakPages: true,
          ignoreLastRenderedPageBreak: false,
          renderHeaders: true,
          renderFooters: true,
        });
        if (cancelado) return;
        setCantidad(destino.querySelectorAll("section.docx").length);
        setEstado("listo");
      } catch (e) {
        if (!cancelado) {
          setEstado("error");
          setDetalle((e as Error).message);
        }
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [url]);

  return (
    <div className="visor-word">
      {estado === "cargando" && <p className="visor-word__aviso">Cargando todas las hojas...</p>}
      {estado === "listo" && cantidad > 0 && (
        <p className="visor-word__aviso">
          {cantidad} {cantidad === 1 ? "hoja" : "hojas"}. Desplaza hacia abajo para verlas todas.
        </p>
      )}
      {estado === "error" && (
        <p className="visor-word__aviso">No se pudo mostrar el documento. {detalle}</p>
      )}
      <div ref={estilos} />
      <div ref={hojas} />
    </div>
  );
}

export default VisorWord;
