import { type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import type { Permiso } from "./roles";

interface Props {
  permiso: Permiso;
  children: ReactNode;
}

/** Renderiza hijos solo si el rol actual tiene el permiso. */
export function SoloConPermiso({ permiso, children }: Props) {
  const { puede } = useAuth();
  if (!puede(permiso)) return null;
  return <>{children}</>;
}
