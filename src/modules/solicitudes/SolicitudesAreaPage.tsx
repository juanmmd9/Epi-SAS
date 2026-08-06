import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ContadorListaMensual, etiquetaPeriodoContador } from "../../components/ContadorListaMensual";
import { useAuth } from "../auth/AuthContext";
import { SoloConPermiso } from "../auth/SoloConPermiso";
import { AREAS_SISTEMA, coincideArea, esAreaValida, normalizarArea } from "../../lib/areas";
import {
  rutaSolicitudesArea,
  usuarioPuedeAccederArea,
  usuarioPuedeEscribirEnArea,
} from "../../lib/usuarioArea";
import {
  contarCorrectivosMes,
  filtrarCorrectivosMes,
  type CriterioFechaCorrectivo,
  type FiltroEstadoCorrectivoMes,
} from "../correctivo/correctivoConteo";
import { listarCorrectivo, ordenarRegistrosCorrectivo } from "../correctivo/correctivoService";
import type { RegistroCorrectivo } from "../correctivo/types";
import { listarHojas } from "../hojas/hojasService";
import type { HojaVida } from "../hojas/types";
import NuevaSolicitudAreaForm from "./NuevaSolicitudAreaForm";
import PanelAlertasSolicitudes from "./PanelAlertasSolicitudes";
import { useSolicitudesRealtime } from "./useSolicitudesRealtime";
import {
  actualizarRepuesto,
  crearRepuesto,
  eliminarRepuesto,
  existeTablaRepuestos,
  listarRepuestos,
} from "./repuestosService";
import {
  diasAbierta,
  repuestoPendiente,
  quienCerroSolicitud,
  solicitudAbierta,
  solicitudEsperaRepuesto,
} from "./solicitudesCalculo";
import { SQL_MIGRACION_REPUESTOS } from "./solicitudesSetup";
import {
  ESTADOS_REPUESTO,
  ETIQUETAS_ESTADO_REPUESTO,
  type EstadoRepuesto,
  type RepuestoInput,
  type RepuestoSolicitud,
} from "./types";
import "./solicitudes.css";

type TabActiva = "correctivas" | "repuestos";

const formularioRepuestoVacio = {
  hoja_id: "",
  correctivo_id: "",
  codigo: "",
  descripcion: "",
  cantidad: "1",
  estado: "solicitado" as EstadoRepuesto,
  fecha_necesaria: "",
  notas: "",
};

function AvisoSetupRepuestos() {
  const projectRef =
    import.meta.env.VITE_SUPABASE_URL?.match(/https:\/\/([^.]+)\./)?.[1] ?? "_";
  const urlSql = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;

  function copiarSql() {
    void navigator.clipboard.writeText(SQL_MIGRACION_REPUESTOS);
  }

  return (
    <aside className="aviso-setup-solicitudes">
      <h3>Falta crear la tabla de repuestos en Supabase</h3>
      <p>Ejecuta este script en SQL Editor y recarga la página para gestionar repuestos.</p>
      <div className="aviso-setup-personal__acciones">
        <button type="button" className="btn" onClick={copiarSql}>
          Copiar script SQL
        </button>
        <a className="btn btn--primario" href={urlSql} target="_blank" rel="noreferrer">
          Abrir SQL Editor
        </a>
      </div>
      <pre>{SQL_MIGRACION_REPUESTOS}</pre>
    </aside>
  );
}

