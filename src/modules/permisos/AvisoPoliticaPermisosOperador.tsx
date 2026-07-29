import "./permisos.css";

/** Aviso corto de política GH — solo visible para operadores. */
function AvisoPoliticaPermisosOperador() {
  return (
    <aside className="permisos__aviso-operador" aria-label="Indicaciones de Gestión Humana">
      <h3>Indicaciones — Gestión Humana</h3>
      <ul>
        <li>
          Solicitudes solo <strong>lunes y martes en la mañana</strong> (autoriza Gerente
          Administrativa).
        </li>
        <li>
          No se autorizan por WhatsApp ni teléfono, salvo urgencia/fuerza mayor. WP GH:{" "}
          <strong>317 377 6876</strong>.
        </li>
        <li>
          Pedir con mínimo <strong>3 días de anticipación</strong>, anexar soporte e informar
          antes al <strong>líder</strong> y al <strong>Director</strong>.
        </li>
        <li>
          Menos de 4 h: se recupera el tiempo. De 4 h en adelante: descuento por nómina.
        </li>
        <li>
          Ausencia sin soporte, aviso ni autorización (TRIAGE no vale): descuento y llamado de
          atención.
        </li>
      </ul>
    </aside>
  );
}

export default AvisoPoliticaPermisosOperador;
