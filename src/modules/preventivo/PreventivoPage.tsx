import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AREAS_CON_PM, areaTienePreventivo, coincideArea } from "../../lib/areas";
import { borrarBorrador, guardarBorrador, leerBorrador } from "../../lib/borradorFormulario";
import { listarHojas } from "../hojas/hojasService";
import { filtrarHojasParaPreventivo, filtrarHojasPorArea, hojaEstaActiva } from "../hojas/hojasFiltro";
import type { HojaVida } from "../hojas/types";
import AvisoSetupPersonal from "../../components/setup/AvisoSetupPersonal";
import { useAuth } from "../auth/AuthContext";
import { SoloConPermiso } from "../auth/SoloConPermiso";
import { listarPersonalActivo, existeTablaPersonal } from "../personal/personalService";
import { faltaTablaPersonal as esErrorTablaPersonal } from "../personal/personalSetup";
import SelectorPersonal from "../personal/SelectorPersonal";
import {
  construirDatosPersonal,
  idsDesdeRegistroPreventivo,
  nombresPersonalEnRegistro,
} from "../personal/personalVinculo";
import type { Persona } from "../personal/types";
import {
  actualizarPreventivo,
  crearPreventivo,
  eliminarPreventivo,
  listarPreventivo,
  ordenarRegistrosPreventivo,
} from "./preventivoService";
import {
  construirMtre045AlGuardar,
  construirMtre045DesdePreventivo,
  etiquetaEquipoPm,
} from "../formatos/mtre045DesdePreventivo";
import Mtre045CamposFormulario, {
  camposFormatoMtre045Vacios,
  extraerCamposFormato,
  type CamposFormatoMtre045,
} from "../formatos/Mtre045CamposFormulario";
import type { Mtre045Datos } from "../formatos/mtre045Types";
import { listarExcepciones } from "../cronograma/cronogramaService";
import type { ExcepcionCronograma } from "../cronograma/types";
import { ContadorListaMensual } from "../../components/ContadorListaMensual";
import BarraBusquedaLista from "../../components/BarraBusquedaLista";
import {
  coincideBusqueda,
  paginarLista,
  registroEnPeriodo,
} from "../../lib/listaRegistros";
import { contarPreventivoMes } from "./preventivoConteo";
import type { RegistroPreventivo } from "./types";
import { resolverFechaProgramadaCercana } from "./pmCompletado";
import {
  calcularMapaNumerosReporte,
  clavesGrupoAfectadas,
  datosConNumeroReporte,
  formatearNumeroReporte,
  numeroReporteDeRegistro,
  numeroReporteParaRegistro,
  sincronizarNumerosReporteEnGrupos,
  sincronizarNumerosReportePendientes,
} from "./numeroReportePm";
import "./preventivo.css";

const formularioVacio = {
  area: "",
  maquinaId: "",
  fecha: "",
  descripcion: "",
};

const CLAVE_BORRADOR_PREVENTIVO = "epi-borrador-preventivo";

type BorradorPreventivo = {
  campos: typeof formularioVacio;
  formatoMtre045: CamposFormatoMtre045;
  personalIds: string[];
  editandoId: string | null;
};

interface EstadoNavegacion {
  registrarPm?: { maquinaId: string; area: string; fecha: string };
}

