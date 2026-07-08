import { useEffect, useMemo, useState, type FormEvent } from "react";
import { SoloConPermiso } from "../auth/SoloConPermiso";
import {
  crearCorrectivo,
  siguienteNumeroSolicitud,
} from "../correctivo/correctivoService";
import { ESTADOS_MAQUINA, TIPOS_SOLICITUD, type RegistroCorrectivo } from "../correctivo/types";
import type { HojaVida } from "../hojas/types";
import "../correctivo/correctivo.css";
import "./solicitudes.css";

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

function NuevaSolicitudAreaForm({
  area,
  nombreSolicitante,
  maquinas,
  correctivos,
  onCreada,
}: Props) {
  const [fecha, setFecha] = useState(fechaHoy);
  const [horaSolicitud, setHoraSolicitud] = useState(horaActual);
  const [solicitante, setSolicitante] = useState(nombreSolicitante);
  const [maquinaId, setMaquinaId] = useState("");
  const [maquinaTexto, setMaquinaTexto] = useState("");
  const [codigoMaquina, setCodigoMaquina] = useState("");
  const [estadoMaquina, setEstadoMaquina] = useState("");
  const [tipos, setTipos] = useState<string[]>([]);
  const [descripcion, setDescripcion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    setSolicitante(nombreSolicitante);
  }, [nombreSolicitante]);

  const maquinasArea = useMemo(
    () => maquinas.filter((m) => m.area === area),
    [maquinas, area],
  );

  function seleccionarMaquina(id: string) {
    setMaquinaId(id);
    const maquina = maquinas.find((m) => m.id === id);
    if (maquina) {
      setMaquinaTexto(maquina.nombre);
      setCodigoMaquina(maquina.codigo ?? "");
    }
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
      setEstadoMaquina("");
      setFecha(fechaHoy());
      setHoraSolicitud(horaActual());
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
          Reporta una falla o necesidad del área <strong>{area}</strong>. El equipo de mantenimiento
          completará tiempos y cierre.
        </p>
        <div className="repuesto-form__grid">
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
