import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { coincideArea } from "../../lib/areas";
import { areaUsuario } from "../../lib/usuarioArea";
import { useAuth } from "../auth/AuthContext";
import { pasoDisenoPorId, claveItemDiseno } from "./disenoPasos";
import "./inicio.css";

function InicioDisenoDetallePage() {
  const { pasoId } = useParams();
  const ubicacion = useLocation();
  const desdeUsuario = (ubicacion.state as { desdeUsuario?: string } | null)?.desdeUsuario;
  const { perfil, rol } = useAuth();
  const area = areaUsuario(perfil);
  const esDiseno = rol === "lider" && Boolean(area) && coincideArea(area ?? "", "Diseno y Desarrollo");
  const paso = pasoDisenoPorId(pasoId);

  if (!esDiseno) {
    return <Navigate to="/" replace />;
  }

  if (!paso) {
    return (
      <section className="inicio inicio-diseno">
        <Link
          to={desdeUsuario ? `/equipo/usuario/${desdeUsuario}` : "/"}
          className="inicio-diseno__volver"
        >
          {desdeUsuario ? "Volver a las etapas" : "Volver al plan"}
        </Link>
        <h1>Esta etapa no está en el plan</h1>
      </section>
    );
  }

  return (
    <section className="inicio inicio-diseno">
      <Link
        to={desdeUsuario ? `/equipo/usuario/${desdeUsuario}` : "/"}
        className="inicio-diseno__volver"
      >
        {desdeUsuario ? "Volver a las etapas" : "Volver al plan"}
      </Link>
      <div className="inicio__cabecera">
        <div>
          <p className="inicio-diseno__numero">Etapa {paso.numero}</p>
          <h1>{paso.titulo}</h1>
          <p className="inicio-diseno__norma">{paso.norma}</p>
          <p className="inicio__descripcion">{paso.resumen}</p>
        </div>
      </div>
      <div className="inicio-diseno__bloques">
        {paso.bloques.map((bloque) => (
          <section key={bloque.titulo} className="inicio-diseno__bloque">
            <h2>{bloque.titulo}</h2>
            <div className="inicio-diseno__items">
              {bloque.items.map((item) => (
                <Link
                  key={item.nombre}
                  to={`/diseno/${paso.id}/item/${claveItemDiseno(item.nombre)}`}
                  state={ubicacion.state}
                  className="inicio-diseno__item-card"
                >
                  <h3>{item.nombre}</h3>
                  <p>{item.detalle}</p>
                  <span>Entrar</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

export default InicioDisenoDetallePage;
