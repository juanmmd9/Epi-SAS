import { Link } from "react-router-dom";

function PreventivoPage() {
  return (
    <section>
      <h1>Mantenimiento preventivo</h1>
      <p>Registro de actividades y cronograma anual. (Pendiente de migración)</p>
      <Link to="/preventivo/cronograma">Ir al cronograma</Link>
    </section>
  );
}

export default PreventivoPage;
