import type { Persona } from "./types";
import "./selectorPersonal.css";

interface Props {
  personal: Persona[];
  seleccionados: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  leyenda?: string;
  vacio?: string;
}

function SelectorPersonal({
  personal,
  seleccionados,
  onChange,
  disabled = false,
  leyenda = "Técnicos que realizaron el trabajo * (puedes marcar varios)",
  vacio = "Registra personal en el módulo Personal",
}: Props) {
  function alternar(id: string) {
    if (disabled) return;
    onChange(
      seleccionados.includes(id)
        ? seleccionados.filter((item) => item !== id)
        : [...seleccionados, id],
    );
  }

  return (
    <fieldset className="selector-personal" disabled={disabled}>
      <legend>{leyenda}</legend>
      {personal.length === 0 ? (
        <p className="selector-personal__vacio">{vacio}</p>
      ) : (
        <div className="selector-personal__lista">
          {personal.map((p) => (
            <label key={p.id} className="selector-personal__item">
              <input
                type="checkbox"
                checked={seleccionados.includes(p.id)}
                onChange={() => alternar(p.id)}
              />
              <span>{p.nombre}</span>
            </label>
          ))}
        </div>
      )}
      {seleccionados.length > 0 && (
        <p className="selector-personal__resumen">
          Seleccionados: {seleccionados.length}
        </p>
      )}
    </fieldset>
  );
}

export default SelectorPersonal;
