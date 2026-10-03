import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { coincideArea } from "../../lib/areas";
import { areaUsuario } from "../../lib/usuarioArea";
import { etiquetaCargo } from "../auth/cargosArea";
import { useAuth } from "../auth/AuthContext";
import { PASOS_CASCO } from "./disenoPasos";
import { listarRegistradosDelArea } from "./equipoRegistrados";
import "./inicio.css";

function EquipoEtapasPage() {
  const { usuarioId } = useParams();
  const { perfil, rol } = useAuth();
  const area = areaUsuario(perfil);
  const esDiseno = rol === "lider" && Boolean(area) && coincideArea(area ?? "", "Diseno y Desarrollo");
  const soyYo = Boolean(usuarioId) && usuarioId === perfil?.id;
  const [nombre, setNombre] = useState(soyYo ? perfil?.nombre || perfil?.usuario || "" : "");
  const [cargo, setCargo] = useState(soyYo ? etiquetaCargo(perfil?.rol, area) : "");
  const [usuario, setUsuario] = useState(soyYo ? perfil?.usuario || perfil?.email || "" : "");
  const [listo, setListo] = useState(soyYo);
  const [falta, setFalta] = useState(false);

  useEffect(() => {
    if (!esDiseno || !area || !usuarioId || !perfil) return;
    if (usuarioId === perfil.id) {
      setNombre(perfil.nombre || perfil.usuario || "Director de diseño");
      setCargo(etiquetaCargo(perfil.rol, area));
      setUsuario(perfil.usuario || perfil.email);
      setListo(true);
      setFalta(false);
      return;
    }
    let vigente = true;
    setListo(false);
    void listarRegistradosDelArea(area, perfil.id)
      .then((lista) => {
        if (!vigente) return;
        const persona = lista.find((item) => item.id === usuarioId);
        if (!persona) {
          setFalta(true);
        } else {
          setNombre(persona.nombre || persona.usuario || persona.email);
          setCargo(etiquetaCargo(persona.rol, persona.area));
          setUsuario(persona.usuario || persona.email);
          setFalta(false);
        }
        setListo(true);
      })
      .catch(() => {
        if (!vigente) return;
        setFalta(true);
        setListo(true);
      });
    return () => {
      vigente = false;
    };
  }, [area, esDiseno, perfil, usuarioId]);

  if (!esDiseno) return <Navigate to="/" replace />;

  return (
    <section className="inicio equipo">
      <Link to="/equipo" className="inicio-diseno__volver">
        Volver al equipo
      </Link>
      {!listo ? (
        <p className="equipo__vacio">Cargando etapas...</p>
      ) : falta ? (
        <h1>Esta persona no está en el equipo</h1>
      ) : (
        <>
          <div className="inicio__cabecera">
            <div>
              <p className="inicio-diseno__numero">{cargo}</p>
              <h1>{nombre}</h1>
              <p className="inicio__descripcion">Usuario: {usuario}. Etapas del proyecto del casco.</p>
            </div>
          </div>
          <div className="equipo__lista">
            {PASOS_CASCO.map((paso) => (
              <Link
                key={paso.id}
                className="equipo__card equipo__card-ir"
                to={`/diseno/${paso.id}`}
                state={{ desdeUsuario: usuarioId }}
              >
                <strong>
                  {paso.numero}. {paso.titulo}
                </strong>
                <span>{paso.norma}</span>
                <span>Entrar</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default EquipoEtapasPage;
