import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { SoloConPermiso } from "../auth/SoloConPermiso";
import { AREAS_SISTEMA } from "../../lib/areas";
import { borrarBorrador, guardarBorrador, leerBorrador } from "../../lib/borradorFormulario";
import { listarHojas } from "../hojas/hojasService";
import type { HojaVida } from "../hojas/types";
import { listarPersonalActivo } from "../personal/personalService";
import SelectorPersonal from "../personal/SelectorPersonal";
import {
  construirDatosPersonal,
  idsDesdeRegistroCorrectivo,
  nombresPersonalEnRegistro,
} from "../personal/personalVinculo";
import type { Persona } from "../personal/types";
import CronometroSolicitudBadge from "../solicitudes/CronometroSolicitudBadge";
import {
  marcarEsperaYPausarCronometro,
  quitarEsperaYReanudarCronometro,
  iniciarCronometroAlAtender,
} from "../solicitudes/cronometroAcciones";
import { detenerCronometroLaboral, pausarCronometroLaboral } from "../solicitudes/cronometroLaboral";
import {
  iniciarCronometro,
  leerCronometro,
  reanudarCronometro,
} from "../solicitudes/cronometroSolicitud";
import {
  actualizarCorrectivo,
  calcularTiempoRespuesta,
  crearCorrectivo,
  eliminarCorrectivo,
  exportarCsv,
  listarCorrectivo,
  ordenarRegistrosCorrectivo,
  siguienteNumeroSolicitud,
} from "./correctivoService";
import {
  contarCorrectivosMes,
  filtrarCorrectivosMes,
  type CriterioFechaCorrectivo,
  type FiltroEstadoCorrectivoMes,
} from "./correctivoConteo";
import BarraBusquedaLista from "../../components/BarraBusquedaLista";
import { ContadorListaMensual, etiquetaPeriodoContador } from "../../components/ContadorListaMensual";
import { coincideBusqueda, paginarLista } from "../../lib/listaRegistros";
import {
  ESTADOS_MAQUINA,
  TIPOS_SOLICITUD,
  type RegistroCorrectivo,
} from "./types";
import "./correctivo.css";

const formularioVacio = {
  fecha: "",
  horaSolicitud: "",
  nombreSolicitante: "",
  horaRespuesta: "",
  horaInicioSolicitud: "",
  horaFinSolicitud: "",
  area: "",
  maquinaId: "",
  maquinaEquipoLocacion: "",
  codigoMaquina: "",
  estadoMaquina: "",
  descripcionSolicitud: "",
  solucionSolicitud: "",
  fechaCierre: "",
  horaCierre: "",
  quienRevisa: "",
};

const CLAVE_BORRADOR_CORRECTIVO = "epi-borrador-correctivo";

type BorradorCorrectivo = {
  campos: typeof formularioVacio;
  personalIds: string[];
  tipos: string[];
  esperaRepuesto: boolean;
  editandoId: string | null;
};

