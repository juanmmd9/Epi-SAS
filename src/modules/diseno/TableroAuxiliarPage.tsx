import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { coincideArea } from "../../lib/areas";
import { areaUsuario } from "../../lib/usuarioArea";
import { useAuth } from "../auth/AuthContext";
import { listarAsignadosAlAuxiliar, listarColumnasAreaLider } from "../gerencia/gerenciaService";
import {
  etiquetaEstado,
  etiquetaTablero,
  etiquetaTipo,
  type ColumnaGerencia,
  type ItemGerencia,
} from "../gerencia/types";
import { pasoDisenoPorId } from "./disenoPasos";
import { proyectoDisenoPorId } from "./proyectosDiseno";
import "../gerencia/gerencia.css";

function TableroAuxiliarPage() {
  const { perfil, rol } = useAuth();
  const area = areaUsuario(perfil);
  const esAuxiliar =
    rol === "solicitante" && Boolean(area) && coincideArea(area ?? "", "Diseno y Desarrollo");
  const usuarioId = perfil?.id ?? "";
  const [items, setItems] = useState<ItemGerencia[]>([]);
  const [columnas, setColumnas] = useState<ColumnaGerencia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!esAuxiliar || !usuarioId || !area) return;
    let vigente = true;
    setCargando(true);
    void Promise.all([listarAsignadosAlAuxiliar(usuarioId), listarColumnasAreaLider(area)])
      .then(([lista, cols]) => {
        if (!vigente) return;
        setItems(lista.filter((item) => item.estado !== "eliminado"));
        setColumnas(cols);
        setError("");
      })
      .catch((fallo: unknown) => {
        if (!vigente) return;
        setItems([]);
        setColumnas([]);
        setError(fallo instanceof Error ? fallo.message : "No se pudo cargar el tablero.");
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [esAuxiliar, usuarioId, area]);

  const columnasVisibles = useMemo(() => {
    const base = [...columnas].sort((a, b) => a.orden - b.orden);
    const ids = new Set(base.map((columna) => columna.id));
    for (const item of items) {
      if (!ids.has(item.tablero)) {
        base.push({
          id: item.tablero,
          etiqueta: etiquetaTablero(item.tablero, columnas),
          orden: 999,
        });
        ids.add(item.tablero);
      }
    }
    return base;
  }, [columnas, items]);

  if (!esAuxiliar) return <Navigate to="/" replace />;

  return (
    <section className="gerencia">
      <header className="gerencia__cabecera">
        <div>
          <h1>Tablero · {area}</h1>
          <p className="gerencia__descripcion">
            Las cards que el director te asignó, en la columna donde las dejó.
          </p>
        </div>
      </header>
      {error ? <p className="gerencia__mensaje gerencia__mensaje--error">{error}</p> : null}
      {cargando ? <p>Cargando tablero...</p> : null}
      {!cargando && items.length === 0 ? (
        <p className="gerencia__vacio">Todavía no tienes proyectos asignados.</p>
      ) : null}
      {!cargando && items.length > 0 ? (
        <div className="gerencia__tablero">
          {columnasVisibles.map((columna) => {
            const deColumna = items
              .filter((item) => item.tablero === columna.id)
              .sort((a, b) => a.orden - b.orden || b.creado_en.localeCompare(a.creado_en));
            if (deColumna.length === 0) return null;
            return (
              <div key={columna.id} className="gerencia__columna">
                <h2 className="gerencia__columna-titulo">
                  <span>{columna.etiqueta}</span>
                  <span className="gerencia__badge">{deColumna.length}</span>
                </h2>
                <div className="gerencia__columna-cards">
                  {deColumna.map((item) => {
                    const etapa = pasoDisenoPorId(item.etapa_diseno || "planificacion");
                    const linea = proyectoDisenoPorId(item.linea_diseno ?? undefined);
                    return (
                      <article key={item.id} className="gerencia__tarjeta">
                        <h3 className="gerencia__tarjeta-titulo">{item.titulo}</h3>
                        <div className="gerencia__tarjeta-meta">
                          <span className="gerencia__tag">{etiquetaTipo(item.tipo)}</span>
                          <span className="gerencia__tag">{etiquetaEstado(item.estado)}</span>
                          {linea ? <span className="gerencia__tag">{linea.corto}</span> : null}
                        </div>
                        <p className="gerencia__tarjeta-detalle">
                          Etapa: {etapa?.titulo || "Planificación integrada"}
                        </p>
                        {item.notas ? (
                          <p className="gerencia__tarjeta-detalle">{item.notas}</p>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

export default TableroAuxiliarPage;