function SolicitudesAreaPage() {
  const { area: areaParam } = useParams<{ area: string }>();
  const area = areaParam ? decodeURIComponent(areaParam) : "";
  const areaValida = esAreaValida(area);
  const navegar = useNavigate();
  const { perfil, puede } = useAuth();

  const [tab, setTab] = useState<TabActiva>("correctivas");
  const [correctivos, setCorrectivos] = useState<RegistroCorrectivo[]>([]);
  const [repuestos, setRepuestos] = useState<RepuestoSolicitud[]>([]);
  const [maquinas, setMaquinas] = useState<HojaVida[]>([]);
  const [cargando, setCargando] = useState(true);
  const [faltaTablaRepuestos, setFaltaTablaRepuestos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [editandoRepuestoId, setEditandoRepuestoId] = useState<string | null>(null);
  const [camposRepuesto, setCamposRepuesto] = useState(formularioRepuestoVacio);
  const [soloAbiertas, setSoloAbiertas] = useState(true);
  const [contadorMes, setContadorMes] = useState(() => new Date().getMonth() + 1);
  const [contadorAnio, setContadorAnio] = useState(() => new Date().getFullYear());
  const [criterioContador, setCriterioContador] =
    useState<CriterioFechaCorrectivo>("solicitud");
  const [filtroContador, setFiltroContador] = useState<FiltroEstadoCorrectivoMes | null>(null);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [regs, hojas, hayTabla] = await Promise.all([
        listarCorrectivo(),
        listarHojas(),
        existeTablaRepuestos(),
      ]);
      setCorrectivos(regs);
      setMaquinas(hojas);
      setFaltaTablaRepuestos(!hayTabla);
      if (hayTabla) {
        setRepuestos(await listarRepuestos());
      } else {
        setRepuestos([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  const maquinasArea = useMemo(
    () => maquinas.filter((m) => coincideArea(m.area, area)),
    [maquinas, area],
  );

  const mapaMaquinas = useMemo(
    () => new Map(maquinas.map((m) => [m.id, m])),
    [maquinas],
  );

  const correctivosDelAreaSinFiltro = useMemo(
    () => correctivos.filter((r) => coincideArea(r.area, area)),
    [correctivos, area],
  );

  const correctivosArea = useMemo(() => {
    if (filtroContador) {
      return ordenarRegistrosCorrectivo(
        filtrarCorrectivosMes(
          correctivosDelAreaSinFiltro,
          contadorAnio,
          contadorMes,
          criterioContador,
          filtroContador,
        ),
      );
    }
    let lista = correctivosDelAreaSinFiltro;
    if (soloAbiertas) {
      lista = lista.filter(solicitudAbierta);
    }
    return ordenarRegistrosCorrectivo(lista);
  }, [
    correctivosDelAreaSinFiltro,
    soloAbiertas,
    filtroContador,
    contadorAnio,
    contadorMes,
    criterioContador,
  ]);

  const repuestosArea = useMemo(
    () => repuestos.filter((r) => coincideArea(r.area, area)),
    [repuestos, area],
  );

  const correctivosAbiertosArea = useMemo(
    () =>
      ordenarRegistrosCorrectivo(
        correctivosDelAreaSinFiltro.filter(solicitudAbierta),
      ),
    [correctivosDelAreaSinFiltro],
  );

  const conteoMes = useMemo(
    () =>
      contarCorrectivosMes(
        correctivosDelAreaSinFiltro,
        contadorAnio,
        contadorMes,
        criterioContador,
      ),
    [correctivosDelAreaSinFiltro, contadorAnio, contadorMes, criterioContador],
  );

  const esSolicitanteArea = perfil?.rol === "solicitante";
  const puedeVerCorrectivo = puede("ver.correctivo");

  const alNuevaSolicitudRealtime = useCallback((registro: RegistroCorrectivo) => {
    setCorrectivos((prev) => {
      if (prev.some((r) => r.id === registro.id)) return prev;
      return ordenarRegistrosCorrectivo([registro, ...prev]);
    });
    setTab("correctivas");
    setMensaje(`Nueva solicitud #${registro.datos.numeroSolicitud} recibida.`);
  }, []);

  const {
    alertas,
    descartarAlerta,
    enLinea,
    sondeoActivo,
    sonidoActivo,
    setSonidoActivo,
    idsDestacados,
    marcarConocido,
  } = useSolicitudesRealtime({
    areaFiltro: areaValida ? area : undefined,
    correctivos,
    onNuevaSolicitud: alNuevaSolicitudRealtime,
    habilitado: areaValida && !cargando,
    // Mantenimiento usa avisos globales; solicitante recibe avisos aquí.
    modo: esSolicitanteArea ? "completo" : "solo-lista",
  });

  const alCrearSolicitud = useCallback(
    (registro: RegistroCorrectivo) => {
      marcarConocido(registro.id);
      setCorrectivos((prev) => ordenarRegistrosCorrectivo([registro, ...prev]));
      setTab("correctivas");
    },
    [marcarConocido],
  );

  const etiquetaFiltroContador =
    filtroContador === "abiertas"
      ? "abiertas"
      : filtroContador === "cerradas"
        ? "cerradas"
        : filtroContador === "espera"
          ? "en espera de repuesto"
          : filtroContador === "todas"
            ? contadorMes === 0
              ? "todas"
              : "del mes"
            : null;

  function seleccionarFiltroContador(key: string) {
    const siguiente = key as FiltroEstadoCorrectivoMes;
    setFiltroContador((prev) => (prev === siguiente ? null : siguiente));
  }

  function irACorrectivo(registro: RegistroCorrectivo) {
    navegar("/correctivo", { state: { editarCorrectivoId: registro.id, filtroArea: area } });
  }

  function cancelarEdicionRepuesto() {
    setEditandoRepuestoId(null);
    setCamposRepuesto(formularioRepuestoVacio);
  }

  function iniciarEdicionRepuesto(repuesto: RepuestoSolicitud) {
    setEditandoRepuestoId(repuesto.id);
    setCamposRepuesto({
      hoja_id: repuesto.hoja_id ?? "",
      correctivo_id: repuesto.correctivo_id ?? "",
      codigo: repuesto.codigo,
      descripcion: repuesto.descripcion,
      cantidad: String(repuesto.cantidad),
      estado: repuesto.estado,
      fecha_necesaria: repuesto.fecha_necesaria ?? "",
      notas: repuesto.notas,
    });
    setTab("repuestos");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function manejarRepuesto(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    setMensaje(null);

    const descripcion = camposRepuesto.descripcion.trim();
    if (!descripcion) {
      setError("La descripción del repuesto es obligatoria.");
      return;
    }

    const cantidad = Number.parseFloat(camposRepuesto.cantidad);
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      setError("La cantidad debe ser mayor que cero.");
      return;
    }

    const input: RepuestoInput = {
      area: normalizarArea(area),
      hoja_id: camposRepuesto.hoja_id || null,
      correctivo_id: camposRepuesto.correctivo_id || null,
      codigo: camposRepuesto.codigo.trim(),
      descripcion,
      cantidad,
      estado: camposRepuesto.estado,
      fecha_necesaria: camposRepuesto.fecha_necesaria || null,
      notas: camposRepuesto.notas.trim(),
    };

    setGuardando(true);
    try {
      if (editandoRepuestoId) {
        const actualizado = await actualizarRepuesto(editandoRepuestoId, input);
        setRepuestos((prev) => prev.map((r) => (r.id === actualizado.id ? actualizado : r)));
        setMensaje("Repuesto actualizado.");
      } else {
        const creado = await crearRepuesto(input);
        setRepuestos((prev) => [creado, ...prev]);
        setMensaje("Repuesto registrado.");
      }
      cancelarEdicionRepuesto();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el repuesto");
    } finally {
      setGuardando(false);
    }
  }

  async function manejarEliminarRepuesto(repuesto: RepuestoSolicitud) {
    if (!window.confirm(`¿Eliminar el repuesto «${repuesto.descripcion}»?`)) return;
    setError(null);
    try {
      await eliminarRepuesto(repuesto.id);
      setRepuestos((prev) => prev.filter((r) => r.id !== repuesto.id));
      if (editandoRepuestoId === repuesto.id) cancelarEdicionRepuesto();
      setMensaje("Repuesto eliminado.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar");
    }
  }

  if (!areaValida) {
    return (
      <section className="solicitudes">
        <h1>Área no válida</h1>
        <p className="solicitudes__descripcion">
          El área «{area || "(vacía)"}» no está en el catálogo del sistema.
        </p>
        <Link to="/solicitudes" className="btn">
          Volver al tablero
        </Link>
        <ul>
          {AREAS_SISTEMA.map((a) => (
            <li key={a}>
              <Link to={rutaSolicitudesArea(a)}>{a}</Link>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (!usuarioPuedeAccederArea(perfil, area)) {
    return <Navigate to="/solicitudes" replace />;
  }

  const puedeEscribirArea = usuarioPuedeEscribirEnArea(perfil, area);

  if (cargando) {
    return (
      <section className="solicitudes">
        <Link to="/solicitudes" className="solicitudes-area__volver">
          ← Tablero de solicitudes
        </Link>
        <h1>{area}</h1>
        <p className="solicitudes__descripcion">Cargando...</p>
      </section>
    );
  }

  return (
    <section className="solicitudes">
      <Link to="/solicitudes" className="solicitudes-area__volver">
        ← Volver al tablero de áreas
      </Link>

      <h1>Solicitudes — {area}</h1>
      <div className="solicitudes__cabecera">
        <p className="solicitudes__descripcion">
          {esSolicitanteArea
            ? "Reporta fallas o consulta el estado de las solicitudes de esta área. Usa el botón de arriba para volver al tablero."
            : "Solicitudes correctivas y pedidos de repuestos del área."}
          {puedeVerCorrectivo && (
            <>
              {" "}
              <Link to="/correctivo">Ir a mantenimiento correctivo</Link>
            </>
          )}
          {esSolicitanteArea
            ? " Deja esta pantalla abierta para avisos al instante."
            : " Los avisos llegan en toda la app (toast + notificación del celular)."}
        </p>
        {esSolicitanteArea ? (
          <PanelAlertasSolicitudes
            enLinea={enLinea}
            sondeoActivo={sondeoActivo}
            sonidoActivo={sonidoActivo}
            onToggleSonido={() => setSonidoActivo((v) => !v)}
            alertas={alertas}
            onDescartar={descartarAlerta}
            areaActual={area}
          />
        ) : (
          <div className="solicitudes-alerta__barra">
            <span
              className={
                "solicitudes-alerta__estado" +
                (enLinea || sondeoActivo
                  ? " solicitudes-alerta__estado--en-linea"
                  : " solicitudes-alerta__estado--off")
              }
            >
              {enLinea ? "Lista en vivo" : sondeoActivo ? "Lista auto" : "Sin auto"}
            </span>
          </div>
        )}
      </div>

      {puedeEscribirArea ? (
        <NuevaSolicitudAreaForm
          area={normalizarArea(area)}
          nombreSolicitante={perfil?.nombre || perfil?.email || ""}
          maquinas={maquinas}
          correctivos={correctivos}
          onCreada={alCrearSolicitud}
        />
      ) : (
        <p className="solicitudes__mensaje">
          Tu perfil es de solo consulta: no puedes crear solicitudes en esta área.
        </p>
      )}

      {error && <p className="solicitudes__error">{error}</p>}
      {mensaje && <p className="solicitudes__mensaje solicitudes__mensaje--ok">{mensaje}</p>}

      <div className="solicitudes-area__tabs">
        <button
          type="button"
          className={
            "solicitudes-area__tab" + (tab === "correctivas" ? " solicitudes-area__tab--activa" : "")
          }
          onClick={() => setTab("correctivas")}
        >
          Correctivas (
          {filtroContador ? correctivosArea.length : correctivosAbiertosArea.length}
          {!filtroContador && soloAbiertas ? " abiertas" : ""})
        </button>
        <button
          type="button"
          className={
            "solicitudes-area__tab" + (tab === "repuestos" ? " solicitudes-area__tab--activa" : "")
          }
          onClick={() => setTab("repuestos")}
        >
          Repuestos ({repuestosArea.filter(repuestoPendiente).length} pendientes)
        </button>
      </div>

      {tab === "correctivas" && (
        <>
          <ContadorListaMensual
            titulo="Contador del mes"
            mes={contadorMes}
            anio={contadorAnio}
            onMes={setContadorMes}
            onAnio={setContadorAnio}
            total={conteoMes.total}
            totalEtiqueta={
              contadorMes === 0
                ? criterioContador === "cierre"
                  ? "todas las cerradas"
                  : "todas las solicitudes"
                : criterioContador === "cierre"
                  ? "cerradas por fecha de cierre"
                  : "registradas por fecha de solicitud"
            }
            chipArea={normalizarArea(area)}
            criterio={{
              valor: criterioContador,
              onChange: (v) => setCriterioContador(v as CriterioFechaCorrectivo),
              opciones: [
                { valor: "solicitud", etiqueta: "Fecha de solicitud" },
                { valor: "cierre", etiqueta: "Fecha de cierre" },
              ],
            }}
            seleccion={filtroContador}
            onSeleccionar={seleccionarFiltroContador}
            tarjetas={[
              {
                key: "abiertas",
                etiqueta: "Abiertas",
                valor: conteoMes.abiertas,
                tono: "alerta",
              },
              {
                key: "cerradas",
                etiqueta: "Cerradas",
                valor: conteoMes.cerradas,
                tono: "ok",
              },
              {
                key: "espera",
                etiqueta: "Espera repuesto",
                valor: conteoMes.enEsperaRepuesto,
                tono: "espera",
              },
            ]}
          />

          {filtroContador ? (
            <div className="solicitudes-filtro-mes">
              <p>
                Mostrando solicitudes <strong>{etiquetaFiltroContador}</strong> de{" "}
                <strong>{etiquetaPeriodoContador(contadorMes, contadorAnio)}</strong>{" "}
                ({correctivosArea.length})
              </p>
              <button type="button" className="btn" onClick={() => setFiltroContador(null)}>
                Quitar filtro
              </button>
            </div>
          ) : (
            <label className="check-tipo">
              <input
                type="checkbox"
                checked={soloAbiertas}
                onChange={(e) => setSoloAbiertas(e.target.checked)}
              />{" "}
              Solo solicitudes abiertas
            </label>
          )}

          {correctivosArea.length === 0 ? (
            <p className="solicitudes__vacio">
              {filtroContador
                ? `No hay solicitudes ${etiquetaFiltroContador} en ${etiquetaPeriodoContador(contadorMes, contadorAnio)}.`
                : soloAbiertas
                  ? "No hay solicitudes correctivas abiertas en esta área."
                  : "No hay solicitudes correctivas en esta área."}
            </p>
          ) : (
            <div className="solicitudes-lista">
              {correctivosArea.map((registro) => {
                const dias = diasAbierta(registro);
                const enEspera = solicitudEsperaRepuesto(registro);
                const cerrada = Boolean(registro.datos.fechaCierre?.trim());
                const quienCerro = cerrada ? quienCerroSolicitud(registro) : null;
                return (
                  <article
                    key={registro.id}
                    className={
                      "solicitud-item" +
                      (enEspera ? " solicitud-item--espera" : "") +
                      (idsDestacados.has(registro.id) ? " solicitud-item--nueva" : "")
                    }
                  >
                    <div>
                      <strong>
                        Solicitud #{registro.datos.numeroSolicitud}
                        {enEspera && " · En espera de repuesto"}
                        {cerrada &&
                          ` · Cerrada ${registro.datos.fechaCierre.slice(0, 10)}`}
                      </strong>
                      <p className="solicitud-item__meta">
                        {registro.fecha.slice(0, 10)}
                        {registro.datos.codigoMaquina && ` · ${registro.datos.codigoMaquina}`}
                        {registro.datos.maquinaEquipoLocacion &&
                          ` · ${registro.datos.maquinaEquipoLocacion}`}
                        {dias !== null && ` · ${dias} día(s) abierta`}
                      </p>
                      {quienCerro && (
                        <p className="solicitud-item__cierre">
                          Cerrada por: <strong>{quienCerro}</strong>
                        </p>
                      )}
                      <p className="solicitud-item__desc">
                        {registro.datos.descripcionSolicitud || "Sin descripción"}
                      </p>
                    </div>
                    {puedeVerCorrectivo && (
                      <button
                        type="button"
                        className="btn btn--primario"
                        onClick={() => irACorrectivo(registro)}
                      >
                        Abrir en correctivo
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === "repuestos" && (
        <>
          {faltaTablaRepuestos && <AvisoSetupRepuestos />}

          <SoloConPermiso permiso="crear.repuestos">
            {puedeEscribirArea && !faltaTablaRepuestos && (
              <form className="repuesto-form" onSubmit={manejarRepuesto}>
                <h2>{editandoRepuestoId ? "Editar repuesto" : "Nuevo repuesto"}</h2>
                <div className="repuesto-form__grid">
                  <label>
                    Máquina (hoja de vida)
                    <select
                      value={camposRepuesto.hoja_id}
                      onChange={(e) => setCamposRepuesto((c) => ({ ...c, hoja_id: e.target.value }))}
                    >
                      <option value="">Sin vínculo / locativo</option>
                      {maquinasArea.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.codigo ? `${m.codigo} — ` : ""}
                          {m.nombre}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Solicitud correctiva (opcional)
                    <select
                      value={camposRepuesto.correctivo_id}
                      onChange={(e) =>
                        setCamposRepuesto((c) => ({ ...c, correctivo_id: e.target.value }))
                      }
                    >
                      <option value="">Ninguna</option>
                      {correctivosAbiertosArea.map((r) => (
                        <option key={r.id} value={r.id}>
                          #{r.datos.numeroSolicitud} — {r.datos.maquinaEquipoLocacion || "sin máquina"}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Código / referencia
                    <input
                      value={camposRepuesto.codigo}
                      onChange={(e) => setCamposRepuesto((c) => ({ ...c, codigo: e.target.value }))}
                      placeholder="Opcional"
                    />
                  </label>
                  <label>
                    Cantidad *
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      required
                      value={camposRepuesto.cantidad}
                      onChange={(e) => setCamposRepuesto((c) => ({ ...c, cantidad: e.target.value }))}
                    />
                  </label>
                  <label>
                    Estado
                    <select
                      value={camposRepuesto.estado}
                      onChange={(e) =>
                        setCamposRepuesto((c) => ({
                          ...c,
                          estado: e.target.value as EstadoRepuesto,
                        }))
                      }
                    >
                      {ESTADOS_REPUESTO.map((estado) => (
                        <option key={estado} value={estado}>
                          {ETIQUETAS_ESTADO_REPUESTO[estado]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Fecha necesaria
                    <input
                      type="date"
                      value={camposRepuesto.fecha_necesaria}
                      onChange={(e) =>
                        setCamposRepuesto((c) => ({ ...c, fecha_necesaria: e.target.value }))
                      }
                    />
                  </label>
                  <label className="repuesto-form__completa">
                    Descripción *
                    <textarea
                      required
                      rows={2}
                      value={camposRepuesto.descripcion}
                      onChange={(e) =>
                        setCamposRepuesto((c) => ({ ...c, descripcion: e.target.value }))
                      }
                    />
                  </label>
                  <label className="repuesto-form__completa">
                    Notas
                    <textarea
                      rows={2}
                      value={camposRepuesto.notas}
                      onChange={(e) => setCamposRepuesto((c) => ({ ...c, notas: e.target.value }))}
                    />
                  </label>
                </div>
                <div className="repuesto-form__acciones">
                  <button type="submit" className="btn btn--primario" disabled={guardando}>
                    {guardando ? "Guardando..." : editandoRepuestoId ? "Guardar cambios" : "Registrar"}
                  </button>
                  {editandoRepuestoId && (
                    <button type="button" className="btn" onClick={cancelarEdicionRepuesto}>
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            )}
          </SoloConPermiso>

          {!puedeEscribirArea && !faltaTablaRepuestos && (
            <p className="solicitudes__descripcion">
              Solo consulta en esta área. Los repuestos se gestionan en tu área asignada.
            </p>
          )}
          {puedeEscribirArea && !puede("crear.repuestos") && !faltaTablaRepuestos && (
            <p className="solicitudes__descripcion">Modo consulta: solo puedes ver repuestos.</p>
          )}

          {faltaTablaRepuestos ? null : repuestosArea.length === 0 ? (
            <p className="solicitudes__vacio">No hay repuestos registrados para esta área.</p>
          ) : (
            <div className="repuestos__tabla-contenedor">
              <table className="repuestos__tabla">
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th>Máquina</th>
                    <th>Cant.</th>
                    <th>Estado</th>
                    <th>Fecha nec.</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {repuestosArea.map((repuesto) => {
                    const maquina = repuesto.hoja_id
                      ? mapaMaquinas.get(repuesto.hoja_id)
                      : undefined;
                    return (
                      <tr key={repuesto.id}>
                        <td>
                          {repuesto.descripcion}
                          {repuesto.codigo && (
                            <span className="solicitud-item__meta"> · {repuesto.codigo}</span>
                          )}
                        </td>
                        <td>
                          {maquina
                            ? `${maquina.codigo ? `${maquina.codigo} — ` : ""}${maquina.nombre}`
                            : "—"}
                        </td>
                        <td>{repuesto.cantidad}</td>
                        <td>
                          <span className={`estado-repuesto estado-repuesto--${repuesto.estado}`}>
                            {ETIQUETAS_ESTADO_REPUESTO[repuesto.estado]}
                          </span>
                        </td>
                        <td>{repuesto.fecha_necesaria?.slice(0, 10) ?? "—"}</td>
                        <td>
                          {puedeEscribirArea && (
                            <SoloConPermiso permiso="crear.repuestos">
                              <button
                                type="button"
                                className="btn"
                                onClick={() => iniciarEdicionRepuesto(repuesto)}
                              >
                                Editar
                              </button>
                            </SoloConPermiso>
                          )}
                          <SoloConPermiso permiso="eliminar.registros">
                            <button
                              type="button"
                              className="btn"
                              onClick={() => void manejarEliminarRepuesto(repuesto)}
                            >
                              Eliminar
                            </button>
                          </SoloConPermiso>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default SolicitudesAreaPage;
