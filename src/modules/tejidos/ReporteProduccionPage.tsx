import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { areaUsuario } from "../../lib/usuarioArea";
import { useAuth } from "../auth/AuthContext";
import FirmaPad from "../preventivo/FirmaPad";
import {
  CAUSAS_NO_CONFORME,
  CAUSAS_PARADA,
  cambiarAreaTrabajo,
  duracionParada,
  maquinasDe,
  puedeUsarFormatosTejidos,
  reporteVacio,
  type AreaTrabajoReporte,
  type FilaCantidad,
  type FilaLiberacion,
  type FilaParada,
  type ReporteProduccionDatos,
  type ResultadoControl,
} from "./reporteProduccionDatos";
import ReporteProduccionVista from "./ReporteProduccionVista";
import {
  eliminarReporteProduccion,
  guardarReporteProduccion,
  listarReportesProduccion,
  type RegistroReporteProduccion,
} from "./reporteProduccionService";
import "./reporteProduccion.css";

const RESULTADOS: ResultadoControl[] = ["", "OK", "NC", "NA"];

function ControlSelect({
  valor,
  onChange,
}: {
  valor: ResultadoControl;
  onChange: (valor: ResultadoControl) => void;
}) {
  return (
    <select value={valor} onChange={(e) => onChange(e.target.value as ResultadoControl)}>
      {RESULTADOS.map((opcion) => (
        <option key={opcion || "vacio"} value={opcion}>
          {opcion || "—"}
        </option>
      ))}
    </select>
  );
}

