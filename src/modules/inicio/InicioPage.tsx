import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import CargaPantalla from "../../components/CargaPantalla";
import { AREAS_CON_PM } from "../../lib/areas";
import { NOMBRES_MESES } from "../../lib/fechas";
import { useAuth } from "../auth/AuthContext";
import { listarUsuariosPortal } from "../auth/usuariosService";
import { listarCorrectivo } from "../correctivo/correctivoService";
import type { RegistroCorrectivo } from "../correctivo/types";
import { listarExcepciones } from "../cronograma/cronogramaService";
import type { ExcepcionCronograma } from "../cronograma/types";
import { listarHojas } from "../hojas/hojasService";
import type { HojaVida } from "../hojas/types";
import { listarPersonalActivo } from "../personal/personalService";
import {
  existeTablaAsignacionesPm,
  guardarAsignacionesPm,
  listarAsignacionesPm,
  operariosAsignables,
  quitarAsignacionPm,
} from "../preventivo/asignacionPmService";
import type { AsignacionPm } from "../preventivo/asignacionPmTypes";
import { mapaAsignacionesPorClave } from "../preventivo/asignacionPmClave";
import { obtenerMisPmPendientes, resumirMisPm } from "../preventivo/pmAsignadosService";
import { listarPreventivo } from "../preventivo/preventivoService";
import type { RegistroPreventivo } from "../preventivo/types";
import {
  existeTablaAsignacionesCorrectivo,
  listarAsignacionesPorPersonal,
} from "../solicitudes/asignacionCorrectivoService";
import MisSolicitudesPanel from "../solicitudes/MisSolicitudesPanel";
import BandejaTomarPanel from "../solicitudes/BandejaTomarPanel";
import { solicitudAbierta } from "../solicitudes/solicitudesCalculo";
import CitaPmItem from "./CitaPmItem";
import { construirDatosArea } from "./inicioDatosArea";
import MisPmPanel from "./MisPmPanel";
import {
  contarPmSinAsignar,
  fechaProgramadaDeCita,
  listarMisPmPendientes,
  type MisPmItem,
} from "./inicioMisPm";
import "./inicio.css";

