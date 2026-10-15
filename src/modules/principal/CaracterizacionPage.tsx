import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  CARACTERIZACION,
  FLUJO,
  REQUISITOS,
  type RequisitoNormativo,
} from "./caracterizacion";
import "./principal.css";

function CaracterizacionPage() {
  const { esAdmin } = useAuth();
  const [requisito, setRequisito] = useState<RequisitoNormativo | null>(null);

  if (!esAdmin) {
    return <Navigate to="/principal" replace />;
  }

  function elegir(siguiente: RequisitoNormativo) {
    setRequisito(siguiente);
    document.getElementById("caracterizacion-detalle")?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }

  return (
    <section className="principal">
      <header className="principal__cabecera">
        <Link to="/principal" className="btn">
          ← Principal
        </Link>
        <h1>{CARACTERIZACION.titulo}</h1>
        <p>
          {CARACTERIZACION.codigo} · Versión {CARACTERIZACION.version} · Modificación{" "}
          {CARACTERIZACION.modificacion}
        </p>
      </header>

      <div className="caracterizacion__flujo">
        {FLUJO.map((grupo, indice) => (
          <div key={grupo.columna} className="caracterizacion__paso">
            {indice > 0 ? <span className="caracterizacion__flecha" aria-hidden="true" /> : null}
            <section className="caracterizacion__columna">
              <h2>{grupo.columna}</h2>
              <ul>
                {grupo.puntos.map((texto) => (
                  <li key={texto}>{texto}</li>
                ))}
              </ul>
            </section>
          </div>
        ))}
      </div>

      <section className="caracterizacion__bloque">
        <h2>Requisitos normativos · ISO 9001:2015</h2>
        <p>Cada numeral es un botón. Ábrelo para ver qué pide en este proceso.</p>
        <div className="caracterizacion__requisitos">
          {REQUISITOS.map((item) => {
            const activo = requisito?.id === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={
                  activo
                    ? "caracterizacion__requisito caracterizacion__requisito--activo"
                    : "caracterizacion__requisito"
                }
                aria-pressed={activo}
                onClick={() => elegir(item)}
              >
                <strong>{item.numeral}</strong>
                <span>{item.titulo}</span>
              </button>
            );
          })}
        </div>
      </section>

      <article id="caracterizacion-detalle" className="caracterizacion__detalle">
        {!requisito ? (
          <p>Pulsa un requisito normativo para ver qué pide en este proceso.</p>
        ) : (
          <>
            <span>ISO 9001:2015 · {requisito.numeral}</span>
            <h2>{requisito.titulo}</h2>
            <p>{requisito.enEsteProceso}</p>
          </>
        )}
      </article>

      <div className="caracterizacion__fichas">
        <article>
          <h2>Objetivo</h2>
          <p>{CARACTERIZACION.objetivo}</p>
        </article>
        <article>
          <h2>Alcance</h2>
          <p>{CARACTERIZACION.alcance}</p>
        </article>
        <article>
          <h2>Riesgos</h2>
          <ul>
            {CARACTERIZACION.riesgos.map((riesgo) => (
              <li key={riesgo}>{riesgo}</li>
            ))}
          </ul>
        </article>
        <article>
          <h2>Oportunidades</h2>
          <ul>
            {CARACTERIZACION.oportunidades.map((oportunidad) => (
              <li key={oportunidad}>{oportunidad}</li>
            ))}
          </ul>
        </article>
        <article>
          <h2>Interacción con los procesos</h2>
          <p>{CARACTERIZACION.interaccion}</p>
        </article>
        <article>
          <h2>Responsable</h2>
          <p>{CARACTERIZACION.responsable}</p>
        </article>
        <article>
          <h2>Recursos</h2>
          <p>{CARACTERIZACION.recursos}</p>
        </article>
        <article>
          <h2>Documentos y registros</h2>
          <p>{CARACTERIZACION.documentos}</p>
        </article>
      </div>

      <section className="caracterizacion__bloque">
        <h2>Indicadores</h2>
        <div className="caracterizacion__tabla">
          <table>
            <thead>
              <tr>
                <th>Indicador</th>
                <th>Meta</th>
                <th>Frecuencia</th>
                <th>Método</th>
              </tr>
            </thead>
            <tbody>
              {CARACTERIZACION.indicadores.map((indicador) => (
                <tr key={indicador.nombre}>
                  <td>{indicador.nombre}</td>
                  <td>{indicador.meta}</td>
                  <td>{indicador.frecuencia}</td>
                  <td>{indicador.metodo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

export default CaracterizacionPage;
