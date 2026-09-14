import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { imprimirFormatoHtml } from "../../lib/imprimirFormato";
import { AREAS_CON_PM } from "../../lib/areas";
import { NOMBRES_MESES } from "../../lib/fechas";
import { listarHojas } from "../hojas/hojasService";
import type { HojaVida } from "../hojas/types";
import { listarPersonalActivo } from "../personal/personalService";
import type { Persona } from "../personal/types";
import { actualizarPreventivo, listarPreventivo } from "../preventivo/preventivoService";
import type { RegistroPreventivo } from "../preventivo/types";
import {
  calcularMapaNumerosReporte,
  datosConNumeroReporte,
  numeroReporteDeRegistro,
  sincronizarNumerosReportePendientes,
} from "../preventivo/numeroReportePm";
import Mtre045VistaPrevia from "./Mtre045VistaPrevia";
import {
  construirMtre045DesdePreventivo,
  nombreYCodigoPm,
} from "./mtre045DesdePreventivo";
import Mtre045CamposFormulario, { extraerCamposFormato } from "./Mtre045CamposFormulario";
import {
  formularioMtre045Vacio,
  prefillMtre045DesdePreventivo,
  type Mtre045Datos,
  type PrefillMtre045DesdePreventivo,
} from "./mtre045Types";
import "./formatos.css";
import "./mtre045.css";
import "../permisos/permisos.css";

interface EstadoNavegacion {
  mtre045?: PrefillMtre045DesdePreventivo;
  mtre045Datos?: Mtre045Datos;
}