function ReporteProduccionPage() {
  const { rol, perfil } = useAuth();
  const [datos, setDatos] = useState<ReporteProduccionDatos>(() => reporteVacio());
  const [registros, setRegistros] = useState<RegistroReporteProduccion[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState<ReporteProduccionDatos | null>(null);
  const [claveFormulario, setClaveFormulario] = useState(0);

  const permitido = puedeUsarFormatosTejidos(rol, areaUsuario(perfil));
  const esTrenzadora = datos.areaTrabajo === "Trenzadora";

  useEffect(() => {
    if (!permitido) return;
    listarReportesProduccion()
      .then(setRegistros)
      .catch((e: Error) => setError(e.message))
      .finally(() => setCargando(false));
  }, [permitido]);

  useEffect(() => {
    if (!perfil) return;
    const nombre = perfil.nombre?.trim();
    if (!nombre) return;
    setDatos((prev) => {
      if (rol === "operador" && !prev.operario) return { ...prev, operario: nombre };
      if (rol === "lider" && !prev.supervisor) return { ...prev, supervisor: nombre };
      return prev;
    });
  }, [perfil, rol]);

  if (!permitido) return <Navigate to="/" replace />;

  function actualizarFila(indice: number, cambios: Partial<FilaLiberacion>) {
    setDatos((prev) => ({
      ...prev,
      filas: prev.filas.map((fila, i) => (i === indice ? { ...fila, ...cambios } : fila)),
    }));
  }

  function actualizarParada(indice: number, cambios: Partial<FilaParada>) {
    setDatos((prev) => ({
      ...prev,
      paradas: prev.paradas.map((fila, i) => (i === indice ? { ...fila, ...cambios } : fila)),
    }));
  }

  function actualizarCantidad(
    campo: "desperdicios" | "noConformes",
    indice: number,
    cambios: Partial<FilaCantidad>,
  ) {
    setDatos((prev) => ({
      ...prev,
      [campo]: prev[campo].map((fila, i) => (i === indice ? { ...fila, ...cambios } : fila)),
    }));
  }

  function formularioEnBlanco(): ReporteProduccionDatos {
    const vacio = reporteVacio();
    const nombre = perfil?.nombre?.trim();
    if (!nombre) return vacio;
    if (rol === "operador") return { ...vacio, operario: nombre };
    if (rol === "lider") return { ...vacio, supervisor: nombre };
    return vacio;
  }

  function limpiarFormulario() {
    setEditandoId(null);
    setDatos(formularioEnBlanco());
    setClaveFormulario((actual) => actual + 1);
  }

  function abrirRegistro(registro: RegistroReporteProduccion) {
    setEditandoId(registro.id);
    setDatos(registro.datos);
    setClaveFormulario((actual) => actual + 1);
    setMensaje(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function nuevo() {
    limpiarFormulario();
    setMensaje(null);
    setError(null);
  }

  async function guardar() {
    setError(null);
    setMensaje(null);
    if (!datos.fecha) {
      setError("Escribe la fecha del reporte.");
      return;
    }
    if (!datos.operario.trim() || !datos.firmaOperario) {
      setError("El operario debe firmar y quedar su nombre debajo de la firma.");
      return;
    }
    if (!datos.supervisor.trim() || !datos.firmaSupervisor) {
      setError("El supervisor debe firmar y quedar su nombre debajo de la firma.");
      return;
    }
    setGuardando(true);
    try {
      const guardado = await guardarReporteProduccion(datos, editandoId);
      setRegistros((prev) => {
        const resto = prev.filter((r) => r.id !== guardado.id);
        return [guardado, ...resto];
      });
      limpiarFormulario();
      setMensaje("Reporte guardado. El formulario quedó en blanco para crear uno nuevo.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  }

  async function eliminarRegistro(id: string) {
    if (!window.confirm("¿Eliminar este reporte de producción?")) return;
    try {
      await eliminarReporteProduccion(id);
      setRegistros((prev) => prev.filter((r) => r.id !== id));
      if (editandoId === id) nuevo();
      setMensaje("Reporte eliminado.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar");
    }
  }

  function imprimirVista() {
    document.body.classList.add("imprimiendo-reporte-tejidos");
    const limpiar = () => {
      document.body.classList.remove("imprimiendo-reporte-tejidos");
      window.removeEventListener("afterprint", limpiar);
    };
    window.addEventListener("afterprint", limpiar);
    window.setTimeout(limpiar, 60_000);
    window.print();
  }

  return (
    <section className="tj-reporte">
      <p>
        <Link to="/tejidos/formatos">← Formatos</Link>
      </p>
      <h1>Reporte de producción</h1>
      <p className="tj-reporte__leyenda">
        TJ-RE-004. La firma del operario y la del supervisor quedan con el nombre debajo, igual que
        en Aprobar PM.
      </p>

      <div className="tj-reporte__panel">
          <div className="tj-reporte__grid">
            <label>
              Fecha *
              <input
                type="date"
                value={datos.fecha}
                onChange={(e) => setDatos({ ...datos, fecha: e.target.value })}
              />
            </label>
            <label>
              Turno
              <input
                value={datos.turno}
                onChange={(e) => setDatos({ ...datos, turno: e.target.value })}
              />
            </label>
            <label>
              Área de trabajo
              <select
                value={datos.areaTrabajo}
                onChange={(e) =>
                  setDatos(cambiarAreaTrabajo(datos, e.target.value as AreaTrabajoReporte))
                }
              >
                <option value="Trenzadora">Trenzadora</option>
                <option value="Telares">Telares</option>
              </select>
            </label>
          </div>

          <h2>Registro de liberación de producción</h2>
          <p className="tj-reporte__leyenda">
            OK cumple, NC no cumple, NA no aplica para este producto.
          </p>
          <div className="tj-reporte__scroll">
            <table className="tj-tabla">
              <thead>
                <tr>
                  <th>Máquina</th>
                  <th>Control de medida</th>
                  <th>Control de medida</th>
                  <th>Referencia</th>
                  <th>Lote</th>
                  <th>Producto limpio</th>
                  {esTrenzadora ? <th>Cantidad de almas</th> : null}
                  <th>Sin despiste</th>
                  <th>Sin deshilache</th>
                  <th>Producto uniforme</th>
                  <th>Cantidad producida</th>
                </tr>
              </thead>
              <tbody>
                {datos.filas.map((fila, indice) => (
                  <tr key={fila.maquina}>
                    <td>{fila.maquina}</td>
                    <td>
                      <input
                        value={fila.medida1}
                        onChange={(e) => actualizarFila(indice, { medida1: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        value={fila.medida2}
                        onChange={(e) => actualizarFila(indice, { medida2: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        value={fila.referencia}
                        onChange={(e) => actualizarFila(indice, { referencia: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        value={fila.lote}
                        onChange={(e) => actualizarFila(indice, { lote: e.target.value })}
                      />
                    </td>
                    <td>
                      <ControlSelect
                        valor={fila.productoLimpio}
                        onChange={(productoLimpio) => actualizarFila(indice, { productoLimpio })}
                      />
                    </td>
                    {esTrenzadora ? (
                      <td>
                        <ControlSelect
                          valor={fila.cantidadAlmas}
                          onChange={(cantidadAlmas) => actualizarFila(indice, { cantidadAlmas })}
                        />
                      </td>
                    ) : null}
                    <td>
                      <ControlSelect
                        valor={fila.sinDespiste}
                        onChange={(sinDespiste) => actualizarFila(indice, { sinDespiste })}
                      />
                    </td>
                    <td>
                      <ControlSelect
                        valor={fila.sinDeshilache}
                        onChange={(sinDeshilache) => actualizarFila(indice, { sinDeshilache })}
                      />
                    </td>
                    <td>
                      <ControlSelect
                        valor={fila.productoUniforme}
                        onChange={(productoUniforme) =>
                          actualizarFila(indice, { productoUniforme })
                        }
                      />
                    </td>
                    <td>
                      <input
                        value={fila.cantidadProducida}
                        onChange={(e) =>
                          actualizarFila(indice, { cantidadProducida: e.target.value })
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <label>
            Observaciones
            <textarea
              rows={3}
              value={datos.observaciones}
              onChange={(e) => setDatos({ ...datos, observaciones: e.target.value })}
            />
          </label>

          <div className="tj-firmas">
            <div className="tj-firma">
              <h3>Firma del operario *</h3>
              <p className="tj-firma__ayuda">
                Dibuja la firma o carga una imagen. El nombre queda debajo, como en Aprobar PM.
              </p>
              <FirmaPad
                reinicioClave={`op-${claveFormulario}`}
                onChange={(firmaOperario) => setDatos((prev) => ({ ...prev, firmaOperario }))}
              />
              <label>
                Nombre del operario *
                <input
                  value={datos.operario}
                  onChange={(e) => setDatos({ ...datos, operario: e.target.value })}
                />
              </label>
              {datos.firmaOperario ? (
                <div className="tj-firma__preview">
                  <img src={datos.firmaOperario} alt="Firma del operario" />
                  <span>{datos.operario || "Sin nombre"}</span>
                </div>
              ) : null}
            </div>
            <div className="tj-firma">
              <h3>Firma del supervisor *</h3>
              <p className="tj-firma__ayuda">
                Dibuja la firma o carga una imagen. El nombre queda debajo, como en Aprobar PM.
              </p>
              <FirmaPad
                reinicioClave={`sup-${claveFormulario}`}
                onChange={(firmaSupervisor) => setDatos((prev) => ({ ...prev, firmaSupervisor }))}
              />
              <label>
                Nombre del supervisor *
                <input
                  value={datos.supervisor}
                  onChange={(e) => setDatos({ ...datos, supervisor: e.target.value })}
                />
              </label>
              {datos.firmaSupervisor ? (
                <div className="tj-firma__preview">
                  <img src={datos.firmaSupervisor} alt="Firma del supervisor" />
                  <span>{datos.supervisor || "Sin nombre"}</span>
                </div>
              ) : null}
            </div>
          </div>

          <h2>Registro y control de paradas</h2>
          <details className="tj-causas">
            <summary>Códigos de parada</summary>
            <p>
              {CAUSAS_PARADA.map((causa) => `${causa.codigo}. ${causa.texto}`).join(" · ")}
            </p>
          </details>
          <div className="tj-reporte__scroll">
            <table className="tj-tabla">
              <thead>
                <tr>
                  <th>Hora inicial</th>
                  <th>Hora final</th>
                  <th>Duración</th>
                  <th>Máquina</th>
                  <th>Código</th>
                  <th>Inspección</th>
                </tr>
              </thead>
              <tbody>
                {datos.paradas.map((fila, indice) => (
                  <tr key={indice}>
                    <td>
                      <input
                        type="time"
                        value={fila.horaInicial}
                        onChange={(e) => actualizarParada(indice, { horaInicial: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        type="time"
                        value={fila.horaFinal}
                        onChange={(e) => actualizarParada(indice, { horaFinal: e.target.value })}
                      />
                    </td>
                    <td>{duracionParada(fila.horaInicial, fila.horaFinal) || "—"}</td>
                    <td>
                      <select
                        value={fila.maquina}
                        onChange={(e) => actualizarParada(indice, { maquina: e.target.value })}
                      >
                        <option value="">—</option>
                        {maquinasDe(datos.areaTrabajo).map((maquina) => (
                          <option key={maquina} value={maquina}>
                            {maquina}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        value={fila.codigo}
                        onChange={(e) => actualizarParada(indice, { codigo: e.target.value })}
                      >
                        <option value="">—</option>
                        {CAUSAS_PARADA.map((causa) => (
                          <option key={causa.codigo} value={causa.codigo}>
                            {causa.codigo}. {causa.texto}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        value={fila.inspeccion}
                        onChange={(e) => actualizarParada(indice, { inspeccion: e.target.value })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            className="btn"
            onClick={() =>
              setDatos((prev) => ({
                ...prev,
                paradas: [
                  ...prev.paradas,
                  { horaInicial: "", horaFinal: "", maquina: "", codigo: "", inspeccion: "" },
                ],
              }))
            }
          >
            Agregar parada
          </button>

          <h2>Desperdicio y no conforme</h2>
          <details className="tj-causas">
            <summary>Causas de no conforme</summary>
            <p>
              {CAUSAS_NO_CONFORME.map((causa) => `${causa.codigo}. ${causa.texto}`).join(" · ")}
            </p>
          </details>
          <div className="tj-reporte__scroll">
            <table className="tj-tabla">
              <thead>
                <tr>
                  <th colSpan={3}>Desperdicio</th>
                  <th colSpan={3}>No conforme</th>
                </tr>
                <tr>
                  <th>Referencia</th>
                  <th>Kg</th>
                  <th>Causa</th>
                  <th>Referencia</th>
                  <th>Mts</th>
                  <th>Causa</th>
                </tr>
              </thead>
              <tbody>
                {datos.desperdicios.map((fila, indice) => {
                  const noConforme = datos.noConformes[indice];
                  return (
                    <tr key={indice}>
                      <td>
                        <input
                          value={fila.referencia}
                          onChange={(e) =>
                            actualizarCantidad("desperdicios", indice, { referencia: e.target.value })
                          }
                        />
                      </td>
                      <td>
                        <input
                          value={fila.cantidad}
                          onChange={(e) =>
                            actualizarCantidad("desperdicios", indice, { cantidad: e.target.value })
                          }
                        />
                      </td>
                      <td>
                        <select
                          value={fila.causa}
                          onChange={(e) =>
                            actualizarCantidad("desperdicios", indice, { causa: e.target.value })
                          }
                        >
                          <option value="">—</option>
                          {CAUSAS_NO_CONFORME.map((causa) => (
                            <option key={causa.codigo} value={causa.codigo}>
                              {causa.codigo}. {causa.texto}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          value={noConforme?.referencia ?? ""}
                          onChange={(e) =>
                            actualizarCantidad("noConformes", indice, { referencia: e.target.value })
                          }
                        />
                      </td>
                      <td>
                        <input
                          value={noConforme?.cantidad ?? ""}
                          onChange={(e) =>
                            actualizarCantidad("noConformes", indice, { cantidad: e.target.value })
                          }
                        />
                      </td>
                      <td>
                        <select
                          value={noConforme?.causa ?? ""}
                          onChange={(e) =>
                            actualizarCantidad("noConformes", indice, { causa: e.target.value })
                          }
                        >
                          <option value="">—</option>
                          {CAUSAS_NO_CONFORME.map((causa) => (
                            <option key={causa.codigo} value={causa.codigo}>
                              {causa.codigo}. {causa.texto}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {mensaje ? <p className="tj-reporte__ok">{mensaje}</p> : null}
          {error ? <p className="tj-reporte__error">{error}</p> : null}

          <div className="tj-reporte__acciones">
            <button type="button" className="btn btn--primario" disabled={guardando} onClick={() => void guardar()}>
              {guardando ? "Guardando..." : editandoId ? "Guardar cambios" : "Guardar"}
            </button>
            <button type="button" className="btn" onClick={() => setVistaPrevia(datos)}>
              Vista previa
            </button>
            <button type="button" className="btn" onClick={nuevo}>
              Nuevo
            </button>
          </div>
      </div>

      <section className="tj-reporte__lista">
        <h2>Reportes guardados</h2>
        {cargando ? <p>Cargando...</p> : null}
        {!cargando && registros.length === 0 ? <p>Todavía no hay reportes.</p> : null}
        {registros.length > 0 ? (
          <div className="tj-reporte__scroll">
            <table className="tj-tabla">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Turno</th>
                  <th>Área</th>
                  <th>Operario</th>
                  <th>Supervisor</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((registro) => (
                  <tr
                    key={registro.id}
                    className={registro.id === editandoId ? "tj-reporte__fila--activa" : undefined}
                  >
                    <td>{registro.fecha}</td>
                    <td>{registro.datos.turno || "—"}</td>
                    <td>{registro.area_trabajo}</td>
                    <td>{registro.datos.operario || "—"}</td>
                    <td>{registro.datos.supervisor || "—"}</td>
                    <td className="tj-reporte__acciones-fila">
                      <button
                        type="button"
                        className="btn"
                        onClick={() => setVistaPrevia(registro.datos)}
                      >
                        Vista previa
                      </button>
                      <button type="button" className="btn" onClick={() => abrirRegistro(registro)}>
                        Modificar
                      </button>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => void eliminarRegistro(registro.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {vistaPrevia ? (
        <div className="tj-reporte__vista" role="dialog" aria-modal="true" aria-label="Vista previa del reporte">
          <div className="tj-reporte__vista-barra">
            <h2>Vista previa</h2>
            <div className="tj-reporte__acciones">
              <button type="button" className="btn btn--primario" onClick={imprimirVista}>
                Imprimir
              </button>
              <button type="button" className="btn" onClick={() => setVistaPrevia(null)}>
                Cerrar
              </button>
            </div>
          </div>
          <div className="tj-reporte__vista-hoja">
            <ReporteProduccionVista datos={vistaPrevia} id="reporte-produccion-copia" />
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default ReporteProduccionPage;
