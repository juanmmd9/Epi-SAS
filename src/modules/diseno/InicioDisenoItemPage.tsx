import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { coincideArea } from "../../lib/areas";
import { areaUsuario } from "../../lib/usuarioArea";
import { useAuth } from "../auth/AuthContext";
import { itemDisenoPorClave, pasoDisenoPorId } from "./disenoPasos";
import "../inicio/inicio.css";

function InicioDisenoItemPage() {
  const { pasoId, itemId } = useParams();
  const ubicacion = useLocation();
  const { perfil, rol } = useAuth();
  const area = areaUsuario(perfil);
  const esDiseno = rol === "lider" && Boolean(area) && coincideArea(area ?? "", "Diseno y Desarrollo");
  const paso = pasoDisenoPorId(pasoId);
  const encontrado = paso && itemId ? itemDisenoPorClave(paso, itemId) : null;

  if (!esDiseno) return <Navigate to="/" replace />;

  if (!paso || !encontrado) {
    return (
      <section className="inicio inicio-diseno">
        <Link to="/" className="inicio-diseno__volver">
          Volver al plan
        </Link>
        <h1>Este punto no está en la etapa</h1>
      </section>
    );
  }

  return (
    <section className="inicio inicio-diseno">
      <Link to={`/diseno/${paso.id}`} state={ubicacion.state} className="inicio-diseno__volver">
        Volver a {paso.titulo}
      </Link>
      <p className="inicio-diseno__numero">
        Etapa {paso.numero} · {encontrado.grupo}
      </p>
      <h1>{encontrado.item.nombre}</h1>
      <p className="inicio__descripcion">{encontrado.item.detalle}</p>
    </section>
  );
}

export default InicioDisenoItemPage;
