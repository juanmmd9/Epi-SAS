import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";

type Props = {
  onChange: (dataUrl: string | null) => void;
  /** Reinicia el canvas cuando cambia (p. ej. al abrir otro PM). */
  reinicioClave?: string;
};

type Punto = { x: number; y: number };

/**
 * Lienzo para firmar con dedo (touch/pointer), mouse o imagen cargada del PC.
 * Pensado para Android WebView (Capacitor) y escritorio.
 */
function FirmaPad({ onChange, reinicioClave = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputArchivoRef = useRef<HTMLInputElement | null>(null);
  const dibujando = useRef(false);
  const ultimo = useRef<Punto | null>(null);
  const tieneTrazado = useRef(false);
  const onChangeRef = useRef(onChange);
  const [vacio, setVacio] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  onChangeRef.current = onChange;

  const ajustarTamano = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const padre = canvas.parentElement;
    if (!padre) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const anchoCss = Math.max(260, Math.floor(padre.clientWidth) || 280);
    const altoCss = 180;
    const snapshot = tieneTrazado.current ? canvas.toDataURL("image/png") : null;

    canvas.width = Math.floor(anchoCss * ratio);
    canvas.height = Math.floor(altoCss * ratio);
    canvas.style.width = `${anchoCss}px`;
    canvas.style.height = `${altoCss}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, anchoCss, altoCss);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (snapshot) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, anchoCss, altoCss);
      };
      img.src = snapshot;
    }
  }, []);

  const emitirFirma = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !tieneTrazado.current) {
      onChangeRef.current(null);
      return;
    }
    onChangeRef.current(canvas.toDataURL("image/png"));
  }, []);

  const limpiarCanvas = useCallback(() => {
    tieneTrazado.current = false;
    dibujando.current = false;
    ultimo.current = null;
    ajustarTamano();
    setVacio(true);
    setErrorCarga(null);
  }, [ajustarTamano]);

  const limpiar = useCallback(() => {
    limpiarCanvas();
    onChangeRef.current(null);
    if (inputArchivoRef.current) inputArchivoRef.current.value = "";
  }, [limpiarCanvas]);

  const dibujarImagenEnCanvas = useCallback(
    (dataUrl: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      ajustarTamano();
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const anchoCss = canvas.clientWidth || 280;
      const altoCss = canvas.clientHeight || 180;
      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, anchoCss, altoCss);
        const escala = Math.min(anchoCss / img.width, altoCss / img.height);
        const w = img.width * escala;
        const h = img.height * escala;
        const x = (anchoCss - w) / 2;
        const y = (altoCss - h) / 2;
        ctx.drawImage(img, x, y, w, h);
        tieneTrazado.current = true;
        setVacio(false);
        setErrorCarga(null);
        onChangeRef.current(canvas.toDataURL("image/png"));
      };
      img.onerror = () => {
        setErrorCarga("No se pudo leer la imagen. Prueba con PNG o JPG.");
        onChangeRef.current(null);
      };
      img.src = dataUrl;
    },
    [ajustarTamano],
  );

  function manejarArchivo(evento: ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    if (!archivo) return;
    if (!archivo.type.startsWith("image/")) {
      setErrorCarga("Selecciona un archivo de imagen (PNG, JPG, etc.).");
      evento.target.value = "";
      return;
    }
    if (archivo.size > 1.5 * 1024 * 1024) {
      setErrorCarga("La imagen es muy pesada (máx. 1.5 MB).");
      evento.target.value = "";
      return;
    }
    const lector = new FileReader();
    lector.onload = () => {
      const resultado = typeof lector.result === "string" ? lector.result : null;
      if (!resultado) {
        setErrorCarga("No se pudo cargar la imagen.");
        return;
      }
      dibujarImagenEnCanvas(resultado);
    };
    lector.onerror = () => setErrorCarga("Error al leer el archivo.");
    lector.readAsDataURL(archivo);
  }

  useEffect(() => {
    limpiarCanvas();
    const id = window.requestAnimationFrame(() => ajustarTamano());
    return () => window.cancelAnimationFrame(id);
  }, [reinicioClave, limpiarCanvas, ajustarTamano]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const padre = canvas?.parentElement;
    if (!padre || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      if (!tieneTrazado.current) ajustarTamano();
    });
    ro.observe(padre);
    return () => ro.disconnect();
  }, [ajustarTamano]);

  function puntoDesdeCliente(clientX: number, clientY: number): Punto | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }

  function trazarHasta(punto: Punto) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const prev = ultimo.current;
    if (!ctx || !prev) {
      ultimo.current = punto;
      return;
    }
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(punto.x, punto.y);
    ctx.stroke();
    ultimo.current = punto;
    if (!tieneTrazado.current) {
      tieneTrazado.current = true;
      setVacio(false);
    }
  }

  function iniciarEn(clientX: number, clientY: number) {
    const punto = puntoDesdeCliente(clientX, clientY);
    if (!punto) return;
    dibujando.current = true;
    ultimo.current = punto;
  }

  function moverEn(clientX: number, clientY: number) {
    if (!dibujando.current) return;
    const punto = puntoDesdeCliente(clientX, clientY);
    if (!punto) return;
    trazarHasta(punto);
  }

  function terminarTrazo() {
    if (!dibujando.current) return;
    dibujando.current = false;
    ultimo.current = null;
    emitirFirma();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const el = canvas;

    function onPointerDown(e: PointerEvent) {
      e.preventDefault();
      el.setPointerCapture?.(e.pointerId);
      iniciarEn(e.clientX, e.clientY);
    }
    function onPointerMove(e: PointerEvent) {
      if (!dibujando.current) return;
      e.preventDefault();
      moverEn(e.clientX, e.clientY);
    }
    function onPointerUp(e: PointerEvent) {
      e.preventDefault();
      try {
        el.releasePointerCapture?.(e.pointerId);
      } catch {
        // ignore
      }
      terminarTrazo();
    }

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length === 0) return;
      e.preventDefault();
      const t = e.touches[0];
      iniciarEn(t.clientX, t.clientY);
    }
    function onTouchMove(e: TouchEvent) {
      if (!dibujando.current || e.touches.length === 0) return;
      e.preventDefault();
      const t = e.touches[0];
      moverEn(t.clientX, t.clientY);
    }
    function onTouchEnd(e: TouchEvent) {
      e.preventDefault();
      terminarTrazo();
    }

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: false });
    el.addEventListener("touchcancel", onTouchEnd, { passive: false });

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [emitirFirma]);

  return (
    <div className="firma-pad">
      <div className="firma-pad__lienzo">
        <canvas ref={canvasRef} className="firma-pad__canvas" />
        {vacio && (
          <span className="firma-pad__guia">Firme aquí con el dedo o cargue una imagen</span>
        )}
      </div>
      <div className="firma-pad__acciones">
        <button type="button" className="btn" onClick={limpiar}>
          Limpiar firma
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => inputArchivoRef.current?.click()}
        >
          Cargar imagen del PC
        </button>
        <input
          ref={inputArchivoRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="firma-pad__input-archivo"
          onChange={manejarArchivo}
        />
      </div>
      {errorCarga ? <p className="firma-pad__error">{errorCarga}</p> : null}
    </div>
  );
}

export default FirmaPad;
