import { useMemo, useState } from "react";
import type { HojaVida } from "../modules/hojas/types";
import { hojaEstaActiva } from "../modules/hojas/hojasFiltro";
import "./buscadorMaquina.css";

type Props = {
  maquinas: HojaVida[];
  valorId: string;
  onElegir: (id: string) => void;
  requerido?: boolean;
  avisoVacio?: string;
};

function textoPlano(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function etiquetaMaquina(maquina: HojaVida): string {
  const codigo = maquina.codigo?.trim() || "sin código";
  return `${codigo} — ${maquina.nombre}`;
}

/** Elige una máquina del formulario. No filtra la lista de solicitudes ni el contador del mes. */
function BuscadorMaquina({ maquinas, valorId, onElegir, requerido = false, avisoVacio }: Props) {
  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState(false);
  const elegida = maquinas.find((maquina) => maquina.id === valorId) ?? null;

  const coincidencias = useMemo(() => {
    const consulta = textoPlano(texto.trim());
    if (consulta.length < 1) return [];
    return maquinas
      .filter((maquina) => {
        const codigo = textoPlano(maquina.codigo ?? "");
        const nombre = textoPlano(maquina.nombre);
        return codigo.includes(consulta) || nombre.includes(consulta);
      })
      .slice(0, 12);
  }, [maquinas, texto]);

  const mostrado = abierto ? texto : elegida ? etiquetaMaquina(elegida) : "";

  function elegir(id: string) {
    onElegir(id);
    setTexto("");
    setAbierto(false);
  }

  return (
    <label className="buscador-maquina">
      Buscar máquina{requerido ? " *" : ""}
      <span className="buscador-maquina__campo">
        <input
          type="search"
          value={mostrado}
          placeholder="Código o nombre. Solo elige la máquina del formulario."
          autoComplete="off"
          onFocus={() => {
            setAbierto(true);
            setTexto("");
          }}
          onChange={(e) => {
            setTexto(e.target.value);
            setAbierto(true);
            if (valorId) onElegir("");
          }}
          onBlur={() => {
            window.setTimeout(() => setAbierto(false), 150);
          }}
        />
        {abierto && texto.trim() && (
          <ul className="buscador-maquina__lista">
            {coincidencias.length === 0 ? (
              <li className="buscador-maquina__vacio">No hay máquinas con ese código o nombre.</li>
            ) : (
              coincidencias.map((maquina) => (
                <li key={maquina.id}>
                  <button type="button" onMouseDown={() => elegir(maquina.id)}>
                    <strong>{maquina.codigo?.trim() || "Sin código"}</strong>
                    <span>{maquina.nombre}</span>
                    {!hojaEstaActiva(maquina) ? <em>Inactiva</em> : null}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </span>
      {requerido ? <input className="buscador-maquina__requerido" required value={valorId} readOnly tabIndex={-1} /> : null}
      <span className="buscador-maquina__ayuda">
        Solo elige la máquina de este formulario. No filtra la lista ni el contador del mes.
      </span>
      {avisoVacio ? <span className="buscador-maquina__ayuda">{avisoVacio}</span> : null}
    </label>
  );
}

export default BuscadorMaquina;
