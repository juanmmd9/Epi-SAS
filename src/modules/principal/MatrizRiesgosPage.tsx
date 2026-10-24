import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { veInventarioMantenimiento } from "../../lib/usuarioArea";
import { useAuth } from "../auth/AuthContext";
import {
  CODIGO_MATRIZ,
  CONSECUENCIAS,
  EFICACIAS,
  ESTADOS_MONITOREO,
  PROBABILIDADES,
  TRATAMIENTOS,
  VERSION_MATRIZ,
  claseNivel,
  filaVacia,
  nivelDe,
  valorDe,
  type Consecuencia,
  type DocumentoMatriz,
  type FilaMatriz,
  type Probabilidad,
} from "./matrizRiesgos";
import { descargarMatrizExcel } from "./matrizRiesgosExcel";
import { cargarMatriz, guardarMatriz } from "./matrizRiesgosService";
import "./principal.css";

function MatrizRiesgosPage() {
  const { perfil } = useAuth();
  const [doc, setDoc] = useState<DocumentoMatriz | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState("Cargando…");
  const [listo, setListo] = useState(false);

  useEffect(() => {
    let activo = true;
    cargarMatriz()
      .then((cargado) => {
        if (!activo) return;
        setDoc(cargado);
        setAviso("Listo");
        setListo(true);
      })
      .catch((err: unknown) => {
        if (!activo) return;
        setError(err instanceof Error ? err.message : "No se pudo abrir la matriz.");
      });
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (!listo || !doc) return;
    setAviso("Guardando…");
    const timer = window.setTimeout(() => {
      guardarMatriz(doc)
        .then(() => setAviso("Guardado"))
        .catch((err: unknown) => {
          setAviso("No se pudo guardar");
          setError(err instanceof Error ? err.message : "No se pudo guardar.");
        });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [doc, listo]);

  if (!veInventarioMantenimiento(perfil)) {
    return <Navigate to="/principal" replace />;
  }

  function actualizarFila(id: string, cambios: Partial<FilaMatriz>) {
    setDoc((actual) =>
      actual
        ? {
            ...actual,
            filas: actual.filas.map((fila) => (fila.id === id ? { ...fila, ...cambios } : fila)),
          }
        : actual,
    );
  }

  function agregar() {
    setDoc((actual) => (actual ? { ...actual, filas: [...actual.filas, filaVacia()] } : actual));
  }

  function eliminar(id: string) {
    if (!window.confirm("¿Eliminar esta fila de la matriz?")) return;
    setDoc((actual) =>
      actual ? { ...actual, filas: actual.filas.filter((fila) => fila.id !== id) } : actual,
    );
  }

  async function descargar() {
    if (!doc) return;
    setError(null);
    try {
      await descargarMatrizExcel(doc);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo descargar el Excel.");
    }
  }

  return (
    <section className="principal matriz-riesgo">
      <header className="principal__cabecera">
        <Link to="/principal" className="btn">
          ← Principal
        </Link>
        <h1>Matriz de riesgos y oportunidades</h1>
        <p>
          {CODIGO_MATRIZ} versión {VERSION_MATRIZ}. Mantenimiento. El valor y el nivel se calculan
          solos.
        </p>
      </header>

      {doc && (
        <div className="matriz-riesgo__barra">
          <label>
            Fecha última revisión
            <input
              value={doc.fechaRevision}
              onChange={(e) => setDoc({ ...doc, fechaRevision: e.target.value })}
            />
          </label>
          <label>
            Año de la nueva calificación
            <input
              type="number"
              value={doc.anio}
              onChange={(e) => setDoc({ ...doc, anio: Number(e.target.value) || doc.anio })}
            />
          </label>
          <button type="button" className="btn btn--primario" onClick={agregar}>
            + Agregar
          </button>
          <button type="button" className="btn" onClick={() => void descargar()}>
            Descargar Excel
          </button>
          <span className="matriz-riesgo__aviso">{aviso}</span>
        </div>
      )}

      <p className="matriz-riesgo__leyenda">
        <span className="matriz-riesgo__valor matriz-riesgo__valor--alto">Alto / alcanzable</span>
        <span className="matriz-riesgo__valor matriz-riesgo__valor--medio">Medio</span>
        <span className="matriz-riesgo__valor matriz-riesgo__valor--bajo">Bajo</span>
      </p>

      {error && <p className="matriz-riesgo__error">{error}</p>}

      {doc && (
        <div className="matriz-riesgo__scroll">
          <table className="matriz-riesgo__tabla">
            <thead>
              <tr>
                <th rowSpan={2}>Proceso</th>
                <th rowSpan={2}>Riesgo / oportunidad</th>
                <th rowSpan={2}>Tipo</th>
                <th colSpan={4}>Análisis y evaluación</th>
                <th colSpan={4}>Tratamiento</th>
                <th rowSpan={2}>Monitoreo</th>
                <th rowSpan={2}>Fecha de seguimiento</th>
                <th colSpan={4}>{doc.anio} · nueva calificación</th>
                <th rowSpan={2}>Eficacia</th>
                <th rowSpan={2}>Evaluador</th>
                <th rowSpan={2}>Observación</th>
                <th rowSpan={2} />
              </tr>
              <tr>
                <th>P</th>
                <th>C</th>
                <th>Valor</th>
                <th>Nivel</th>
                <th>Tipo</th>
                <th>Acciones</th>
                <th>Responsable</th>
                <th>Indicador</th>
                <th>P</th>
                <th>C</th>
                <th>Valor</th>
                <th>Nivel</th>
              </tr>
            </thead>
            <tbody>
              {doc.filas.map((fila) => {
                const valor = valorDe(fila.p, fila.c);
                const valorNuevo = valorDe(fila.pNueva, fila.cNueva);
                return (
                  <tr key={fila.id}>
                    <td>
                      <input
                        value={fila.proceso}
                        onChange={(e) => actualizarFila(fila.id, { proceso: e.target.value })}
                      />
                    </td>
                    <td className="matriz-riesgo__ancho">
                      <textarea
                        rows={3}
                        value={fila.riesgo}
                        onChange={(e) => actualizarFila(fila.id, { riesgo: e.target.value })}
                      />
                    </td>
                    <td>
                      <select
                        value={fila.tipo}
                        onChange={(e) =>
                          actualizarFila(fila.id, {
                            tipo: e.target.value === "Oportunidad" ? "Oportunidad" : "Riesgo",
                          })
                        }
                      >
                        <option>Riesgo</option>
                        <option>Oportunidad</option>
                      </select>
                    </td>
                    <td>
                      <SelectNumero
                        valor={fila.p}
                        opciones={PROBABILIDADES}
                        onChange={(p) => actualizarFila(fila.id, { p })}
                      />
                    </td>
                    <td>
                      <SelectNumero
                        valor={fila.c}
                        opciones={CONSECUENCIAS}
                        onChange={(c) => actualizarFila(fila.id, { c })}
                      />
                    </td>
                    <td className={`matriz-riesgo__valor ${claseNivel(valor)}`}>{valor ?? ""}</td>
                    <td className={`matriz-riesgo__valor ${claseNivel(valor)}`}>
                      {nivelDe(valor, fila.tipo)}
                    </td>
                    <td>
                      <select
                        value={fila.tratamiento}
                        onChange={(e) => actualizarFila(fila.id, { tratamiento: e.target.value })}
                      >
                        <option value="" />
                        {TRATAMIENTOS.map((opcion) => (
                          <option key={opcion}>{opcion}</option>
                        ))}
                      </select>
                    </td>
                    <td className="matriz-riesgo__ancho">
                      <textarea
                        rows={3}
                        value={fila.acciones}
                        onChange={(e) => actualizarFila(fila.id, { acciones: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        value={fila.responsable}
                        onChange={(e) => actualizarFila(fila.id, { responsable: e.target.value })}
                      />
                    </td>
                    <td className="matriz-riesgo__ancho">
                      <textarea
                        rows={3}
                        value={fila.indicador}
                        onChange={(e) => actualizarFila(fila.id, { indicador: e.target.value })}
                      />
                    </td>
                    <td>
                      <select
                        value={fila.monitoreo}
                        onChange={(e) => actualizarFila(fila.id, { monitoreo: e.target.value })}
                      >
                        <option value="" />
                        {ESTADOS_MONITOREO.map((opcion) => (
                          <option key={opcion}>{opcion}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="date"
                        value={fila.fechaSeguimiento}
                        onChange={(e) =>
                          actualizarFila(fila.id, { fechaSeguimiento: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <SelectNumero
                        valor={fila.pNueva}
                        opciones={PROBABILIDADES}
                        onChange={(pNueva) => actualizarFila(fila.id, { pNueva })}
                      />
                    </td>
                    <td>
                      <SelectNumero
                        valor={fila.cNueva}
                        opciones={CONSECUENCIAS}
                        onChange={(cNueva) => actualizarFila(fila.id, { cNueva })}
                      />
                    </td>
                    <td className={`matriz-riesgo__valor ${claseNivel(valorNuevo)}`}>
                      {valorNuevo ?? ""}
                    </td>
                    <td className={`matriz-riesgo__valor ${claseNivel(valorNuevo)}`}>
                      {nivelDe(valorNuevo, fila.tipo)}
                    </td>
                    <td>
                      <select
                        value={fila.eficacia}
                        onChange={(e) => actualizarFila(fila.id, { eficacia: e.target.value })}
                      >
                        <option value="" />
                        {EFICACIAS.map((opcion) => (
                          <option key={opcion}>{opcion}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        value={fila.evaluador}
                        onChange={(e) => actualizarFila(fila.id, { evaluador: e.target.value })}
                      />
                    </td>
                    <td className="matriz-riesgo__ancho">
                      <textarea
                        rows={3}
                        value={fila.observacion}
                        onChange={(e) => actualizarFila(fila.id, { observacion: e.target.value })}
                      />
                    </td>
                    <td>
                      <button type="button" className="btn" onClick={() => eliminar(fila.id)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function SelectNumero<T extends Probabilidad | Consecuencia>({
  valor,
  opciones,
  onChange,
}: {
  valor: T;
  opciones: readonly Exclude<T, "">[];
  onChange: (valor: T) => void;
}) {
  return (
    <select value={valor === "" ? "" : String(valor)} onChange={(e) => {
      const texto = e.target.value;
      onChange((texto === "" ? "" : Number(texto)) as T);
    }}>
      <option value="" />
      {opciones.map((opcion) => (
        <option key={opcion} value={opcion}>
          {opcion}
        </option>
      ))}
    </select>
  );
}

export default MatrizRiesgosPage;
