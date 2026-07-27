import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { coincideArea } from "../../lib/areas";
import { SoloConPermiso } from "../auth/SoloConPermiso";
import { borrarBorrador, guardarBorrador, leerBorrador } from "../../lib/borradorFormulario";
import {
  crearCorrectivo,
  siguienteNumeroSolicitud,
} from "../correctivo/correctivoService";
import { ESTADOS_MAQUINA, TIPOS_SOLICITUD, type RegistroCorrectivo } from "../correctivo/types";
import type { HojaVida } from "../hojas/types";
import "../correctivo/correctivo.css";
import "./solicitudes.css";

function textoBusqueda(valor: string | null | undefined): string {
  return (valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function coincideBusquedaMolde(maquina: HojaVida, consulta: string): boolean {
  const q = textoBusqueda(consulta);
  if (!q) return true;
  const campos = [
    maquina.nombre,
    maquina.codigo,
    maquina.datos.ubicacion,
    maquina.datos.marca,
    maquina.datos.modelo,
    maquina.datos.serial,
  ];
  return campos.some((campo) => textoBusqueda(campo).includes(q));
}

function horaActual(): string {
  const ahora = new Date();
  return `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;
}

function fechaHoy(): string {
  return new Date().toISOString().slice(0, 10);
}

interface Props {
  area: string;
  nombreSolicitante: string;
  maquinas: HojaVida[];
  correctivos: RegistroCorrectivo[];
  onCreada: (registro: RegistroCorrectivo) => void;
}

type BorradorSolicitud = {
  fecha: string;
  horaSolicitud: string;
  solicitante: string;
  maquinaId: string;
  maquinaTexto: string;
  codigoMaquina: string;
  estadoMaquina: string;
  tipos: string[];
  descripcion: string;
};

function claveBorradorSolicitud(area: string): string {
  return `epi-borrador-solicitud-${area}`;
}

function NuevaSolicitudAreaForm({
  area,
  nombreSolicitante,
  maquinas,
  correctivos,
  onCreada,
}: Props) {
  const borradorInicial = useRef(leerBorrador<BorradorSolicitud>(claveBorradorSolicitud(area)));
  const [fecha, setFecha] = useState(() => borradorInicial.current?.fecha ?? fechaHoy());
  const [horaSolicitud, setHoraSolicitud] = useState(
    () => borradorInicial.current?.horaSolicitud ?? horaActual(),
  );
  const [solicitante, setSolicitante] = useState(
    () => borradorInicial.current?.solicitante || nombreSolicitante,
  );
  const [maquinaId, setMaquinaId] = useState(() => borradorInicial.current?.maquinaId ?? "");
  const [maquinaTexto, setMaquinaTexto] = useState(
    () => borradorInicial.current?.maquinaTexto ?? "",
  );
  const [codigoMaquina, setCodigoMaquina] = useState(
    () => borradorInicial.current?.codigoMaquina ?? "",
  );
  const [estadoMaquina, setEstadoMaquina] = useState(
    () => borradorInicial.current?.estadoMaquina ?? "",
  );
  const [tipos, setTipos] = useState(() => borradorInicial.current?.tipos ?? []);
  const [descripcion, setDescripcion] = useState(
    () => borradorInicial.current?.descripcion ?? "",
  );
  const [busquedaMolde, setBusquedaMolde] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const esMoldes = coincideArea(area, "Moldes");

  useEffect(() => {
    if (!borradorInicial.current?.solicitante) {
      setSolicitante(nombreSolicitante);
    }
  }, [nombreSolicitante]);

  useEffect(() => {
    const hayContenido =
      Boolean(maquinaTexto.trim()) ||
      Boolean(descripcion.trim()) ||
      tipos.length > 0 ||
      Boolean(estadoMaquina) ||
      Boolean(maquinaId);
    if (!hayContenido) {
      borrarBorrador(claveBorradorSolicitud(area));
      return;
    }
    guardarBorrador(claveBorradorSolicitud(area), {
      fecha,
      horaSolicitud,
      solicitante,
      maquinaId,
      maquinaTexto,
      codigoMaquina,
      estadoMaquina,
      tipos,
      descripcion,
    } satisfies BorradorSolicitud);
  }, [
    area,
    fecha,
    horaSolicitud,
    solicitante,
    maquinaId,
    maquinaTexto,
    codigoMaquina,
    estadoMaquina,
    tipos,
    descripcion,
  ]);

  const maquinasArea = useMemo(
    () =>
      maquinas
        .filter((m) => coincideArea(m.area, area) && m.activa)
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
    [maquinas, area],
  );

  const moldesFiltrados = useMemo(() => {
    if (!esMoldes) return [];
    return maquinasArea.filter((m) => coincideBusquedaMolde(m, busquedaMolde));
  }, [esMoldes, maquinasArea, busquedaMolde]);

  const moldeSeleccionado = useMemo(
    () => (esMoldes ? maquinasArea.find((m) => m.id === maquinaId) ?? null : null),
    [esMoldes, maquinasArea, maquinaId],
  );

  function seleccionarMaquina(id: string) {
    setMaquinaId(id);
    const maquina = maquinas.find((m) => m.id === id);
    if (maquina) {
      setMaquinaTexto(maquina.nombre);
      setCodigoMaquina(maquina.codigo ?? "");
    }
  }

  function seleccionarMolde(maquina: HojaVida) {
    setMaquinaId(maquina.id);
    setMaquinaTexto(maquina.nombre);
    setCodigoMaquina(maquina.codigo ?? "");
  }

  function limpiarMolde() {
    setMaquinaId("");
    setMaquinaTexto("");
    setCodigoMaquina("");
  }

  function alternarTipo(tipo: string) {
    setTipos((prev) => (prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]));
  }

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    setMensaje(null);

    if (tipos.length === 0) {
      setError("Marca al menos un tipo de solicitud.");
      return;
    }
    if (esMoldes && !maquinaId) {
      setError("Busca y selecciona el molde de la hoja de vida.");
      return;
    }
    if (!maquinaTexto.trim()) {
      setError("Indica la máquina, equipo o locación.");
      return;
    }
    if (!descripcion.trim()) {
      setError("Describe el problema o la necesidad.");
      return;
    }

    setGuardando(true);
    try {
      const creado = await crearCorrectivo({
        area,
        fecha,
        datos: {
          numeroSolicitud: siguienteNumeroSolicitud(correctivos),
          horaSolicitud,
          nombreSolicitante: solicitante.trim(),
          horaRespuesta: "",
          tiempoRespuesta: "",
          horaInicioSolicitud: "",
          horaFinSolicitud: "",
          maquinaEquipoLocacion: maquinaTexto.trim(),
          codigoMaquina: codigoMaquina.trim(),
          maquinaId,
          estadoMaquina,
          tiposSolicitud: tipos,
          descripcionSolicitud: descripcion.trim(),
          solucionSolicitud: "",
          fechaCierre: "",
          horaCierre: "",
          quienRevisa: "",
        },
      });
      onCreada(creado);
      setDescripcion("");
      setTipos([]);
      setMaquinaId("");
      setMaquinaTexto("");
      setCodigoMaquina("");
      setBusquedaMolde("");
      setEstadoMaquina("");
      setFecha(fechaHoy());
      setHoraSolicitud(horaActual());
      borrarBorrador(claveBorradorSolicitud(area));
      setMensaje(`Solicitud No. ${creado.datos.numeroSolicitud} registrada. Mantenimiento la atenderá pronto.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo registrar la solicitud");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <SoloConPermiso permiso="crear.solicitudes">
      <form className="repuesto-form solicitud-area-form" onSubmit={(e) => void manejarEnvio(e)}>
        <h2>Nueva solicitud de mantenimiento</h2>
        <p className="solicitudes__descripcion">
          Reporta una falla o necesidad en esta área. El equipo de mantenimiento completará tiempos
          y cierre.
        </p>
        <div className="repuesto-form__grid">
          <label>
            Área
            <input type="text" value={area} readOnly disabled className="solicitud-area-form__area-fija" />
          </label>
          <label>
            Fecha
            <input type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </label>
          <label>
            Hora
            <input
              type="time"
              required
              value={horaSolicitud}
              onChange={(e) => setHoraSolicitud(e.target.value)}
            />
          </label>
          <label>
            Solicitante
            <input
              type="text"
              required
              value={solicitante}
              onChange={(e) => setSolicitante(e.target.value)}
            />
          </label>
          {!esMoldes && (
            <>
              <label>
                Máquina (lista)
                <select value={maquinaId} onChange={(e) => seleccionarMaquina(e.target.value)}>
                  <option value="">— Escribir abajo si no está —</option>
                  {maquinasArea.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.codigo ? `${m.codigo} — ` : ""}
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label className="repuesto-form__completa">
                Máquina / equipo / locación *
                <input
                  required
                  value={maquinaTexto}
                  onChange={(e) => setMaquinaTexto(e.target.value)}
                  placeholder="Nombre o ubicación"
                />
              </label>
            </>
          )}
          <label>
            Estado máquina
            <select
              value={estadoMaquina}
              onChange={(e) => setEstadoMaquina(e.target.value)}
            >
              <option value="">Opcional</option>
              {ESTADOS_MAQUINA.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
          </label>
        </div>

        {esMoldes && (
          <div className="solicitud-moldes">
            <label className="solicitud-moldes__buscar">
              Buscar molde por palabra *
              <input
                type="search"
                value={busquedaMolde}
                onChange={(e) => setBusquedaMolde(e.target.value)}
                placeholder="Código, nombre, ubicación, marca…"
                autoComplete="off"
              />
            </label>

            {moldeSeleccionado && (
              <div className="solicitud-moldes__elegido">
                <div className="solicitud-moldes__foto">
                  {moldeSeleccionado.foto_url ? (
                    <img src={moldeSeleccionado.foto_url} alt={moldeSeleccionado.nombre} />
                  ) : (
                    <span>Sin foto</span>
                  )}
                </div>
                <div className="solicitud-moldes__elegido-info">
                  <strong>{moldeSeleccionado.nombre}</strong>
                  <span>
                    {moldeSeleccionado.codigo || "Sin código"}
                    {moldeSeleccionado.datos.ubicacion
                      ? ` · ${moldeSeleccionado.datos.ubicacion}`
                      : ""}
                  </span>
                </div>
                <button type="button" className="btn" onClick={limpiarMolde}>
                  Cambiar
                </button>
              </div>
            )}

            {!moldeSeleccionado && (
              <>
                <p className="solicitud-moldes__ayuda">
                  {busquedaMolde.trim()
                    ? `${moldesFiltrados.length} resultado(s). Elige el molde.`
                    : `Escribe para filtrar entre ${maquinasArea.length} moldes con foto de hoja de vida.`}
                </p>
                <div className="solicitud-moldes__grid" role="listbox" aria-label="Moldes">
                  {moldesFiltrados.length === 0 ? (
                    <p className="solicitud-moldes__vacio">
                      No hay moldes que coincidan con “{busquedaMolde.trim()}”.
                    </p>
                  ) : (
                    moldesFiltrados.map((molde) => (
                      <button
                        key={molde.id}
                        type="button"
                        role="option"
                        aria-selected={false}
                        className="solicitud-moldes__tarjeta"
                        onClick={() => seleccionarMolde(molde)}
                      >
                        <div className="solicitud-moldes__foto">
                          {molde.foto_url ? (
                            <img src={molde.foto_url} alt="" />
                          ) : (
                            <span>Sin foto</span>
                          )}
                        </div>
                        <div className="solicitud-moldes__info">
                          <strong>{molde.nombre}</strong>
                          <span>{molde.codigo || "Sin código"}</span>
                          {molde.datos.ubicacion && <small>{molde.datos.ubicacion}</small>}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}

        <fieldset className="correctivo-form__tipos">
          <legend>Tipo de solicitud *</legend>
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

        <label className="repuesto-form__completa">
          Descripción del problema *
          <textarea
            required
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Qué ocurre, desde cuándo, si la máquina está parada..."
          />
        </label>

        {error && <p className="solicitudes__error">{error}</p>}
        {mensaje && <p className="solicitudes__mensaje solicitudes__mensaje--ok">{mensaje}</p>}

        <div className="repuesto-form__acciones">
          <button type="submit" className="btn btn--primario" disabled={guardando}>
            {guardando ? "Enviando..." : "Enviar solicitud"}
          </button>
        </div>
      </form>
    </SoloConPermiso>
  );
}

export default NuevaSolicitudAreaForm;
