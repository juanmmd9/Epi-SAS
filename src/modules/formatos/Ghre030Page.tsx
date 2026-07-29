import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { SoloConPermiso } from "../auth/SoloConPermiso";
import { listarPersonalActivo } from "../personal/personalService";
import type { Persona } from "../personal/types";
import { imprimirPdf } from "../../lib/imprimirPdf";
import {
  generarPdfGhRe030,
  obtenerPdfPermiso,
  urlVistaPreviaPdf,
} from "../permisos/ghre030Pdf";
import {
  calcularTiempoConcedidoMinutos,
  formatearTiempoConcedido,
  obtenerFestivo,
  recalcularDatosPermiso,
} from "../permisos/permisosCalculo";
import { listarFestivosAnio } from "../permisos/horarioService";
import {
  eliminarPermiso,
  guardarPermiso,
  listarPermisos,
} from "../permisos/permisosService";
import {
  ESTADOS_PERMISO,
  formularioPermisoVacio,
  MOTIVOS_PERMISO,
  permisoPuedeImprimirse,
  prefillDesdePersonal,
  TIPOS_REMUNERACION,
  type EstadoPermiso,
  type PermisoDatos,
  type PrefillDesdePersonal,
  type RegistroPermiso,
} from "../permisos/types";
import type { Festivo } from "../permisos/types";
import AvisoPoliticaPermisosOperador from "../permisos/AvisoPoliticaPermisosOperador";
import "../formatos/formatos.css";
import "../permisos/permisos.css";

interface EstadoNavegacion {
  permiso?: PrefillDesdePersonal;
  editarPermiso?: RegistroPermiso;
}

