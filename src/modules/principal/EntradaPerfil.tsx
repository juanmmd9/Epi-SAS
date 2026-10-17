import { Navigate } from "react-router-dom";
import CargaPantalla from "../../components/CargaPantalla";
import { areaUsuario } from "../../lib/usuarioArea";
import { useAuth } from "../auth/AuthContext";
import { rutaInicioParaRol } from "../auth/roles";

/** Al abrir el perfil, entra a la pantalla que corresponde al rol. */
function EntradaPerfil() {
  const { rol, perfil, cargando } = useAuth();
  if (cargando || !perfil) {
    return <CargaPantalla mensaje="Abriendo perfil..." />;
  }
  return <Navigate to={rutaInicioParaRol(rol, areaUsuario(perfil))} replace />;
}

export default EntradaPerfil;