function InicioPage() {
  const { puede, esAdmin, perfil, cargando: cargandoAuth } = useAuth();
  const puedeModificarPm = puede("crear.preventivo");
  const anioActual = new Date().getFullYear();
  const mesActual = new Date().getMonth() + 1;
  const ubicacion = useLocation();
  const esOperario = perfil?.rol === "operador";
  const mostrarCronogramaCompleto = !esOperario;
  const [anio, setAnio] = useState(anioActual);
  const [maquinas, setMaquinas] = useState<HojaVida[]>([]);
  const [excepciones, setExcepciones] = useState<ExcepcionCronograma[]>([]);
  const [preventivo, setPreventivo] = useState<RegistroPreventivo[]>([]);
  const [asignaciones, setAsignaciones] = useState<AsignacionPm[]>([]);
  const [usuarios, setUsuarios] = useState<Awaited<ReturnType<typeof listarUsuariosPortal>>>([]);
  const [personal, setPersonal] = useState<Awaited<ReturnType<typeof listarPersonalActivo>>>([]);
  const [asignacionesDisponibles, setAsignacionesDisponibles] = useState(false);
  const [misSolicitudes, setMisSolicitudes] = useState<RegistroCorrectivo[]>([]);
  const [misPmOperario, setMisPmOperario] = useState<MisPmItem[]>([]);
  const [guardandoAsignacion, setGuardandoAsignacion] = useState(false);
  const [cargandoCronograma, setCargandoCronograma] = useState(true);
  const [cargandoOperario, setCargandoOperario] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarMisSolicitudes = useCallback(async (personalId: string) => {
    const hay = await existeTablaAsignacionesCorrectivo().catch(() => false);
    if (!hay) return [] as RegistroCorrectivo[];
    const [regs, asigs] = await Promise.all([
      listarCorrectivo(),
      listarAsignacionesPorPersonal(personalId),
    ]);
    const ids = new Set(asigs.map((a) => a.correctivo_id));
    return regs.filter((r) => ids.has(r.id) && solicitudAbierta(r));
  }, []);

  const recargarDatosOperario = useCallback(async () => {
    if (!perfil) return;
    setCargandoOperario(true);
    setError(null);
    try {
      const okPm = await existeTablaAsignacionesPm().catch(() => false);
      setAsignacionesDisponibles(okPm);
      if (perfil.personal_id) {
        const [pm, sols] = await Promise.all([
          okPm ? obtenerMisPmPendientes(perfil.personal_id, anio) : Promise.resolve([]),
          cargarMisSolicitudes(perfil.personal_id),
        ]);
        setMisPmOperario(pm);
        setMisSolicitudes(sols);
      } else {
        setMisPmOperario([]);
        setMisSolicitudes([]);
      }
    } catch (e) {
      setError("No se pudieron cargar tus tareas: " + (e as Error).message);
    } finally {
      setCargandoOperario(false);
    }
  }, [anio, cargarMisSolicitudes, perfil]);

  const recargarDatosCompleto = useCallback(async () => {
    setCargandoCronograma(true);
    setError(null);
    try {
      const [hojas, excs, prev, pers, usrs, asigs, sols] = await Promise.all([
        listarHojas(),
        listarExcepciones(),
        listarPreventivo(),
        listarPersonalActivo(),
        esAdmin ? listarUsuariosPortal() : Promise.resolve([]),
        existeTablaAsignacionesPm()
          .then((ok) => (ok ? listarAsignacionesPm(anio) : []))
          .catch(() => [] as AsignacionPm[]),
        perfil?.personal_id
          ? cargarMisSolicitudes(perfil.personal_id).catch(() => [] as RegistroCorrectivo[])
          : Promise.resolve([] as RegistroCorrectivo[]),
      ]);
      setMaquinas(hojas);
      setExcepciones(excs);
      setPreventivo(prev);
      setPersonal(pers);
      setUsuarios(usrs);
      setAsignaciones(asigs);
      setMisSolicitudes(sols);
      const ok = await existeTablaAsignacionesPm().catch(() => false);
      setAsignacionesDisponibles(ok);
    } catch (e) {
      setError("No se pudieron cargar los datos: " + (e as Error).message);
    } finally {
      setCargandoCronograma(false);
    }
  }, [anio, cargarMisSolicitudes, esAdmin, perfil?.personal_id]);

  const recargarDatos = useCallback(() => {
    if (esOperario) {
      void recargarDatosOperario();
      return;
    }
    void recargarDatosCompleto();
  }, [esOperario, recargarDatosCompleto, recargarDatosOperario]);

  useEffect(() => {
    if (cargandoAuth || !perfil) return;
    recargarDatos();
  }, [cargandoAuth, perfil, ubicacion.key, recargarDatos]);

  const datosPorArea = useMemo(() => {
    if (esOperario) return [];
    return AREAS_CON_PM.map((area) =>
      construirDatosArea(area, anio, maquinas, excepciones, preventivo),
    );
  }, [anio, esOperario, maquinas, excepciones, preventivo]);

  const mapaAsignaciones = useMemo(
    () => mapaAsignacionesPorClave(asignaciones),
    [asignaciones],
  );

  const mapaNombresPersonal = useMemo(
    () => new Map(personal.map((p) => [p.id, p.nombre])),
    [personal],
  );

  const operarios = useMemo(
    () => operariosAsignables(usuarios, personal),
    [usuarios, personal],
  );

  const sinAsignar = useMemo(
    () => (asignacionesDisponibles ? contarPmSinAsignar(datosPorArea, anio, asignaciones) : 0),
    [asignacionesDisponibles, datosPorArea, anio, asignaciones],
  );

  const misPm = useMemo(() => {
    if (esOperario) return misPmOperario;
    if (!perfil?.personal_id || !asignacionesDisponibles) return [];
    return listarMisPmPendientes(
      datosPorArea,
      anio,
      perfil.personal_id,
      asignaciones,
      mapaNombresPersonal,
    );
  }, [
    esOperario,
    misPmOperario,
    perfil?.personal_id,
    asignacionesDisponibles,
    datosPorArea,
    anio,
    asignaciones,
    mapaNombresPersonal,
  ]);

  const resumenMisPm = useMemo(() => resumirMisPm(misPm), [misPm]);
  const cargandoMisPm = esOperario ? cargandoOperario : cargandoCronograma;

  async function manejarAsignacion(
    hojaId: string,
    area: string,
    fechaProgramada: string,
    personalIds: string[],
  ) {
    if (!esAdmin || !asignacionesDisponibles) return;
    setGuardandoAsignacion(true);
    setError(null);
    try {
      if (personalIds.length === 0) {
        await quitarAsignacionPm(hojaId, fechaProgramada);
        setAsignaciones((prev) =>
          prev.filter(
            (a) => !(a.hoja_id === hojaId && a.fecha_programada === fechaProgramada),
          ),
        );
      } else {
        const guardadas = await guardarAsignacionesPm(
          hojaId,
          area,
          fechaProgramada,
          personalIds,
        );
        setAsignaciones((prev) => {
          const resto = prev.filter(
            (a) => !(a.hoja_id === hojaId && a.fecha_programada === fechaProgramada),
          );
          return [...resto, ...guardadas];
        });
      }
    } catch (e) {
      setError("No se pudo guardar la asignación: " + (e as Error).message);
    } finally {
      setGuardandoAsignacion(false);
    }
  }

  const verMisPm = Boolean(
    perfil?.personal_id && (perfil.rol === "operador" || perfil.rol === "admin"),
  );
  const verMisSolicitudes = Boolean(
    perfil?.personal_id && (perfil.rol === "operador" || perfil.rol === "admin"),
  );

  if (cargandoAuth || !perfil) {
    return <CargaPantalla mensaje="Preparando inicio..." />;
  }

  return (
    <section className={"inicio" + (esOperario ? " inicio--operario" : "")}>
      <div className="inicio__cabecera">
        <div>
          <h1>
            {esOperario ? "Mis tareas asignadas" : "Panel de mantenimiento preventivo"}
          </h1>
          <p className="inicio__descripcion">
            {esOperario ? (
              <>
                Aquí ves tus preventivos y las solicitudes que tomaste. En Solicitudes del
                área usa la bandeja y pulsa <strong>Tomar</strong>.
              </>
            ) : puedeModificarPm ? (
              <>
                Programación anual por área. Asigna uno o varios operarios a cada cita.
                Para reprogramar, usa el <Link to="/preventivo/cronograma">calendario</Link>.
              </>
            ) : (
              <>Programación anual por área (solo consulta).</>
            )}
          </p>
          {esAdmin && asignacionesDisponibles && sinAsignar > 0 && (
            <p className="inicio__aviso-asignacion">
              {sinAsignar} PM pendiente(s) sin operario asignado en {anio}.
            </p>
          )}
          {esAdmin && !asignacionesDisponibles && (
            <p className="inicio__aviso-asignacion inicio__aviso-asignacion--sql">
              Para asignar operarios, ejecuta en Supabase el SQL{" "}
              <code>supabase/migrations/preventivo_asignaciones.sql</code>
              {" "}y luego{" "}
              <code>preventivo_asignaciones_multi.sql</code>.
            </p>
          )}
          {mostrarCronogramaCompleto && (
            <div className="inicio__leyenda">
              <span className="inicio__leyenda-item inicio__leyenda-item--completada">Hecho</span>
              <span className="inicio__leyenda-item inicio__leyenda-item--programada">Programado</span>
              <span className="inicio__leyenda-item inicio__leyenda-item--no-realizado">No realizado</span>
              <span className="inicio__leyenda-item inicio__leyenda-item--reprogramada">Reprogramado</span>
              <span className="inicio__leyenda-item inicio__leyenda-item--vencida">Vencido (activa)</span>
              <span className="inicio__leyenda-item inicio__leyenda-item--de-baja">De baja</span>
            </div>
          )}
        </div>
        {mostrarCronogramaCompleto && (
          <div className="inicio__anio">
            <button className="btn" onClick={() => setAnio(anio - 1)}>←</button>
            <span>{anio}</span>
            <button className="btn" onClick={() => setAnio(anio + 1)}>→</button>
          </div>
        )}
      </div>

      {error && <p className="inicio__error">{error}</p>}

      {esOperario && <BandejaTomarPanel onTomada={recargarDatos} />}

      {verMisSolicitudes && (
        <MisSolicitudesPanel
          items={misSolicitudes}
          personalId={perfil?.personal_id ?? null}
          modoPrincipal={esOperario}
          onDevuelta={recargarDatos}
          onAtendida={recargarDatos}
        />
      )}

      {verMisPm && (
        <MisPmPanel
          items={misPm}
          resumen={resumenMisPm}
          cargando={cargandoMisPm}
          modoPrincipal={esOperario}
        />
      )}

      {esOperario && !cargandoOperario && !perfil?.personal_id && (
        <div className="mis-tareas__vacio">
          <strong>Tu usuario no está vinculado a un técnico</strong>
          <p>
            Pide al administrador que te asigne un técnico en Usuarios del portal para
            ver tus PM y solicitudes.
          </p>
        </div>
      )}

      {mostrarCronogramaCompleto && (
      <div className="inicio__areas">
        {cargandoCronograma ? (
          <CargaPantalla mensaje="Cargando cronograma..." />
        ) : (
          datosPorArea.map((datos) => (
            <article key={datos.area} className="area-card">
              <div className="area-card__cabecera">
                <h3>{datos.area}</h3>
                <div className="area-card__stats">
                  <span className="chip">{datos.totalMaquinas} máquina(s)</span>
                  <span className="chip">{datos.maquinasActivas} activa(s)</span>
                  <span className="chip chip--pm">{datos.totalCitas} PM en {anio}</span>
                  {datos.citasCompletadas > 0 && (
                    <span className="chip chip--ok">{datos.citasCompletadas} registrado(s)</span>
                  )}
                </div>
              </div>

              {datos.totalMaquinas === 0 ? (
                <p className="area-card__vacio">
                  Registra equipos en <Link to="/hojas-de-vida">Hojas de vida</Link> con
                  área {datos.area}, primer PM y frecuencia en meses.
                </p>
              ) : (
                <>
                  <p className="area-card__proximo">
                    {datos.proximaCita ? (
                      <>
                        <strong>Próximo PM:</strong> {datos.proximaCita.nombre} (
                        {datos.proximaCita.codigo}) — {datos.proximaCita.dia}{" "}
                        {NOMBRES_MESES[datos.proximaCita.mes - 1]} {anio}
                      </>
                    ) : (
                      <>
                        <strong>{anio}:</strong> no hay PM pendientes a futuro en esta área.
                      </>
                    )}
                  </p>

                  {datos.porMes.length === 0 ? (
                    <p className="area-card__vacio">
                      Hay máquinas pero ningún PM calculado para {anio}. Revisa primer
                      PM, frecuencia y que la máquina esté activa.
                    </p>
                  ) : (
                    <div className="area-card__meses">
                      {datos.porMes.map((bloque) => (
                        <div
                          key={bloque.mes}
                          className={
                            "mes-bloque" +
                            (anio === anioActual && bloque.mes === mesActual
                              ? " mes-bloque--actual"
                              : "") +
                            (bloque.completadas === bloque.citas.length && bloque.citas.length > 0
                              ? " mes-bloque--todo-cumplido"
                              : "")
                          }
                        >
                          <div className="mes-bloque__titulo">
                            <span>{NOMBRES_MESES[bloque.mes - 1]}</span>
                            <span>{bloque.completadas}/{bloque.citas.length} hecho(s)</span>
                          </div>
                          <ul>
                            {bloque.citas.map((cita) => {
                              const fechaProgramada = fechaProgramadaDeCita(
                                anio,
                                bloque.mes,
                                cita.dia,
                                cita.reprogramadoA,
                              );
                              const asignacionesCita = mapaAsignaciones.get(
                                `${cita.maquinaId}|${fechaProgramada}`,
                              );
                              return (
                                <CitaPmItem
                                  key={`${cita.maquinaId}-${fechaProgramada}`}
                                  maquinaId={cita.maquinaId}
                                  nombre={cita.nombre}
                                  codigo={cita.codigo}
                                  frecuencia={cita.frecuencia}
                                  dia={cita.dia}
                                  mes={bloque.mes}
                                  anio={anio}
                                  area={datos.area}
                                  estado={cita.estado}
                                  reprogramadoA={cita.reprogramadoA}
                                  fechaProgramada={fechaProgramada}
                                  asignaciones={asignacionesCita}
                                  operarios={operarios}
                                  mapaNombres={mapaNombresPersonal}
                                  puedeModificarPm={puedeModificarPm}
                                  puedeAsignar={esAdmin && asignacionesDisponibles}
                                  guardandoAsignacion={guardandoAsignacion}
                                  onAsignar={(personalIds) =>
                                    void manejarAsignacion(
                                      cita.maquinaId,
                                      datos.area,
                                      fechaProgramada,
                                      personalIds,
                                    )
                                  }
                                />
                              );
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              <div className="area-card__pie">
                {puedeModificarPm && (
                  <>
                    <Link className="btn" to="/preventivo/cronograma">
                      Ver calendario
                    </Link>
                    <Link className="btn btn--primario" to="/preventivo">
                      Registrar PM
                    </Link>
                  </>
                )}
              </div>
            </article>
          ))
        )}
      </div>
      )}
    </section>
  );
}

export default InicioPage;
