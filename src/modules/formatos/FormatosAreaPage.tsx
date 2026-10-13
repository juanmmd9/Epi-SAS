import { Link } from "react-router-dom";
import "./formatos.css";

/** Formatos que usan todas las áreas. Un documento de una sola área va en su carpeta: tejidos, mantenimiento o diseno. */

function FormatosAreaPage() {
  return (
    <section className="formatos">
      <h1>Formatos</h1>
      <p className="formatos__descripcion">Formatos del área.</p>

      <article className="formato-card">
        <h2>GC-RE-001</h2>
        <p>Acciones de mejora del SGC.</p>
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
        <p>Gestión del cambio.</p>
        <Link to="/formatos/gc-re-027" className="btn btn--primario">
          Abrir formato GC-RE-027
        </Link>
      </article>
    </section>
  );
}

export default FormatosAreaPage;
