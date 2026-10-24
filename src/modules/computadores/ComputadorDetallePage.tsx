import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { SoloConPermiso } from "../auth/SoloConPermiso";
import {
  actualizarComputador,
  cambiarEstadoComputador,
  crearPiezaComputador,
  crearPmComputador,
  eliminarPiezaComputador,
  eliminarPmComputador,
  listarPiezasComputador,
  listarPmComputador,
  obtenerComputador,
} from "./computadoresService";
import { esErrorTablaComputadores } from "./computadoresSetup";
import { pmProximoEnDias, pmVencido } from "./computadoresUtil";
import {
  ETIQUETAS_MOTIVO_PIEZA,
  ETIQUETAS_TIPO_COMPUTADOR,
  MOTIVOS_PIEZA,
  TIPOS_PIEZA,
  type Computador,
  type ComputadorPieza,
  type ComputadorPiezaInput,
  type ComputadorPm,
  type ComputadorPmInput,
  type MotivoPieza,
} from "./types";
import "./computadores.css";

type Tab = "datos" | "pm" | "piezas";

function fechaHoy(): string {
  return new Date().toISOString().slice(0, 10);
}

function ComputadorDetallePage() {
  const { id } = useParams<{ id: string }>();
  const { puede } = useAuth();

  const [pc, setPc] = useState<Computador | null>(null);
  const [pms, setPms] = useState<ComputadorPm[]>([]);
  const [piezas, setPiezas] = useState<ComputadorPieza[]>([]);
  const [tab, setTab] = useState<Tab>("datos");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const [pmForm, setPmForm] = useState<ComputadorPmInput>({
    fecha: fechaHoy(),
    tecnico: "",
    actividades: "Limpieza, revisión general, antivirus",
    observaciones: "",
  });

  const [piezaForm, setPiezaForm] = useState<ComputadorPiezaInput>({
    fecha: fechaHoy(),
    tipo_pieza: "SSD",
    detalle: "",
    serial: "",
    motivo: "falla",
    tecnico: "",
    notas: "",
  });

  async function cargar(computadorId: string) {
    setCargando(true);
    setError(null);
    try {
      const encontrado = await obtenerComputador(computadorId);
      if (!encontrado) {
        setError("No se encontró ese computador.");
        setPc(null);
        return;
      }
      setPc(encontrado);
      const [listaPm, listaPiezas] = await Promise.all([
        listarPmComputador(computadorId),
        listarPiezasComputador(computadorId),
      ]);
      setPms(listaPm);
      setPiezas(listaPiezas);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al cargar";
      setError(esErrorTablaComputadores(msg) ? "Faltan las tablas de Computadores en Supabase." : msg);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    if (!id) {
      setError("No se indicó el computador.");
      setCargando(false);
      return;
    }
    void cargar(id);
  }, [id]);

  async function guardarDatos(evento: FormEvent) {
    evento.preventDefault();
    if (!pc) return;
    setGuardando(true);
    setError(null);
    try {
      const actualizado = await actualizarComputador(pc.id, {
        codigo: pc.codigo,
        ubicacion: pc.ubicacion,
        tipo: pc.tipo,
        usuario_asignado: pc.usuario_asignado,
        frecuencia_pm_meses: pc.frecuencia_pm_meses,
        ultimo_pm: pc.ultimo_pm,
        proximo_pm: pc.proximo_pm,
        datos: pc.datos,
      });
      setPc(actualizado);
      setMensaje("Datos actualizados.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  }

  async function registrarPm(evento: FormEvent) {
    evento.preventDefault();
    if (!pc) return;
    setGuardando(true);
    setError(null);
    try {
      const { pm, computador } = await crearPmComputador(pc.id, pmForm, pc.frecuencia_pm_meses);
      setPms((prev) => [pm, ...prev]);
      setPc(computador);
      setPmForm({
        fecha: fechaHoy(),
        tecnico: "",
        actividades: "Limpieza, revisión general, antivirus",
        observaciones: "",
      });
      setMensaje("PM registrado. Se actualizó el próximo vencimiento.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo registrar el PM");
    } finally {
      setGuardando(false);
    }
  }

  async function registrarPieza(evento: FormEvent) {
    evento.preventDefault();
    if (!pc) return;
    if (!piezaForm.tipo_pieza.trim()) {
      setError("Indica el tipo de pieza.");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const creada = await crearPiezaComputador(pc.id, piezaForm);
      setPiezas((prev) => [creada, ...prev]);
      setPiezaForm({
        fecha: fechaHoy(),
        tipo_pieza: "SSD",
        detalle: "",
        serial: "",
        motivo: "falla",
        tecnico: "",
        notas: "",
      });
      setMensaje("Pieza registrada.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo registrar la pieza");
    } finally {
      setGuardando(false);
    }
  }

  async function toggleBaja() {
    if (!pc) return;
    if (pc.activa) {
      const motivo = window.prompt(`Motivo de baja para ${pc.codigo || pc.ubicacion}:`);
      if (motivo === null) return;
      const actualizado = await cambiarEstadoComputador(pc, false, motivo);
      setPc(actualizado);
      setMensaje("Computador marcado como baja.");
    } else {
      const actualizado = await cambiarEstadoComputador(pc, true);
      setPc(actualizado);
      setMensaje("Computador reactivado.");
    }
  }

  if (cargando) {
    return (
      <section className="computadores">
        <p>Cargando ficha...</p>
      </section>
    );
  }

  if (error && !pc) {
    return (
      <section className="computadores">
        <Link className="pc-detalle__volver" to="/computadores">
          ← Volver al inventario
        </Link>
        <p className="computadores__mensaje computadores__mensaje--error">{error}</p>
      </section>
    );
  }

  if (!pc) return null;

  const estadoPm = !pc.proximo_pm
    ? "Sin programar"
    : pmVencido(pc.proximo_pm)
      ? "Vencido"
      : pmProximoEnDias(pc.proximo_pm, 30)
        ? "Próximo"
        : "Al día";

  return (
    <section className="computadores">
      <Link className="pc-detalle__volver" to="/computadores">
        ← Volver al inventario
      </Link>

      <div className="pc-detalle__titulo">
        <div>
          <h1>{pc.codigo || "Sin código"}</h1>
          <p className="pc-detalle__subtitulo">
            {ETIQUETAS_TIPO_COMPUTADOR[pc.tipo]} · {pc.ubicacion}
            {pc.usuario_asignado ? ` · ${pc.usuario_asignado}` : ""}
            {!pc.activa ? " · Fuera de servicio" : ""}
          </p>
        </div>
        <SoloConPermiso permiso="editar.computadores">
          <button type="button" className="btn" onClick={() => void toggleBaja()}>
            {pc.activa ? "Dar de baja" : "Reactivar"}
          </button>
        </SoloConPermiso>
      </div>

      {mensaje && <p className="computadores__mensaje computadores__mensaje--ok">{mensaje}</p>}
      {error && <p className="computadores__mensaje computadores__mensaje--error">{error}</p>}

      <div className="computadores__stats">
        <div className="computadores__stat">
          <span>Último PM</span>
          <strong>{pc.ultimo_pm || "—"}</strong>
        </div>
        <div
          className={
            "computadores__stat" +
            (estadoPm === "Vencido"
              ? " computadores__stat--alerta"
              : estadoPm === "Al día"
                ? " computadores__stat--ok"
                : "")
          }
        >
          <span>Próximo PM ({estadoPm})</span>
          <strong>{pc.proximo_pm || "—"}</strong>
        </div>
        <div className="computadores__stat computadores__stat--info">
          <span>Visitas PM</span>
          <strong>{pms.length}</strong>
        </div>
        <div className="computadores__stat computadores__stat--ok">
          <span>Piezas cambiadas</span>
          <strong>{piezas.length}</strong>
        </div>
      </div>

      <div className="pc-tabs">
        <button
          type="button"
          className={"pc-tab" + (tab === "datos" ? " pc-tab--activa" : "")}
          onClick={() => setTab("datos")}
        >
          Datos
        </button>
        <button
          type="button"
          className={"pc-tab" + (tab === "pm" ? " pc-tab--activa" : "")}
          onClick={() => setTab("pm")}
        >
          PM
        </button>
        <button
          type="button"
          className={"pc-tab" + (tab === "piezas" ? " pc-tab--activa" : "")}
          onClick={() => setTab("piezas")}
        >
          Piezas
        </button>
      </div>

      {tab === "datos" && (
        <div className="pc-panel pc-panel--datos">
          {puede("editar.computadores") ? (
            <form className="pc-datos-form" onSubmit={guardarDatos}>
              <div className="pc-datos-bloque">
                <h3 className="pc-datos-bloque__titulo">Identificación</h3>
                <div className="pc-datos-grid">
                  <label className="pc-campo">
                    <span>Código</span>
                    <input
                      value={pc.codigo}
                      onChange={(e) => setPc({ ...pc, codigo: e.target.value })}
                    />
                  </label>
                  <label className="pc-campo pc-campo--ancho">
                    <span>Ubicación</span>
                    <input
                      value={pc.ubicacion}
                      onChange={(e) => setPc({ ...pc, ubicacion: e.target.value })}
                      required
                    />
                  </label>
                  <label className="pc-campo pc-campo--ancho">
                    <span>Usuario asignado</span>
                    <input
                      value={pc.usuario_asignado}
                      onChange={(e) => setPc({ ...pc, usuario_asignado: e.target.value })}
                    />
                  </label>
                  <label className="pc-campo">
                    <span>Frecuencia PM (meses)</span>
                    <input
                      type="number"
                      min={1}
                      value={pc.frecuencia_pm_meses}
                      onChange={(e) =>
                        setPc({ ...pc, frecuencia_pm_meses: Number(e.target.value) || 6 })
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="pc-datos-bloque">
                <h3 className="pc-datos-bloque__titulo">Equipo</h3>
                <div className="pc-datos-grid">
                  <label className="pc-campo">
                    <span>Marca</span>
                    <input
                      value={pc.datos.marca ?? ""}
                      onChange={(e) =>
                        setPc({ ...pc, datos: { ...pc.datos, marca: e.target.value } })
                      }
                    />
                  </label>
                  <label className="pc-campo">
                    <span>Modelo</span>
                    <input
                      value={pc.datos.modelo ?? ""}
                      onChange={(e) =>
                        setPc({ ...pc, datos: { ...pc.datos, modelo: e.target.value } })
                      }
                    />
                  </label>
                  <label className="pc-campo">
                    <span>Serial</span>
                    <input
                      value={pc.datos.serial ?? ""}
                      onChange={(e) =>
                        setPc({ ...pc, datos: { ...pc.datos, serial: e.target.value } })
                      }
                    />
                  </label>
                  <label className="pc-campo">
                    <span>Sistema operativo</span>
                    <input
                      value={pc.datos.sistemaOperativo ?? ""}
                      onChange={(e) =>
                        setPc({
                          ...pc,
                          datos: { ...pc.datos, sistemaOperativo: e.target.value },
                        })
                      }
                    />
                  </label>
                  <label className="pc-campo">
                    <span>IP</span>
                    <input
                      value={pc.datos.ip ?? ""}
                      onChange={(e) =>
                        setPc({ ...pc, datos: { ...pc.datos, ip: e.target.value } })
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="pc-datos-bloque">
                <h3 className="pc-datos-bloque__titulo">Observaciones</h3>
                <label className="pc-campo pc-campo--full">
                  <span>Notas del equipo</span>
                  <textarea
                    rows={4}
                    value={pc.datos.observaciones ?? ""}
                    onChange={(e) =>
                      setPc({
                        ...pc,
                        datos: { ...pc.datos, observaciones: e.target.value },
                      })
                    }
                    placeholder="Estado general, accesorios, observaciones de soporte…"
                  />
                </label>
              </div>

              <div className="pc-form__acciones">
                <button type="submit" className="btn btn--primario" disabled={guardando}>
                  Guardar cambios
                </button>
              </div>
            </form>
          ) : (
            <dl className="pc-dl">
              <div>
                <dt>Tipo</dt>
                <dd>{ETIQUETAS_TIPO_COMPUTADOR[pc.tipo]}</dd>
              </div>
              <div>
                <dt>Marca / Modelo</dt>
                <dd>
                  {[pc.datos.marca, pc.datos.modelo].filter(Boolean).join(" ") || "—"}
                </dd>
              </div>
              <div>
                <dt>Serial</dt>
                <dd>{pc.datos.serial || "—"}</dd>
              </div>
              <div>
                <dt>SO</dt>
                <dd>{pc.datos.sistemaOperativo || "—"}</dd>
              </div>
              <div>
                <dt>IP</dt>
                <dd>{pc.datos.ip || "—"}</dd>
              </div>
              <div>
                <dt>Observaciones</dt>
                <dd>{pc.datos.observaciones || "—"}</dd>
              </div>
            </dl>
          )}
        </div>
      )}

      {tab === "pm" && (
        <div className="pc-panel">
          <SoloConPermiso permiso="editar.computadores">
            <form className="pc-form" onSubmit={registrarPm} style={{ border: "none", padding: 0 }}>
              <h2>Registrar PM</h2>
              <div className="pc-form__grid">
                <label>
                  Fecha
                  <input
                    type="date"
                    required
                    value={pmForm.fecha}
                    onChange={(e) => setPmForm((f) => ({ ...f, fecha: e.target.value }))}
                  />
                </label>
                <label>
                  Técnico
                  <input
                    value={pmForm.tecnico}
                    onChange={(e) => setPmForm((f) => ({ ...f, tecnico: e.target.value }))}
                  />
                </label>
              </div>
              <label>
                Actividades
                <textarea
                  value={pmForm.actividades}
                  onChange={(e) => setPmForm((f) => ({ ...f, actividades: e.target.value }))}
                />
              </label>
              <label>
                Observaciones
                <textarea
                  value={pmForm.observaciones}
                  onChange={(e) =>
                    setPmForm((f) => ({ ...f, observaciones: e.target.value }))
                  }
                />
              </label>
              <button type="submit" className="btn btn--primario" disabled={guardando}>
                Guardar PM
              </button>
            </form>
          </SoloConPermiso>

          <h2>Historial PM</h2>
          {pms.length === 0 ? (
            <p className="computadores__vacio">Aún no hay visitas registradas.</p>
          ) : (
            <ul className="pc-lista-hist">
              {pms.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.fecha}</strong>
                    <p>
                      {item.tecnico || "Sin técnico"}
                      {item.actividades ? ` · ${item.actividades}` : ""}
                    </p>
                    {item.observaciones && <p>{item.observaciones}</p>}
                  </div>
                  <SoloConPermiso permiso="eliminar.registros">
                    <button
                      type="button"
                      className="btn btn--peligro"
                      onClick={() => {
                        if (!window.confirm("¿Eliminar este PM?")) return;
                        void eliminarPmComputador(item.id).then(() =>
                          setPms((prev) => prev.filter((p) => p.id !== item.id)),
                        );
                      }}
                    >
                      Eliminar
                    </button>
                  </SoloConPermiso>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "piezas" && (
        <div className="pc-panel">
          <SoloConPermiso permiso="editar.computadores">
            <form
              className="pc-form"
              onSubmit={registrarPieza}
              style={{ border: "none", padding: 0 }}
            >
              <h2>Registrar pieza cambiada</h2>
              <div className="pc-form__grid">
                <label>
                  Fecha
                  <input
                    type="date"
                    required
                    value={piezaForm.fecha}
                    onChange={(e) => setPiezaForm((f) => ({ ...f, fecha: e.target.value }))}
                  />
                </label>
                <label>
                  Tipo de pieza
                  <select
                    value={piezaForm.tipo_pieza}
                    onChange={(e) =>
                      setPiezaForm((f) => ({ ...f, tipo_pieza: e.target.value }))
                    }
                  >
                    {TIPOS_PIEZA.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Detalle (marca/capacidad)
                  <input
                    value={piezaForm.detalle}
                    onChange={(e) => setPiezaForm((f) => ({ ...f, detalle: e.target.value }))}
                    placeholder="SSD 512GB Kingston"
                  />
                </label>
                <label>
                  Serial
                  <input
                    value={piezaForm.serial}
                    onChange={(e) => setPiezaForm((f) => ({ ...f, serial: e.target.value }))}
                  />
                </label>
                <label>
                  Motivo
                  <select
                    value={piezaForm.motivo}
                    onChange={(e) =>
                      setPiezaForm((f) => ({
                        ...f,
                        motivo: e.target.value as MotivoPieza,
                      }))
                    }
                  >
                    {MOTIVOS_PIEZA.map((m) => (
                      <option key={m} value={m}>
                        {ETIQUETAS_MOTIVO_PIEZA[m]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Técnico
                  <input
                    value={piezaForm.tecnico}
                    onChange={(e) => setPiezaForm((f) => ({ ...f, tecnico: e.target.value }))}
                  />
                </label>
              </div>
              <label>
                Notas
                <textarea
                  value={piezaForm.notas}
                  onChange={(e) => setPiezaForm((f) => ({ ...f, notas: e.target.value }))}
                />
              </label>
              <button type="submit" className="btn btn--primario" disabled={guardando}>
                Guardar pieza
              </button>
            </form>
          </SoloConPermiso>

          <h2>Historial de piezas</h2>
          {piezas.length === 0 ? (
            <p className="computadores__vacio">Aún no hay piezas registradas.</p>
          ) : (
            <ul className="pc-lista-hist">
              {piezas.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>
                      {item.fecha} · {item.tipo_pieza}
                      {item.detalle ? ` — ${item.detalle}` : ""}
                    </strong>
                    <p>
                      {ETIQUETAS_MOTIVO_PIEZA[item.motivo]}
                      {item.serial ? ` · Serial: ${item.serial}` : ""}
                      {item.tecnico ? ` · ${item.tecnico}` : ""}
                    </p>
                    {item.notas && <p>{item.notas}</p>}
                  </div>
                  <SoloConPermiso permiso="eliminar.registros">
                    <button
                      type="button"
                      className="btn btn--peligro"
                      onClick={() => {
                        if (!window.confirm("¿Eliminar este registro de pieza?")) return;
                        void eliminarPiezaComputador(item.id).then(() =>
                          setPiezas((prev) => prev.filter((p) => p.id !== item.id)),
                        );
                      }}
                    >
                      Eliminar
                    </button>
                  </SoloConPermiso>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

export default ComputadorDetallePage;