function Mtre045Page() {
  const ubicacion = useLocation();
  const [datos, setDatos] = useState<Mtre045Datos>(formularioMtre045Vacio());
  const [registros, setRegistros] = useState<RegistroPreventivo[]>([]);
  const [hojas, setHojas] = useState<HojaVida[]>([]);
  const [personal, setPersonal] = useState<Persona[]>([]);
  const [imprimiendo, setImprimiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filtroPmArea, setFiltroPmArea] = useState("");
  const [filtroPmDia, setFiltroPmDia] = useState("");
  const [filtroPmMes, setFiltroPmMes] = useState("");
  const [filtroPmAnio, setFiltroPmAnio] = useState("");

  useEffect(() => {
    Promise.all([listarPreventivo(), listarHojas(), listarPersonalActivo()])
      .then(async ([prev, listaHojas, tecnicos]) => {
        const sincronizados = await sincronizarNumerosReportePendientes(prev);
        setRegistros(sincronizados);
        setHojas(listaHojas);
        setPersonal(tecnicos);
      })
      .catch((e: Error) => setError("No se pudieron cargar datos: " + e.message));
  }, []);

  const mapaNumerosReporte = useMemo(
    () => calcularMapaNumerosReporte(registros),
    [registros],
  );

  useEffect(() => {
    const nav = ubicacion.state as EstadoNavegacion | null;
    if (nav?.mtre045Datos) {
      setDatos(nav.mtre045Datos);
      setMensaje("Reporte sincronizado con el registro de mantenimiento preventivo.");
    } else if (nav?.mtre045) {
      setDatos(prefillMtre045DesdePreventivo(nav.mtre045));
      setMensaje("Reporte precargado desde mantenimiento preventivo. Revise los datos e imprima.");
    }
    if (nav?.mtre045 || nav?.mtre045Datos) {
      window.history.replaceState({}, "");
    }
  }, [ubicacion.state]);

  useEffect(() => {
    if (!datos.preventivoId) return;
    const registro = registros.find((r) => r.id === datos.preventivoId);
    if (!registro) return;
    const numero = numeroReporteDeRegistro(registro, mapaNumerosReporte);
    if (numero && numero !== datos.numeroReporte) {
      setDatos((previos) => ({ ...previos, numeroReporte: numero }));
    }
  }, [datos.preventivoId, datos.numeroReporte, registros, mapaNumerosReporte]);

  const actualizar = useCallback((cambios: Partial<Mtre045Datos>) => {
    setDatos((previos) => ({ ...previos, ...cambios }));
  }, []);

  function cargarDesdePreventivo(registro: RegistroPreventivo) {
    const hoja = hojas.find((h) => h.id === registro.hoja_id);
    const numero = numeroReporteDeRegistro(registro, mapaNumerosReporte);
    const fusionado = construirMtre045DesdePreventivo(registro, hoja, personal, {
      numeroReporte: numero,
    });
    setDatos(fusionado);
    const { nombre, codigo } = nombreYCodigoPm(registro, hoja);
    setMensaje(`Cargado PM ${registro.fecha} — ${nombre} (${codigo})`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function manejarImprimir() {
    if (!datos.equipo.trim()) {
      setError("Indica al menos el equipo antes de imprimir.");
      return;
    }
    setImprimiendo(true);
    setError(null);
    try {
      imprimirFormatoHtml();
      setMensaje("Diálogo de impresión abierto. El documento coincide con la vista previa del formato oficial.");
    } catch (e) {
      setError("No se pudo imprimir: " + (e as Error).message);
    } finally {
      setImprimiendo(false);
    }
  }

  function manejarEnvioFormulario(evento: FormEvent) {
    evento.preventDefault();
  }

  async function manejarGuardarEnPreventivo() {
    if (!datos.preventivoId) {
      setError("Carga un registro de mantenimiento preventivo para vincular este reporte.");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const registro = registros.find((r) => r.id === datos.preventivoId);
      if (!registro) throw new Error("Registro preventivo no encontrado.");
      const numero = numeroReporteDeRegistro(registro, mapaNumerosReporte);
      const datosGuardados = datosConNumeroReporte(
        {
          ...registro.datos,
          mtre045: { ...datos, numeroReporte: numero },
        },
        numero,
      );
      await actualizarPreventivo(datos.preventivoId, { datos: datosGuardados });
      setRegistros((lista) =>
        lista.map((r) =>
          r.id === datos.preventivoId ? { ...r, datos: datosGuardados } : r,
        ),
      );
      setDatos((previos) => ({ ...previos, numeroReporte: numero }));
      setMensaje("Datos del MT-RE-045 guardados en el registro preventivo.");
    } catch (e) {
      setError("No se pudo guardar: " + (e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  const anioActual = new Date().getFullYear();
  const aniosPmDisponibles = useMemo(() => {
    const desdeRegistros = new Set(
      registros.map((r) => r.fecha.slice(0, 4)).filter(Boolean),
    );
    for (let anio = anioActual - 5; anio <= anioActual + 1; anio += 1) {
      desdeRegistros.add(String(anio));
    }
    return [...desdeRegistros].sort((a, b) => Number(b) - Number(a));
  }, [registros, anioActual]);

  const registrosPmFiltrados = useMemo(() => {
    return registros
      .filter((registro) => {
        if (filtroPmArea && registro.area !== filtroPmArea) return false;
        const [anio, mes, dia] = registro.fecha.split("-");
        if (filtroPmAnio && anio !== filtroPmAnio) return false;
        if (filtroPmMes && mes !== filtroPmMes) return false;
        if (filtroPmDia && dia !== filtroPmDia.padStart(2, "0")) return false;
        return true;
      })
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [registros, filtroPmArea, filtroPmAnio, filtroPmMes, filtroPmDia]);

  return (
    <section className="formatos mtre045-page">
      <header className="formatos__cabecera">
        <div>
          <Link to="/formatos" className="btn">
            ← Volver a formatos
          </Link>
          <h1>MT-RE-045 — Reporte de mantenimiento preventivo</h1>
          <p className="formatos__descripcion">
            Los datos del registro PM se sincronizan automáticamente. La vista previa replica el
            formato oficial; <strong>Imprimir</strong> genera el mismo documento.
          </p>
        </div>
        <a className="btn" href="/templates/MT-RE-045.docx" download>
          Plantilla Word original
        </a>
      </header>

      <div className="mtre045-page__layout">
        <form className="mtre045-form" onSubmit={manejarEnvioFormulario}>
          <h2>Datos del reporte</h2>
          <p className="formatos__descripcion">
            Equipo, fecha, área y actividad se toman del mantenimiento preventivo al cargar un PM.
          </p>
          <div className="mtre045-form__grid">
            <label>
              Número de reporte
              <input
                value={datos.numeroReporte}
                readOnly={Boolean(datos.preventivoId)}
                className={datos.preventivoId ? "mtre045-form__solo-lectura" : undefined}
                title={
                  datos.preventivoId
                    ? "Secuencial por área y mes (1 = primer PM del mes en el área)"
                    : undefined
                }
                onChange={(e) => actualizar({ numeroReporte: e.target.value })}
              />
            </label>
            <label>
              Fecha *
              <input
                type="date"
                required
                value={datos.fecha}
                onChange={(e) => actualizar({ fecha: e.target.value })}
              />
            </label>
            <label>
              Código máquina
              <input
                value={datos.codigo}
                readOnly
                className="mtre045-form__solo-lectura"
                title="Se completa desde el registro PM"
              />
            </label>
            <label>
              Equipo *
              <input
                required
                value={datos.equipo}
                onChange={(e) => actualizar({ equipo: e.target.value })}
              />
            </label>
            <label>
              Marca
              <input value={datos.marca} onChange={(e) => actualizar({ marca: e.target.value })} />
            </label>
            <label>
              Serie
              <input value={datos.serie} onChange={(e) => actualizar({ serie: e.target.value })} />
            </label>
            <label>
              Área
              <input
                value={datos.area}
                onChange={(e) => actualizar({ area: e.target.value })}
                placeholder="Se completa al cargar un PM"
              />
            </label>
            <label className="mtre045-form__ancho">
              Actividad realizada (PM) *
              <textarea
                required
                rows={3}
                value={datos.actividadRealizada}
                onChange={(e) => actualizar({ actividadRealizada: e.target.value })}
              />
            </label>
            <label>
              Responsable mantenimiento
              <input
                value={datos.responsableMantenimiento}
                onChange={(e) => actualizar({ responsableMantenimiento: e.target.value })}
              />
            </label>
          </div>
          <Mtre045CamposFormulario
            datos={extraerCamposFormato(datos)}
            onChange={(cambios) => actualizar(cambios)}
          />
          <div className="mtre045-form__acciones">
            <button
              type="button"
              className="btn btn--primario"
              disabled={imprimiendo}
              onClick={manejarImprimir}
            >
              {imprimiendo ? "Abriendo..." : "Imprimir"}
            </button>
            {datos.preventivoId && (
              <button
                type="button"
                className="btn"
                disabled={guardando}
                onClick={() => void manejarGuardarEnPreventivo()}
              >
                {guardando ? "Guardando..." : "Guardar en PM"}
              </button>
            )}
          </div>
        </form>

        <aside className="mtre045-lista-pm">
          <h2>Cargar desde preventivo</h2>
          <p className="formatos__descripcion">
            Filtra por área y fecha. Cada registro muestra máquina y código.
          </p>
          <div className="mtre045-filtros-pm">
            <label>
              Área
              <select value={filtroPmArea} onChange={(e) => setFiltroPmArea(e.target.value)}>
                <option value="">Todas</option>
                {AREAS_CON_PM.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Año
              <select value={filtroPmAnio} onChange={(e) => setFiltroPmAnio(e.target.value)}>
                <option value="">Todos</option>
                {aniosPmDisponibles.map((anio) => (
                  <option key={anio} value={anio}>
                    {anio}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Mes
              <select value={filtroPmMes} onChange={(e) => setFiltroPmMes(e.target.value)}>
                <option value="">Todos</option>
                {NOMBRES_MESES.map((nombre, indice) => {
                  const mes = String(indice + 1).padStart(2, "0");
                  return (
                    <option key={mes} value={mes}>
                      {nombre}
                    </option>
                  );
                })}
              </select>
            </label>
            <label>
              Día
              <select value={filtroPmDia} onChange={(e) => setFiltroPmDia(e.target.value)}>
                <option value="">Todos</option>
                {Array.from({ length: 31 }, (_, i) => String(i + 1)).map((dia) => (
                  <option key={dia} value={dia.padStart(2, "0")}>
                    {dia}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="mtre045-lista-pm__conteo">
            {registrosPmFiltrados.length} registro(s) encontrado(s)
          </p>
          <div className="mtre045-lista-pm__items">
            {registrosPmFiltrados.length === 0 && (
              <p className="mtre045-lista-pm__vacio">No hay PM con esos filtros.</p>
            )}
            {registrosPmFiltrados.map((registro) => {
              const hoja = hojas.find((h) => h.id === registro.hoja_id);
              const { nombre, codigo } = nombreYCodigoPm(registro, hoja);
              return (
                <article key={registro.id} className="mtre045-item-pm">
                  <div>
                    <strong>{registro.fecha}</strong> — {registro.area}
                    <span className="mtre045-item-pm__numero">
                      Nº {numeroReporteDeRegistro(registro, mapaNumerosReporte) || "—"}
                    </span>
                    <p>
                      <em>{nombre}</em>
                      <span className="mtre045-item-pm__codigo">{codigo}</span>
                    </p>
                    <p className="mtre045-item-pm__desc">
                      {registro.descripcion?.slice(0, 80) ?? "Sin descripción"}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => cargarDesdePreventivo(registro)}
                  >
                    Cargar
                  </button>
                </article>
              );
            })}
          </div>
        </aside>
      </div>

      {mensaje && <p className="formatos__mensaje formatos__mensaje--ok">{mensaje}</p>}
      {error && <p className="formatos__mensaje formatos__mensaje--error">{error}</p>}

      <section className="mtre045-panel-preview">
        <div className="mtre045-panel-preview__barra">
          <h2>Vista previa — formato oficial MT-RE-045</h2>
          <button type="button" className="btn btn--primario" onClick={manejarImprimir}>
            Imprimir
          </button>
        </div>
        <div className="mtre045-panel-preview__scroll">
          <Mtre045VistaPrevia datos={datos} />
        </div>
      </section>
    </section>
  );
}

export default Mtre045Page;
