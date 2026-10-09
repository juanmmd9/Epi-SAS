import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { coincideArea } from "../../lib/areas";
import { areaUsuario } from "../../lib/usuarioArea";
import { etiquetaCargo } from "../auth/cargosArea";
import type { UsuarioPortal } from "../auth/roles";
import { useAuth } from "../auth/AuthContext";
import { listarRegistradosDelArea } from "../inicio/equipoRegistrados";
import "../inicio/inicio.css";

function usuarioVisible(persona: UsuarioPortal): string {
  return persona.usuario || persona.email;
}

function EquipoPage() {
  const { perfil, rol } = useAuth();
  const area = areaUsuario(perfil);
  const esDiseno = rol === "lider" && Boolean(area) && coincideArea(area ?? "", "Diseno y Desarrollo");
  const usuarioId = perfil?.id ?? "";
  const [registrados, setRegistrados] = useState<UsuarioPortal[]>([]);

  useEffect(() => {
    if (!esDiseno || !area || !usuarioId) return;
    let vigente = true;
    void listarRegistradosDelArea(area, usuarioId)
      .then((lista) => {
        if (!vigente) return;
        setRegistrados(lista.filter((persona) => persona.rol === "solicitante"));
      })
      .catch(() => {
        if (vigente) setRegistrados([]);
      });
    return () => {
      vigente = false;
    };
  }, [area, esDiseno, usuarioId]);

  if (!esDiseno) return <Navigate to="/" replace />;

  return (
    <section className="inicio equipo">
      <div className="inicio__cabecera">
        <div>
          <h1>Equipo</h1>
          <p className="inicio__descripcion">
            Auxiliares de diseño que ya crearon su perfil.
          </p>
        </div>
      </div>

      {registrados.length === 0 ? (
        <p className="equipo__vacio">Todavía no hay auxiliares de diseño.</p>
      ) : (
        <div className="equipo__lista">
          {registrados.map((persona) => {
            const usuario = usuarioVisible(persona);
            const correo =
              persona.email &&
              !persona.email.endsWith("@epi.local") &&
              persona.email !== usuario
                ? persona.email
                : "";
            return (
              <article key={persona.id} className="equipo__card">
                <strong>{persona.nombre || usuario}</strong>
                <span>{etiquetaCargo(persona.rol, persona.area)}</span>
                <span className="equipo__usuario">Usuario: {usuario}</span>
                {correo ? <span>{correo}</span> : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default EquipoPage;
