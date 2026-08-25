import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { coincideArea } from "../../lib/areas";
import { areaUsuario } from "../../lib/usuarioArea";
import { useAuth } from "../auth/AuthContext";
import {
  ETIQUETAS_ESTADO_APROBACION_PM,
  esPendienteAprobacionPm,
  estadoAprobacionPm,
} from "./aprobacionPm";
import FirmaPad from "./FirmaPad";
import {
  aprobarPreventivo,
  listarPreventivo,
  ordenarRegistrosPreventivo,
  rechazarPreventivo,
} from "./preventivoService";
import { numeroReporteDeRegistro } from "./numeroReportePm";
import type { RegistroPreventivo } from "./types";
import "./preventivo.css";

function nombresTecnicos(registro: RegistroPreventivo): string {
  const nombres = registro.datos.personalNombres;
  if (Array.isArray(nombres) && nombres.length > 0) return nombres.join(", ");
  return registro.datos.personalNombre || "—";
}

function AprobacionPmPage() {
  const { puede, perfil, rol } = useAuth();
  const navigate = useNavigate();
  const [registros, setRegistros] = useState<RegistroPreventivo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState<Record<string, string>>({});
  const [registroParaFirmar, setRegistroParaFirmar] = useState<RegistroPreventivo | null>(null);
  const [imagenFirma, setImagenFirma] = useState<string | null>(null);

  const areaLider = areaUsuario(perfil);
  const esAdmin = rol === "admin";

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const lista = await listarPreventivo();
      setRegistros(ordenarRegistrosPreventivo(lista));
    } catch (e) {
      setError("No se pudieron cargar los PM: " + (e as Error).message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const puedeAprobar = puede("aprobar.preventivo");

  const pendientes = useMemo(() => {
    return registros.filter((r) => {
      if (!esPendienteAprobacionPm(r)) return false;
      if (esAdmin) return true;
      if (!areaLider) return false;
      return coincideArea(r.area, areaLider);
    });
  }, [registros, esAdmin, areaLider]);

  const recientes = useMemo(() => {
    return registros
      .filter((r) => {
        const estado = estadoAprobacionPm(r);
        if (estado === "pendiente_aprobacion") return false;
        if (!r.datos.estadoAprobacion) return false;
        if (esAdmin) return true;
        if (!areaLider) return false;
        return coincideArea(r.area, areaLider);
      })
      .slice(0, 30);
  }, [registros, esAdmin, areaLider]);

  if (!puedeAprobar) {
    return <Navigate to="/preventivo" replace />;
  }

  function firmaActual(imagenFirmaPng: string) {
    return {
      usuarioId: perfil!.id,
      nombre: perfil!.nombre || perfil!.usuario || perfil!.email,
      imagenFirma: imagenFirmaPng,
    };
  }

  function abrirPanelFirma(registro: RegistroPreventivo) {
    setError(null);
    setMensaje(null);
    setImagenFirma(null);
    setRegistroParaFirmar(registro);
  }

  function cerrarPanelFirma() {
    if (procesandoId) return;
    setRegistroParaFirmar(null);
    setImagenFirma(null);
  }

  async function confirmarFirmaYAprobar() {
    if (!registroParaFirmar) return;
    if (!imagenFirma) {
      setError("Firme con el dedo en el recuadro antes de confirmar.");
      return;
    }
    setProcesandoId(registroParaFirmar.id);
    setError(null);
    setMensaje(null);
    try {
      const actualizado = await aprobarPreventivo(
        registroParaFirmar,
        firmaActual(imagenFirma),
      );
      setRegistros((prev) =>
        ordenarRegistrosPreventivo(prev.map((r) => (r.id === actualizado.id ? actualizado : r))),
      );
      setMensaje(
        `PM de ${registroParaFirmar.datos.equipo || "máquina"} aprobado con firma. El cronograma ya lo cuenta como cumplido.`,
      );
      setRegistroParaFirmar(null);
      setImagenFirma(null);
    } catch (e) {
      setError("No se pudo aprobar: " + (e as Error).message);
    } finally {
      setProcesandoId(null);
    }
  }

  async function manejarRechazar(registro: RegistroPreventivo) {
    const motivo = (motivoRechazo[registro.id] ?? "").trim();
    if (!motivo) {
      setError("Indica el motivo del rechazo para que mantenimiento pueda corregir.");
      return;
    }
    setProcesandoId(registro.id);
    setError(null);
    setMensaje(null);
    try {
      const actualizado = await rechazarPreventivo(
        registro,
        {
          usuarioId: perfil!.id,
          nombre: perfil!.nombre || perfil!.usuario || perfil!.email,
          imagenFirma: "",
        },
        motivo,
      );
      setRegistros((prev) =>
        ordenarRegistrosPreventivo(prev.map((r) => (r.id === actualizado.id ? actualizado : r))),
      );
      setMensaje("PM rechazado. Mantenimiento debe corregirlo y reenviarlo.");
      setMotivoRechazo((prev) => {
        const siguiente = { ...prev };
        delete siguiente[registro.id];
        return siguiente;
      });
    } catch (e) {
      setError("No se pudo rechazar: " + (e as Error).message);
    } finally {
      setProcesandoId(null);
    }
  }

  function abrirFormato(registro: RegistroPreventivo) {
    if (registro.datos.mtre045) {
      navigate("/formatos/mt-re-045", { state: { mtre045Datos: registro.datos.mtre045 } });
      return;
    }
    setError("Este registro aún no tiene el formato MT-RE-045 generado.");
  }

  const ocupadoFirma = Boolean(registroParaFirmar && procesandoId === registroParaFirmar.id);

  return (
    <section className="preventivo">
      <h1>Aprobación de mantenimiento preventivo</h1>
      <p className="preventivo__descripcion">
        Revisa el formato <strong>MT-RE-045</strong>, fírmalo con el dedo o recházalo con motivo.
        Solo al aprobar se marca la cita del cronograma como cumplida.
        {areaLider && !esAdmin ? (
          <>
            {" "}
            Tu área: <strong>{areaLider}</strong>.
          </>
        ) : null}
        {" · "}
        <Link to="/preventivo">Ver registros PM</Link>
      </p>

      {!esAdmin && !areaLider && (
        <p className="preventivo__mensaje preventivo__mensaje--error">
          Tu usuario líder no tiene área asignada. Pide al administrador que te asigne el área en
          Usuarios portal.
        </p>
      )}

      {mensaje && <p className="preventivo__mensaje preventivo__mensaje--ok">{mensaje}</p>}
      {error && <p className="preventivo__mensaje preventivo__mensaje--error">{error}</p>}

      <h2 className="preventivo__subtitulo">
        Pendientes de firma{" "}
        <span className="preventivo__chip preventivo__chip--pendiente">{pendientes.length}</span>
      </h2>

      {cargando && <p>Cargando...</p>}
      {!cargando && pendientes.length === 0 && (
        <p className="preventivo__vacio">No hay PM pendientes de aprobación.</p>
      )}

      {pendientes.length > 0 && (
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
                <th>Decisión</th>
              </tr>
            </thead>
            <tbody>
              {pendientes.map((registro) => {
                const ocupado = procesandoId === registro.id;
                return (
                  <tr key={registro.id} className="preventivo__fila--pendiente">
                    <td>{registro.fecha}</td>
                    <td>{registro.datos.numeroReporte || "—"}</td>
                    <td>{registro.area}</td>
                    <td>
                      {registro.datos.equipo || "—"}
                      {registro.datos.codigo ? ` (${registro.datos.codigo})` : ""}
                    </td>
                    <td>{nombresTecnicos(registro)}</td>
                    <td>{registro.descripcion || "—"}</td>
                    <td className="preventivo__acciones preventivo__acciones--aprobacion">
                      <button
                        type="button"
                        className="btn"
                        disabled={ocupado}
                        onClick={() => abrirFormato(registro)}
                      >
                        Ver MT-RE-045
                      </button>
                      <button
                        type="button"
                        className="btn btn--primario"
                        disabled={ocupado}
                        onClick={() => abrirPanelFirma(registro)}
                      >
                        Aprobar / Firmar
                      </button>
                      <label className="preventivo__motivo-rechazo">
                        Motivo rechazo
                        <input
                          value={motivoRechazo[registro.id] ?? ""}
                          onChange={(e) =>
                            setMotivoRechazo((prev) => ({
                              ...prev,
                              [registro.id]: e.target.value,
                            }))
                          }
                          placeholder="Ej. Falta detalle de actividad"
                          disabled={ocupado}
                        />
                      </label>
                      <button
                        type="button"
                        className="btn btn--peligro"
                        disabled={ocupado}
                        onClick={() => void manejarRechazar(registro)}
                      >
                        Rechazar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="preventivo__subtitulo">Decisiones recientes</h2>
      {!cargando && recientes.length === 0 && (
        <p className="preventivo__vacio">Aún no hay aprobaciones o rechazos registrados.</p>
      )}
      {recientes.length > 0 && (
        <div className="preventivo__tabla-contenedor">
          <table className="preventivo__tabla">
            <thead>
              <tr>
                <th>Fecha PM</th>
                <th>Nº</th>
                <th>Área</th>
                <th>Máquina</th>
                <th>Estado</th>
                <th>Firma / decisión</th>
              </tr>
            </thead>
            <tbody>
              {recientes.map((registro) => {
                const estado = estadoAprobacionPm(registro);
                const firmaImg =
                  registro.datos.firmaAprobacion || registro.datos.mtre045?.firmaVerificacion;
                return (
                  <tr key={registro.id}>
                    <td>{registro.fecha}</td>
                    <td>{numeroReporteDeRegistro(registro) || registro.datos.numeroReporte || "—"}</td>
                    <td>{registro.area}</td>
                    <td>{registro.datos.equipo || "—"}</td>
                    <td>
                      <span className={`preventivo__chip preventivo__chip--${estado}`}>
                        {ETIQUETAS_ESTADO_APROBACION_PM[estado]}
                      </span>
                      {estado === "rechazado" && registro.datos.motivoRechazo ? (
                        <small className="preventivo__motivo-texto">
                          {registro.datos.motivoRechazo}
                        </small>
                      ) : null}
                    </td>
                    <td>
                      {estado === "aprobado" ? (
                        <div className="preventivo__firma-resumen">
                          {firmaImg ? (
                            <img
                              src={firmaImg}
                              alt="Firma del líder"
                              className="preventivo__firma-miniatura"
                            />
                          ) : null}
                          <span>
                            {registro.datos.aprobadoPorNombre || "—"} ·{" "}
                            {(registro.datos.aprobadoEn ?? "").slice(0, 10)}
                          </span>
                        </div>
                      ) : (
                        `${registro.datos.rechazadoPorNombre || "—"} · ${(registro.datos.rechazadoEn ?? "").slice(0, 10)}`
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {registroParaFirmar && (
        <div
          className="firma-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="firma-modal-titulo"
        >
          <button
            type="button"
            className="firma-modal__fondo"
            aria-label="Cerrar"
            onClick={cerrarPanelFirma}
          />
          <div className="firma-modal__panel">
            <h2 id="firma-modal-titulo">Firmar aprobación</h2>
            <p className="firma-modal__detalle">
              <strong>{registroParaFirmar.datos.equipo || "Máquina"}</strong>
              {" · "}
              {registroParaFirmar.area}
              {" · "}
              {registroParaFirmar.fecha}
              {registroParaFirmar.datos.numeroReporte
                ? ` · Nº ${registroParaFirmar.datos.numeroReporte}`
                : ""}
            </p>
            <p className="firma-modal__ayuda">
              Dibuje su firma con el dedo. Quedará guardada en el MT-RE-045 como responsable de
              verificación.
            </p>
            <FirmaPad
              reinicioClave={registroParaFirmar.id}
              onChange={setImagenFirma}
            />
            <div className="firma-modal__acciones">
              <button
                type="button"
                className="btn"
                disabled={ocupadoFirma}
                onClick={cerrarPanelFirma}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn--primario"
                disabled={ocupadoFirma || !imagenFirma}
                onClick={() => void confirmarFirmaYAprobar()}
              >
                {ocupadoFirma ? "Guardando..." : "Confirmar firma y aprobar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default AprobacionPmPage;
