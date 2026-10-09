import { Link } from "react-router-dom";
import { rutaPublica } from "../../lib/rutaPublica";
import { PROYECTOS_DISENO } from "./proyectosDiseno";
import "../inicio/inicio.css";

function InicioDisenoPage() {
  return (
    <section className="inicio inicio-diseno">
      <img
        className="inicio-diseno__fondo"
        src={rutaPublica("/Image/fondo-diseno.png")}
        alt=""
      />
      <div className="inicio-proyectos">
        {PROYECTOS_DISENO.map((proyecto) => (
          <Link
            key={proyecto.id}
            to={`/diseno/proyectos/${proyecto.id}`}
            className="inicio-proyectos__card"
          >
            <img src={rutaPublica(proyecto.imagen)} alt="" />
            <h2>{proyecto.titulo}</h2>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default InicioDisenoPage;
