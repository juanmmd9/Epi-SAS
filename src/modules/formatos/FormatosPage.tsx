import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listarNoConformidades } from "./formatosService";
import type { RegistroNc } from "./types";
import "./formatos.css";

function FormatosPage() {
  const [registros, setRegistros] = useState<RegistroNc[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    listarNoConformidades()
      .then(setRegistros)
      .finally(() => setCargando(false));
  }, []);

  return (
    <section className="formatos">
      <h1>Formatos</h1>
      <p className="formatos__descripcion">
        Catálogo de formatos del sistema de gestión de calidad.
      </p>

      <article className="formato-card">
        <h2>GC-RE-009</h2>
        <p>Reporte de no conformidades y acciones correctivas con generación de PDF sobre la plantilla oficial.</p>
        <Link to="/formatos/gc-re-009" className="btn btn--primario">
          Abrir formato GC-RE-009
        </Link>
      </article>

      <h2>Registros recientes ({registros.length})</h2>
      {cargando && <p>Cargando...</p>}
      {!cargando && registros.length === 0 && (
        <p className="formatos__vacio">Aún no hay registros guardados.</p>
      )}
      <div className="formatos__lista-recientes">
        {registros.slice(0, 10).map((registro) => (
          <article key={registro.id} className="item-nc item-nc--compacto">
            <strong>No. {registro.numero} — {registro.datos.area}</strong>
            <p>{registro.datos.fechaDeteccion} · {registro.datos.descripcion.slice(0, 60)}...</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default FormatosPage;
