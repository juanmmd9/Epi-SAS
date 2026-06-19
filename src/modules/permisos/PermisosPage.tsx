import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SoloConPermiso } from "../auth/SoloConPermiso";
import { imprimirPdf } from "../../lib/imprimirPdf";
import { listarPersonal } from "../personal/personalService";
import type { Persona } from "../personal/types";
import { obtenerPdfPermiso, urlVistaPreviaPdf } from "./ghre030Pdf";
import { listarHorarioAnio, listarFestivosAnio } from "./horarioService";
import {
  etiquetaEstadoPermiso,
  etiquetaTipoPermiso,
  formatearTiempoConcedido,
  nombreDiaSemana,
  obtenerJornadaEsperada,
} from "./permisosCalculo";
import { eliminarPermiso, existeTablaPermisos, listarPermisos } from "./permisosService";
import { SQL_MIGRACION_PERMISOS } from "./permisosSetup";
import type { Festivo, HorarioLaboral, RegistroPermiso } from "./types";
import "./permisos.css";

function AvisoSetupPermisos() {
  const projectRef =
    import.meta.env.VITE_SUPABASE_URL?.match(/https:\/\/([^.]+)\./)?.[1] ?? "_";
  const urlSql = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;

  function copiarSql() {
    void navigator.clipboard.writeText(SQL_MIGRACION_PERMISOS);
  }

  return (
    <aside className="aviso-setup-personal permisos__aviso-sql">
      <h3>Falta crear las tablas de permisos en Supabase</h3>
      <p>Ejecuta este script en SQL Editor y recarga la página.</p>
      <div className="aviso-setup-personal__acciones">
        <button type="button" className="btn" onClick={copiarSql}>
          Copiar script SQL
        </button>
        <a className="btn btn--primario" href={urlSql} target="_blank" rel="noreferrer">
          Abrir SQL Editor
        </a>
      </div>
      <pre className="aviso-setup-personal__sql">{SQL_MIGRACION_PERMISOS}</pre>
    </aside>
  );
}

