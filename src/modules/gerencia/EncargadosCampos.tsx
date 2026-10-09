/** Lista editable de encargados del proyecto (+ para agregar más). */
function EncargadosCampos({
  valores,
  onChange,
  etiqueta = "Encargado del proyecto",
}: {
  valores: string[];
  onChange: (siguiente: string[]) => void;
  etiqueta?: string;
}) {
  const lista = valores.length > 0 ? valores : [""];

  function actualizar(i: number, texto: string) {
    const next = [...lista];
    next[i] = texto;
    onChange(next);
  }

  function quitar(i: number) {
    if (lista.length <= 1) {
      onChange([""]);
      return;
    }
    onChange(lista.filter((_, idx) => idx !== i));
  }

  function agregar() {
    onChange([...lista, ""]);
  }

  return (
    <div className="gerencia__campo gerencia__encargados">
      <span className="gerencia__encargados-etiqueta">{etiqueta}</span>
      {lista.map((nombre, i) => (
        <div key={i} className="gerencia__encargados-fila">
          <input
            value={nombre}
            onChange={(e) => actualizar(i, e.target.value)}
            placeholder={i === 0 ? "Nombre del encargado" : "Otra persona"}
            aria-label={i === 0 ? "Encargado principal" : `Encargado ${i + 1}`}
          />
          {lista.length > 1 && (
            <button
              type="button"
              className="gerencia__encargados-quitar"
              title="Quitar"
              aria-label="Quitar persona"
              onClick={() => quitar(i)}
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button type="button" className="btn gerencia__encargados-add" onClick={agregar}>
        + Agregar persona
      </button>
    </div>
  );
}

export default EncargadosCampos;
