import "./CargaPantalla.css";

interface Props {
  mensaje?: string;
  pantallaCompleta?: boolean;
}

function CargaPantalla({ mensaje = "Cargando...", pantallaCompleta = false }: Props) {
  return (
    <div
      className={
        "carga-pantalla" + (pantallaCompleta ? " carga-pantalla--completa" : "")
      }
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="carga-pantalla__spinner" aria-hidden="true" />
      <p className="carga-pantalla__texto">{mensaje}</p>
    </div>
  );
}

export default CargaPantalla;
