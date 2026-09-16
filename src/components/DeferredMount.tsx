import { useEffect, useState, type ReactNode } from "react";

interface Props {
  delay?: number;
  children: ReactNode;
}

/** Monta hijos tras un retraso para no competir con la carga inicial. */
function DeferredMount({ delay = 2500, children }: Props) {
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setListo(true), delay);
    return () => window.clearTimeout(id);
  }, [delay]);

  if (!listo) return null;
  return <>{children}</>;
}

export default DeferredMount;
