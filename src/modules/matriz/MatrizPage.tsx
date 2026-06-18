import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AvisoSetupPersonal from "../../components/setup/AvisoSetupPersonal";
import { listarPersonal } from "../personal/personalService";
import type { Persona } from "../personal/types";
import {
  agruparPorCategoria,
  calcularResumenFila,
  claseNivelH,
  construirMapaValores,
  obtenerValorCelda,
} from "./matrizCalculo";
import { HOJAS_MATRIZ } from "./matrizCatalogo";
import {
  aplicarMetasPorDefecto,
  existeTablaMatriz,
  guardarValorMatriz,
  inicializarCatalogoMecanico,
  listarCompetencias,
  listarValoresMatriz,
} from "./matrizService";
import { SQL_MIGRACION_MATRIZ } from "./matrizSetup";
import type { CompetenciaMatriz, HojaMatriz, ValorMatrizCelda } from "./types";
import { NIVELES_MATRIZ } from "./types";
import "./matriz.css";

function AvisoSetupMatriz() {
  const projectRef =
    import.meta.env.VITE_SUPABASE_URL?.match(/https:\/\/([^.]+)\./)?.[1] ?? "_";
  const urlSql = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;

  function copiarSql() {
    void navigator.clipboard.writeText(SQL_MIGRACION_MATRIZ);
  }

  return (
    <aside className="aviso-setup-personal matriz__aviso-sql">
      <h3>Falta crear las tablas de la matriz en Supabase</h3>
      <p>Ejecuta este script en SQL Editor y recarga la página.</p>
      <div className="aviso-setup-personal__acciones">
        <button type="button" className="btn" onClick={copiarSql}>
          Copiar script SQL
        </button>
        <a className="btn btn--primario" href={urlSql} target="_blank" rel="noreferrer">
          Abrir SQL Editor
        </a>
      </div>
      <pre className="aviso-setup-personal__sql">{SQL_MIGRACION_MATRIZ}</pre>
    </aside>
  );
}

interface CeldaProps {
  valor: number;
  campo: "nivel_i" | "nivel_d" | "nivel_h";
  competencia: CompetenciaMatriz;
  celda: ValorMatrizCelda;
  onGuardar: (actualizado: ValorMatrizCelda) => void;
}

