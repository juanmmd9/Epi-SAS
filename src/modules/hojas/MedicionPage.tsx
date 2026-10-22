import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AREAS_PLANTA } from "../../lib/areas";
import { SoloConPermiso } from "../auth/SoloConPermiso";
import {
  areasSinInstrumento,
  documentosMedicionDe,
  esEquipoMedicion,
  estadoMedicion,
  etiquetaEstado,
  fechaIso,
  ultimaVerificacion,
  verificacionesDe,
  type EstadoMedicion,
} from "./medicion";
import { actualizarHoja, crearHoja, listarHojas, subirDocumentoMedicion } from "./hojasService";
import type {
  DocumentoMedicionHoja,
  HojaVida,
  HojaVidaDatos,
  VerificacionMedicion,
} from "./types";
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
  const [archivoVerificacion, setArchivoVerificacion] = useState<File | null>(null);
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
    setArchivoVerificacion(null);
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
    try {
      let documentoUrl: string | undefined;
      let documentoNombre: string | undefined;
      let documentos = documentosMedicionDe(actual);
      if (archivoVerificacion) {
        documentoUrl = await subirDocumentoMedicion(actual.id, archivoVerificacion);
        documentoNombre = archivoVerificacion.name;
        const adjunto: DocumentoMedicionHoja = {
          id: crypto.randomUUID(),
          nombre: documentoNombre,
          url: documentoUrl,
          fecha: formulario.fecha,
        };
        documentos = [adjunto, ...documentos];
      }
      const registro: VerificacionMedicion = {
        id: crypto.randomUUID(),
        ...formulario,
        documentoUrl,
        documentoNombre,
      };
      const datos: HojaVidaDatos = {
        ...actual.datos,
        esMedicion: true,
        documentosMedicion: documentos,
        verificaciones: [registro, ...verificacionesDe(actual)],
      };
      const guardada = await actualizarHoja(actual.id, { datos });
      setHojas((previas) => previas.map((hoja) => (hoja.id === guardada.id ? guardada : hoja)));
      setFormulario({ ...FORMULARIO_VACIO, fecha: fechaIso(new Date()) });
      setArchivoVerificacion(null);
      setAviso("Verificación guardada en la hoja de vida.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  }

  async function subirDocumento(archivo: File) {
    if (!actual) return;
    setGuardando(true);
    setError(null);
    try {
      const url = await subirDocumentoMedicion(actual.id, archivo);
      const adjunto: DocumentoMedicionHoja = {
        id: crypto.randomUUID(),
        nombre: archivo.name,
        url,
        fecha: fechaIso(new Date()),
      };
      const datos: HojaVidaDatos = {
        ...actual.datos,
        esMedicion: true,
        documentosMedicion: [adjunto, ...documentosMedicionDe(actual)],
      };
      const guardada = await actualizarHoja(actual.id, { datos });
      setHojas((previas) => previas.map((hoja) => (hoja.id === guardada.id ? guardada : hoja)));
      setAviso(`Documento cargado en ${guardada.codigo || guardada.nombre}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir el documento.");
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
      <div className="medicion__top">
        <div>
          <Link className="hoja-detalle__volver" to="/hojas-de-vida">
            ← Hojas de vida
          </Link>
          <h1>Verificación de equipos de medición</h1>
          <p className="hojas__descripcion">
            Revisa uno por uno: documentos, verificación y próxima fecha quedan en la hoja de vida.
          </p>
        </div>
        {!cargando && (
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
            <p className="medicion__contador">
              {instrumentos.length === 0
                ? "Sin instrumentos"
                : `${indice + 1} / ${instrumentos.length}`}
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
        )}
      </div>

      {error && <p className="hojas__mensaje hojas__mensaje--error">{error}</p>}
      {aviso && <p className="hojas__mensaje">{aviso}</p>}
      {cargando && <p>Cargando instrumentos…</p>}

      {!cargando && (
        <>
          <div className="medicion__layout">
            <aside className="medicion__aside">
              <h2 className="medicion__aside-titulo">Instrumentos</h2>
              <ul className="medicion__lista">
                {instrumentos.map((hoja, i) => {
                  const estado = estadoMedicion(hoja);
                  return (
                    <li key={hoja.id}>
                      <button
                        type="button"
                        className={
                          i === indice ? "medicion__item medicion__item--activo" : "medicion__item"
                        }
                        onClick={() => {
                          setIndice(i);
                          setFormulario({ ...FORMULARIO_VACIO, fecha: fechaIso(new Date()) });
                          setArchivoVerificacion(null);
                          setAviso(null);
                        }}
                      >
                        <span className="medicion__item-principal">
                          <strong>{hoja.codigo || "Sin código"}</strong>
                          <span>{hoja.nombre}</span>
                        </span>
                        <span className="medicion__item-meta">
                          <span>{hoja.area}</span>
                          <em className={`medicion__estado medicion__estado--${estado}`}>
                            {etiquetaEstado(estado)}
                          </em>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </aside>

            {actual ? (
              <Revision
                hoja={actual}
                formulario={formulario}
                archivo={archivoVerificacion}
                guardando={guardando}
                onChange={setFormulario}
                onArchivo={setArchivoVerificacion}
                onGuardar={() => void guardarVerificacion()}
                onSubirDocumento={(archivo) => void subirDocumento(archivo)}
              />
            ) : (
              <p className="medicion__vacio-panel">Agrega el primer instrumento de esta área.</p>
            )}
          </div>

          {vacias.length > 0 && (
            <p className="hojas__descripcion medicion__vacias">
              Sin instrumentos todavía: {vacias.join(", ")}.
            </p>
          )}
          <SoloConPermiso permiso="editar.hojas">
            <details className="hoja-form medicion__alta">
              <summary>Agregar instrumento que falta</summary>
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
            </details>
          </SoloConPermiso>
        </>
      )}
    </section>
  );
}

function Revision({
  hoja,
  formulario,
  archivo,
  guardando,
  onChange,
  onArchivo,
  onGuardar,
  onSubirDocumento,
}: {
  hoja: HojaVida;
  formulario: typeof FORMULARIO_VACIO;
  archivo: File | null;
  guardando: boolean;
  onChange: (valor: typeof FORMULARIO_VACIO) => void;
  onArchivo: (archivo: File | null) => void;
  onGuardar: () => void;
  onSubirDocumento: (archivo: File) => void;
}) {
  const historial = verificacionesDe(hoja);
  const documentos = documentosMedicionDe(hoja);
  const ultima = ultimaVerificacion(hoja);
  const estado: EstadoMedicion = estadoMedicion(hoja);

  return (
    <article className="hoja-form medicion__revision">
      <header className="medicion__cabecera">
        <div className="medicion__cabecera-texto">
          <h2>
            {hoja.codigo || "Sin código"} — {hoja.nombre}
          </h2>
          <p className="medicion__meta">
            {hoja.area}
            {hoja.datos.marca ? ` · ${hoja.datos.marca}` : ""}
            {hoja.datos.serial ? ` · serie ${hoja.datos.serial}` : ""}
            {hoja.datos.ubicacion ? ` · ${hoja.datos.ubicacion}` : ""}
          </p>
          {ultima ? (
            <p className="medicion__resumen">
              Última {ultima.fecha} · Próxima {ultima.proxima || "sin fecha"} ·{" "}
              {ultima.resultado || "sin resultado"}
            </p>
          ) : (
            <p className="medicion__resumen">Sin verificación registrada todavía.</p>
          )}
        </div>
        <div className="medicion__cabecera-lado">
          <span className={`medicion__estado medicion__estado--${estado}`}>
            {etiquetaEstado(estado)}
          </span>
          <Link className="medicion__enlace-hoja" to={`/hojas-de-vida/${hoja.id}`}>
            Abrir hoja de vida
          </Link>
        </div>
      </header>

      <div className="medicion__cuerpo">
        <section className="medicion__bloque">
          <div className="medicion__bloque-titulo">
            <h3>Documentos</h3>
            <SoloConPermiso permiso="editar.hojas">
              <label className="medicion__archivo medicion__archivo--inline">
                <span>Subir</span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx"
                  disabled={guardando}
                  onChange={(e) => {
                    const elegido = e.target.files?.[0] ?? null;
                    e.target.value = "";
                    if (elegido) onSubirDocumento(elegido);
                  }}
                />
              </label>
            </SoloConPermiso>
          </div>
          {documentos.length === 0 ? (
            <p className="medicion__vacio">Todavía no hay formato o informe cargado.</p>
          ) : (
            <ul className="medicion__documentos">
              {documentos.map((doc) => (
                <li key={doc.id}>
                  <a href={doc.url} target="_blank" rel="noreferrer">
                    {doc.nombre}
                  </a>
                  <span>{doc.fecha}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <SoloConPermiso permiso="editar.hojas">
          <section className="medicion__bloque medicion__bloque--form">
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
              <label className="medicion__campo-ancho">
                Patrón usado y su trazabilidad
                <input
                  value={formulario.patron}
                  onChange={(e) => onChange({ ...formulario, patron: e.target.value })}
                />
              </label>
            </div>
            <div className="medicion__textos">
              <label>
                Puntos medidos y error
                <textarea
                  rows={3}
                  value={formulario.puntos}
                  onChange={(e) => onChange({ ...formulario, puntos: e.target.value })}
                />
              </label>
              <label>
                Observación
                <textarea
                  rows={3}
                  value={formulario.observacion}
                  onChange={(e) => onChange({ ...formulario, observacion: e.target.value })}
                />
              </label>
            </div>
            <div className="medicion__acciones-form">
              <label className="medicion__archivo">
                Adjuntar informe de esta verificación
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx"
                  disabled={guardando}
                  onChange={(e) => onArchivo(e.target.files?.[0] ?? null)}
                />
                {archivo && <span className="medicion__archivo-nombre">{archivo.name}</span>}
              </label>
              <button
                type="button"
                className="btn btn--primario"
                disabled={guardando}
                onClick={onGuardar}
              >
                Guardar verificación
              </button>
            </div>
          </section>
        </SoloConPermiso>

        <section className="medicion__bloque">
          <h3>Informes anteriores</h3>
          {historial.length === 0 ? (
            <p className="medicion__vacio">Todavía no hay un informe. Esta es la que toca revisar.</p>
          ) : (
            <ul className="medicion__historial">
              {historial.map((item) => (
                <li key={item.id}>
                  <div className="medicion__historial-top">
                    <strong>
                      {item.fecha} · {item.resultado || "Sin resultado"}
                    </strong>
                    <span>Próxima {item.proxima || "—"}</span>
                  </div>
                  {item.responsable && <span className="medicion__historial-resp">{item.responsable}</span>}
                  {item.patron && <p>{item.patron}</p>}
                  {item.puntos && <p>{item.puntos}</p>}
                  {item.observacion && <p>{item.observacion}</p>}
                  {item.documentoUrl && (
                    <a href={item.documentoUrl} target="_blank" rel="noreferrer">
                      {item.documentoNombre || "Ver documento"}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </article>
  );
}

export default MedicionPage;
