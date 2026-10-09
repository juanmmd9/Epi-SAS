import type { ReactNode } from "react";
import { NOMBRES_MESES } from "../lib/fechas";
import { TAMANO_PAGINA_LISTA, totalPaginas } from "../lib/listaRegistros";
import "./barraBusquedaLista.css";

type Props = {
  titulo: string;
  busqueda: string;
  onBusqueda: (valor: string) => void;
  placeholder?: string;
  total: number;
  pagina: number;
  onPagina: (pagina: number) => void;
  porPagina?: number;
  /** 0 = todos los meses del año */
  mes: number;
  anio: number;
  onMes: (mes: number) => void;
  onAnio: (anio: number) => void;
  extraAcciones?: ReactNode;
  children?: ReactNode;
};

function BarraBusquedaLista({
  titulo,
  busqueda,
  onBusqueda,
  placeholder = "Buscar por máquina, código, descripción…",
  total,
  pagina,
  onPagina,
  porPagina = TAMANO_PAGINA_LISTA,
  mes,
  anio,
  onMes,
  onAnio,
  extraAcciones,
  children,
}: Props) {
  const paginas = totalPaginas(total, porPagina);
  const paginaSegura = Math.min(Math.max(1, pagina), paginas);
  const desde = total === 0 ? 0 : (paginaSegura - 1) * porPagina + 1;
  const hasta = Math.min(paginaSegura * porPagina, total);
  const anioActual = new Date().getFullYear();

  return (
    <div className="barra-busqueda-lista">
      <div className="barra-busqueda-lista__cabecera">
        <h2>
          {titulo}{" "}
          <span className="barra-busqueda-lista__conteo">({total})</span>
        </h2>
        {extraAcciones}
      </div>

      <div className="barra-busqueda-lista__controles">
        <label className="barra-busqueda-lista__buscar">
          Buscar
          <input
            type="search"
            value={busqueda}
            onChange={(e) => {
              onBusqueda(e.target.value);
              onPagina(1);
            }}
            placeholder={placeholder}
            autoComplete="off"
          />
        </label>

        <label>
          Mes
          <select
            value={mes}
            onChange={(e) => {
              onMes(Number(e.target.value));
              onPagina(1);
            }}
          >
            <option value={0}>Todos los meses</option>
            {NOMBRES_MESES.map((nombre, i) => (
              <option key={nombre} value={i + 1}>
                {nombre}
              </option>
            ))}
          </select>
        </label>

        <label>
          Año
          <select
            value={anio}
            onChange={(e) => {
              onAnio(Number(e.target.value));
              onPagina(1);
            }}
          >
            {[anioActual, anioActual - 1, anioActual - 2].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>

        {children}
      </div>

      <div className="barra-busqueda-lista__paginacion">
        <span>
          {total === 0
            ? "Sin resultados"
            : `Mostrando ${desde}–${hasta} de ${total}`}
        </span>
        <div className="barra-busqueda-lista__botones">
          <button
            type="button"
            className="btn"
            disabled={paginaSegura <= 1}
            onClick={() => onPagina(paginaSegura - 1)}
          >
            Anterior
          </button>
          <span className="barra-busqueda-lista__pagina">
            Página {paginaSegura} / {paginas}
          </span>
          <button
            type="button"
            className="btn"
            disabled={paginaSegura >= paginas}
            onClick={() => onPagina(paginaSegura + 1)}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}

export default BarraBusquedaLista;
