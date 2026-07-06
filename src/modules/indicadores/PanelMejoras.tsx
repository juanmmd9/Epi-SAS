import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AREAS_SISTEMA } from "../../lib/areas";
import { NOMBRES_MESES } from "../../lib/fechas";
import { useAuth } from "../auth/AuthContext";
import { listarPersonalActivo } from "../personal/personalService";
import SelectorPersonal from "../personal/SelectorPersonal";
import type { Persona } from "../personal/types";
import {
  actualizarMejoraPortfolio,
  crearMejoraPortfolio,
  eliminarMejoraPortfolio,
  listarMejorasPortfolio,
  subirFotoMejora,
} from "./mejorasPortfolioService";
import {
  datosMejoraVacio,
  ESTADOS_MEJORA_PORTFOLIO,
  etiquetaEstadoMejora,
  type MejoraPortfolio,
  type MejoraPortfolioDatos,
} from "./mejorasPortfolioTypes";
import { exportarMejorasExcel } from "./mejorasPortfolioExport";

interface FormularioMejora {
  titulo: string;
  area: string;
  fecha: string;
  datos: MejoraPortfolioDatos;
}

function formularioVacio(): FormularioMejora {
  return {
    titulo: "",
    area: "",
    fecha: new Date().toISOString().slice(0, 10),
    datos: datosMejoraVacio(),
  };
}

function formularioDesdeMejora(m: MejoraPortfolio): FormularioMejora {
  return {
    titulo: m.titulo,
    area: m.area ?? "",
    fecha: m.fecha,
    datos: { ...m.datos },
  };
}

function formatearFecha(fecha: string): string {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  if (!anio || !mes || !dia) return fecha;
  return `${dia} ${NOMBRES_MESES[mes - 1]} ${anio}`;
}

function imagenesDeMejora(m: MejoraPortfolio): string[] {
  const urls = [
    m.datos.fotoAntesUrl,
    m.datos.fotoDespuesUrl,
    ...m.datos.fotosExtras,
  ].filter((url): url is string => Boolean(url));
  return [...new Set(urls)];
}

interface Props {
  anioFiltro: number;
}

