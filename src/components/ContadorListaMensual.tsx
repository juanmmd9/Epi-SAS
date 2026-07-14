import { NOMBRES_MESES } from "../lib/fechas";
import "./contadorLista.css";

export interface ContadorListaTarjeta {
  key: string;
  etiqueta: string;
  valor: number;
  tono?: "alerta" | "ok" | "espera" | "neutro";
}

export interface ContadorListaDesglose {
  titulo: string;
  items: { clave: string; cantidad: number }[];
}

/** mes = 0 significa "Todos los meses" (sin filtro de fecha). */
interface Props {
  titulo?: string;
  mes: number;
  anio: number;
  onMes: (mes: number) => void;
  onAnio: (anio: number) => void;
  total: number;
  totalEtiqueta: string;
  tarjetas: ContadorListaTarjeta[];
  chipArea?: string;
  criterio?: {
    valor: string;
    onChange: (valor: string) => void;
    opciones: { valor: string; etiqueta: string }[];
  };
  desgloses?: ContadorListaDesglose[];
  /** Clave activa (`todas` = total del mes, o key de tarjeta). */
  seleccion?: string | null;
  onSeleccionar?: (key: string) => void;
}

export function etiquetaPeriodoContador(mes: number, anio: number): string {
  if (mes === 0) return "Todos los meses";
  return `${NOMBRES_MESES[mes - 1]} ${anio}`;
}

export function ContadorListaMensual({
  titulo = "Contador del mes",
  mes,
  anio,
  onMes,
  onAnio,
  total,
  totalEtiqueta,
  tarjetas,
  chipArea,
  criterio,
  desgloses,
  seleccion = null,
  onSeleccionar,
}: Props) {
  const anios = Array.from({ length: 8 }, (_, i) => new Date().getFullYear() - i);
  const clickable = Boolean(onSeleccionar);

  function manejarClic(key: string) {
    if (!onSeleccionar) return;
    onSeleccionar(key);
  }

  return (
    <aside className="contador-lista" aria-label={titulo}>
      <div className="contador-lista__cabecera">
        <div>
          <h2>{titulo}</h2>
          <p className="contador-lista__hint">
            {clickable
              ? "Elige el mes (o todos) y pulsa una tarjeta para ver la lista"
              : "Selecciona el mes para ver abiertas y cerradas"}
          </p>
        </div>
        {chipArea && <span className="contador-lista__chip">Área: {chipArea}</span>}
      </div>

      <div className="contador-lista__controles">
        <label>
          Mes
          <select value={mes} onChange={(e) => onMes(Number(e.target.value))}>
            <option value={0}>Todos los meses</option>
            {NOMBRES_MESES.map((nombre: string, i: number) => (
              <option key={nombre} value={i + 1}>
                {nombre}
              </option>
            ))}
          </select>
        </label>
        <label>
          Año
          <select value={anio} onChange={(e) => onAnio(Number(e.target.value))}>
            {!anios.includes(anio) && <option value={anio}>{anio}</option>}
            {anios.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        {criterio && (
          <label>
            Contar por
            <select
              value={criterio.valor}
              onChange={(e) => criterio.onChange(e.target.value)}
            >
              {criterio.opciones.map((op) => (
                <option key={op.valor} value={op.valor}>
                  {op.etiqueta}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="contador-lista__principal">
        {clickable ? (
          <button
            type="button"
            className={
              "contador-lista__total contador-lista__boton" +
              (seleccion === "todas" ? " contador-lista__boton--activa" : "")
            }
            onClick={() => manejarClic("todas")}
            aria-pressed={seleccion === "todas"}
          >
            <span>{etiquetaPeriodoContador(mes, anio)}</span>
            <strong>{total}</strong>
            <small>{totalEtiqueta}</small>
          </button>
        ) : (
          <div className="contador-lista__total">
            <span>{etiquetaPeriodoContador(mes, anio)}</span>
            <strong>{total}</strong>
            <small>{totalEtiqueta}</small>
          </div>
        )}
        <div className="contador-lista__tarjetas">
          {tarjetas.map((t) => {
            const activa = seleccion === t.key;
            const clases =
              "contador-lista__tarjeta" +
              (t.tono ? ` contador-lista__tarjeta--${t.tono}` : "") +
              (clickable ? " contador-lista__boton" : "") +
              (activa ? " contador-lista__boton--activa" : "");
            if (clickable) {
              return (
                <button
                  key={t.key}
                  type="button"
                  className={clases}
                  onClick={() => manejarClic(t.key)}
                  aria-pressed={activa}
                >
                  <span>{t.etiqueta}</span>
                  <strong>{t.valor}</strong>
                </button>
              );
            }
            return (
              <article key={t.key} className={clases}>
                <span>{t.etiqueta}</span>
                <strong>{t.valor}</strong>
              </article>
            );
          })}
        </div>
      </div>

      {desgloses?.map((bloque) =>
        bloque.items.length > 0 ? (
          <div key={bloque.titulo} className="contador-lista__desglose">
            <h3>{bloque.titulo}</h3>
            <ul>
              {bloque.items.map((item) => (
                <li key={item.clave}>
                  <span>{item.clave}</span>
                  <strong>{item.cantidad}</strong>
                </li>
              ))}
            </ul>
          </div>
        ) : null,
      )}
    </aside>
  );
}
