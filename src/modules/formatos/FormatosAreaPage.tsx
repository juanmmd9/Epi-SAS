import { Link } from "react-router-dom";
import "./formatos.css";

/** Formatos que usan todas las áreas. Un documento de una sola área va en su carpeta: tejidos, mantenimiento o diseno. */

function FormatosAreaPage() {
  return (
    <section className="formatos">
      <h1>Formatos</h1>
      <p className="formatos__descripcion">Formatos del área.</p>

      <article className="formato-card">
        <h2>Gestión del cambio</h2>
        <p>GC-RE-027. Registra el cambio, revísalo en vista previa, modifícalo e imprímelo.</p>
        <Link to="/formatos/gc-re-027" className="btn btn--primario">
          Abrir gestión del cambio
        </Link>
      </article>
    </section>
  );
}

export default FormatosAreaPage;
