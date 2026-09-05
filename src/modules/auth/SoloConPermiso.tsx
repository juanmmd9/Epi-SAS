import { useRef, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import type { Permiso } from "./roles";

interface Props {
  permiso: Permiso;
  children: ReactNode;
}

/** Si ya se concedió el permiso en esta pantalla, no ocultar el contenido por un fallo momentáneo de sesión. */
export function SoloConPermiso({ permiso, children }: Props) {
  const { puede } = useAuth();
  const concedido = useRef(false);
  if (puede(permiso)) concedido.current = true;
  if (!puede(permiso) && !concedido.current) return null;
  return children;
}
