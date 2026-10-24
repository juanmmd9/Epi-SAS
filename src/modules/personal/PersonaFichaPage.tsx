import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import VisorWord from "../../components/VisorWord";
import { useAuth } from "../auth/AuthContext";
import {
  APARTADOS_FICHA,
  type DocumentoPersonal,
  type TipoDocumentoPersonal,
} from "./personalDocumentos";
import {
  eliminarDocumentoPersonal,
  faltaTablaDocumentosPersonal,
  listarDocumentosPersonal,
  subirDocumentoPersonal,
} from "./personalDocumentosService";
import { obtenerPersona } from "./personalService";
import type { Persona } from "./types";
import "./personal.css";

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  return partes
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}

function fechaCorta(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "";
  return fecha.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

function tipoVista(nombre: string): "imagen" | "pdf" | "word" | "otro" {
  if (/\.(png|jpe?g|webp|gif)$/i.test(nombre)) return "imagen";
  if (/\.pdf$/i.test(nombre)) return "pdf";
  if (/\.docx$/i.test(nombre)) return "word";
  return "otro";
}

function PersonaFichaPage() {
  const { personaId } = useParams();
  const { puede } = useAuth();
  const [persona, setPersona] = useState<Persona | null>(null);
  const [documentos, setDocumentos] = useState<DocumentoPersonal[]>([]);
  const [apartado, setApartado] = useState<TipoDocumentoPersonal>("hoja_vida");
  const [visto, setVisto] = useState<DocumentoPersonal | null>(null);
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faltaTabla, setFaltaTabla] = useState(false);

  useEffect(() => {
    if (!personaId) return;
    let vigente = true;
    setCargando(true);
    setError(null);
    obtenerPersona(personaId)
      .then(async (encontrada) => {
        if (!vigente) return;
        setPersona(encontrada);
        if (!encontrada) return;
        try {
          const lista = await listarDocumentosPersonal(personaId);
          if (vigente) setDocumentos(lista);
        } catch (e) {
          if (!vigente) return;
          const msg = (e as Error).message;
          if (faltaTablaDocumentosPersonal(msg)) setFaltaTabla(true);
          else setError(msg);
        }
      })
      .catch((e: Error) => {
        if (vigente) setError(e.message);
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [personaId]);

  const delApartado = useMemo(
    () => documentos.filter((doc) => doc.tipo === apartado),
    [documentos, apartado],
  );
  const elegido = APARTADOS_FICHA.find((item) => item.id === apartado) ?? APARTADOS_FICHA[0];

  async function subir(lista: FileList | null) {
    if (!personaId || !lista || lista.length === 0) return;
    setSubiendo(true);
    setError(null);
    const fallos: string[] = [];
    for (const archivo of Array.from(lista)) {
      try {
        const guardado = await subirDocumentoPersonal(personaId, apartado, archivo);
        setDocumentos((previos) => [guardado, ...previos]);
      } catch (e) {
        const msg = (e as Error).message;
        if (faltaTablaDocumentosPersonal(msg)) setFaltaTabla(true);
        fallos.push(msg);
      }
    }
    if (fallos.length > 0) setError(fallos.join(" "));
    setSubiendo(false);
  }

  async function quitar(documento: DocumentoPersonal) {
    if (!window.confirm(`¿Quitar "${documento.nombre}" de la ficha?`)) return;
    setError(null);
    try {
      await eliminarDocumentoPersonal(documento);
      setDocumentos((previos) => previos.filter((item) => item.id !== documento.id));
      if (visto?.id === documento.id) setVisto(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (!puede("ver.personal")) {
    return <Navigate to="/" replace />;
  }

  return (
    <section className="personal">
      <Link to="/personal" className="btn">
        ← Personal
      </Link>

      {cargando && <p>Cargando ficha...</p>}
      {!cargando && !persona && !faltaTabla && (
        <p className="personal__mensaje personal__mensaje--error">No se encontró esta persona.</p>
      )}

      {persona && (
        <>
          <article className="ficha-cabecera">
            <span className="ficha-cabecera__iniciales" aria-hidden="true">
              {iniciales(persona.nombre)}
            </span>
            <div>
              <h1>{persona.nombre}</h1>
              <p>
                {persona.cargo ?? "Sin cargo"} · {persona.area ?? "Sin área"} · Cédula{" "}
                {persona.cedula ?? "—"}
              </p>
              {persona.activo ? (
                <span className="personal__chip personal__chip--ok">Activo</span>
              ) : (
                <span className="personal__chip personal__chip--inactivo">Inactivo</span>
              )}
            </div>
          </article>

          {faltaTabla && (
            <p className="personal__mensaje personal__mensaje--error">
              Falta la tabla de documentos del personal en Supabase.
            </p>
          )}
          {error && <p className="personal__mensaje personal__mensaje--error">{error}</p>}

          <div className="ficha-apartados">
            {APARTADOS_FICHA.map((item) => {
              const cantidad = documentos.filter((doc) => doc.tipo === item.id).length;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`ficha-apartado${item.id === apartado ? " ficha-apartado--activo" : ""}`}
                  onClick={() => {
                    setApartado(item.id);
                    setVisto(null);
                  }}
                >
                  <strong>{item.titulo}</strong>
                  <span>{item.detalle}</span>
                  <em>{cantidad === 0 ? "Sin archivos" : `${cantidad} archivo${cantidad === 1 ? "" : "s"}`}</em>
                </button>
              );
            })}
          </div>

          <section className="ficha-lista">
            <header className="ficha-lista__cabecera">
              <div>
                <h2>{elegido.titulo}</h2>
                <p>{elegido.detalle}</p>
              </div>
              {puede("editar.personal") && (
                <label className="btn btn--primario ficha-lista__subir">
                  {subiendo ? "Subiendo..." : "Subir archivos"}
                  <input
                    type="file"
                    multiple
                    disabled={subiendo || faltaTabla}
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.xls,.xlsx"
                    onChange={(e) => {
                      void subir(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
            </header>

            {delApartado.length === 0 && (
              <p className="personal__vacio">Todavía no hay archivos en este apartado.</p>
            )}
            {delApartado.length > 0 && (
              <ul className="ficha-archivos">
                {delApartado.map((documento) => (
                  <li key={documento.id}>
                    <button type="button" className="ficha-archivos__nombre" onClick={() => setVisto(documento)}>
                      {documento.nombre}
                    </button>
                    <span>{fechaCorta(documento.subido_en)}</span>
                    {puede("editar.personal") && (
                      <button type="button" className="btn btn--peligro" onClick={() => void quitar(documento)}>
                        Quitar
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {visto && (
            <section className="ficha-visor">
              <div className="ficha-visor__barra">
                <h2>{visto.nombre}</h2>
                <button type="button" className="btn" onClick={() => setVisto(null)}>
                  Cerrar
                </button>
              </div>
              {tipoVista(visto.nombre) === "imagen" && <img src={visto.url} alt={visto.nombre} />}
              {tipoVista(visto.nombre) === "pdf" && <iframe title={visto.nombre} src={visto.url} />}
              {tipoVista(visto.nombre) === "word" && <VisorWord url={visto.url} />}
              {tipoVista(visto.nombre) === "otro" && (
                <p className="personal__vacio">
                  Este archivo se abre en una pestaña. Para verlo aquí, súbelo en PDF, Word (.docx) o imagen.
                </p>
              )}
              {tipoVista(visto.nombre) === "otro" && (
                <a className="btn" href={visto.url} target="_blank" rel="noreferrer">
                  Abrir archivo
                </a>
              )}
            </section>
          )}
        </>
      )}
    </section>
  );
}

export default PersonaFichaPage;
