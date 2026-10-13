import { useState } from "react";
import { Link } from "react-router-dom";
import VisorWord from "../../components/VisorWord";
import { rutaPublica } from "../../lib/rutaPublica";
import imagenProcedimientos from "../../assets/card-procedimientos.jpg";
import imagenDireccionamiento from "../../assets/card-direccionamiento.jpg";
import { PRESENTACIONES_SGC } from "./direccionamiento";
import { PROCEDIMIENTOS_REALIZADOS, type ProcedimientoPortal } from "./procedimientos";
import "./principal.css";

function PrincipalPage() {
  return (
    <section className="principal">
      <header className="principal__cabecera">
        <h1>Principal</h1>
        <p>Accesos del área de mantenimiento.</p>
      </header>
      <div className="principal__cards">
        <Link to="/principal/procedimientos" className="principal__card">
          <img src={imagenProcedimientos} alt="" />
          <div className="principal__card-texto">
            <h2>Procedimientos</h2>
            <p>{PROCEDIMIENTOS_REALIZADOS.length} procedimientos listos para consultar.</p>
          </div>
        </Link>
        <Link to="/principal/direccionamiento" className="principal__card">
          <img src={imagenDireccionamiento} alt="" />
          <div className="principal__card-texto">
            <h2>Direccionamiento estratégico</h2>
            <p>{PRESENTACIONES_SGC.length} presentaciones de la carpeta SGC.</p>
          </div>
        </Link>
      </div>
    </section>
  );
}

export function ProcedimientosPage() {
  const [visto, setVisto] = useState<ProcedimientoPortal | null>(null);

  return (
    <section className="principal">
      <header className="principal__cabecera">
        <Link to="/principal" className="btn">
          ← Principal
        </Link>
        <h1>Procedimientos</h1>
        <p>Los que ya quedaron escritos para el portal.</p>
      </header>
      <ul className="principal__lista">
        {PROCEDIMIENTOS_REALIZADOS.map((procedimiento) => (
          <li key={procedimiento.codigo} className="principal__doc">
            <div>
              <strong>
                {procedimiento.codigo} — {procedimiento.titulo}
              </strong>
              <span>Versión {procedimiento.version}</span>
              <p>{procedimiento.resumen}</p>
            </div>
            <button
              type="button"
              className="btn btn--primario"
              onClick={() => setVisto(procedimiento)}
            >
              Ver
            </button>
          </li>
        ))}
      </ul>
      {visto && (
        <div className="principal__visor">
          <div className="principal__visor-barra">
            <h2>
              {visto.codigo} — {visto.titulo}
            </h2>
            <button type="button" className="btn" onClick={() => setVisto(null)}>
              Cerrar
            </button>
          </div>
          <VisorWord url={rutaPublica(visto.archivo)} />
        </div>
      )}
    </section>
  );
}

export default PrincipalPage;
