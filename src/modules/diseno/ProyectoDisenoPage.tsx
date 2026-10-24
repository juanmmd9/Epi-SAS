import { Navigate, useParams } from "react-router-dom";
import { coincideArea } from "../../lib/areas";
import { areaUsuario } from "../../lib/usuarioArea";
import { useAuth } from "../auth/AuthContext";
import GestorIsoDiseno from "./GestorIsoDisenoPage";
import type { IdLineaDisenoIso } from "./isoDisenoCatalogo";
import { proyectoDisenoPorId } from "./proyectosDiseno";

function ProyectoDisenoPage() {
  const { proyectoId } = useParams();
  const { perfil, rol } = useAuth();
  const area = areaUsuario(perfil);
  const esDiseno =
    rol === "admin" ||
    ((rol === "lider" || rol === "solicitante") &&
      Boolean(area) &&
      coincideArea(area ?? "", "Diseno y Desarrollo"));
  const proyecto = proyectoDisenoPorId(proyectoId);

  if (!esDiseno) return <Navigate to="/" replace />;
  if (!proyecto) return <Navigate to="/inicio" replace />;

  return (
    <GestorIsoDiseno
      lineaId={proyecto.id as IdLineaDisenoIso}
      titulo={proyecto.titulo}
    />
  );
}

export default ProyectoDisenoPage;