function CeldaMatriz({ valor, campo, competencia, celda, onGuardar }: CeldaProps) {
  const [guardando, setGuardando] = useState(false);
  const clase =
    campo === "nivel_h" ? claseNivelH(celda.nivel_h, celda.nivel_d) : `matriz-celda--${campo}`;

  async function manejarCambio(nuevo: number) {
    const actualizado: ValorMatrizCelda = { ...celda, [campo]: nuevo };
    setGuardando(true);
    try {
      const guardado = await guardarValorMatriz(actualizado);
      onGuardar(guardado);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <td className={`matriz-celda ${clase}`}>
      <select
        value={valor}
        disabled={guardando}
        onChange={(e) => void manejarCambio(Number.parseInt(e.target.value, 10))}
        aria-label={`${campo} ${competencia.descripcion}`}
      >
        {NIVELES_MATRIZ.map((nivel) => (
          <option key={nivel.valor} value={nivel.valor}>
            {nivel.valor}
          </option>
        ))}
      </select>
    </td>
  );
}

function MatrizPage() {
  const [hoja, setHoja] = useState<HojaMatriz>("MECANICO");
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [competencias, setCompetencias] = useState<CompetenciaMatriz[]>([]);
  const [valores, setValores] = useState<ValorMatrizCelda[]>([]);
  const [cargando, setCargando] = useState(true);
  const [inicializando, setInicializando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [faltaTabla, setFaltaTabla] = useState(false);
  const [faltaPersonal, setFaltaPersonal] = useState(false);

  const mapaValores = useMemo(() => construirMapaValores(valores), [valores]);
  const personalIds = useMemo(() => personas.map((p) => p.id), [personas]);
  const grupos = useMemo(() => agruparPorCategoria(competencias), [competencias]);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const okMatriz = await existeTablaMatriz();
      setFaltaTabla(!okMatriz);
      if (!okMatriz) {
        setCompetencias([]);
        setValores([]);
        setPersonas([]);
        return;
      }

      let listaPersonal: Persona[] = [];
      try {
        listaPersonal = await listarPersonal();
        setFaltaPersonal(false);
      } catch (e) {
        const msg = (e as Error).message;
        if (/personal|schema cache/i.test(msg)) {
          setFaltaPersonal(true);
        } else {
          throw e;
        }
      }

      const [comps, vals] = await Promise.all([
        listarCompetencias(hoja),
        listarValoresMatriz(hoja),
      ]);
      setPersonas(listaPersonal.filter((p) => p.activo));
      setCompetencias(comps);
      setValores(vals);
    } catch (e) {
      setError("No se pudo cargar la matriz: " + (e as Error).message);
    } finally {
      setCargando(false);
    }
  }, [hoja]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  function actualizarCeldaLocal(guardado: ValorMatrizCelda) {
    setValores((previas) => {
      const indice = previas.findIndex(
        (v) =>
          v.personal_id === guardado.personal_id &&
          v.competencia_id === guardado.competencia_id,
      );
      if (indice >= 0) {
        const copia = [...previas];
        copia[indice] = guardado;
        return copia;
      }
      return [...previas, guardado];
    });
  }

  async function manejarInicializarCatalogo() {
    setInicializando(true);
    setError(null);
    setMensaje(null);
    try {
      const cantidad = await inicializarCatalogoMecanico();
      setMensaje(`Catálogo cargado: ${cantidad} competencias de mantenimiento mecánico.`);
      await recargar();
    } catch (e) {
      setError("No se pudo cargar el catálogo: " + (e as Error).message);
    } finally {
      setInicializando(false);
    }
  }

  async function manejarInicializarCeldas() {
    if (personalIds.length === 0) {
      setError("Registra técnicos en Personal antes de llenar la matriz.");
      return;
    }
    setInicializando(true);
    setError(null);
    try {
      const creadas = await aplicarMetasPorDefecto(hoja, personalIds);
      setMensaje(
        creadas > 0
          ? `Se crearon ${creadas} celdas con valores iniciales (I=1, D=meta, H=0).`
          : "Todas las celdas ya tenían valores guardados.",
      );
      await recargar();
    } catch (e) {
      setError("No se pudieron inicializar las celdas: " + (e as Error).message);
    } finally {
      setInicializando(false);
    }
  }

  const brechas = useMemo(() => {
    return competencias
      .map((competencia) => {
        const resumen = calcularResumenFila(competencia, personalIds, mapaValores);
        return { competencia, resumen };
      })
      .filter((item) => item.resumen.claseSemaforo === "fail")
      .slice(0, 8);
  }, [competencias, personalIds, mapaValores]);

  return (
    <section className="matriz">
      <header className="matriz__encabezado">
        <div>
          <h1>Matriz de conocimientos y habilidades</h1>
          <p className="matriz__subtitulo">
            Formación y desempeño — modelo I (inicial), D (meta), H (desarrollo actual).
            Basado en el formato GC matriz mantenimiento mecánico 2025.
          </p>
        </div>
        <Link className="btn" to="/personal">
          Ir a Personal
        </Link>
      </header>

      {faltaTabla && <AvisoSetupMatriz />}
      {faltaPersonal && !faltaTabla && (
        <AvisoSetupPersonal titulo="Falta la tabla personal para vincular técnicos" />
      )}

      <section className="matriz__convenciones">
        <h2>Convenciones</h2>
        <div className="matriz__niveles">
          {NIVELES_MATRIZ.map((nivel) => (
            <span key={nivel.valor} className="matriz__nivel-item">
              <strong>{nivel.valor}</strong> {nivel.etiqueta}
            </span>
          ))}
        </div>
        <p>
          <strong>I</strong> situación inicial · <strong>D</strong> meta · <strong>H</strong>{" "}
          desarrollo actual. El semáforo de fila es H÷D del equipo (verde ≥ 100%).
        </p>
      </section>

      <div className="matriz__barra">
        <label>
          Equipo / hoja
          <select value={hoja} onChange={(e) => setHoja(e.target.value as HojaMatriz)}>
            {HOJAS_MATRIZ.map((item) => (
              <option key={item.clave} value={item.clave}>
                {item.etiqueta}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn btn--primario"
          disabled={inicializando || faltaTabla}
          onClick={() => void manejarInicializarCatalogo()}
        >
          {competencias.length === 0 ? "Cargar catálogo Excel" : "Catálogo ya cargado"}
        </button>
        <button
          type="button"
          className="btn"
          disabled={inicializando || faltaTabla || competencias.length === 0}
          onClick={() => void manejarInicializarCeldas()}
        >
          Inicializar celdas del equipo
        </button>
      </div>

      {mensaje && <p className="matriz__mensaje matriz__mensaje--ok">{mensaje}</p>}
      {error && <p className="matriz__mensaje matriz__mensaje--error">{error}</p>}

      {brechas.length > 0 && (
        <section className="matriz__alertas">
          <h3>Habilidades con semáforo bajo (&lt; 75% H/D)</h3>
          <ul>
            {brechas.map(({ competencia, resumen }) => (
              <li key={competencia.id}>
                #{competencia.numero} — {competencia.descripcion.slice(0, 80)}
                … ({resumen.semaforo !== null ? `${Math.round(resumen.semaforo * 100)}%` : "—"})
              </li>
            ))}
          </ul>
        </section>
      )}

      {cargando && <p>Cargando matriz...</p>}

      {!cargando && !faltaTabla && competencias.length === 0 && (
        <p className="matriz__vacio">
          Pulsa <strong>Cargar catálogo Excel</strong> para importar las 35 competencias del
          formato oficial.
        </p>
      )}

      {!cargando && competencias.length > 0 && personas.length === 0 && (
        <p className="matriz__vacio">
          No hay técnicos activos. Regístralos en{" "}
          <Link to="/personal">Personal</Link> (Guillermo Bravo, Jose L Gualguan, etc.).
        </p>
      )}

      {!cargando && competencias.length > 0 && personas.length > 0 && (
        <div className="matriz__tabla-scroll">
          <table className="matriz__tabla">
            <thead>
              <tr>
                <th className="matriz__col-num">#</th>
                <th className="matriz__col-desc">Conocimiento / habilidad</th>
                <th className="matriz__col-meta">Meta D</th>
                {personas.map((persona) => (
                  <th key={persona.id} colSpan={3} className="matriz__col-persona">
                    {persona.nombre}
                  </th>
                ))}
                <th colSpan={4} className="matriz__col-totales">
                  Totales
                </th>
              </tr>
              <tr className="matriz__fila-subencabezado">
                <th colSpan={3} />
                {personas.flatMap((persona) => [
                  <th key={`${persona.id}-i`}>I</th>,
                  <th key={`${persona.id}-d`}>D</th>,
                  <th key={`${persona.id}-h`}>H</th>,
                ])}
                <th>I</th>
                <th>D</th>
                <th>H</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {grupos.map((grupo) => (
                <Fragment key={grupo.categoria}>
                  <tr className="matriz__fila-categoria">
                    <td colSpan={3 + personas.length * 3 + 4}>{grupo.categoria}</td>
                  </tr>
                  {grupo.items.map((competencia) => {
                    const resumen = calcularResumenFila(
                      competencia,
                      personalIds,
                      mapaValores,
                    );
                    return (
                      <tr key={competencia.id}>
                        <td className="matriz__col-num">{competencia.numero ?? competencia.orden}</td>
                        <td className="matriz__col-desc">
                          <div>{competencia.descripcion}</div>
                          {(competencia.experto || competencia.herramienta) && (
                            <div className="matriz__meta-extra">
                              {competencia.experto && (
                                <span>Experto: {competencia.experto}</span>
                              )}
                              {competencia.herramienta && (
                                <span>LUP: {competencia.herramienta}</span>
                              )}
                              {competencia.estado_capacitacion && (
                                <span className="matriz__estado-cap">
                                  {competencia.estado_capacitacion}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="matriz__col-meta">{competencia.meta_d}</td>
                        {personas.map((persona) => {
                          const celda = obtenerValorCelda(
                            mapaValores,
                            persona.id,
                            competencia,
                          );
                          return (
                            <Fragment key={`${persona.id}-${competencia.id}`}>
                              <CeldaMatriz
                                valor={celda.nivel_i}
                                campo="nivel_i"
                                competencia={competencia}
                                celda={celda}
                                onGuardar={actualizarCeldaLocal}
                              />
                              <CeldaMatriz
                                valor={celda.nivel_d}
                                campo="nivel_d"
                                competencia={competencia}
                                celda={celda}
                                onGuardar={actualizarCeldaLocal}
                              />
                              <CeldaMatriz
                                valor={celda.nivel_h}
                                campo="nivel_h"
                                competencia={competencia}
                                celda={celda}
                                onGuardar={actualizarCeldaLocal}
                              />
                            </Fragment>
                          );
                        })}
                        <td className="matriz__total">{resumen.sumaI}</td>
                        <td className="matriz__total">{resumen.sumaD}</td>
                        <td className="matriz__total">{resumen.sumaH}</td>
                        <td
                          className={`matriz__semaforo matriz__semaforo--${resumen.claseSemaforo}`}
                        >
                          {resumen.semaforo !== null
                            ? `${Math.round(resumen.semaforo * 100)}%`
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default MatrizPage;
