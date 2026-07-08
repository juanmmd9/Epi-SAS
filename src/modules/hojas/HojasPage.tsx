import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SoloConPermiso } from "../auth/SoloConPermiso";
import { AREAS_SISTEMA, coincideArea } from "../../lib/areas";
import HojaForm from "./HojaForm";
import {
  actualizarHoja,
  cambiarEstadoHoja,
  crearHoja,
  eliminarHoja,
  listarHojas,
  subirFotoMaquina,
} from "./hojasService";
import type { HojaVida, HojaVidaInput } from "./types";
import "./hojas.css";

function HojasPage() {
  const ubicacion = useLocation();
  const navigate = useNavigate();
  const [hojas, setHojas] = useState<HojaVida[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filtroArea, setFiltroArea] = useState("");
  const [maquinaSeleccionada, setMaquinaSeleccionada] = useState("");
  const [hojaEnEdicion, setHojaEnEdicion] = useState<HojaVida | null>(null);

  function cerrarEdicion() {
    setHojaEnEdicion(null);
  }

  useEffect(() => {
    if (!hojaEnEdicion) return;
    function alTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") cerrarEdicion();
    }
    window.addEventListener("keydown", alTecla);
    return () => window.removeEventListener("keydown", alTecla);
  }, [hojaEnEdicion]);

  useEffect(() => {
    listarHojas()
      .then(setHojas)
      .catch((e: Error) => setError("No se pudieron cargar las máquinas: " + e.message))
      .finally(() => setCargando(false));
  }, [ubicacion.key]);

  useEffect(() => {
    function alVolver() {
      if (document.visibilityState === "visible") {
        listarHojas()
          .then(setHojas)
          .catch(() => undefined);
      }
    }
    window.addEventListener("focus", alVolver);
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      window.removeEventListener("focus", alVolver);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, []);

  const hojasFiltradas = useMemo(
    () => (filtroArea ? hojas.filter((h) => coincideArea(h.area, filtroArea)) : hojas),
    [hojas, filtroArea],
  );

  const hojasParaSelector = useMemo(
    () =>
      [...hojasFiltradas].sort((a, b) =>
        `${a.area} ${a.nombre}`.localeCompare(`${b.area} ${b.nombre}`, "es"),
      ),
    [hojasFiltradas],
  );

  useEffect(() => {
    if (!maquinaSeleccionada) return;
    if (!hojasParaSelector.some((h) => h.id === maquinaSeleccionada)) {
      setMaquinaSeleccionada("");
    }
  }, [hojasParaSelector, maquinaSeleccionada]);

  function abrirHojaDeVida(id?: string) {
    const destino = id || maquinaSeleccionada;
    if (!destino) return;
    navigate(`/hojas-de-vida/${destino}`);
  }

  async function manejarGuardar(input: HojaVidaInput, foto: File | null) {
    setGuardando(true);
    setError(null);
    setMensaje(null);
    try {
      const fotoUrl = foto ? await subirFotoMaquina(foto) : null;
      if (hojaEnEdicion) {
        const cambios = fotoUrl ? { ...input, foto_url: fotoUrl } : input;
        const actualizada = await actualizarHoja(hojaEnEdicion.id, cambios);
        setHojas((previas) =>
          previas.map((h) => (h.id === actualizada.id ? actualizada : h)),
        );
        setHojaEnEdicion(null);
        if (!coincideArea(hojaEnEdicion.area, actualizada.area)) {
          setFiltroArea(actualizada.area);
          setMensaje(
            `Máquina "${actualizada.nombre}" actualizada. Área cambiada a ${actualizada.area}.`,
          );
        } else {
          setMensaje(`Máquina "${actualizada.nombre}" actualizada.`);
        }
      } else {
        const creada = await crearHoja(input, fotoUrl);
        setHojas((previas) => [creada, ...previas]);
        setMensaje(
          `Máquina registrada. PM automático cada ${input.frecuencia_pm_meses} mes(es)` +
            (input.primer_pm ? ` desde ${input.primer_pm}.` : "."),
        );
      }
    } catch (e) {
      setError("No fue posible guardar: " + (e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  async function manejarBaja(hoja: HojaVida) {
    const motivo = window.prompt(
      `Motivo de baja para "${hoja.nombre}" (puede quedar vacío):`,
    );
    if (motivo === null) return;
    try {
      const actualizada = await cambiarEstadoHoja(hoja, false, motivo);
      setHojas((previas) =>
        previas.map((h) => (h.id === actualizada.id ? actualizada : h)),
      );
    } catch (e) {
      setError("No fue posible dar de baja: " + (e as Error).message);
    }
  }

  async function manejarReactivar(hoja: HojaVida) {
    try {
      const actualizada = await cambiarEstadoHoja(hoja, true);
      setHojas((previas) =>
        previas.map((h) => (h.id === actualizada.id ? actualizada : h)),
      );
    } catch (e) {
      setError("No fue posible reactivar: " + (e as Error).message);
    }
  }

  async function manejarEliminar(hoja: HojaVida) {
    const confirmado = window.confirm(
      `¿Eliminar definitivamente "${hoja.nombre}"? Esta acción no se puede deshacer.`,
    );
    if (!confirmado) return;
    try {
      await eliminarHoja(hoja.id);
      setHojas((previas) => previas.filter((h) => h.id !== hoja.id));
      if (hojaEnEdicion?.id === hoja.id) setHojaEnEdicion(null);
    } catch (e) {
      setError("No fue posible eliminar: " + (e as Error).message);
    }
  }

  return (
    <section className="hojas">
      <h1>Hojas de vida</h1>
      <p className="hojas__descripcion">
        Catálogo de máquinas y equipos. Los datos se guardan en la nube y los ven
        todos los usuarios del portal.
      </p>

      <SoloConPermiso permiso="editar.hojas">
        <HojaForm
          hojaEnEdicion={null}
          guardando={guardando && !hojaEnEdicion}
          onGuardar={manejarGuardar}
          onCancelarEdicion={cerrarEdicion}
        />
      </SoloConPermiso>

      {hojaEnEdicion && (
        <div
          className="hoja-modal__overlay"
          onClick={cerrarEdicion}
          role="presentation"
        >
          <div
            className="hoja-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="hoja-modal-titulo"
          >
            <div className="hoja-modal__cabecera">
              <h2 id="hoja-modal-titulo">Editar hoja de vida</h2>
              <button
                type="button"
                className="hoja-modal__cerrar"
                aria-label="Cerrar"
                onClick={cerrarEdicion}
              >
                ×
              </button>
            </div>
            <p className="hoja-modal__subtitulo">
              {hojaEnEdicion.codigo ? `${hojaEnEdicion.codigo} — ` : ""}
              {hojaEnEdicion.nombre}
            </p>
            <HojaForm
              hojaEnEdicion={hojaEnEdicion}
              guardando={guardando}
              onGuardar={manejarGuardar}
              onCancelarEdicion={cerrarEdicion}
            />
          </div>
        </div>
      )}

      {mensaje && <p className="hojas__mensaje hojas__mensaje--ok">{mensaje}</p>}
      {error && <p className="hojas__mensaje hojas__mensaje--error">{error}</p>}

      <section className="hojas__consulta">
        <h2>Consultar hoja de vida</h2>
        <p>Selecciona una máquina para ver sus datos completos y el historial de mantenimientos.</p>
        <div className="hojas__consulta-fila">
          <label>
            Área
            <select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)}>
              <option value="">Todas las áreas</option>
              {AREAS_SISTEMA.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </label>
          <label className="hojas__consulta-maquina">
            Máquina
            <select
              value={maquinaSeleccionada}
              onChange={(e) => setMaquinaSeleccionada(e.target.value)}
            >
              <option value="">Selecciona una máquina</option>
              {hojasParaSelector.map((hoja) => (
                <option key={hoja.id} value={hoja.id}>
                  {hoja.codigo ? `${hoja.codigo} — ` : ""}
                  {hoja.nombre} ({hoja.area})
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="btn btn--primario"
            disabled={!maquinaSeleccionada}
            onClick={() => abrirHojaDeVida()}
          >
            Ver hoja de vida
          </button>
        </div>
      </section>

      <div className="hojas__filtros">
        <h2>Máquinas registradas ({hojasFiltradas.length})</h2>
      </div>

      {cargando && <p>Cargando máquinas...</p>}
      {!cargando && hojasFiltradas.length === 0 && (
        <p className="hojas__vacio">
          No hay máquinas registradas{filtroArea ? ` en ${filtroArea}` : ""}. Usa el
          formulario de arriba para registrar la primera.
        </p>
      )}

      <div className="hojas__lista">
        {hojasFiltradas.map((hoja) => (
          <article
            key={hoja.id}
            className={"tarjeta-maquina" + (hoja.activa ? "" : " tarjeta-maquina--baja")}
          >
            <div className="tarjeta-maquina__foto">
              {hoja.foto_url ? (
                <img src={hoja.foto_url} alt={hoja.nombre} />
              ) : (
                <span>Sin foto</span>
              )}
            </div>
            <div className="tarjeta-maquina__info">
              <h3>{hoja.nombre}</h3>
              <p className="tarjeta-maquina__codigo">
                {hoja.codigo || "Sin código"} · {hoja.area}
              </p>
              <p>
                PM cada {hoja.frecuencia_pm_meses ?? 12} mes(es)
                {hoja.primer_pm ? ` · desde ${hoja.primer_pm}` : ""}
              </p>
              {hoja.datos.ubicacion && <p>Ubicación: {hoja.datos.ubicacion}</p>}
              {!hoja.activa && (
                <p className="tarjeta-maquina__baja">
                  Fuera de circulación
                  {hoja.datos.fechaBaja ? ` desde ${hoja.datos.fechaBaja}` : ""}
                  {hoja.datos.motivoBaja ? ` — ${hoja.datos.motivoBaja}` : ""}
                </p>
              )}
            </div>
            <div className="tarjeta-maquina__acciones">
              <button
                type="button"
                className="btn btn--primario"
                onClick={() => abrirHojaDeVida(hoja.id)}
              >
                Ver hoja de vida
              </button>
              <SoloConPermiso permiso="editar.hojas">
                <button className="btn" onClick={() => setHojaEnEdicion(hoja)}>
                  Editar
                </button>
                {hoja.activa ? (
                  <button className="btn btn--advertencia" onClick={() => manejarBaja(hoja)}>
                    Dar de baja
                  </button>
                ) : (
                  <button className="btn btn--primario" onClick={() => manejarReactivar(hoja)}>
                    Reactivar
                  </button>
                )}
              </SoloConPermiso>
              <SoloConPermiso permiso="eliminar.registros">
                <button className="btn btn--peligro" onClick={() => manejarEliminar(hoja)}>
                  Eliminar
                </button>
              </SoloConPermiso>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default HojasPage;
