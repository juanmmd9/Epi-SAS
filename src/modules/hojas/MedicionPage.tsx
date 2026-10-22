import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AREAS_PLANTA } from "../../lib/areas";
import { SoloConPermiso } from "../auth/SoloConPermiso";
import {
  areasSinInstrumento,
  esEquipoMedicion,
  estadoMedicion,
  etiquetaEstado,
  fechaIso,
  ultimaVerificacion,
  verificacionesDe,
  type EstadoMedicion,
} from "./medicion";
import { actualizarHoja, crearHoja, listarHojas } from "./hojasService";
import type { HojaVida, HojaVidaDatos, VerificacionMedicion } from "./types";
import "./hojas.css";

const FORMULARIO_VACIO = {
  fecha: fechaIso(new Date()),
  proxima: "",
  patron: "",
  puntos: "",
  resultado: "" as VerificacionMedicion["resultado"],
  responsable: "",
  observacion: "",
};

function MedicionPage() {
  const [hojas, setHojas] = useState<HojaVida[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [area, setArea] = useState("");
  const [indice, setIndice] = useState(0);
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [alta, setAlta] = useState({
    area: "Confeccion",
    codigo: "",
    nombre: "Cinta métrica",
    marca: "",
    serial: "",
    ubicacion: "",
  });

  useEffect(() => {
    listarHojas()
      .then(setHojas)
      .catch((e: Error) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  const instrumentos = useMemo(() => {
    return hojas
      .filter(esEquipoMedicion)
      .filter((hoja) => !area || hoja.area === area)
      .sort(
        (a, b) =>
          a.area.localeCompare(b.area, "es") ||
          (a.codigo ?? "").localeCompare(b.codigo ?? "", "es") ||
          a.nombre.localeCompare(b.nombre, "es"),
      );
  }, [hojas, area]);

  const actual = instrumentos[indice] ?? null;
  const vacias = areasSinInstrumento(hojas);

  useEffect(() => {
    setIndice(0);
  }, [area]);

  useEffect(() => {
    if (indice > instrumentos.length - 1) setIndice(Math.max(0, instrumentos.length - 1));
  }, [indice, instrumentos.length]);

  function ir(delta: number) {
    setIndice((previo) => {
      const siguiente = previo + delta;
      if (siguiente < 0 || siguiente >= instrumentos.length) return previo;
      return siguiente;
    });
    setFormulario({ ...FORMULARIO_VACIO, fecha: fechaIso(new Date()) });
    setAviso(null);
  }

  async function guardarVerificacion() {
    if (!actual) return;
    if (!formulario.fecha || !formulario.proxima || !formulario.resultado) {
      setError("Fecha, próxima verificación y resultado son obligatorios.");
      return;
    }
    setGuardando(true);
    setError(null);
    const registro: VerificacionMedicion = {
      id: crypto.randomUUID(),
      ...formulario,
    };
    const datos: HojaVidaDatos = {
      ...actual.datos,
      esMedicion: true,
      verificaciones: [registro, ...verificacionesDe(actual)],
    };
    try {
      const guardada = await actualizarHoja(actual.id, { datos });
      setHojas((previas) => previas.map((hoja) => (hoja.id === guardada.id ? guardada : hoja)));
      setFormulario({ ...FORMULARIO_VACIO, fecha: fechaIso(new Date()) });
      setAviso("Verificación guardada en la hoja de vida.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  }

  async function crearInstrumento() {
    if (!alta.nombre.trim() || !alta.codigo.trim()) {
      setError("El instrumento necesita nombre y código.");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const creada = await crearHoja(
        {
          nombre: alta.nombre.trim(),
          codigo: alta.codigo.trim(),
          area: alta.area,
          frecuencia_pm_meses: 12,
          primer_pm: null,
          datos: {
            esMedicion: true,
            marca: alta.marca.trim(),
            serial: alta.serial.trim(),
            ubicacion: alta.ubicacion.trim(),
            verificaciones: [],
          },
        },
        null,
      );
      setHojas((previas) => [creada, ...previas]);
      setArea(creada.area);
      setAlta({ ...alta, codigo: "", marca: "", serial: "", ubicacion: "" });
      setAviso("Instrumento creado. Quedó en la lista para revisarlo.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="hojas medicion">
      <Link className="hoja-detalle__volver" to="/hojas-de-vida">
        ← Hojas de vida
      </Link>
      <h1>Verificación de equipos de medición</h1>
      <p className="hojas__descripcion">
        Revisa uno por uno. Cada báscula, balanza o cinta métrica tiene su hoja de vida y aquí
        queda el informe: patrón, mediciones, resultado y próxima fecha.
      </p>

      {error && <p className="hojas__mensaje hojas__mensaje--error">{error}</p>}
      {aviso && <p className="hojas__mensaje">{aviso}</p>}
      {cargando && <p>Cargando instrumentos…</p>}

      {!cargando && (
        <>
          <div className="medicion__filtros">
            <label>
              Área
              <select value={area} onChange={(e) => setArea(e.target.value)}>
                <option value="">Todas</option>
                {AREAS_PLANTA.map((nombre) => (
                  <option key={nombre} value={nombre}>
                    {nombre}
                  </option>
                ))}
              </select>
            </label>
            <p>
              {instrumentos.length === 0
                ? "No hay instrumentos en este filtro."
                : `${indice + 1} de ${instrumentos.length}`}
            </p>
            <div className="medicion__nav">
              <button type="button" className="btn" onClick={() => ir(-1)} disabled={indice === 0}>
                Anterior
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => ir(1)}
                disabled={indice >= instrumentos.length - 1}
              >
                Siguiente
              </button>
            </div>
          </div>

          <div className="medicion__layout">
            <ul className="medicion__lista">
              {instrumentos.map((hoja, i) => {
                const estado = estadoMedicion(hoja);
                return (
                  <li key={hoja.id}>
                    <button
                      type="button"
                      className={i === indice ? "medicion__item medicion__item--activo" : "medicion__item"}
                      onClick={() => {
                        setIndice(i);
                        setFormulario({ ...FORMULARIO_VACIO, fecha: fechaIso(new Date()) });
                      }}
                    >
                      <strong>
                        {hoja.codigo || "Sin código"} · {hoja.nombre}
                      </strong>
                      <span>{hoja.area}</span>
                      <em className={`medicion__estado medicion__estado--${estado}`}>
                        {etiquetaEstado(estado)}
                      </em>
                    </button>
                  </li>
                );
              })}
            </ul>

            {actual ? (
              <Revision
                hoja={actual}
                formulario={formulario}
                guardando={guardando}
                onChange={setFormulario}
                onGuardar={() => void guardarVerificacion()}
              />
            ) : (
              <p>Agrega el primer instrumento de esta área.</p>
            )}
          </div>

          {vacias.length > 0 && (
            <p className="hojas__descripcion">
              Sin instrumentos todavía: {vacias.join(", ")}.
            </p>
          )}
          <SoloConPermiso permiso="editar.hojas">
          <section className="hoja-form medicion__alta">
            <h2>Agregar instrumento que falta</h2>
            <div className="hoja-form__grid">
              <label>
                Área
                <select
                  value={alta.area}
                  onChange={(e) => setAlta({ ...alta, area: e.target.value })}
                >
                  {AREAS_PLANTA.map((nombre) => (
                    <option key={nombre}>{nombre}</option>
                  ))}
                </select>
              </label>
              <label>
                Código
                <input
                  value={alta.codigo}
                  onChange={(e) => setAlta({ ...alta, codigo: e.target.value })}
                />
              </label>
              <label>
                Nombre
                <input
                  value={alta.nombre}
                  onChange={(e) => setAlta({ ...alta, nombre: e.target.value })}
                />
              </label>
              <label>
                Marca
                <input
                  value={alta.marca}
                  onChange={(e) => setAlta({ ...alta, marca: e.target.value })}
                />
              </label>
              <label>
                Serie
                <input
                  value={alta.serial}
                  onChange={(e) => setAlta({ ...alta, serial: e.target.value })}
                />
              </label>
              <label>
                Ubicación
                <input
                  value={alta.ubicacion}
                  onChange={(e) => setAlta({ ...alta, ubicacion: e.target.value })}
                />
              </label>
            </div>
            <button
              type="button"
              className="btn btn--primario"
              disabled={guardando}
              onClick={() => void crearInstrumento()}
            >
              Crear hoja de vida
            </button>
          </section>
          </SoloConPermiso>
        </>
      )}
    </section>
  );
}

function Revision({
  hoja,
  formulario,
  guardando,
  onChange,
  onGuardar,
}: {
  hoja: HojaVida;
  formulario: typeof FORMULARIO_VACIO;
  guardando: boolean;
  onChange: (valor: typeof FORMULARIO_VACIO) => void;
  onGuardar: () => void;
}) {
  const historial = verificacionesDe(hoja);
  const ultima = ultimaVerificacion(hoja);
  const estado: EstadoMedicion = estadoMedicion(hoja);

  return (
    <article className="hoja-form medicion__revision">
      <header>
        <h2>
          {hoja.codigo || "Sin código"} — {hoja.nombre}
        </h2>
        <p>
          {hoja.area}
          {hoja.datos.marca ? ` · ${hoja.datos.marca}` : ""}
          {hoja.datos.serial ? ` · serie ${hoja.datos.serial}` : ""}
          {hoja.datos.ubicacion ? ` · ${hoja.datos.ubicacion}` : ""}
        </p>
        <p className={`medicion__estado medicion__estado--${estado}`}>{etiquetaEstado(estado)}</p>
        {ultima && (
          <p>
            Última: {ultima.fecha}. Próxima: {ultima.proxima || "sin fecha"}. Resultado:{" "}
            {ultima.resultado || "sin resultado"}.
          </p>
        )}
        <Link to={`/hojas-de-vida/${hoja.id}`}>Abrir hoja de vida</Link>
      </header>

      <SoloConPermiso permiso="editar.hojas">
      <h3>Nueva verificación</h3>
      <div className="hoja-form__grid">
        <label>
          Fecha
          <input
            type="date"
            value={formulario.fecha}
            onChange={(e) => onChange({ ...formulario, fecha: e.target.value })}
          />
        </label>
        <label>
          Próxima verificación
          <input
            type="date"
            value={formulario.proxima}
            onChange={(e) => onChange({ ...formulario, proxima: e.target.value })}
          />
        </label>
        <label>
          Resultado
          <select
            value={formulario.resultado}
            onChange={(e) =>
              onChange({
                ...formulario,
                resultado: e.target.value as VerificacionMedicion["resultado"],
              })
            }
          >
            <option value="">Seleccione</option>
            <option>Apto</option>
            <option>No apto</option>
          </select>
        </label>
        <label>
          Responsable
          <input
            value={formulario.responsable}
            onChange={(e) => onChange({ ...formulario, responsable: e.target.value })}
          />
        </label>
        <label>
          Patrón usado y su trazabilidad
          <input
            value={formulario.patron}
            onChange={(e) => onChange({ ...formulario, patron: e.target.value })}
          />
        </label>
      </div>
      <label>
        Puntos medidos y error
        <textarea
          rows={4}
          value={formulario.puntos}
          onChange={(e) => onChange({ ...formulario, puntos: e.target.value })}
        />
      </label>
      <label>
        Observación
        <textarea
          rows={2}
          value={formulario.observacion}
          onChange={(e) => onChange({ ...formulario, observacion: e.target.value })}
        />
      </label>
      <button type="button" className="btn btn--primario" disabled={guardando} onClick={onGuardar}>
        Guardar verificación
      </button>
      </SoloConPermiso>

      <h3>Informes anteriores</h3>
      {historial.length === 0 ? (
        <p>Todavía no hay un informe. Esta es la que toca revisar.</p>
      ) : (
        <ul className="medicion__historial">
          {historial.map((item) => (
            <li key={item.id}>
              <strong>
                {item.fecha} · {item.resultado || "Sin resultado"} · próxima {item.proxima || "—"}
              </strong>
              <span>{item.responsable}</span>
              <p>{item.patron}</p>
              <p>{item.puntos}</p>
              {item.observacion && <p>{item.observacion}</p>}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export default MedicionPage;
