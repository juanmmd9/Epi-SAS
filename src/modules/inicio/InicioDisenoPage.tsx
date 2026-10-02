import { Link } from "react-router-dom";
import { rutaPublica } from "../../lib/rutaPublica";
import { PASOS_CASCO, type PasoDiseno } from "./disenoPasos";
import "./inicio.css";

function paso(id: string): PasoDiseno {
  const encontrado = PASOS_CASCO.find((item) => item.id === id);
  if (!encontrado) throw new Error(`Falta el paso ${id}`);
  return encontrado;
}

function Nodo({
  id,
  variante,
}: {
  id: string;
  variante?: "decision" | "no" | "si" | "fin";
}) {
  const item = paso(id);
  return (
    <Link
      to={`/diseno/${item.id}`}
      className={"flujo__nodo" + (variante ? ` flujo__nodo--${variante}` : "")}
    >
      <span>{item.numero}</span>
      <strong>{item.titulo}</strong>
      <small>{item.norma}</small>
    </Link>
  );
}

function Flecha() {
  return <div className="flujo__flecha" aria-hidden />;
}

function InicioDisenoPage() {
  return (
    <section className="inicio inicio-diseno">
      <img
        className="inicio-diseno__fondo"
        src={rutaPublica("/Image/fondo-diseno.png")}
        alt=""
      />
      <div className="inicio__cabecera">
        <div>
          <h1>Diseño y Desarrollo</h1>
          <p className="inicio__descripcion">
            Plan de desarrollo de nuevo casco de seguridad. El flujo baja de arriba a abajo.
          </p>
        </div>
      </div>

      <div className="flujo">
        <Nodo id="planificacion" />
        <Flecha />
        <Nodo id="entradas" />
        <Flecha />
        <div className="flujo__paralelo">
          <Nodo id="casco" />
          <Nodo id="herramental" />
        </div>
        <p className="flujo__nota">En paralelo</p>
        <Flecha />
        <Nodo id="revision" />
        <Flecha />
        <Nodo id="verificacion" />
        <Flecha />
        <Nodo id="validacion" />
        <Flecha />
        <Nodo id="decision" variante="decision" />
        <div className="flujo__ramas">
          <div className="flujo__rama">
            <span className="flujo__etiqueta flujo__etiqueta--no">No</span>
            <Flecha />
            <Nodo id="cambios" variante="no" />
            <p className="flujo__nota">Vuelve a verificación</p>
          </div>
          <div className="flujo__rama">
            <span className="flujo__etiqueta flujo__etiqueta--si">Sí</span>
            <Flecha />
            <Nodo id="salidas" variante="si" />
            <Flecha />
            <Nodo id="serie" variante="fin" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default InicioDisenoPage;