function PanelMejoras({ anioFiltro }: Props) {
  const { puede } = useAuth();
  const puedeEditar = puede("editar.indicadores");

  const [mejoras, setMejoras] = useState<MejoraPortfolio[]>([]);
  const [personal, setPersonal] = useState<Persona[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [filtroArea, setFiltroArea] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [soloDestacadas, setSoloDestacadas] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<FormularioMejora>(formularioVacio());
  const [guardando, setGuardando] = useState(false);
  const [detalle, setDetalle] = useState<MejoraPortfolio | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const personalPorId = useMemo(
    () => new Map(personal.map((p) => [p.id, p])),
    [personal],
  );

  async function recargar() {
    setCargando(true);
    setError(null);
    try {
      const [lista, equipo] = await Promise.all([
        listarMejorasPortfolio(),
        listarPersonalActivo().catch(() => [] as Persona[]),
      ]);
      setMejoras(lista);
      setPersonal(equipo);
    } catch (e) {
      setError(
        "No se pudieron cargar las mejoras: " +
          (e as Error).message +
          ". Si es la primera vez, ejecuta supabase/migrations/mejoras_portfolio.sql en Supabase.",
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    recargar();
  }, []);

  const mejorasFiltradas = useMemo(() => {
    return mejoras.filter((m) => {
      const anio = Number.parseInt(m.fecha.slice(0, 4), 10);
      if (anio !== anioFiltro) return false;
      if (filtroArea && m.area !== filtroArea) return false;
      if (filtroEstado && m.datos.estado !== filtroEstado) return false;
      if (soloDestacadas && !m.datos.destacada) return false;
      return true;
    });
  }, [mejoras, anioFiltro, filtroArea, filtroEstado, soloDestacadas]);

  const resumen = useMemo(() => {
    const completadas = mejorasFiltradas.filter((m) => m.datos.estado === "completada").length;
    const enProgreso = mejorasFiltradas.filter((m) => m.datos.estado === "en_progreso").length;
    const tecnicos = new Set(mejorasFiltradas.flatMap((m) => m.datos.personalIds));
    return {
      total: mejorasFiltradas.length,
      completadas,
      enProgreso,
      tecnicos: tecnicos.size,
    };
  }, [mejorasFiltradas]);

  function abrirNueva() {
    setEditandoId(null);
    setForm(formularioVacio());
    setMostrarFormulario(true);
    setMensaje(null);
    setError(null);
  }

  function abrirEditar(m: MejoraPortfolio) {
    setEditandoId(m.id);
    setForm(formularioDesdeMejora(m));
    setMostrarFormulario(true);
    setDetalle(null);
  }

  function cerrarFormulario() {
    setMostrarFormulario(false);
    setEditandoId(null);
    setForm(formularioVacio());
  }

  async function subirImagen(
    archivo: File | null,
    campo: "fotoAntesUrl" | "fotoDespuesUrl",
  ) {
    if (!archivo) return;
    setGuardando(true);
    setError(null);
    try {
      const url = await subirFotoMejora(archivo);
      setForm((prev) => ({
        ...prev,
        datos: { ...prev.datos, [campo]: url },
      }));
    } catch (e) {
      setError("No se pudo subir la imagen: " + (e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  async function subirExtras(archivos: FileList | null) {
    if (!archivos?.length) return;
    setGuardando(true);
    setError(null);
    try {
      const urls: string[] = [];
      for (const archivo of Array.from(archivos)) {
        urls.push(await subirFotoMejora(archivo));
      }
      setForm((prev) => ({
        ...prev,
        datos: {
          ...prev.datos,
          fotosExtras: [...prev.datos.fotosExtras, ...urls],
        },
      }));
    } catch (e) {
      setError("No se pudieron subir las fotos: " + (e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  async function manejarGuardar(e: FormEvent) {
    e.preventDefault();
    if (!form.titulo.trim()) {
      setError("El título es obligatorio.");
      return;
    }
    setGuardando(true);
    setError(null);
    setMensaje(null);
    try {
      const payload = {
        titulo: form.titulo.trim(),
        area: form.area || null,
        fecha: form.fecha,
        datos: form.datos,
      };
      if (editandoId) {
        await actualizarMejoraPortfolio(editandoId, payload);
        setMensaje("Mejora actualizada.");
      } else {
        await crearMejoraPortfolio(payload);
        setMensaje("Mejora registrada en la galería.");
      }
      cerrarFormulario();
      await recargar();
    } catch (err) {
      const msg = (err as Error).message;
      setError(
        msg.includes("row-level security")
          ? "No se pudo guardar: falta configurar permisos en Supabase. Ejecuta el archivo supabase/migrations/mejoras_portfolio_rls.sql en el SQL Editor."
          : "No se pudo guardar: " + msg,
      );
    } finally {
      setGuardando(false);
    }
  }

  async function manejarEliminar(id: string) {
    if (!window.confirm("¿Eliminar esta mejora de la galería?")) return;
    setGuardando(true);
    try {
      await eliminarMejoraPortfolio(id);
      setDetalle(null);
      setMensaje("Mejora eliminada.");
      await recargar();
    } catch (e) {
      setError("No se pudo eliminar: " + (e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  function nombresEquipo(ids: string[]): string[] {
    return ids
      .map((id) => personalPorId.get(id)?.nombre)
      .filter((nombre): nombre is string => Boolean(nombre));
  }

  return (
    <div className="panel-mejoras">
      <header className="panel-mejoras__cabecera">
        <div>
          <h2>Acciones de mejora — galería visual</h2>
          <p className="panel-mejoras__intro">
            Muestra el antes y después de cada mejora, el equipo que participó y el
            beneficio obtenido. Ideal para presentaciones a dirección y auditorías del SGC.
          </p>
        </div>
        <div className="panel-mejoras__acciones">
          <button
            type="button"
            className="btn"
            disabled={cargando || mejorasFiltradas.length === 0}
            onClick={() => exportarMejorasExcel(mejorasFiltradas, personalPorId, anioFiltro)}
          >
            Exportar a Excel
          </button>
          {puedeEditar && (
            <button type="button" className="btn btn--primario" onClick={abrirNueva}>
              + Registrar mejora
            </button>
          )}
        </div>
      </header>

      <div className="panel-mejoras__stats">
        <article>
          <span>Mejoras en {anioFiltro}</span>
          <strong>{resumen.total}</strong>
        </article>
        <article>
          <span>Completadas</span>
          <strong>{resumen.completadas}</strong>
        </article>
        <article>
          <span>En progreso</span>
          <strong>{resumen.enProgreso}</strong>
        </article>
        <article>
          <span>Técnicos involucrados</span>
          <strong>{resumen.tecnicos}</strong>
        </article>
      </div>

      <div className="panel-mejoras__filtros">
        <label>
          Área
          <select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)}>
            <option value="">Todas</option>
            {AREAS_SISTEMA.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </label>
        <label>
          Estado
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <option value="">Todos</option>
            {ESTADOS_MEJORA_PORTFOLIO.map((e) => (
              <option key={e.clave} value={e.clave}>{e.etiqueta}</option>
            ))}
          </select>
        </label>
        <label className="panel-mejoras__check">
          <input
            type="checkbox"
            checked={soloDestacadas}
            onChange={(e) => setSoloDestacadas(e.target.checked)}
          />
          Solo destacadas para presentación
        </label>
      </div>

      {mensaje && <p className="indicadores__mensaje indicadores__mensaje--ok">{mensaje}</p>}
      {error && <p className="indicadores__mensaje indicadores__mensaje--error">{error}</p>}
      {cargando && <p>Cargando galería de mejoras...</p>}

      {!cargando && mejorasFiltradas.length === 0 && (
        <div className="panel-mejoras__vacio">
          <p>No hay mejoras registradas para {anioFiltro} con estos filtros.</p>
          {puedeEditar && (
            <p>
              Pulsa <strong>Registrar mejora</strong> para documentar la primera con fotos
              antes/después y el equipo de mantenimiento.
            </p>
          )}
        </div>
      )}

      <div className="panel-mejoras__grid">
        {mejorasFiltradas.map((m) => {
          const equipo = nombresEquipo(m.datos.personalIds);
          const imagenes = imagenesDeMejora(m);
          const portada =
            m.datos.fotoDespuesUrl || m.datos.fotoAntesUrl || imagenes[0] || null;

          return (
            <article
              key={m.id}
              className={
                "mejora-card" +
                (m.datos.destacada ? " mejora-card--destacada" : "") +
                ` mejora-card--${m.datos.estado.replaceAll("_", "-")}`
              }
            >
              <button
                type="button"
                className="mejora-card__portada"
                onClick={() => setDetalle(m)}
              >
                {portada ? (
                  <img src={portada} alt={m.titulo} loading="lazy" />
                ) : (
                  <span className="mejora-card__sin-foto">Sin foto</span>
                )}
                {m.datos.fotoAntesUrl && m.datos.fotoDespuesUrl && (
                  <span className="mejora-card__badge-compare">Antes / Después</span>
                )}
              </button>

              <div className="mejora-card__cuerpo">
                <div className="mejora-card__etiquetas">
                  <span className={`mejora-card__estado mejora-card__estado--${m.datos.estado.replaceAll("_", "-")}`}>
                    {etiquetaEstadoMejora(m.datos.estado)}
                  </span>
                  {m.area && <span className="mejora-card__chip">{m.area}</span>}
                  {m.datos.destacada && (
                    <span className="mejora-card__chip mejora-card__chip--destacada">Destacada</span>
                  )}
                </div>
                <h3>{m.titulo}</h3>
                <p className="mejora-card__fecha">{formatearFecha(m.fecha)}</p>
                {m.datos.situacion && (
                  <p className="mejora-card__resumen">{m.datos.situacion.slice(0, 120)}{m.datos.situacion.length > 120 ? "…" : ""}</p>
                )}
                {equipo.length > 0 && (
                  <div className="mejora-card__equipo">
                    {equipo.slice(0, 4).map((nombre) => (
                      <span key={nombre} className="mejora-card__tecnico" title={nombre}>
                        {nombre.split(" ").slice(0, 2).map((p) => p[0]).join("").slice(0, 2)}
                      </span>
                    ))}
                    <span className="mejora-card__equipo-texto">
                      {equipo.length === 1
                        ? equipo[0]
                        : `${equipo.length} del equipo`}
                    </span>
                  </div>
                )}
                <button type="button" className="mejora-card__ver" onClick={() => setDetalle(m)}>
                  Ver detalle
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {mostrarFormulario && (
        <div className="mejora-modal__overlay" onClick={() => !guardando && cerrarFormulario()}>
          <form
            className="mejora-modal mejora-modal--formulario"
            onClick={(e) => e.stopPropagation()}
            onSubmit={manejarGuardar}
          >
            <h3>{editandoId ? "Editar mejora" : "Nueva acción de mejora"}</h3>

            <label>
              Título corto *
              <input
                value={form.titulo}
                onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
                placeholder="Ej: Protección en polea transportadora"
                required
              />
            </label>

            <div className="mejora-modal__fila">
              <label>
                Área
                <select
                  value={form.area}
                  onChange={(e) => setForm((p) => ({ ...p, area: e.target.value }))}
                >
                  <option value="">General / varias</option>
                  {AREAS_SISTEMA.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </label>
              <label>
                Fecha
                <input
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setForm((p) => ({ ...p, fecha: e.target.value }))}
                />
              </label>
              <label>
                Estado
                <select
                  value={form.datos.estado}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      datos: {
                        ...p.datos,
                        estado: e.target.value as MejoraPortfolioDatos["estado"],
                      },
                    }))
                  }
                >
                  {ESTADOS_MEJORA_PORTFOLIO.map((e) => (
                    <option key={e.clave} value={e.clave}>{e.etiqueta}</option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Situación inicial (antes)
              <textarea
                rows={2}
                value={form.datos.situacion}
                onChange={(e) =>
                  setForm((p) => ({ ...p, datos: { ...p.datos, situacion: e.target.value } }))
                }
                placeholder="¿Qué problema había?"
              />
            </label>
            <label>
              Acción realizada
              <textarea
                rows={2}
                value={form.datos.accion}
                onChange={(e) =>
                  setForm((p) => ({ ...p, datos: { ...p.datos, accion: e.target.value } }))
                }
                placeholder="¿Qué se hizo?"
              />
            </label>
            <label>
              Beneficio obtenido
              <textarea
                rows={2}
                value={form.datos.beneficio}
                onChange={(e) =>
                  setForm((p) => ({ ...p, datos: { ...p.datos, beneficio: e.target.value } }))
                }
                placeholder="Seguridad, disponibilidad, calidad…"
              />
            </label>

            <SelectorPersonal
              personal={personal}
              seleccionados={form.datos.personalIds}
              onChange={(ids) =>
                setForm((p) => ({ ...p, datos: { ...p.datos, personalIds: ids } }))
              }
              leyenda="Equipo de mantenimiento que participó"
              vacio="Registra personal en Personal → Mantenimiento"
            />

            <div className="mejora-modal__fotos">
              <label>
                Foto ANTES
                <input
                  type="file"
                  accept="image/*"
                  disabled={guardando}
                  onChange={(e) => subirImagen(e.target.files?.[0] ?? null, "fotoAntesUrl")}
                />
                {form.datos.fotoAntesUrl && (
                  <img src={form.datos.fotoAntesUrl} alt="Antes" className="mejora-modal__preview" />
                )}
              </label>
              <label>
                Foto DESPUÉS
                <input
                  type="file"
                  accept="image/*"
                  disabled={guardando}
                  onChange={(e) => subirImagen(e.target.files?.[0] ?? null, "fotoDespuesUrl")}
                />
                {form.datos.fotoDespuesUrl && (
                  <img src={form.datos.fotoDespuesUrl} alt="Después" className="mejora-modal__preview" />
                )}
              </label>
            </div>

            <label>
              Fotos adicionales (detalle, planos, evidencia)
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={guardando}
                onChange={(e) => subirExtras(e.target.files)}
              />
            </label>
            {form.datos.fotosExtras.length > 0 && (
              <div className="mejora-modal__extras">
                {form.datos.fotosExtras.map((url) => (
                  <img key={url} src={url} alt="" className="mejora-modal__preview" />
                ))}
              </div>
            )}

            <div className="mejora-modal__fila">
              <label>
                Nº GC-RE-001 (opcional)
                <input
                  type="number"
                  min={1}
                  value={form.datos.numeroAm ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      datos: {
                        ...p.datos,
                        numeroAm: e.target.value ? Number(e.target.value) : null,
                      },
                    }))
                  }
                />
              </label>
              <label className="panel-mejoras__check">
                <input
                  type="checkbox"
                  checked={form.datos.destacada}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      datos: { ...p.datos, destacada: e.target.checked },
                    }))
                  }
                />
                Destacar en presentaciones
              </label>
            </div>

            <div className="mejora-modal__pie">
              <button type="button" className="btn" disabled={guardando} onClick={cerrarFormulario}>
                Cancelar
              </button>
              <button type="submit" className="btn btn--primario" disabled={guardando}>
                {guardando ? "Guardando…" : editandoId ? "Actualizar" : "Guardar mejora"}
              </button>
            </div>
          </form>
        </div>
      )}

      {detalle && (
        <div className="mejora-modal__overlay" onClick={() => setDetalle(null)}>
          <article className="mejora-modal mejora-modal--detalle" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="mejora-modal__cerrar" onClick={() => setDetalle(null)}>
              ×
            </button>
            <div className="mejora-modal__etiquetas">
              <span className={`mejora-card__estado mejora-card__estado--${detalle.datos.estado.replaceAll("_", "-")}`}>
                {etiquetaEstadoMejora(detalle.datos.estado)}
              </span>
              {detalle.area && <span className="mejora-card__chip">{detalle.area}</span>}
              <span className="mejora-card__chip">{formatearFecha(detalle.fecha)}</span>
            </div>
            <h3>{detalle.titulo}</h3>

            {(detalle.datos.fotoAntesUrl || detalle.datos.fotoDespuesUrl) && (
              <div className="mejora-compare">
                {detalle.datos.fotoAntesUrl && (
                  <figure>
                    <figcaption>Antes</figcaption>
                    <button type="button" onClick={() => setLightboxUrl(detalle.datos.fotoAntesUrl)}>
                      <img src={detalle.datos.fotoAntesUrl} alt="Antes" />
                    </button>
                  </figure>
                )}
                {detalle.datos.fotoDespuesUrl && (
                  <figure>
                    <figcaption>Después</figcaption>
                    <button type="button" onClick={() => setLightboxUrl(detalle.datos.fotoDespuesUrl)}>
                      <img src={detalle.datos.fotoDespuesUrl} alt="Después" />
                    </button>
                  </figure>
                )}
              </div>
            )}

            {detalle.datos.situacion && (
              <section className="mejora-detalle__bloque">
                <h4>Situación</h4>
                <p>{detalle.datos.situacion}</p>
              </section>
            )}
            {detalle.datos.accion && (
              <section className="mejora-detalle__bloque">
                <h4>Acción</h4>
                <p>{detalle.datos.accion}</p>
              </section>
            )}
            {detalle.datos.beneficio && (
              <section className="mejora-detalle__bloque mejora-detalle__bloque--beneficio">
                <h4>Beneficio</h4>
                <p>{detalle.datos.beneficio}</p>
              </section>
            )}

            {nombresEquipo(detalle.datos.personalIds).length > 0 && (
              <section className="mejora-detalle__bloque">
                <h4>Equipo de mantenimiento</h4>
                <ul className="mejora-detalle__equipo">
                  {detalle.datos.personalIds.map((id) => {
                    const p = personalPorId.get(id);
                    if (!p) return null;
                    return (
                      <li key={id}>
                        <span className="mejora-card__tecnico mejora-card__tecnico--grande">
                          {p.nombre.split(" ").slice(0, 2).map((x) => x[0]).join("").slice(0, 2)}
                        </span>
                        <span>
                          {p.nombre}
                          {p.cargo ? ` — ${p.cargo}` : ""}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {detalle.datos.fotosExtras.length > 0 && (
              <section className="mejora-detalle__bloque">
                <h4>Galería adicional</h4>
                <div className="mejora-detalle__galeria">
                  {detalle.datos.fotosExtras.map((url) => (
                    <button key={url} type="button" onClick={() => setLightboxUrl(url)}>
                      <img src={url} alt="" loading="lazy" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            <div className="mejora-modal__pie">
              {detalle.datos.numeroAm && (
                <Link className="btn" to="/formatos/gc-re-001">
                  Ver formato GC-RE-001 #{detalle.datos.numeroAm}
                </Link>
              )}
              {puedeEditar && (
                <>
                  <button type="button" className="btn" onClick={() => abrirEditar(detalle)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn btn--peligro"
                    disabled={guardando}
                    onClick={() => manejarEliminar(detalle.id)}
                  >
                    Eliminar
                  </button>
                </>
              )}
            </div>
          </article>
        </div>
      )}

      {lightboxUrl && (
        <div className="mejora-lightbox" onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} alt="Ampliada" onClick={(e) => e.stopPropagation()} />
          <button type="button" className="mejora-lightbox__cerrar" onClick={() => setLightboxUrl(null)}>
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}

export default PanelMejoras;
