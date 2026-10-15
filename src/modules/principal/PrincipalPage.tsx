import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import VisorWord from "../../components/VisorWord";
import { rutaFormatosPara } from "../../components/layout/navConfig";
import { coincideArea, esAreaProduccion } from "../../lib/areas";
import { areaUsuario } from "../../lib/usuarioArea";
import { rutaPublica } from "../../lib/rutaPublica";
import { useAuth } from "../auth/AuthContext";
import imagenProcedimientos from "../../assets/card-procedimientos.jpg";
import imagenCaracterizacion from "../../assets/card-caracterizacion.jpg";
import imagenDireccionamiento from "../../assets/card-direccionamiento.jpg";
import imagenFormatos from "../../assets/card-formatos.jpg";
import { PRESENTACIONES_SGC } from "./direccionamiento";
import { PROCEDIMIENTOS_REALIZADOS, type ProcedimientoPortal } from "./procedimientos";
import "./principal.css";

function PrincipalPage() {
  const { perfil } = useAuth();
  const area = areaUsuario(perfil);
  const rutaFormatos = rutaFormatosPara(perfil?.rol, area);
  const esProduccion = esAreaProduccion(area);
  const muestraProcedimientos = !esProduccion;
  const esTejidos = Boolean(area && coincideArea(area, "Tejidos"));
  const esPlasticos = Boolean(
    area && (coincideArea(area, "Plasticos") || coincideArea(area, "Produccion Plasticos")),
  );
  const esConfeccion = Boolean(
    area && (coincideArea(area, "Confeccion") || coincideArea(area, "Produccion Confeccion")),
  );
  const formatosEnPrincipal = esTejidos || esPlasticos || esConfeccion;
  const destinoFormatos = formatosEnPrincipal
    ? esTejidos
      ? "/tejidos/formatos"
      : "/area/formatos"
    : rutaFormatos;

  return (
    <section className="principal">
      <header className="principal__cabecera">
        <h1>Principal</h1>
        <p>{esProduccion ? "Accesos del área." : "Accesos del área de mantenimiento."}</p>
      </header>
      <div className="principal__cards">
        {muestraProcedimientos ? (
          <Link to="/principal/procedimientos" className="principal__card">
            <img src={imagenProcedimientos} alt="" />
            <div className="principal__card-texto">
              <h2>Procedimientos</h2>
              <p>{PROCEDIMIENTOS_REALIZADOS.length} procedimientos listos para consultar.</p>
            </div>
          </Link>
        ) : null}
        <Link to="/principal/caracterizacion" className="principal__card">
          <img src={imagenCaracterizacion} alt="" />
          <div className="principal__card-texto">
            <h2>Caracterización</h2>
            <p>Proceso de mantenimiento y sus requisitos normativos.</p>
          </div>
        </Link>
        <Link to="/principal/direccionamiento" className="principal__card">
          <img src={imagenDireccionamiento} alt="" />
          <div className="principal__card-texto">
            <h2>Direccionamiento estratégico</h2>
            <p>{PRESENTACIONES_SGC.length} presentaciones de la carpeta SGC.</p>
          </div>
        </Link>
        {destinoFormatos ? (
          <Link to={destinoFormatos} className="principal__card">
            <img src={imagenFormatos} alt="" />
            <div className="principal__card-texto">
              <h2>Formatos</h2>
              <p>Catálogo de formatos del sistema de gestión.</p>
            </div>
          </Link>
        ) : null}
      </div>
    </section>
  );
}

export function ProcedimientosPage() {
  const { perfil } = useAuth();
  const [visto, setVisto] = useState<ProcedimientoPortal | null>(null);
  if (esAreaProduccion(areaUsuario(perfil))) {
    return <Navigate to="/principal" replace />;
  }

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