function PreventivoPage() {
  const { puede } = useAuth();
  const ubicacion = useLocation();
  const navigate = useNavigate();
  const borradorInicial = useRef(leerBorrador<BorradorPreventivo>(CLAVE_BORRADOR_PREVENTIVO));
  const [registros, setRegistros] = useState<RegistroPreventivo[]>([]);
  const [maquinas, setMaquinas] = useState<HojaVida[]>([]);
  const [personal, setPersonal] = useState<Persona[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [campos, setCampos] = useState(
    () => borradorInicial.current?.campos ?? formularioVacio,
  );
  const [formatoMtre045, setFormatoMtre045] = useState<CamposFormatoMtre045>(
    () => borradorInicial.current?.formatoMtre045 ?? camposFormatoMtre045Vacios(),
  );
  const [personalIds, setPersonalIds] = useState(
    () => borradorInicial.current?.personalIds ?? [],
  );
  const [editandoId, setEditandoId] = useState<string | null>(
    () => borradorInicial.current?.editandoId ?? null,
  );
  /** Cita del cronograma enlazada (no se altera primer_pm al cambiar la fecha de ejecución). */
  const [fechaProgramada, setFechaProgramada] = useState<string | null>(null);
  const [filtroArea, setFiltroArea] = useState("");
  const [busquedaLista, setBusquedaLista] = useState("");
  const [listaMes, setListaMes] = useState(() => new Date().getMonth() + 1);
  const [listaAnio, setListaAnio] = useState(() => new Date().getFullYear());
  const [paginaLista, setPaginaLista] = useState(1);
  const [excepciones, setExcepciones] = useState<ExcepcionCronograma[]>([]);
  const [contadorAnio, setContadorAnio] = useState(() => new Date().getFullYear());
  const [contadorMes, setContadorMes] = useState(() => new Date().getMonth() + 1);
  const [faltaTablaPersonal, setFaltaTablaPersonal] = useState(false);

  useEffect(() => {
    const hayContenido =
      Object.values(campos).some((v) => String(v).trim() !== "") ||
      personalIds.length > 0 ||
      Boolean(editandoId) ||
      Object.values(formatoMtre045).some((v) => String(v).trim() !== "");
    if (!hayContenido) {
      borrarBorrador(CLAVE_BORRADOR_PREVENTIVO);
      return;
    }
    guardarBorrador(CLAVE_BORRADOR_PREVENTIVO, {
      campos,
      formatoMtre045,
      personalIds,
      editandoId,
    } satisfies BorradorPreventivo);
  }, [campos, formatoMtre045, personalIds, editandoId]);

  useEffect(() => {
    setCargando(true);
    setError(null);
    Promise.all([listarPreventivo(), listarHojas(), listarExcepciones()])
      .then(async ([regs, hojas, excs]) => {
        const sincronizados = await sincronizarNumerosReportePendientes(regs);
        setRegistros(ordenarRegistrosPreventivo(sincronizados));
        setMaquinas(hojas);
        setExcepciones(excs);
      })
      .catch((e: Error) => setError("No se pudieron cargar los datos: " + e.message))
      .finally(() => setCargando(false));

    listarPersonalActivo()
      .then((tecnicos) => {
        setPersonal(tecnicos);
        setFaltaTablaPersonal(false);
      })
      .catch((e: Error) => {
        setPersonal([]);
        if (esErrorTablaPersonal(e.message)) setFaltaTablaPersonal(true);
      });

    existeTablaPersonal()
      .then((ok) => setFaltaTablaPersonal(!ok))
      .catch(() => setFaltaTablaPersonal(true));
  }, [ubicacion.key]);

  useEffect(() => {
    if (!campos.maquinaId) return;
    const maquina = maquinas.find((m) => m.id === campos.maquinaId);
    if (maquina && !coincideArea(campos.area, maquina.area)) {
      setCampos((c) => ({ ...c, area: maquina.area }));
    }
  }, [maquinas, campos.maquinaId, campos.area]);

  // Precarga del formulario al llegar desde el panel de inicio (clic en una cita)
  useEffect(() => {
    const estado = ubicacion.state as EstadoNavegacion | null;
    if (!estado?.registrarPm) return;
    const { maquinaId, area, fecha } = estado.registrarPm;
    setEditandoId(null);
    setFechaProgramada(fecha);
    setCampos({ area, maquinaId, fecha, descripcion: "" });
    setFormatoMtre045(camposFormatoMtre045Vacios());
    setPersonalIds([]);
    setMensaje(
      "Datos cargados desde el panel. Puedes ajustar la fecha real del trabajo; la cita programada se mantiene enlazada (sin cambiar la fecha base de la máquina).",
    );
    window.history.replaceState({}, "");
  }, [ubicacion.state]);

  const mapaNumerosReporte = useMemo(
    () => calcularMapaNumerosReporte(registros),
    [registros],
  );

  const numeroReporteVista = useMemo(() => {
    if (!campos.area || !campos.fecha) return null;
    const idBorrador = editandoId ?? "__borrador__";
    const registroBorrador: RegistroPreventivo = {
      id: idBorrador,
      hoja_id: campos.maquinaId || null,
      personal_id: null,
      area: campos.area,
      fecha: campos.fecha,
      descripcion: campos.descripcion,
      adjunto_url: null,
      datos: {},
      creado_en:
        registros.find((r) => r.id === editandoId)?.creado_en ?? new Date().toISOString(),
    };
    const lista = editandoId
      ? registros.map((r) =>
          r.id === editandoId ? { ...r, area: campos.area, fecha: campos.fecha } : r,
        )
      : [...registros, registroBorrador];
    return formatearNumeroReporte(numeroReporteParaRegistro(lista, registroBorrador));
  }, [campos.area, campos.fecha, campos.maquinaId, campos.descripcion, editandoId, registros]);

  const maquinaSeleccionada = useMemo(
    () => maquinas.find((m) => m.id === campos.maquinaId),
    [maquinas, campos.maquinaId],
  );

  const maquinasDelArea = useMemo(
    () => filtrarHojasParaPreventivo(maquinas, campos.area, campos.maquinaId),
    [maquinas, campos.area, campos.maquinaId],
  );

  const maquinasInactivasEnArea = useMemo(() => {
    if (!campos.area) return 0;
    return filtrarHojasPorArea(maquinas, campos.area).filter(
      (m) => areaTienePreventivo(m.area) && !hojaEstaActiva(m),
    ).length;
  }, [maquinas, campos.area]);

  const registrosFiltrados = useMemo(() => {
    const lista = registros.filter((r) => {
      if (filtroArea && r.area !== filtroArea) return false;
      if (!registroEnPeriodo(r.fecha, listaMes, listaAnio)) return false;
      const maquina = maquinas.find((m) => m.id === r.hoja_id);
      return coincideBusqueda(
        busquedaLista,
        r.fecha,
        r.area,
        r.descripcion,
        r.datos.equipo,
        r.datos.codigo,
        r.datos.numeroReporte,
        maquina?.nombre,
        maquina?.codigo,
        ...(r.datos.personalNombres ?? []),
        r.datos.personalNombre,
      );
    });
    return [...lista].sort((a, b) => {
      const porFecha = b.fecha.localeCompare(a.fecha);
      if (porFecha !== 0) return porFecha;
      const porNumero =
        (mapaNumerosReporte.get(b.id) ?? 0) - (mapaNumerosReporte.get(a.id) ?? 0);
      if (porNumero !== 0) return porNumero;
      return (b.creado_en ?? "").localeCompare(a.creado_en ?? "");
    });
  }, [
    registros,
    filtroArea,
    mapaNumerosReporte,
    listaMes,
    listaAnio,
    busquedaLista,
    maquinas,
  ]);

  const registrosPagina = useMemo(
    () => paginarLista(registrosFiltrados, paginaLista),
    [registrosFiltrados, paginaLista],
  );

  const conteoMes = useMemo(
    () =>
      contarPreventivoMes(
        maquinas,
        excepciones,
        registros,
        contadorAnio,
        contadorMes,
        filtroArea,
      ),
    [maquinas, excepciones, registros, contadorAnio, contadorMes, filtroArea],
  );

  function nombreMaquina(registro: RegistroPreventivo): string {
    const maquina = maquinas.find((m) => m.id === registro.hoja_id);
    if (maquina) {
      return etiquetaEquipoPm(maquina.nombre, maquina.codigo);
    }
    const codigo = registro.datos.codigo?.trim();
    return codigo
      ? etiquetaEquipoPm(registro.datos.equipo ?? "Máquina", codigo)
      : registro.datos.equipo ?? "Máquina eliminada";
  }

  function nombresTecnicos(registro: RegistroPreventivo): string {
    const ids = idsDesdeRegistroPreventivo(registro);
    return nombresPersonalEnRegistro(ids, personal, registro.datos.personalNombres);
  }

  function iniciarEdicion(registro: RegistroPreventivo) {
    setEditandoId(registro.id);
    setFechaProgramada(registro.datos.fechaProgramada?.slice(0, 10) || null);
    setCampos({
      area: registro.area,
      maquinaId: registro.hoja_id ?? "",
      fecha: registro.fecha,
      descripcion: registro.descripcion ?? "",
    });
    setPersonalIds(idsDesdeRegistroPreventivo(registro));
    setFormatoMtre045(extraerCamposFormato(registro.datos.mtre045));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setFechaProgramada(null);
    setCampos(formularioVacio);
    setFormatoMtre045(camposFormatoMtre045Vacios());
    setPersonalIds([]);
    borrarBorrador(CLAVE_BORRADOR_PREVENTIVO);
  }

  function construirMtre045DesdeFormulario(preventivoId: string): Mtre045Datos | null {
    if (!maquinaSeleccionada) return null;
    const lista = registros.map((r) =>
      r.id === preventivoId
        ? { ...r, area: maquinaSeleccionada.area, fecha: campos.fecha }
        : r,
    );
    const registro = lista.find((r) => r.id === preventivoId);
    if (!registro) return null;
    const numero = formatearNumeroReporte(numeroReporteParaRegistro(lista, registro));
    return construirMtre045AlGuardar({
      preventivoId,
      maquina: maquinaSeleccionada,
      fecha: campos.fecha,
      descripcion: campos.descripcion.trim(),
      personalIds: personalIds.filter((id) => personal.some((p) => p.id === id)),
      personal,
      formato: formatoMtre045,
      numeroReporte: numero,
    });
  }

  function construirMtre045DesdeRegistro(registro: RegistroPreventivo): Mtre045Datos {
    const hoja = maquinas.find((m) => m.id === registro.hoja_id);
    const numero = numeroReporteDeRegistro(registro, mapaNumerosReporte);
    return construirMtre045DesdePreventivo(registro, hoja, personal, { numeroReporte: numero });
  }

  function abrirMtre045(registro: RegistroPreventivo) {
    navigate("/formatos/mt-re-045", {
      state: { mtre045Datos: construirMtre045DesdeRegistro(registro) },
    });
  }

  function abrirMtre045FormularioActual() {
    if (!editandoId) {
      setError("Guarda el registro primero para abrir el MT-RE-045 con el número vinculado.");
      return;
    }
    const datos = construirMtre045DesdeFormulario(editandoId);
    if (!datos) {
      setError("Selecciona una máquina válida.");
      return;
    }
    navigate("/formatos/mt-re-045", { state: { mtre045Datos: datos } });
  }

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    setMensaje(null);

    const maquina = maquinas.find((m) => m.id === campos.maquinaId);
    if (!maquina) {
      setError("Selecciona una máquina válida registrada en hojas de vida.");
      return;
    }

    if (personal.length > 0 && personalIds.length === 0) {
      setError("Selecciona al menos un técnico que realizó la actividad.");
      return;
    }

    const idsValidos = personalIds.filter((id) => personal.some((p) => p.id === id));
    if (personalIds.length > 0 && idsValidos.length === 0) {
      setError("Los técnicos seleccionados no son válidos.");
      return;
    }

    setGuardando(true);
    try {
      const fechaProgramadaResuelta =
        fechaProgramada ||
        resolverFechaProgramadaCercana(maquina, campos.fecha) ||
        undefined;

      const datosPersonal = construirDatosPersonal(idsValidos, personal);
      const datosBase = {
        equipo: maquina.nombre,
        codigo: maquina.codigo ?? "",
        marca: maquina.datos?.marca ?? "",
        serial: maquina.datos?.serial ?? "",
        ...datosPersonal,
        ...(fechaProgramadaResuelta ? { fechaProgramada: fechaProgramadaResuelta } : {}),
      };

      const inputBase = {
        hoja_id: maquina.id,
        ...(datosPersonal.personalId ? { personal_id: datosPersonal.personalId } : {}),
        area: maquina.area,
        fecha: campos.fecha,
        descripcion: campos.descripcion.trim(),
        datos: datosBase,
      };

      if (editandoId) {
        const registroAnterior = registros.find((r) => r.id === editandoId);
        const listaTentativa = registros.map((r) =>
          r.id === editandoId
            ? {
                ...r,
                ...inputBase,
                descripcion: inputBase.descripcion,
              }
            : r,
        );
        const numero = formatearNumeroReporte(
          numeroReporteParaRegistro(listaTentativa, listaTentativa.find((r) => r.id === editandoId)!),
        );
        const mtre045 = construirMtre045AlGuardar({
          preventivoId: editandoId,
          maquina,
          fecha: campos.fecha,
          descripcion: campos.descripcion.trim(),
          personalIds: idsValidos,
          personal,
          formato: formatoMtre045,
          numeroReporte: numero,
        });
        const actualizado = await actualizarPreventivo(editandoId, {
          ...inputBase,
          datos: datosConNumeroReporte({ ...datosBase, mtre045 }, numero),
        });
        let listaFinal = registros.map((r) => (r.id === actualizado.id ? actualizado : r));
        const claves = clavesGrupoAfectadas(registroAnterior, maquina.area, campos.fecha);
        listaFinal = await sincronizarNumerosReporteEnGrupos(
          listaFinal,
          claves,
          calcularMapaNumerosReporte(listaFinal),
        );
        setRegistros(ordenarRegistrosPreventivo(listaFinal));
        setMensaje("Registro y reporte MT-RE-045 guardados. Puede imprimir desde el botón MT-RE-045.");
        cancelarEdicion();
      } else {
        const creado = await crearPreventivo(inputBase);
        const listaTentativa = [...registros, { ...creado, ...inputBase }];
        const numero = formatearNumeroReporte(
          numeroReporteParaRegistro(listaTentativa, creado),
        );
        const mtre045 = construirMtre045AlGuardar({
          preventivoId: creado.id,
          maquina,
          fecha: campos.fecha,
          descripcion: campos.descripcion.trim(),
          personalIds: idsValidos,
          personal,
          formato: formatoMtre045,
          numeroReporte: numero,
        });
        const actualizado = await actualizarPreventivo(creado.id, {
          datos: datosConNumeroReporte({ ...creado.datos, ...datosBase, mtre045 }, numero),
        });
        let listaFinal = [actualizado, ...registros];
        const claves = clavesGrupoAfectadas(null, maquina.area, campos.fecha);
        listaFinal = await sincronizarNumerosReporteEnGrupos(
          listaFinal,
          claves,
          calcularMapaNumerosReporte(listaFinal),
        );
        setRegistros(ordenarRegistrosPreventivo(listaFinal));
        setEditandoId(actualizado.id);
        setMensaje(
          "Registro y reporte MT-RE-045 guardados. Use «Ver / Imprimir MT-RE-045» o el botón en la tabla.",
        );
      }
    } catch (e) {
      setError("No fue posible guardar: " + (e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  async function manejarEliminar(registro: RegistroPreventivo) {
    if (!window.confirm("¿Eliminar este registro de mantenimiento preventivo?")) return;
    try {
      await eliminarPreventivo(registro.id);
      let lista = registros.filter((r) => r.id !== registro.id);
      const claves = clavesGrupoAfectadas(null, registro.area, registro.fecha);
      lista = await sincronizarNumerosReporteEnGrupos(
        lista,
        claves,
        calcularMapaNumerosReporte(lista),
      );
      setRegistros(ordenarRegistrosPreventivo(lista));
      if (editandoId === registro.id) cancelarEdicion();
    } catch (e) {
      setError("No fue posible eliminar: " + (e as Error).message);
    }
  }

  return (
    <section className="preventivo">
      <h1>Mantenimiento preventivo</h1>
      <p className="preventivo__descripcion">
        Registre la actividad y los datos del formato <strong>MT-RE-045</strong> en un solo
        formulario. Al guardar queda listo para imprimir.{" "}
        <Link to="/preventivo/cronograma">Ver cronograma anual</Link>
        {" · "}
        <Link to="/personal">Gestionar personal</Link>
      </p>

      {faltaTablaPersonal && (
        <AvisoSetupPersonal titulo="Para asignar técnicos, crea primero la tabla personal en Supabase" />
      )}

      <SoloConPermiso permiso="crear.preventivo">
        <form className="preventivo-form" onSubmit={manejarEnvio}>
        <h2>{editandoId ? "Editar registro" : "Registrar actividad"}</h2>
        <div className="preventivo-form__grid">
          <label>
            Área *
            <select
              required
              value={campos.area}
              onChange={(e) =>
                setCampos((c) => ({ ...c, area: e.target.value, maquinaId: "" }))
              }
            >
              <option value="">Selecciona un área</option>
              {AREAS_CON_PM.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </label>

          <label>
            Máquina *
            <select
              required
              value={campos.maquinaId}
              onChange={(e) => {
                setFechaProgramada(null);
                setCampos((c) => ({ ...c, maquinaId: e.target.value }));
              }}
            >
              <option value="">
                {campos.area
                  ? maquinasDelArea.length
                    ? "Selecciona una máquina"
                    : "No hay máquinas en esta área"
                  : "Selecciona primero un área"}
              </option>
              {maquinasDelArea.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre} ({m.codigo ?? "sin código"})
                  {!hojaEstaActiva(m) ? " — inactiva" : ""}
                </option>
              ))}
            </select>
            {campos.area && maquinasDelArea.length === 0 && (
              <span className="preventivo-form__ayuda">
                {maquinas.length === 0
                  ? "No hay máquinas en hojas de vida. Regístralas primero."
                  : maquinasInactivasEnArea > 0
                    ? `Hay ${maquinasInactivasEnArea} máquina(s) inactiva(s) en esta área. Reactívalas en Hojas de vida.`
                    : `No hay máquinas activas en ${campos.area}. Revisa el área asignada en Hojas de vida.`}
              </span>
            )}
          </label>

          <SelectorPersonal
            personal={personal}
            seleccionados={personalIds}
            onChange={setPersonalIds}
            disabled={faltaTablaPersonal}
            leyenda={
              personal.length > 0
                ? "Realizado por * (puedes marcar 2 o más técnicos)"
                : "Realizado por (opcional — registra personal primero)"
            }
          />

          <label>
            Fecha *
            <input
              required
              type="date"
              value={campos.fecha}
              onChange={(e) => setCampos((c) => ({ ...c, fecha: e.target.value }))}
            />
            <span className="preventivo-form__ayuda">
              Fecha real del trabajo. Puedes cambiarla si se hizo otros días; no altera la fecha
              base (primer PM) ni el indicador de preventivo: la cita del cronograma sigue igual y
              solo se marca como cumplida.
              {fechaProgramada ? ` Cita programada enlazada: ${fechaProgramada}.` : ""}
            </span>
          </label>

          <label className="preventivo-form__descripcion">
            Actividad realizada (PM) *
            <textarea
              required
              rows={3}
              value={campos.descripcion}
              onChange={(e) => setCampos((c) => ({ ...c, descripcion: e.target.value }))}
              placeholder="Ej. Cambio de aceite, revisión de correas, lubricación..."
            />
          </label>

          {maquinaSeleccionada && (
            <div className="preventivo-form__equipo-info">
              <div>
                <span>Equipo</span>
                {etiquetaEquipoPm(maquinaSeleccionada.nombre, maquinaSeleccionada.codigo)}
              </div>
              <div>
                <span>Marca</span>
                {maquinaSeleccionada.datos?.marca || "—"}
              </div>
              <div>
                <span>Serie</span>
                {maquinaSeleccionada.datos?.serial || "—"}
              </div>
              <div>
                <span>Área</span>
                {maquinaSeleccionada.area}
              </div>
              {numeroReporteVista && (
                <div>
                  <span>Nº reporte (mes)</span>
                  <strong>{numeroReporteVista}</strong>
                </div>
              )}
            </div>
          )}

          <div className="preventivo-form__seccion-formato">
            <Mtre045CamposFormulario
              datos={formatoMtre045}
              onChange={(cambios) => setFormatoMtre045((prev) => ({ ...prev, ...cambios }))}
            />
          </div>
        </div>
        <div className="preventivo-form__acciones">
          <button type="submit" className="btn btn--primario" disabled={guardando}>
            {guardando ? "Guardando..." : editandoId ? "Guardar cambios" : "Registrar"}
          </button>
          <button
            type="button"
            className="btn"
            disabled={guardando || !editandoId}
            onClick={abrirMtre045FormularioActual}
          >
            Ver / Imprimir MT-RE-045
          </button>
          {editandoId && (
            <button type="button" className="btn" onClick={cancelarEdicion}>
              Cancelar edición
            </button>
          )}
        </div>
        </form>
      </SoloConPermiso>

      {!puede("crear.preventivo") && (
        <p className="preventivo__descripcion">Modo consulta: solo puedes ver los registros.</p>
      )}

      {mensaje && <p className="preventivo__mensaje preventivo__mensaje--ok">{mensaje}</p>}
      {error && <p className="preventivo__mensaje preventivo__mensaje--error">{error}</p>}

      <BarraBusquedaLista
        titulo="Registros"
        busqueda={busquedaLista}
        onBusqueda={setBusquedaLista}
        placeholder="Buscar máquina, código, técnico, descripción, Nº reporte…"
        total={registrosFiltrados.length}
        pagina={paginaLista}
        onPagina={setPaginaLista}
        mes={listaMes}
        anio={listaAnio}
        onMes={setListaMes}
        onAnio={setListaAnio}
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
            {AREAS_CON_PM.map((area) => (
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
          contadorMes === 0
            ? `PM programados en ${contadorAnio} (todos los meses)`
            : "PM programados en el mes (cronograma)"
        }
        chipArea={filtroArea || undefined}
        tarjetas={[
          {
            key: "abiertas",
            etiqueta: "Pendientes (abiertas)",
            valor: conteoMes.abiertas,
            tono: "alerta",
          },
          {
            key: "cerradas",
            etiqueta: "Realizados (cerradas)",
            valor: conteoMes.cerradas,
            tono: "ok",
          },
          {
            key: "reprogramadas",
            etiqueta: "Reprogramados",
            valor: conteoMes.reprogramadas,
            tono: "espera",
          },
        ]}
        desgloses={
          !filtroArea
            ? [
                {
                  titulo: "Por área",
                  items: conteoMes.porArea.map((x) => ({
                    clave: `${x.area} (${x.cerradas} ok / ${x.abiertas} pend.)`,
                    cantidad: x.cantidad,
                  })),
                },
              ]
            : []
        }
      />

      {cargando && <p>Cargando registros...</p>}
      {!cargando && registrosFiltrados.length === 0 && (
        <p className="preventivo__vacio">
          {busquedaLista.trim() || listaMes !== 0 || filtroArea
            ? "No hay registros con esos filtros. Prueba otra búsqueda o «Todos los meses»."
            : "No hay registros preventivos todavía."}
        </p>
      )}

      {registrosPagina.length > 0 && (
        <div className="preventivo__tabla-contenedor">
          <table className="preventivo__tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Nº</th>
                <th>Área</th>
                <th>Máquina</th>
                <th>Técnicos</th>
                <th>Actividad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {registrosPagina.map((registro) => (
                <tr key={registro.id}>
                  <td>{registro.fecha}</td>
                  <td>{numeroReporteDeRegistro(registro, mapaNumerosReporte) || "—"}</td>
                  <td>{registro.area}</td>
                  <td>{nombreMaquina(registro)}</td>
                  <td>{nombresTecnicos(registro)}</td>
                  <td>{registro.descripcion}</td>
                  <td className="preventivo__acciones">
                    <SoloConPermiso permiso="ver.formatos">
                      <button className="btn" onClick={() => abrirMtre045(registro)}>
                        MT-RE-045
                      </button>
                    </SoloConPermiso>
                    <SoloConPermiso permiso="crear.preventivo">
                      <button className="btn" onClick={() => iniciarEdicion(registro)}>
                        Editar
                      </button>
                    </SoloConPermiso>
                    <SoloConPermiso permiso="eliminar.registros">
                      <button
                        className="btn btn--peligro"
                        onClick={() => manejarEliminar(registro)}
                      >
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

export default PreventivoPage;