function PermisosPage() {
  const navigate = useNavigate();
  const anioActual = new Date().getFullYear();
  const [permisos, setPermisos] = useState<RegistroPermiso[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [horarios, setHorarios] = useState<HorarioLaboral[]>([]);
  const [festivos, setFestivos] = useState<Festivo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [faltaTabla, setFaltaTabla] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [imprimiendoId, setImprimiendoId] = useState<string | null>(null);
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);
  const [filtroPersonal, setFiltroPersonal] = useState("");
  const [filtroMes, setFiltroMes] = useState("");
  const [filtroAnio, setFiltroAnio] = useState(String(anioActual));
  const previewAnterior = useRef<string | null>(null);
  const previewRef = useRef<HTMLElement>(null);

  const mapaPersonas = useMemo(() => {
    const mapa = new Map<string, Persona>();
    personas.forEach((p) => mapa.set(p.id, p));
    return mapa;
  }, [personas]);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const ok = await existeTablaPermisos();
      setFaltaTabla(!ok);
      if (!ok) {
        setPermisos([]);
        return;
      }
      const anio = Number.parseInt(filtroAnio, 10) || anioActual;
      const [lista, personal, horario, listaFestivos] = await Promise.all([
        listarPermisos(),
        listarPersonal(),
        listarHorarioAnio(anio).catch(() => [] as HorarioLaboral[]),
        listarFestivosAnio(anio).catch(() => [] as Festivo[]),
      ]);
      setPermisos(lista);
      setPersonas(personal);
      setHorarios(horario);
      setFestivos(listaFestivos);
    } catch (e) {
      setError("No se pudieron cargar los permisos: " + (e as Error).message);
    } finally {
      setCargando(false);
    }
  }, [filtroAnio, anioActual]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  useEffect(() => {
    return () => {
      if (previewAnterior.current) URL.revokeObjectURL(previewAnterior.current);
    };
  }, []);

  const permisosFiltrados = useMemo(() => {
    return permisos.filter((permiso) => {
      if (filtroPersonal && permiso.personal_id !== filtroPersonal) return false;
      const fecha = permiso.datos.fechaDesde;
      if (filtroAnio && !fecha.startsWith(filtroAnio)) return false;
      if (filtroMes) {
        const mes = fecha.slice(5, 7);
        if (mes !== filtroMes.padStart(2, "0")) return false;
      }
      return true;
    });
  }, [permisos, filtroPersonal, filtroMes, filtroAnio]);

  function cerrarVistaPrevia() {
    if (previewAnterior.current) URL.revokeObjectURL(previewAnterior.current);
    previewAnterior.current = null;
    setPdfPreview(null);
  }

  function mostrarPreview(pdfBytes: Uint8Array) {
    if (previewAnterior.current) URL.revokeObjectURL(previewAnterior.current);
    const url = urlVistaPreviaPdf(pdfBytes);
    previewAnterior.current = url;
    setPdfPreview(url);
    requestAnimationFrame(() => {
      previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function editarPermiso(permiso: RegistroPermiso) {
    navigate("/formatos/gh-re-030", { state: { editarPermiso: permiso } });
  }

  async function imprimirPermiso(permiso: RegistroPermiso) {
    setError(null);
    setMensaje(null);
    setImprimiendoId(permiso.id);
    try {
      const pdfBytes = await obtenerPdfPermiso(permiso);
      mostrarPreview(pdfBytes);
      imprimirPdf(pdfBytes);
      setMensaje(`Formato GH-RE-030 No. ${permiso.numero} listo para impresión.`);
    } catch (e) {
      setError("No se pudo generar el formato: " + (e as Error).message);
    } finally {
      setImprimiendoId(null);
    }
  }

  async function manejarEliminar(permiso: RegistroPermiso) {
    if (!window.confirm(`¿Eliminar permiso No. ${permiso.numero}?`)) return;
    setError(null);
    setMensaje(null);
    try {
      await eliminarPermiso(permiso.id);
      setPermisos((previos) => previos.filter((p) => p.id !== permiso.id));
      setMensaje(`Permiso No. ${permiso.numero} eliminado.`);
    } catch (e) {
      setError("No se pudo eliminar: " + (e as Error).message);
    }
  }

  return (
    <section className="permisos">
      <header className="permisos__encabezado">
        <div>
          <h1>Control de permisos del personal</h1>
          <p className="personal__descripcion">
            Consulta salidas, llegadas y tipos de permiso según el formato GH-RE-030.
          </p>
        </div>
        <div className="permisos__enlaces-cabecera">
          <Link className="btn btn--primario" to="/formatos/gh-re-030">
            Nuevo permiso
          </Link>
          <Link className="btn" to="/personal/horario">
            Horario y festivos
          </Link>
          <Link className="btn" to="/personal">
            Volver a Personal
          </Link>
        </div>
      </header>

      {faltaTabla && <AvisoSetupPermisos />}
      {mensaje && <p className="permisos__mensaje permisos__mensaje--ok">{mensaje}</p>}
      {error && <p className="permisos__mensaje permisos__mensaje--error">{error}</p>}

      <div className="permisos__filtros">
        <label>
          Año
          <input
            type="number"
            min={2020}
            max={2100}
            value={filtroAnio}
            onChange={(e) => setFiltroAnio(e.target.value)}
          />
        </label>
        <label>
          Mes
          <select value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)}>
            <option value="">Todos</option>
            {Array.from({ length: 12 }, (_, i) => {
              const mes = String(i + 1).padStart(2, "0");
              return (
                <option key={mes} value={mes}>
                  {mes}
                </option>
              );
            })}
          </select>
        </label>
        <label>
          Técnico
          <select value={filtroPersonal} onChange={(e) => setFiltroPersonal(e.target.value)}>
            <option value="">Todos</option>
            {personas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>

      {cargando && <p>Cargando permisos...</p>}

      {!cargando && !faltaTabla && permisosFiltrados.length === 0 && (
        <p className="personal__vacio">
          No hay permisos para los filtros seleccionados.{" "}
          <Link to="/formatos/gh-re-030">Registrar uno</Link>.
        </p>
      )}

      {!cargando && festivos.length > 0 && (
        <p className="permisos__resumen-festivos">
          {festivos.length} festivos cargados en {filtroAnio}.{" "}
          <Link to="/personal/horario">Ver calendario</Link>
        </p>
      )}

      {!cargando && permisosFiltrados.length > 0 && (
        <div className="permisos__tabla-scroll">
          <table className="permisos__tabla">
            <thead>
              <tr>
                <th>No.</th>
                <th>Día</th>
                <th>Fecha</th>
                <th>Festivo</th>
                <th>Técnico</th>
                <th>Entrada esperada</th>
                <th>Salida esperada</th>
                <th>Hora salida</th>
                <th>Hora llegada</th>
                <th>Tiempo</th>
                <th>Tipo permiso</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {permisosFiltrados.map((permiso) => {
                const jornada = obtenerJornadaEsperada(
                  horarios,
                  permiso.datos.fechaDesde,
                  festivos,
                );
                const persona = mapaPersonas.get(permiso.personal_id);
                const imprimiendo = imprimiendoId === permiso.id;
                return (
                  <tr
                    key={permiso.id}
                    className={jornada?.esFestivo ? "permisos__fila--festivo" : ""}
                  >
                    <td>{permiso.numero}</td>
                    <td>{nombreDiaSemana(permiso.datos.fechaDesde)}</td>
                    <td>{permiso.datos.fechaDesde}</td>
                    <td>
                      {jornada?.esFestivo ? (
                        <span className="permisos__chip permisos__chip--festivo">
                          {jornada.nombreFestivo}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{persona?.nombre ?? permiso.datos.nombreTrabajador}</td>
                    <td>{jornada?.entrada ?? "—"}</td>
                    <td>{jornada?.salida ?? "—"}</td>
                    <td>{permiso.datos.horaSalidaGh || permiso.datos.horaDesde}</td>
                    <td>{permiso.datos.horaLlegadaGh || permiso.datos.horaHasta}</td>
                    <td>{formatearTiempoConcedido(permiso.datos.tiempoConcedidoMinutos)}</td>
                    <td>{etiquetaTipoPermiso(permiso.datos)}</td>
                    <td>
                      <span className={`permisos__chip permisos__chip--${permiso.estado}`}>
                        {etiquetaEstadoPermiso(permiso.estado)}
                      </span>
                    </td>
                    <td>
                      <div className="permisos__tabla-acciones">
                        <button
                          type="button"
                          className="btn"
                          onClick={() => editarPermiso(permiso)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn"
                          disabled={imprimiendo}
                          onClick={() => void imprimirPermiso(permiso)}
                        >
                          {imprimiendo ? "..." : "Imprimir"}
                        </button>
                        <SoloConPermiso permiso="eliminar.registros">
                          <button
                            type="button"
                            className="btn btn--peligro"
                            onClick={() => void manejarEliminar(permiso)}
                          >
                            Eliminar
                          </button>
                        </SoloConPermiso>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pdfPreview && (
        <section ref={previewRef} className="permisos__preview">
          <div className="permisos__preview-barra">
            <h2>Vista previa para impresión</h2>
            <button type="button" className="btn" onClick={cerrarVistaPrevia}>
              Cerrar
            </button>
          </div>
          <iframe title="Vista previa GH-RE-030" src={pdfPreview} className="permisos__iframe" />
        </section>
      )}
    </section>
  );
}

export default PermisosPage;
