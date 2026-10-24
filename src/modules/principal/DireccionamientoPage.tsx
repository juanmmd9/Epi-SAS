import { useState } from "react";
import { Link } from "react-router-dom";
import VisorPptx from "../../components/VisorPptx";
import { rutaPublica } from "../../lib/rutaPublica";
import { PRESENTACIONES_SGC, type PresentacionSgc } from "./direccionamiento";
import "./principal.css";

function DireccionamientoPage() {
  const [vista, setVista] = useState<PresentacionSgc | null>(null);

  return (
    <section className="principal">
      <header className="principal__cabecera">
        <Link to="/principal" className="btn">
          ← Principal
        </Link>
        <h1>Direccionamiento estratégico</h1>
        <p>Presentaciones de la carpeta SGC.</p>
      </header>
      <ul className="principal__lista">
        {PRESENTACIONES_SGC.map((presentacion) => (
          <li key={presentacion.archivo} className="principal__doc">
            <div>
              <strong>{presentacion.titulo}</strong>
              <span>Presentación</span>
            </div>
            <button type="button" className="btn btn--primario" onClick={() => setVista(presentacion)}>
              Ver
            </button>
          </li>
        ))}
      </ul>
      {vista && (
        <div className="principal__visor">
          <div className="principal__visor-barra">
            <h2>{vista.titulo}</h2>
            <button type="button" className="btn" onClick={() => setVista(null)}>
              Cerrar
            </button>
          </div>
          <VisorPptx url={rutaPublica(vista.archivo)} />
        </div>
      )}
    </section>
  );
}

export default DireccionamientoPage;