function Ghre030Page() {
  const { perfil, puede, esAdmin } = useAuth();
  const puedeCrear = puede("crear.permisos");
  const puedeAprobar = puede("aprobar.permisos");
  const ubicacion = useLocation();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [personalId, setPersonalId] = useState("");
  const [datos, setDatos] = useState<PermisoDatos>(formularioPermisoVacio());
  const [estado, setEstado] = useState<EstadoPermiso>("solicitado");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [numeroActual, setNumeroActual] = useState<number | null>(null);
  const [registros, setRegistros] = useState<RegistroPermiso[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imprimiendo, setImprimiendo] = useState(false);
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);
  const [festivos, setFestivos] = useState<Festivo[]>([]);
  const previewAnterior = useRef<string | null>(null);
  const previewRef = useRef<HTMLElement>(null);

  const tiempoCalculado = useMemo(
    () =>
      calcularTiempoConcedidoMinutos(
        datos.fechaDesde,
        datos.fechaHasta,
        datos.horaDesde,
        datos.horaHasta,
      ),
    [datos.fechaDesde, datos.fechaHasta, datos.horaDesde, datos.horaHasta],
  );

  const festivoEnFecha = useMemo(() => {
    if (!datos.fechaDesde) return null;
    return obtenerFestivo(festivos, datos.fechaDesde);
  }, [festivos, datos.fechaDesde]);

  const anioPermiso = datos.fechaDesde
    ? Number.parseInt(datos.fechaDesde.slice(0, 4), 10)
    : new Date().getFullYear();

  const registrosVisibles = useMemo(() => {
    if (puedeAprobar) return registros;
    if (!perfil?.id) return [];
    return registros.filter((r) => r.datos.solicitadoPorId === perfil.id);
  }, [registros, puedeAprobar, perfil?.id]);

  useEffect(() => {
    listarFestivosAnio(anioPermiso)
      .then(setFestivos)
      .catch(() => setFestivos([]));
  }, [anioPermiso]);

  useEffect(() => {
    listarPersonalActivo()
      .then(setPersonas)
      .catch((e: Error) => setError("No se pudo cargar personal: " + e.message));
    listarPermisos()
      .then(setRegistros)
      .catch((e: Error) => setError("No se pudieron cargar permisos: " + e.message));
  }, []);

  useEffect(() => {
    const nav = ubicacion.state as EstadoNavegacion | null;
    if (!nav) return;
    if (nav.editarPermiso) {
      const registro = nav.editarPermiso;
      setEditandoId(registro.id);
      setNumeroActual(registro.numero);
      setPersonalId(registro.personal_id);
      setDatos(registro.datos);
      setEstado(registro.estado);
      setMensaje(`Permiso No. ${registro.numero} cargado para edición.`);
      window.history.replaceState({}, "");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!nav.permiso) return;
    setPersonalId(nav.permiso.personalId);
    setDatos(prefillDesdePersonal(nav.permiso));
    setMensaje("Formulario precargado desde Personal.");
    window.history.replaceState({}, "");
  }, [ubicacion.state]);

  useEffect(() => {
    return () => {
      if (previewAnterior.current) URL.revokeObjectURL(previewAnterior.current);
    };
  }, []);

  function actualizarDatos(cambios: Partial<PermisoDatos>) {
    setDatos((previos) => recalcularDatosPermiso({ ...previos, ...cambios }));
  }

  function manejarCambioPersonal(id: string) {
    setPersonalId(id);
    const persona = personas.find((p) => p.id === id);
    if (!persona) return;
    actualizarDatos({
      nombreTrabajador: persona.nombre,
      cedula: persona.cedula ?? "",
    });
  }

  function limpiarFormulario() {
    setEditandoId(null);
    setNumeroActual(null);
    setPersonalId("");
    setDatos(formularioPermisoVacio());
    setEstado("solicitado");
    setMensaje(null);
    setError(null);
  }

  function cerrarVistaPrevia() {
    if (previewAnterior.current) URL.revokeObjectURL(previewAnterior.current);
    previewAnterior.current = null;
    setPdfPreview(null);
  }

  function cargarRegistro(registro: RegistroPermiso) {
    setEditandoId(registro.id);
    setNumeroActual(registro.numero);
    setPersonalId(registro.personal_id);
    setDatos(registro.datos);
    setEstado(registro.estado);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  async function manejarGuardar(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    setMensaje(null);

    if (!puedeCrear) {
      setError("No tienes permiso para registrar solicitudes.");
      return;
    }
    if (!personalId || !datos.nombreTrabajador.trim()) {
      setError("Selecciona un trabajador.");
      return;
    }
    if (!datos.fechaDesde || !datos.horaDesde || !datos.horaHasta) {
      setError("Completa fechas y horarios del permiso.");
      return;
    }

    const estadoGuardar: EstadoPermiso = puedeAprobar ? estado : "solicitado";
    const datosConSolicitante: PermisoDatos = {
      ...datos,
      solicitadoPorId: datos.solicitadoPorId || perfil?.id || "",
      solicitadoPorNombre:
        datos.solicitadoPorNombre || perfil?.nombre || perfil?.email || "Operador",
      tipoDefinidoPorAdmin: puedeAprobar ? Boolean(datos.tipoDefinidoPorAdmin ?? true) : false,
    };

    setGuardando(true);
    try {
      const registro = await guardarPermiso(
        personalId,
        datosConSolicitante,
        estadoGuardar,
        editandoId,
      );
      setRegistros((previos) => {
        const filtrados = previos.filter((p) => p.id !== registro.id);
        return [registro, ...filtrados];
      });
      setEditandoId(registro.id);
      setNumeroActual(registro.numero);
      setEstado(registro.estado);
      setDatos(registro.datos);
      setMensaje(
        registro.estado === "solicitado"
          ? `Solicitud No. ${registro.numero} enviada. El administrador debe aprobarla o rechazarla.`
          : `Permiso GH-RE-030 No. ${registro.numero} guardado.`,
      );
    } catch (e) {
      setError("No se pudo guardar: " + (e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  async function manejarImprimir() {
    setError(null);
    if (!numeroActual) {
      setError("Guarda el permiso primero para obtener el número oficial antes de imprimir.");
      return;
    }
    if (!esAdmin && !permisoPuedeImprimirse(estado)) {
      setError("Solo se imprime cuando el administrador aprueba el permiso.");
      return;
    }
    setImprimiendo(true);
    try {
      const pdfBytes = await generarPdfGhRe030(datos, numeroActual, estado);
      mostrarPreview(pdfBytes);
      imprimirPdf(pdfBytes);
    } catch (e) {
      setError("No se pudo generar el formato para imprimir: " + (e as Error).message);
    } finally {
      setImprimiendo(false);
    }
  }

  async function imprimirRegistro(registro: RegistroPermiso) {
    setError(null);
    if (!esAdmin && !permisoPuedeImprimirse(registro.estado)) {
      setError("Ese permiso aún no está aprobado.");
      return;
    }
    setImprimiendo(true);
    try {
      const pdfBytes = await obtenerPdfPermiso(registro);
      mostrarPreview(pdfBytes);
      imprimirPdf(pdfBytes);
    } catch (e) {
      setError("No se pudo generar el formato para imprimir: " + (e as Error).message);
    } finally {
      setImprimiendo(false);
    }
  }

  async function manejarEliminar(registro: RegistroPermiso) {
    if (!window.confirm(`¿Eliminar permiso No. ${registro.numero}?`)) return;
    try {
      await eliminarPermiso(registro.id);
      setRegistros((previos) => previos.filter((p) => p.id !== registro.id));
      if (editandoId === registro.id) limpiarFormulario();
    } catch (e) {
      setError("No se pudo eliminar: " + (e as Error).message);
    }
  }

  return (
    <section className="formatos permisos-formato">
      <header className="permisos__encabezado">
        <div>
          <h1>GH-RE-030 — Solicitud de permiso</h1>
          <p className="formatos__descripcion">
            {puedeAprobar
              ? "Registra o ajusta permisos. Las solicitudes del operador aparecen como Solicitado hasta que las apruebes."
              : "Completa la solicitud del trabajador. El administrador recibirá el permiso para aprobarlo o rechazarlo."}
          </p>
        </div>
        <div className="permisos__enlaces-cabecera">
          {puede("ver.formatos") && (
            <Link className="btn" to="/formatos">
              Volver a Formatos
            </Link>
          )}
          <Link className="btn" to="/personal/permisos">
            Ver control de permisos
          </Link>
        </div>
      </header>

      {!puedeAprobar && <AvisoPoliticaPermisosOperador />}

      {numeroActual !== null && (
        <p className="permisos__numero-actual">
          Registro No. {numeroActual} · {estado}
        </p>
      )}

      <SoloConPermiso permiso="crear.permisos">
      <form className="permiso-form" onSubmit={(e) => void manejarGuardar(e)}>
        <h2>Datos del trabajador</h2>
        <div className="permiso-form__grid">
          <label>
            Trabajador *
            <select
              required
              value={personalId}
              onChange={(e) => manejarCambioPersonal(e.target.value)}
            >
              <option value="">Seleccionar...</option>
              {personas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            No. cédula
            <input
              value={datos.cedula}
              onChange={(e) => actualizarDatos({ cedula: e.target.value })}
            />
          </label>
          <label>
            Fecha elaboración
            <input
              type="date"
              value={datos.fechaElaboracion}
              onChange={(e) => actualizarDatos({ fechaElaboracion: e.target.value })}
            />
          </label>
        </div>

        <h2>Condiciones del permiso</h2>
        {festivoEnFecha && (
          <p className="permisos__aviso-festivo">
            La fecha seleccionada es festivo: <strong>{festivoEnFecha.descripcion}</strong>.
            No hay jornada laboral ese día.
          </p>
        )}
        <div className="permiso-form__grid">
          <label>
            Fecha desde *
            <input
              type="date"
              required
              value={datos.fechaDesde}
              onChange={(e) => actualizarDatos({ fechaDesde: e.target.value })}
            />
          </label>
          <label>
            Fecha hasta *
            <input
              type="date"
              required
              value={datos.fechaHasta}
              onChange={(e) => actualizarDatos({ fechaHasta: e.target.value })}
            />
          </label>
          <label>
            Hora desde *
            <input
              type="time"
              required
              value={datos.horaDesde}
              onChange={(e) => actualizarDatos({ horaDesde: e.target.value })}
            />
          </label>
          <label>
            Hora hasta *
            <input
              type="time"
              required
              value={datos.horaHasta}
              onChange={(e) => actualizarDatos({ horaHasta: e.target.value })}
            />
          </label>
          <label>
            Tiempo concedido
            <input
              readOnly
              value={formatearTiempoConcedido(tiempoCalculado)}
              className="permiso-form__solo-lectura"
            />
          </label>
          <label>
            Hora salida GH
            <input
              type="time"
              value={datos.horaSalidaGh}
              onChange={(e) => actualizarDatos({ horaSalidaGh: e.target.value })}
            />
          </label>
          <label>
            Hora llegada GH (cierre)
            <input
              type="time"
              value={datos.horaLlegadaGh}
              onChange={(e) => actualizarDatos({ horaLlegadaGh: e.target.value })}
            />
          </label>
          {puedeAprobar ? (
            <label>
              Estado
              <select value={estado} onChange={(e) => setEstado(e.target.value as EstadoPermiso)}>
                {ESTADOS_PERMISO.map((item) => (
                  <option key={item.clave} value={item.clave}>
                    {item.etiqueta}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label>
              Estado
              <input
                readOnly
                value="Solicitado (pendiente de aprobación)"
                className="permiso-form__solo-lectura"
              />
            </label>
          )}
        </div>

        <fieldset className="permiso-form__opciones">
          <legend>Tipo de permiso {puedeAprobar ? "" : "(lo define el administrador)"}</legend>
          {puedeAprobar ? (
            <>
              <div className="permiso-form__radios">
                {TIPOS_REMUNERACION.map((item) => (
                  <label key={item.clave}>
                    <input
                      type="radio"
                      name="remunerado"
                      checked={datos.remunerado === item.clave}
                      onChange={() =>
                        actualizarDatos({
                          remunerado: item.clave,
                          tipoDefinidoPorAdmin: true,
                        })
                      }
                    />
                    {item.etiqueta}
                  </label>
                ))}
              </div>
              <div className="permiso-form__radios">
                {MOTIVOS_PERMISO.map((item) => (
                  <label key={item.clave}>
                    <input
                      type="radio"
                      name="motivo"
                      checked={datos.motivo === item.clave}
                      onChange={() =>
                        actualizarDatos({
                          motivo: item.clave,
                          tipoDefinidoPorAdmin: true,
                        })
                      }
                    />
                    {item.etiqueta}
                  </label>
                ))}
              </div>
            </>
          ) : (
            <p className="permisos__ayuda-tipo">
              El administrador elegirá si es remunerado / no remunerado y el motivo al aprobar
              la solicitud.
            </p>
          )}
        </fieldset>

        <label className="permiso-form__ancho">
          Descripción del permiso
          <textarea
            rows={3}
            value={datos.descripcion}
            onChange={(e) => actualizarDatos({ descripcion: e.target.value })}
          />
        </label>
        <label className="permiso-form__ancho">
          Observaciones
          <textarea
            rows={2}
            value={datos.observaciones}
            onChange={(e) => actualizarDatos({ observaciones: e.target.value })}
          />
        </label>

        <div className="permiso-form__acciones">
          <button type="submit" className="btn btn--primario" disabled={guardando}>
            {guardando
              ? "Guardando..."
              : editandoId
                ? "Guardar cambios"
                : puedeAprobar
                  ? "Guardar"
                  : "Enviar solicitud"}
          </button>
          <button
            type="button"
            className="btn"
            disabled={
              imprimiendo || guardando || (!esAdmin && !permisoPuedeImprimirse(estado))
            }
            onClick={() => void manejarImprimir()}
          >
            {imprimiendo ? "Generando..." : "Imprimir formato"}
          </button>
          <button type="button" className="btn" onClick={limpiarFormulario}>
            Nuevo permiso
          </button>
        </div>
      </form>
      </SoloConPermiso>

      {mensaje && <p className="permisos__mensaje permisos__mensaje--ok">{mensaje}</p>}
      {error && <p className="permisos__mensaje permisos__mensaje--error">{error}</p>}

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

      <section className="permisos__lista">
        <h2>
          {puedeAprobar ? "Permisos guardados" : "Mis solicitudes"} ({registrosVisibles.length})
        </h2>
        {registrosVisibles.length === 0 && (
          <p className="formatos__vacio">Aún no hay permisos registrados.</p>
        )}
        <div className="permisos__lista-items">
          {registrosVisibles.slice(0, 15).map((registro) => (
            <article key={registro.id} className="item-permiso">
              <div>
                <strong>No. {registro.numero}</strong> — {registro.datos.nombreTrabajador}
                <p>
                  {registro.datos.fechaDesde} {registro.datos.horaDesde} → {registro.datos.horaHasta}{" "}
                  · {formatearTiempoConcedido(registro.datos.tiempoConcedidoMinutos)}
                  {" · "}
                  {registro.estado}
                </p>
              </div>
              <div className="item-permiso__acciones">
                <button type="button" className="btn" onClick={() => cargarRegistro(registro)}>
                  Editar
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={!esAdmin && !permisoPuedeImprimirse(registro.estado)}
                  onClick={() => void imprimirRegistro(registro)}
                >
                  Imprimir
                </button>
                <SoloConPermiso permiso="eliminar.registros">
                  <button
                    type="button"
                    className="btn btn--peligro"
                    onClick={() => void manejarEliminar(registro)}
                  >
                    Eliminar
                  </button>
                </SoloConPermiso>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

export default Ghre030Page;
