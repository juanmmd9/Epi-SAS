import { Link } from "react-router-dom";

function FormatosPage() {
  return (
    <section>
      <h1>Formatos</h1>
      <p>Catálogo de formatos del sistema de gestión. (Pendiente de migración)</p>
      <Link to="/formatos/gc-re-009">GC-RE-009 — No conformidades</Link>
    </section>
  );
}

export default FormatosPage;
