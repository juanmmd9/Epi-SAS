import { Link, Navigate } from "react-router-dom";
import { areaUsuario } from "../../lib/usuarioArea";
import { useAuth } from "../auth/AuthContext";
import { CODIGO_FORMATO, puedeUsarFormatosTejidos } from "./reporteProduccionDatos";
import "../formatos/formatos.css";
import "./reporteProduccion.css";

function FormatosTejidosPage() {
  const { rol, perfil } = useAuth();
  if (!puedeUsarFormatosTejidos(rol, areaUsuario(perfil))) {
    return <Navigate to="/" replace />;
  }

  return (
    <section className="formatos">
      <h1>Formatos</h1>
      <p className="tj-formatos__descripcion">
        Formatos generales del SGC y los propios de Tejidos.
      </p>

      <article className="formato-card">
        <h2>Reporte de producción</h2>
        <p>
          {CODIGO_FORMATO}, versión 6. Liberación de trenzadoras y telares, paradas, desperdicio y
          no conforme. Lleva la firma del operario y del supervisor, con el nombre debajo.
        </p>
        <Link to="/tejidos/formatos/reporte-produccion" className="btn btn--primario">
          Abrir reporte de producción
        </Link>
      </article>

      <article className="formato-card">
        <h2>GC-RE-001</h2>
        <p>Acciones de mejora del SGC. Oportunidades de mejora, evaluación y plan de acción.</p>
        <Link to="/formatos/gc-re-001" className="btn btn--primario">
          Abrir formato GC-RE-001
        </Link>
      </article>

      <article className="formato-card">
        <h2>GC-RE-009</h2>
        <p>No conformidades y acciones correctivas.</p>
        <Link to="/formatos/gc-re-009" className="btn btn--primario">
          Abrir formato GC-RE-009
        </Link>
      </article>

      <article className="formato-card">
        <h2>GC-RE-027</h2>
        <p>Gestión del cambio. Registra el cambio, revísalo, modifícalo e imprímelo.</p>
        <Link to="/formatos/gc-re-027" className="btn btn--primario">
          Abrir formato GC-RE-027
        </Link>
      </article>
    </section>
  );
}

export default FormatosTejidosPage;