function CorrectivoPage() {
  const { puede } = useAuth();
  const ubicacion = useLocation();
  const stateNavegacion = ubicacion.state as
    | { editarCorrectivoId?: string; filtroArea?: string }
    | null
    | undefined;
  const borradorInicial = useRef(leerBorrador<BorradorCorrectivo>(CLAVE_BORRADOR_CORRECTIVO));
  const [registros, setRegistros] = useState<RegistroCorrectivo[]>([]);
  const [maquinas, setMaquinas] = useState<HojaVida[]>([]);
  const [personal, setPersonal] = useState<Persona[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [campos, setCampos] = useState(
    () => borradorInicial.current?.campos ?? formularioVacio,
  );
  const [personalIds, setPersonalIds] = useState(
    () => borradorInicial.current?.personalIds ?? [],
  );
  const [tipos, setTipos] = useState(() => borradorInicial.current?.tipos ?? []);
  const [esperaRepuesto, setEsperaRepuesto] = useState(
    () => borradorInicial.current?.esperaRepuesto ?? false,
  );
  const [editandoId, setEditandoId] = useState<string | null>(
    () => borradorInicial.current?.editandoId ?? null,
  );
  const [filtroArea, setFiltroArea] = useState("");
  const [busquedaLista, setBusquedaLista] = useState("");
  const [listaMes, setListaMes] = useState(() => new Date().getMonth() + 1);
  const [listaAnio, setListaAnio] = useState(() => new Date().getFullYear());
  const [paginaLista, setPaginaLista] = useState(1);
  const [contadorAnio, setContadorAnio] = useState(() => new Date().getFullYear());
  const [contadorMes, setContadorMes] = useState(() => new Date().getMonth() + 1);
  const [criterioContador, setCriterioContador] = useState<CriterioFechaCorrectivo>("solicitud");
  const [filtroContador, setFiltroContador] = useState<FiltroEstadoCorrectivoMes | null>(null);
  const navegacionProcesada = useRef(false);

  useEffect(() => {
    const hayContenido =
      Object.values(campos).some((v) => String(v).trim() !== "") ||
      personalIds.length > 0 ||
      tipos.length > 0 ||
      esperaRepuesto ||
      Boolean(editandoId);
    if (!hayContenido) {
      borrarBorrador(CLAVE_BORRADOR_CORRECTIVO);
      return;
    }
    guardarBorrador(CLAVE_BORRADOR_CORRECTIVO, {
      campos,
      personalIds,
      tipos,
      esperaRepuesto,
      editandoId,
    } satisfies BorradorCorrectivo);
  }, [campos, personalIds, tipos, esperaRepuesto, editandoId]);

  useEffect(() => {
    Promise.all([listarCorrectivo(), listarHojas(), listarPersonalActivo()])
      .then(([regs, hojas, tecnicos]) => {
        setRegistros(regs);
        setMaquinas(hojas);
        setPersonal(tecnicos);
      })
      .catch((e: Error) => setError("No se pudieron cargar los datos: " + e.message))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    if (cargando || navegacionProcesada.current) return;
    if (!stateNavegacion?.editarCorrectivoId && !stateNavegacion?.filtroArea) return;
    if (stateNavegacion.editarCorrectivoId && registros.length === 0) return;
    navegacionProcesada.current = true;
    if (stateNavegacion.filtroArea) {
      setFiltroArea(stateNavegacion.filtroArea);
    }
    if (stateNavegacion.editarCorrectivoId) {
      const id = stateNavegacion.editarCorrectivoId;
      void (async () => {
        try {
          const actualizado = await iniciarCronometroAlAtender(id);
          setRegistros((prev) =>
            ordenarRegistrosCorrectivo(
              prev.map((r) => (r.id === actualizado.id ? actualizado : r)),
            ),
          );
          iniciarEdicion(actualizado);
        } catch {
          const registro = registros.find((r) => r.id === id);
          if (registro) iniciarEdicion(registro);
        }
      })();
    }
  }, [cargando, registros, stateNavegacion]);

  const maquinasDelArea = useMemo(
    () => maquinas.filter((m) => m.area === campos.area),
    [maquinas, campos.area],
  );

  const registrosFiltrados = useMemo(() => {
    const estado = filtroContador ?? "todas";
    const delPeriodo = filtrarCorrectivosMes(
      registros,
      listaAnio,
      listaMes,
      criterioContador,
      estado,
      filtroArea,
    );
    const lista = delPeriodo.filter((r) =>
      coincideBusqueda(
        busquedaLista,
        r.fecha,
        r.area,
        String(r.datos.numeroSolicitud),
        r.datos.maquinaEquipoLocacion,
        r.datos.codigoMaquina,
        r.datos.descripcionSolicitud,
        r.datos.solucionSolicitud,
        r.datos.nombreSolicitante,
        r.datos.quienRevisa,
        r.datos.estadoMaquina,
        ...(r.datos.tiposSolicitud ?? []),
        ...(r.datos.personalNombres ?? []),
      ),
    );
    return ordenarRegistrosCorrectivo(lista);
  }, [
    registros,
    filtroArea,
    filtroContador,
    listaAnio,
    listaMes,
    criterioContador,
    busquedaLista,
  ]);

  const registrosPagina = useMemo(
    () => paginarLista(registrosFiltrados, paginaLista),
    [registrosFiltrados, paginaLista],
  );

  const conteoMes = useMemo(
    () =>
      contarCorrectivosMes(
        registros,
        contadorAnio,
        contadorMes,
        criterioContador,
        filtroArea,
      ),
    [registros, contadorAnio, contadorMes, criterioContador, filtroArea],
  );

  function seleccionarFiltroContador(key: string) {
    const siguiente = key as FiltroEstadoCorrectivoMes;
    setFiltroContador((prev) => (prev === siguiente ? null : siguiente));
    setListaMes(contadorMes);
    setListaAnio(contadorAnio);
    setPaginaLista(1);
  }

  function actualizar(nombre: keyof typeof formularioVacio, valor: string) {
    setCampos((c) => ({ ...c, [nombre]: valor }));
  }

  function seleccionarMaquina(maquinaId: string) {
    const maquina = maquinas.find((m) => m.id === maquinaId);
    setCampos((c) => ({
      ...c,
      maquinaId,
      maquinaEquipoLocacion: maquina ? maquina.nombre : c.maquinaEquipoLocacion,
      codigoMaquina: maquina ? (maquina.codigo ?? "") : c.codigoMaquina,
    }));
  }

  function alternarTipo(tipo: string) {
    setTipos((previos) =>
      previos.includes(tipo) ? previos.filter((t) => t !== tipo) : [...previos, tipo],
    );
  }

  function nombresTecnicos(registro: RegistroCorrectivo): string {
    const ids = idsDesdeRegistroCorrectivo(registro);
    return nombresPersonalEnRegistro(ids, personal, registro.datos.personalNombres);
  }

  function actualizarQuienRevisa(ids: string[]) {
    const nombres = ids
      .map((id) => personal.find((p) => p.id === id)?.nombre)
      .filter(Boolean);
    if (nombres.length > 0) {
      setCampos((c) => ({ ...c, quienRevisa: nombres.join(", ") }));
    }
  }

  function manejarPersonalIds(ids: string[]) {
    setPersonalIds(ids);
    actualizarQuienRevisa(ids);
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setCampos(formularioVacio);
    setPersonalIds([]);
    setTipos([]);
    setEsperaRepuesto(false);
    borrarBorrador(CLAVE_BORRADOR_CORRECTIVO);
  }

  function iniciarEdicion(registro: RegistroCorrectivo) {
    setEditandoId(registro.id);
    setCampos({
      fecha: registro.fecha,
      horaSolicitud: registro.datos.horaSolicitud,
      nombreSolicitante: registro.datos.nombreSolicitante,
      horaRespuesta: registro.datos.horaRespuesta,
      horaInicioSolicitud: registro.datos.horaInicioSolicitud,
      horaFinSolicitud: registro.datos.horaFinSolicitud,
      area: registro.area,
      maquinaId: registro.datos.maquinaId,
      maquinaEquipoLocacion: registro.datos.maquinaEquipoLocacion,
      codigoMaquina: registro.datos.codigoMaquina,
      estadoMaquina: registro.datos.estadoMaquina,
      descripcionSolicitud: registro.datos.descripcionSolicitud,
      solucionSolicitud: registro.datos.solucionSolicitud,
      fechaCierre: registro.datos.fechaCierre,
      horaCierre: registro.datos.horaCierre,
      quienRevisa: registro.datos.quienRevisa,
    });
    setPersonalIds(idsDesdeRegistroCorrectivo(registro));
    setTipos(registro.datos.tiposSolicitud);
    setEsperaRepuesto(Boolean(registro.datos.esperaRepuesto));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    setMensaje(null);

    if (tipos.length === 0) {
      setError("Selecciona al menos un tipo de solicitud.");
      return;
    }

    if (personal.length > 0 && personalIds.length === 0) {
      setError("Selecciona al menos un técnico responsable.");
      return;
    }

    const idsValidos = personalIds.filter((id) => personal.some((p) => p.id === id));
    if (personalIds.length > 0 && idsValidos.length === 0) {
      setError("Los técnicos seleccionados no son válidos.");
      return;
    }

    setGuardando(true);
    try {
      const numeroSolicitud = editandoId
        ? (registros.find((r) => r.id === editandoId)?.datos.numeroSolicitud ?? 0)
        : siguienteNumeroSolicitud(registros);

      const datosPersonal = construirDatosPersonal(idsValidos, personal);
      const nombresTecnicosTexto = datosPersonal.personalNombres.join(", ");

      const registroPrevio = editandoId
        ? registros.find((r) => r.id === editandoId)
        : undefined;
      const cronPrev = leerCronometro(registroPrevio?.datos);
      const cerrada = Boolean(campos.fechaCierre?.trim());
      const espera = Boolean(campos.fechaCierre ? false : esperaRepuesto);
      const habiaAsignado = Boolean(
        (registroPrevio?.datos.cronometro?.estado &&
          registroPrevio.datos.cronometro.estado !== "idle") ||
          personalIds.length > 0,
      );

      let cronometro = cronPrev;
      if (cerrada) {
        cronometro = await detenerCronometroLaboral(cronPrev);
      } else if (espera) {
        cronometro =
          cronPrev.estado === "running"
            ? await pausarCronometroLaboral(cronPrev)
            : {
                estado: "paused",
                segmentoInicio: null,
                acumuladoSeg: cronPrev.acumuladoSeg,
              };
      } else if (cronPrev.estado === "paused") {
        cronometro = reanudarCronometro(cronPrev);
      } else if (cronPrev.estado === "idle" && habiaAsignado) {
        cronometro = iniciarCronometro(cronPrev);
      }

      const input = {
        ...(datosPersonal.personalId ? { personal_id: datosPersonal.personalId } : {}),
        area: campos.area,
        fecha: campos.fecha,
        datos: {
          numeroSolicitud,
          horaSolicitud: campos.horaSolicitud,
          nombreSolicitante: campos.nombreSolicitante.trim(),
          horaRespuesta: campos.horaRespuesta,
          tiempoRespuesta: calcularTiempoRespuesta(
            campos.horaSolicitud,
            campos.horaRespuesta,
          ),
          horaInicioSolicitud: campos.horaInicioSolicitud,
          horaFinSolicitud: campos.horaFinSolicitud,
          maquinaEquipoLocacion: campos.maquinaEquipoLocacion.trim(),
          codigoMaquina: campos.codigoMaquina.trim(),
          maquinaId: campos.maquinaId,
          estadoMaquina: campos.estadoMaquina,
          tiposSolicitud: tipos,
          descripcionSolicitud: campos.descripcionSolicitud.trim(),
          solucionSolicitud: campos.solucionSolicitud.trim(),
          fechaCierre: campos.fechaCierre,
          horaCierre: campos.horaCierre,
          esperaRepuesto: campos.fechaCierre ? false : esperaRepuesto,
          cronometro,
          quienRevisa: campos.quienRevisa.trim() || nombresTecnicosTexto,
          ...datosPersonal,
        },
      };

      if (editandoId) {
        const actualizado = await actualizarCorrectivo(editandoId, input);
        setRegistros((previos) =>
          ordenarRegistrosCorrectivo(
            previos.map((r) => (r.id === actualizado.id ? actualizado : r)),
          ),
        );
        setMensaje("Solicitud actualizada correctamente.");
      } else {
        const creado = await crearCorrectivo(input);
        setRegistros((previos) => ordenarRegistrosCorrectivo([creado, ...previos]));
        setMensaje(`Solicitud No. ${numeroSolicitud} guardada correctamente.`);
      }
      cancelarEdicion();
    } catch (e) {
      setError("No fue posible guardar: " + (e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  async function manejarEliminar(registro: RegistroCorrectivo) {
    if (!window.confirm(`¿Eliminar la solicitud No. ${registro.datos.numeroSolicitud}?`)) return;
    try {
      await eliminarCorrectivo(registro.id);
      setRegistros((previos) => previos.filter((r) => r.id !== registro.id));
      if (editandoId === registro.id) cancelarEdicion();
    } catch (e) {
      setError("No fue posible eliminar: " + (e as Error).message);
    }
  }

  return (
    <section className="correctivo">
      <div className="correctivo__cabecera">
        <div>
          <h1>Mantenimiento correctivo</h1>
          <p className="correctivo__descripcion">
            Solicitudes de servicio de mantenimiento por área.{" "}
            <Link to="/personal">Gestionar personal</Link>
          </p>
        </div>
      </div>

      <SoloConPermiso permiso="crear.correctivo">
        <form className="correctivo-form" onSubmit={manejarEnvio}>
        <h2>
          {editandoId
            ? "Editar solicitud"
            : `Nueva solicitud (No. ${siguienteNumeroSolicitud(registros)})`}
        </h2>

        <div className="correctivo-form__grid">
          <label>
            Fecha solicitud *
            <input required type="date" value={campos.fecha}
              onChange={(e) => actualizar("fecha", e.target.value)} />
          </label>
          <label>
            Hora solicitud *
            <input required type="time" value={campos.horaSolicitud}
              onChange={(e) => actualizar("horaSolicitud", e.target.value)} />
          </label>
          <label>
            Nombre solicitante *
            <input required value={campos.nombreSolicitante}
              onChange={(e) => actualizar("nombreSolicitante", e.target.value)} />
          </label>
          <label>
            Hora respuesta
            <input type="time" value={campos.horaRespuesta}
              onChange={(e) => actualizar("horaRespuesta", e.target.value)} />
          </label>
          <label>
            Hora inicio trabajo
            <input type="time" value={campos.horaInicioSolicitud}
              onChange={(e) => actualizar("horaInicioSolicitud", e.target.value)} />
          </label>
          <label>
            Hora fin trabajo
            <input type="time" value={campos.horaFinSolicitud}
              onChange={(e) => actualizar("horaFinSolicitud", e.target.value)} />
          </label>
          <label>
            Proceso / Área *
            <select required value={campos.area}
              onChange={(e) => actualizar("area", e.target.value)}>
              <option value="">Selecciona un área</option>
              {AREAS_SISTEMA.map((area) => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </label>
          <label>
            Máquina registrada (opcional)
            <select value={campos.maquinaId}
              onChange={(e) => seleccionarMaquina(e.target.value)}>
              <option value="">Selección manual abajo</option>
              {maquinasDelArea.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre} ({m.codigo ?? "sin código"})
                </option>
              ))}
            </select>
          </label>
          <label>
            Máquina / Equipo / Locación *
            <input required value={campos.maquinaEquipoLocacion}
              onChange={(e) => actualizar("maquinaEquipoLocacion", e.target.value)} />
          </label>
          <label>
            Código máquina
            <input value={campos.codigoMaquina}
              onChange={(e) => actualizar("codigoMaquina", e.target.value)} />
          </label>
          <label>
            Estado máquina
            <select value={campos.estadoMaquina}
              onChange={(e) => actualizar("estadoMaquina", e.target.value)}>
              <option value="">Opcional</option>
              {ESTADOS_MAQUINA.map((estado) => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </select>
          </label>
        </div>

        <fieldset className="correctivo-form__tipos">
          <legend>Tipo de solicitud * (puedes marcar varios)</legend>
          <div>
            {TIPOS_SOLICITUD.map((tipo) => (
              <label key={tipo} className="check-tipo">
                <input
                  type="checkbox"
                  checked={tipos.includes(tipo)}
                  onChange={() => alternarTipo(tipo)}
                />{" "}
                {tipo.charAt(0) + tipo.slice(1).toLowerCase()}
              </label>
            ))}
          </div>
        </fieldset>

        <SelectorPersonal
          personal={personal}
          seleccionados={personalIds}
          onChange={manejarPersonalIds}
          leyenda="Técnicos responsables * (puedes marcar 2 o más)"
        />

        <div className="correctivo-form__grid">
          <label className="correctivo-form__completa">
            Descripción de solicitud *
            <textarea required rows={2} value={campos.descripcionSolicitud}
              onChange={(e) => actualizar("descripcionSolicitud", e.target.value)} />
          </label>
          <label className="correctivo-form__completa">
            Solución
            <textarea rows={2} value={campos.solucionSolicitud}
              onChange={(e) => actualizar("solucionSolicitud", e.target.value)} />
          </label>
          <label>
            Fecha cierre
            <input type="date" value={campos.fechaCierre}
              onChange={(e) => actualizar("fechaCierre", e.target.value)} />
          </label>
          <label>
            Hora cierre
            <input type="time" value={campos.horaCierre}
              onChange={(e) => actualizar("horaCierre", e.target.value)} />
          </label>
          <label className="check-tipo">
            <input
              type="checkbox"
              checked={esperaRepuesto}
              disabled={Boolean(campos.fechaCierre) || !editandoId}
              onChange={(e) => {
                const checked = e.target.checked;
                setEsperaRepuesto(checked);
                if (!editandoId) return;
                void (async () => {
                  try {
                    const actualizado = checked
                      ? await marcarEsperaYPausarCronometro(editandoId)
                      : await quitarEsperaYReanudarCronometro(editandoId);
                    setRegistros((previos) =>
                      ordenarRegistrosCorrectivo(
                        previos.map((r) => (r.id === actualizado.id ? actualizado : r)),
                      ),
                    );
                    setMensaje(
                      checked
                        ? "Espera de repuesto: cronómetro pausado."
                        : "Cronómetro reanudado.",
                    );
                  } catch (err) {
                    setEsperaRepuesto(!checked);
                    setError((err as Error).message);
                  }
                })();
              }}
            />{" "}
            En espera de repuesto (pausa el cronómetro al instante)
          </label>
          <label>
            Quién revisa
            <input value={campos.quienRevisa}
              onChange={(e) => actualizar("quienRevisa", e.target.value)}
              placeholder="Se completa con los técnicos seleccionados"
            />
          </label>
        </div>

        {editandoId && !campos.fechaCierre && (
          <div className="correctivo-cronometro-bloque">
            {(() => {
              const regEdicion = registros.find((r) => r.id === editandoId);
              return regEdicion ? <CronometroSolicitudBadge datos={regEdicion.datos} /> : null;
            })()}
          </div>
        )}

        <div className="correctivo-form__acciones">
          <button type="submit" className="btn btn--primario" disabled={guardando}>
            {guardando ? "Guardando..." : editandoId ? "Guardar cambios" : "Registrar solicitud"}
          </button>
          {editandoId && (
            <button type="button" className="btn" onClick={cancelarEdicion}>
              Cancelar edición
            </button>
          )}
        </div>
      </form>
      </SoloConPermiso>

      {!puede("crear.correctivo") && (
        <p className="correctivo__descripcion">Modo consulta: solo puedes ver las solicitudes.</p>
      )}

      {mensaje && <p className="correctivo__mensaje correctivo__mensaje--ok">{mensaje}</p>}
      {error && <p className="correctivo__mensaje correctivo__mensaje--error">{error}</p>}

      <BarraBusquedaLista
        titulo="Solicitudes"
        busqueda={busquedaLista}
        onBusqueda={setBusquedaLista}
        placeholder="Buscar No., máquina, código, solicitante, descripción…"
        total={registrosFiltrados.length}
        pagina={paginaLista}
        onPagina={setPaginaLista}
        mes={listaMes}
        anio={listaAnio}
        onMes={setListaMes}
        onAnio={setListaAnio}
        extraAcciones={
          <button
            className="btn"
            disabled={registrosFiltrados.length === 0}
            onClick={() => exportarCsv(registrosFiltrados)}
          >
            Exportar CSV
          </button>
        }
      >
        <label>
          Área
          <select
            value={filtroArea}
            onChange={(e) => {
              setFiltroArea(e.target.value);
              setPaginaLista(1);
            }}
          >
            <option value="">Todas las áreas</option>
            {AREAS_SISTEMA.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </label>
      </BarraBusquedaLista>

      <ContadorListaMensual
        titulo="Contador del mes"
        mes={contadorMes}
        anio={contadorAnio}
        onMes={setContadorMes}
        onAnio={setContadorAnio}
        total={conteoMes.total}
        totalEtiqueta={
          criterioContador === "cierre"
            ? "cerradas por fecha de cierre"
            : "registradas por fecha de solicitud"
        }
        chipArea={filtroArea || undefined}
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
        desgloses={[
          ...(!filtroArea
            ? [
                {
                  titulo: "Por área",
                  items: conteoMes.porArea.map((x) => ({
                    clave: x.area,
                    cantidad: x.cantidad,
                  })),
                },
              ]
            : []),
          {
            titulo: "Por tipo",
            items: conteoMes.porTipo.map((x) => ({
              clave: x.tipo,
              cantidad: x.cantidad,
            })),
          },
        ]}
      />

      {filtroContador && (
        <p className="correctivo__filtro-mes">
          Mostrando{" "}
          {filtroContador === "todas"
            ? "todas"
            : filtroContador === "espera"
              ? "espera repuesto"
              : filtroContador}{" "}
          de {etiquetaPeriodoContador(contadorMes, contadorAnio)} ({registrosFiltrados.length}).{" "}
          <button type="button" className="btn" onClick={() => setFiltroContador(null)}>
            Quitar filtro
          </button>
        </p>
      )}

      {cargando && <p>Cargando solicitudes...</p>}
      {!cargando && registrosFiltrados.length === 0 && (
        <p className="correctivo__vacio">
          {filtroContador || busquedaLista.trim() || listaMes !== 0 || filtroArea
            ? "No hay solicitudes con esos filtros. Prueba otra búsqueda o «Todos los meses»."
            : "No hay solicitudes registradas todavía."}
        </p>
      )}

      {registrosPagina.length > 0 && (
        <div className="correctivo__tabla-contenedor">
          <table className="correctivo__tabla">
            <thead>
              <tr>
                <th>No.</th>
                <th>Fecha</th>
                <th>Área</th>
                <th>Máquina</th>
                <th>Técnicos</th>
                <th>Estado</th>
                <th>Tipo</th>
                <th>Descripción</th>
                <th>T. respuesta</th>
                <th>Cierre</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {registrosPagina.map((registro) => (
                <tr key={registro.id}>
                  <td>{registro.datos.numeroSolicitud}</td>
                  <td>{registro.fecha}</td>
                  <td>{registro.area}</td>
                  <td>
                    {registro.datos.maquinaEquipoLocacion}
                    {registro.datos.codigoMaquina && (
                      <span className="correctivo__codigo"> {registro.datos.codigoMaquina}</span>
                    )}
                  </td>
                  <td>{nombresTecnicos(registro)}</td>
                  <td>{registro.datos.estadoMaquina}</td>
                  <td>{registro.datos.tiposSolicitud.join(", ")}</td>
                  <td className="correctivo__descripcion-celda">
                    {registro.datos.descripcionSolicitud}
                  </td>
                  <td>{registro.datos.tiempoRespuesta || "—"}</td>
                  <td>{registro.datos.fechaCierre || "Abierta"}</td>
                  <td className="correctivo__acciones">
                    <SoloConPermiso permiso="crear.correctivo">
                      <button className="btn" onClick={() => iniciarEdicion(registro)}>
                        Editar
                      </button>
                    </SoloConPermiso>
                    <SoloConPermiso permiso="eliminar.registros">
                      <button className="btn btn--peligro" onClick={() => manejarEliminar(registro)}>
                        Eliminar
                      </button>
                    </SoloConPermiso>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default CorrectivoPage;
