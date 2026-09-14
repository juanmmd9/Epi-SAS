import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ContadorListaMensual, etiquetaPeriodoContador } from "../../components/ContadorListaMensual";
import { useAuth } from "../auth/AuthContext";
import { SoloConPermiso } from "../auth/SoloConPermiso";
import { listarUsuariosPortal } from "../auth/usuariosService";
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
import { listarPersonalActivo } from "../personal/personalService";
import {
  existeTablaAsignacionesCorrectivo,
  listarAsignacionesCorrectivo,
  mapaAsignacionesPorCorrectivo,
  operariosParaAsignarSolicitud,
  tomarSolicitud,
} from "./asignacionCorrectivoService";
import type { AsignacionCorrectivo } from "./asignacionCorrectivoTypes";
import BandejaTomarPanel from "./BandejaTomarPanel";
import SolicitudEditarModal from "./SolicitudEditarModal";
import SolicitudGestionCard from "./SolicitudGestionCard";
import { marcarEsperaYPausarCronometro } from "./cronometroAcciones";
import NuevaSolicitudAreaForm from "./NuevaSolicitudAreaForm";
import SelectorAsignacionSolicitud from "./SelectorAsignacionSolicitud";
import { useSolicitudesRealtime } from "./useSolicitudesRealtime";
import {
  actualizarRepuesto,
  crearRepuesto,
  eliminarRepuesto,
  existeTablaRepuestos,
  listarRepuestos,
} from "./repuestosService";
import {
  repuestoPendiente,
  solicitudAbierta,
  solicitudCerradaEnMes,
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

type VistaArea = "bandeja" | "curso" | "espera" | "cerradas" | "historial" | "repuestos";

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

function SolicitudesAreaPage({
  areaIncrustada,
  modoIncrustado = false,
}: {
  areaIncrustada?: string;
  modoIncrustado?: boolean;
} = {}) {
  const { area: areaParam } = useParams<{ area: string }>();
  const area = areaIncrustada ?? (areaParam ? decodeURIComponent(areaParam) : "");
  const areaValida = esAreaValida(area);
  const navegar = useNavigate();
  const { perfil, puede, esAdmin } = useAuth();

  const [vistaActiva, setVistaActiva] = useState<VistaArea>(() =>
    modoIncrustado || perfil?.rol === "admin" ? "curso" : "bandeja",
  );
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [editandoSolicitudId, setEditandoSolicitudId] = useState<string | null>(null);
  const [correctivos, setCorrectivos] = useState<RegistroCorrectivo[]>([]);
  const [repuestos, setRepuestos] = useState<RepuestoSolicitud[]>([]);
  const [maquinas, setMaquinas] = useState<HojaVida[]>([]);
  const [asignaciones, setAsignaciones] = useState<AsignacionCorrectivo[]>([]);
  const [asignacionesOk, setAsignacionesOk] = useState(false);
  const [usuarios, setUsuarios] = useState<Awaited<ReturnType<typeof listarUsuariosPortal>>>([]);
  const [personal, setPersonal] = useState<Awaited<ReturnType<typeof listarPersonalActivo>>>([]);
  const [cargando, setCargando] = useState(true);
  const [faltaTablaRepuestos, setFaltaTablaRepuestos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [editandoRepuestoId, setEditandoRepuestoId] = useState<string | null>(null);
  const [camposRepuesto, setCamposRepuesto] = useState(formularioRepuestoVacio);
  const [accionId, setAccionId] = useState<string | null>(null);
  const [contadorMes, setContadorMes] = useState(() => new Date().getMonth() + 1);
  const [contadorAnio, setContadorAnio] = useState(() => new Date().getFullYear());
  const [criterioContador, setCriterioContador] =
    useState<CriterioFechaCorrectivo>("solicitud");
  const [filtroContador, setFiltroContador] = useState<FiltroEstadoCorrectivoMes | null>(null);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [regs, hojas, hayTabla, hayAsig] = await Promise.all([
        listarCorrectivo(),
        listarHojas(),
        existeTablaRepuestos(),
        existeTablaAsignacionesCorrectivo().catch(() => false),
      ]);
      setCorrectivos(regs);
      setMaquinas(hojas);
      setFaltaTablaRepuestos(!hayTabla);
      setAsignacionesOk(hayAsig);
      if (hayTabla) {
        setRepuestos(await listarRepuestos());
      } else {
        setRepuestos([]);
      }
      const [pers, usrs, asigs] = await Promise.all([
        listarPersonalActivo(),
        esAdmin ? listarUsuariosPortal() : Promise.resolve([]),
        hayAsig ? listarAsignacionesCorrectivo() : Promise.resolve([] as AsignacionCorrectivo[]),
      ]);
      setPersonal(pers);
      setUsuarios(usrs);
      setAsignaciones(asigs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setCargando(false);
    }
  }, [esAdmin]);

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

  const mapaAsignaciones = useMemo(
    () => mapaAsignacionesPorCorrectivo(asignaciones),
    [asignaciones],
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
    return ordenarRegistrosCorrectivo(correctivosDelAreaSinFiltro);
  }, [
    correctivosDelAreaSinFiltro,
    filtroContador,
    contadorAnio,
    contadorMes,
    criterioContador,
  ]);

  const listaVista = useMemo(() => {
    const abiertas = correctivosDelAreaSinFiltro.filter(solicitudAbierta);
    switch (vistaActiva) {
      case "bandeja":
        return ordenarRegistrosCorrectivo(
          abiertas.filter((r) => !(mapaAsignaciones.get(r.id)?.length)),
        );
      case "curso":
        return ordenarRegistrosCorrectivo(
          abiertas.filter(
            (r) =>
              (mapaAsignaciones.get(r.id)?.length ?? 0) > 0 &&
              !solicitudEsperaRepuesto(r),
          ),
        );
      case "espera":
        return ordenarRegistrosCorrectivo(abiertas.filter(solicitudEsperaRepuesto));
      case "cerradas": {
        const anio = new Date().getFullYear();
        const mes = new Date().getMonth() + 1;
        return ordenarRegistrosCorrectivo(
          correctivosDelAreaSinFiltro.filter((r) =>
            Boolean(r.datos.fechaCierre?.trim()) &&
            solicitudCerradaEnMes(r, anio, mes),
          ),
        );
      }
      case "historial":
        return correctivosArea;
      default:
        return [];
    }
  }, [
    vistaActiva,
    correctivosDelAreaSinFiltro,
    mapaAsignaciones,
    correctivosArea,
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

  const puedeVerCorrectivo = puede("ver.correctivo");
  const esOperario = perfil?.rol === "operador";

  const mapaNombresPersonal = useMemo(
    () => new Map(personal.map((p) => [p.id, p.nombre])),
    [personal],
  );

  const operariosAsignables = useMemo(
    () => operariosParaAsignarSolicitud(usuarios, personal),
    [usuarios, personal],
  );

  const conteosVista = useMemo(() => {
    const abiertas = correctivosDelAreaSinFiltro.filter(solicitudAbierta);
    const anio = new Date().getFullYear();
    const mes = new Date().getMonth() + 1;
    return {
      bandeja: abiertas.filter((r) => !(mapaAsignaciones.get(r.id)?.length)).length,
      curso: abiertas.filter(
        (r) =>
          (mapaAsignaciones.get(r.id)?.length ?? 0) > 0 && !solicitudEsperaRepuesto(r),
      ).length,
      espera: abiertas.filter(solicitudEsperaRepuesto).length,
      cerradas: correctivosDelAreaSinFiltro.filter((r) =>
        solicitudCerradaEnMes(r, anio, mes),
      ).length,
      repuestos: repuestosArea.filter(repuestoPendiente).length,
    };
  }, [correctivosDelAreaSinFiltro, mapaAsignaciones, repuestosArea]);

  function alActualizarAsignacion(correctivoId: string, filas: AsignacionCorrectivo[]) {
    setAsignaciones((prev) => {
      const resto = prev.filter((a) => a.correctivo_id !== correctivoId);
      return [...resto, ...filas];
    });
    void listarCorrectivo()
      .then(setCorrectivos)
      .catch(() => undefined);
  }

  async function manejarTomar(correctivoId: string) {
    if (!perfil?.personal_id) {
      setError("Tu usuario no está vinculado a un técnico.");
      return;
    }
    setAccionId(correctivoId);
    setError(null);
    try {
      const { asignaciones: filas } = await tomarSolicitud(correctivoId, perfil.personal_id);
      alActualizarAsignacion(correctivoId, filas);
      setMensaje("Solicitud tomada. El cronómetro ya corre.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAccionId(null);
    }
  }

  const alNuevaSolicitudRealtime = useCallback((registro: RegistroCorrectivo) => {
    setCorrectivos((prev) => {
      if (prev.some((r) => r.id === registro.id)) return prev;
      return ordenarRegistrosCorrectivo([registro, ...prev]);
    });
    setVistaActiva("bandeja");
    setMensaje(`Nueva solicitud #${registro.datos.numeroSolicitud} recibida.`);
    if (asignacionesOk) {
      void listarAsignacionesCorrectivo()
        .then(setAsignaciones)
        .catch(() => undefined);
    }
  }, [asignacionesOk]);

  const {
    idsDestacados,
    marcarConocido,
  } = useSolicitudesRealtime({
    areaFiltro: areaValida ? area : undefined,
    correctivos,
    onNuevaSolicitud: alNuevaSolicitudRealtime,
    habilitado: areaValida && !cargando,
    modo: "solo-lista",
  });

  const alCrearSolicitud = useCallback(
    (registro: RegistroCorrectivo) => {
      marcarConocido(registro.id);
      setCorrectivos((prev) => ordenarRegistrosCorrectivo([registro, ...prev]));
      setVistaActiva("bandeja");
      if (asignacionesOk) {
        window.setTimeout(() => {
          void listarAsignacionesCorrectivo()
            .then(setAsignaciones)
            .catch(() => undefined);
        }, 500);
      }
    },
    [marcarConocido, asignacionesOk],
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
    setVistaActiva("repuestos");
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
        if (input.correctivo_id && repuestoPendiente(creado)) {
          await marcarEsperaYPausarCronometro(input.correctivo_id);
          setCorrectivos((prev) =>
            prev.map((r) =>
              r.id === input.correctivo_id
                ? {
                    ...r,
                    datos: {
                      ...r.datos,
                      esperaRepuesto: true,
                      cronometro: {
                        estado: "paused",
                        segmentoInicio: null,
                        acumuladoSeg: r.datos.cronometro?.acumuladoSeg ?? 0,
                      },
                    },
                  }
                : r,
            ),
          );
          setMensaje("Repuesto registrado. Cronómetro de la solicitud pausado.");
        } else {
          setMensaje("Repuesto registrado.");
        }
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
  const puedeEliminar = puede("eliminar.registros");
  const solicitudEditando = editandoSolicitudId
    ? correctivos.find((r) => r.id === editandoSolicitudId) ?? null
    : null;

  const VISTAS_NAV: Array<{ key: VistaArea; etiqueta: string; conteo: number }> = [
    { key: "bandeja", etiqueta: "Bandeja", conteo: conteosVista.bandeja },
    { key: "curso", etiqueta: "En curso", conteo: conteosVista.curso },
    { key: "espera", etiqueta: "Espera repuesto", conteo: conteosVista.espera },
    { key: "cerradas", etiqueta: "Cerradas mes", conteo: conteosVista.cerradas },
    { key: "historial", etiqueta: "Historial", conteo: correctivosDelAreaSinFiltro.length },
    { key: "repuestos", etiqueta: "Repuestos", conteo: conteosVista.repuestos },
  ];

  function actualizarSolicitudLocal(actualizado: RegistroCorrectivo) {
    setCorrectivos((prev) =>
      ordenarRegistrosCorrectivo(
        prev.map((r) => (r.id === actualizado.id ? actualizado : r)),
      ),
    );
    setMensaje(`Solicitud #${actualizado.datos.numeroSolicitud} actualizada.`);
  }

  function eliminarSolicitudLocal(id: string) {
    setCorrectivos((prev) => prev.filter((r) => r.id !== id));
    setMensaje("Solicitud eliminada.");
  }

  function renderTarjetas(lista: RegistroCorrectivo[]) {
    if (lista.length === 0) {
      return <p className="solicitudes__vacio">No hay solicitudes en esta sección.</p>;
    }
    return (
      <div className="sol-gestion-grid">
        {lista.map((registro) => {
          const asigs = mapaAsignaciones.get(registro.id) ?? [];
          const nombresAsig = asigs.map(
            (a) => mapaNombresPersonal.get(a.personal_id) ?? "Técnico",
          );
          const cerrada = Boolean(registro.datos.fechaCierre?.trim());
          const libre = asigs.length === 0;
          const puedeTomar =
            asignacionesOk &&
            !cerrada &&
            libre &&
            Boolean(perfil?.personal_id) &&
            (esOperario || esAdmin);

          return (
            <SolicitudGestionCard
              key={registro.id}
              registro={registro}
              asignados={nombresAsig}
              destacada={idsDestacados.has(registro.id)}
              acciones={
                <>
                  {puedeTomar && (
                    <button
                      type="button"
                      className="btn bandeja-tomar__btn"
                      disabled={accionId === registro.id}
                      onClick={() => void manejarTomar(registro.id)}
                    >
                      {accionId === registro.id ? "Tomando…" : "TOMAR"}
                    </button>
                  )}
                  {asignacionesOk && (
                    <SelectorAsignacionSolicitud
                      correctivoId={registro.id}
                      area={registro.area}
                      asignaciones={asigs}
                      operarios={operariosAsignables}
                      mapaNombres={mapaNombresPersonal}
                      puedeEditar={esAdmin && !cerrada}
                      onActualizado={alActualizarAsignacion}
                    />
                  )}
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setEditandoSolicitudId(registro.id)}
                  >
                    Editar
                  </button>
                  {puedeVerCorrectivo && (
                    <button
                      type="button"
                      className="btn btn--primario"
                      onClick={() => irACorrectivo(registro)}
                    >
                      Correctivo
                    </button>
                  )}
                </>
              }
            />
          );
        })}
      </div>
    );
  }

  if (cargando) {
    if (modoIncrustado) {
      return (
        <div className="solicitudes-area solicitudes-area--incrustada">
          <p className="solicitudes__descripcion">Cargando {area}…</p>
        </div>
      );
    }
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
    <section className={"solicitudes solicitudes-area" + (modoIncrustado ? " solicitudes-area--incrustada" : "")}>
      {!modoIncrustado && (
        <Link to="/solicitudes" className="solicitudes-area__volver">
          ← Volver al tablero de áreas
        </Link>
      )}

      <header className="sol-area-header">
        <div>
          <h1>{area}</h1>
          <p className="solicitudes__descripcion">
            Control de solicitudes, tiempos y repuestos del área.
            {puedeVerCorrectivo && (
              <>
                {" "}
                <Link to="/correctivo">Mantenimiento correctivo</Link>
              </>
            )}
          </p>
        </div>
        {puedeEscribirArea && (
          <button
            type="button"
            className="btn btn--primario"
            onClick={() => setMostrarNueva((v) => !v)}
          >
            {mostrarNueva ? "Ocultar formulario" : "+ Nueva solicitud"}
          </button>
        )}
      </header>

      {mostrarNueva && puedeEscribirArea && (
        <div className="sol-area-panel">
          <NuevaSolicitudAreaForm
            area={normalizarArea(area)}
            nombreSolicitante={perfil?.nombre || perfil?.email || ""}
            maquinas={maquinas}
            correctivos={correctivos}
            onCreada={(r) => {
              alCrearSolicitud(r);
              setMostrarNueva(false);
            }}
          />
        </div>
      )}

      {!puedeEscribirArea && (
        <p className="solicitudes__mensaje">
          Tu perfil es de solo consulta en esta área.
        </p>
      )}

      {error && <p className="solicitudes__error">{error}</p>}
      {mensaje && <p className="solicitudes__mensaje solicitudes__mensaje--ok">{mensaje}</p>}

      <nav className="sol-area-nav" aria-label="Secciones del área">
        {VISTAS_NAV.map(({ key, etiqueta, conteo }) => (
          <button
            key={key}
            type="button"
            className={
              "sol-area-nav__item" +
              (vistaActiva === key ? " sol-area-nav__item--activa" : "") +
              (key === "bandeja" && conteo > 0 ? " sol-area-nav__item--alerta" : "") +
              (key === "espera" && conteo > 0 ? " sol-area-nav__item--espera" : "")
            }
            onClick={() => {
              setVistaActiva(key);
              if (key !== "historial") setFiltroContador(null);
            }}
          >
            <span>{etiqueta}</span>
            <strong>{conteo}</strong>
          </button>
        ))}
      </nav>

      <div className="sol-area-contenido">
        {vistaActiva === "bandeja" && (
          <>
            {esAdmin && !asignacionesOk && (
              <aside className="aviso-setup-solicitudes">
                <h3>Bandeja y asignación</h3>
                <p>
                  Ejecuta <code>correctivo_asignaciones.sql</code> y{" "}
                  <code>correctivo_bandeja_claim.sql</code> en Supabase.
                </p>
              </aside>
            )}
            {(esOperario || esAdmin) && (
              <BandejaTomarPanel
                areaFiltro={area}
                onTomada={() => void recargar()}
              />
            )}
            {listaVista.length > 0 && (
              <section className="sol-area-seccion">
                <h2 className="sol-area-seccion__titulo">Libres en lista</h2>
                {renderTarjetas(listaVista)}
              </section>
            )}
          </>
        )}

        {vistaActiva === "curso" && (
          <section className="sol-area-seccion">
            <h2 className="sol-area-seccion__titulo">Asignadas y en atención</h2>
            <p className="sol-area-seccion__hint">
              Cronómetro activo según horario laboral. Usa Editar para cerrar o pausar.
            </p>
            {renderTarjetas(listaVista)}
          </section>
        )}

        {vistaActiva === "espera" && (
          <section className="sol-area-seccion">
            <h2 className="sol-area-seccion__titulo">En espera de repuesto</h2>
            <p className="sol-area-seccion__hint">El tiempo está pausado hasta que llegue el repuesto.</p>
            {renderTarjetas(listaVista)}
          </section>
        )}

        {vistaActiva === "cerradas" && (
          <section className="sol-area-seccion">
            <h2 className="sol-area-seccion__titulo">Cerradas este mes</h2>
            {renderTarjetas(listaVista)}
          </section>
        )}

        {vistaActiva === "historial" && (
          <section className="sol-area-seccion">
            <h2 className="sol-area-seccion__titulo">Historial por mes</h2>
            <ContadorListaMensual
              titulo="Filtrar por periodo"
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
                { key: "abiertas", etiqueta: "Abiertas", valor: conteoMes.abiertas, tono: "alerta" },
                { key: "cerradas", etiqueta: "Cerradas", valor: conteoMes.cerradas, tono: "ok" },
                {
                  key: "espera",
                  etiqueta: "Espera repuesto",
                  valor: conteoMes.enEsperaRepuesto,
                  tono: "espera",
                },
              ]}
            />
            {filtroContador && (
              <div className="solicitudes-filtro-mes">
                <p>
                  <strong>{etiquetaFiltroContador}</strong> ·{" "}
                  {etiquetaPeriodoContador(contadorMes, contadorAnio)} ({listaVista.length})
                </p>
                <button type="button" className="btn" onClick={() => setFiltroContador(null)}>
                  Quitar filtro
                </button>
              </div>
            )}
            {renderTarjetas(filtroContador ? listaVista : correctivosArea.slice(0, 30))}
            {!filtroContador && correctivosArea.length > 30 && (
              <p className="sol-area-seccion__hint">
                Mostrando las 30 más recientes. Usa el contador del mes para filtrar.
              </p>
            )}
          </section>
        )}

        {vistaActiva === "repuestos" && (
          <section className="sol-area-seccion">
            <h2 className="sol-area-seccion__titulo">Repuestos del área</h2>
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
          </section>
        )}
      </div>

      {solicitudEditando && (
        <SolicitudEditarModal
          registro={solicitudEditando}
          puedeEliminar={puedeEliminar}
          onCerrar={() => setEditandoSolicitudId(null)}
          onActualizado={actualizarSolicitudLocal}
          onEliminado={eliminarSolicitudLocal}
        />
      )}
    </section>
  );
}

export default SolicitudesAreaPage;
