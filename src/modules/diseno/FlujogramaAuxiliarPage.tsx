import { Navigate, useParams } from "react-router-dom";
import { proyectoDisenoPorId } from "./proyectosDiseno";

function FlujogramaAuxiliarPage() {
  const { proyectoId } = useParams();
  const proyecto = proyectoDisenoPorId(proyectoId);
  if (!proyecto) return <Navigate to="/" replace />;
  return <Navigate to={`/diseno/proyectos/${proyecto.id}`} replace />;
}

export default FlujogramaAuxiliarPage;
