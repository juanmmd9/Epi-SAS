import { useCallback, useEffect, useMemo, useState } from "react";
import { AREAS_SISTEMA, coincideArea, normalizarArea } from "../../lib/areas";
import { useAuth } from "../auth/AuthContext";
import { listarCorrectivo } from "../correctivo/correctivoService";
import type { RegistroCorrectivo } from "../correctivo/types";
import {
  existeTablaAsignacionesCorrectivo,
  listarAsignacionesCorrectivo,
  mapaAsignacionesPorCorrectivo,
  tomarSolicitud,
} from "./asignacionCorrectivoService";
import CronometroSolicitudBadge from "./CronometroSolicitudBadge";
import { solicitudAbierta } from "./solicitudesCalculo";
import "./solicitudes.css";

interface Props {
  /** Si se define, entra directo a las libres de esa área (sin cards). */
  areaFiltro?: string;
  onTomada?: () => void;
}

/**
 * Bandeja del operario: cards por área → lista → TOMAR.
 */
function BandejaTomarPanel({ areaFiltro, onTomada }: Props) {
  const { perfil } = useAuth();
  const [regs, setRegs] = useState<RegistroCorrectivo[]>([]);
  const [mapaAsig, setMapaAsig] = useState(() => new Map<string, string[]>());
  const [okTabla, setOkTabla] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [areaSeleccionada, setAreaSeleccionada] = useState<string | null>(
    areaFiltro ? normalizarArea(areaFiltro) : null,
  );

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const hay = await existeTablaAsignacionesCorrectivo().catch(() => false);
      setOkTabla(hay);
      const lista = await listarCorrectivo();
      setRegs(lista);
      if (hay) {
        const asigs = await listarAsignacionesCorrectivo();
        const mapa = mapaAsignacionesPorCorrectivo(asigs);
        const simple = new Map<string, string[]>();
        for (const [id, filas] of mapa) {
          simple.set(
            id,
            filas.map((a) => a.personal_id),
          );
        }
        setMapaAsig(simple);
      } else {
        setMapaAsig(new Map());
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  useEffect(() => {
    if (areaFiltro) setAreaSeleccionada(normalizarArea(areaFiltro));
  }, [areaFiltro]);

  const todasLibres = useMemo(
    () => listaAbiertasLibres(regs, mapaAsig, undefined),
    [regs, mapaAsig],
  );

  const porArea = useMemo(() => {
    const mapa = new Map<string, RegistroCorrectivo[]>();
    for (const area of AREAS_SISTEMA) mapa.set(area, []);
    for (const r of todasLibres) {
      const area = normalizarArea(r.area) || r.area || "Sin área";
      const lista = mapa.get(area) ?? [];
      lista.push(r);
      mapa.set(area, lista);
    }
    const resultado: Array<{ area: string; items: RegistroCorrectivo[] }> = [];
    for (const area of AREAS_SISTEMA) {
      resultado.push({ area, items: mapa.get(area) ?? [] });
    }
    for (const [area, items] of mapa) {
      if (!AREAS_SISTEMA.includes(area as (typeof AREAS_SISTEMA)[number])) {
        resultado.push({ area, items });
      }
    }
    return resultado;
  }, [todasLibres]);

  const areasConLibres = useMemo(
    () => porArea.filter((a) => a.items.length > 0),
    [porArea],
  );

  const libresArea = useMemo(() => {
    if (!areaSeleccionada) return [];
    return listaAbiertasLibres(regs, mapaAsig, areaSeleccionada);
  }, [regs, mapaAsig, areaSeleccionada]);

  const totalLibres = todasLibres.length;
  const mostrarCards = !areaFiltro && !areaSeleccionada;

  async function tomar(id: string) {
    if (!perfil?.personal_id) {
      setError(
        "Tu usuario no está vinculado a un técnico. Pide al admin que te vincule en Usuarios.",
      );
      return;
    }
    setBusyId(id);
    setError(null);
    setMensaje(null);
    try {
      await tomarSolicitud(id, perfil.personal_id);
      setMensaje("Solicitud tomada. El cronómetro ya corre. Mírala en Mis solicitudes.");
      await recargar();
      onTomada?.();
    } catch (e) {
      setError((e as Error).message);
      await recargar();
    } finally {
      setBusyId(null);
    }
  }

  if (!perfil || (perfil.rol !== "operador" && perfil.rol !== "admin")) {
    return null;
  }

  return (
    <section className="bandeja-tomar">
      <div className="bandeja-tomar__cabecera">
        <div>
          <h2>Bandeja · tomar solicitud</h2>
          <p>
            {mostrarCards
              ? "Elige un área para ver las solicitudes libres y tomarlas."
              : "Pulsa TOMAR en la que vayas a atender. Queda tuya y arranca el tiempo."}
          </p>
        </div>
        <span className="bandeja-tomar__badge">{totalLibres} libre(s)</span>
      </div>

      {!perfil.personal_id && (
        <p className="bandeja-tomar__aviso">
          No tienes técnico vinculado: no podrás tomar hasta que el admin te asigne uno en
          Usuarios.
        </p>
      )}

      {!okTabla && !cargando && (
        <p className="bandeja-tomar__aviso">
          Falta activar la bandeja en Supabase: ejecuta{" "}
          <code>correctivo_asignaciones.sql</code> y <code>correctivo_bandeja_claim.sql</code>.
        </p>
      )}

      {error && <p className="bandeja-tomar__error">{error}</p>}
      {mensaje && <p className="bandeja-tomar__ok">{mensaje}</p>}

      {cargando ? (
        <p className="bandeja-tomar__vacio">Cargando bandeja…</p>
      ) : mostrarCards ? (
        areasConLibres.length === 0 ? (
          <div className="bandeja-tomar__vacio">
            <strong>No hay solicitudes libres ahora</strong>
            <p>
              Cuando entre una nueva, verás la card de su área aquí. Si hay abiertas pero no
              libres, ya las tomó otro técnico.
            </p>
          </div>
        ) : (
          <div className="bandeja-tomar__areas">
            {areasConLibres.map(({ area, items }) => (
              <button
                key={area}
                type="button"
                className="bandeja-area-card"
                onClick={() => setAreaSeleccionada(area)}
              >
                <h3>{area}</h3>
                <span className="bandeja-area-card__count">
                  <strong>{items.length}</strong>
                  libre{items.length === 1 ? "" : "s"}
                </span>
                <span className="bandeja-area-card__accion">Ver solicitudes →</span>
              </button>
            ))}
          </div>
        )
      ) : (
        <div className="bandeja-tomar__detalle">
          {!areaFiltro && (
            <button
              type="button"
              className="bandeja-tomar__volver"
              onClick={() => {
                setAreaSeleccionada(null);
                setMensaje(null);
                setError(null);
              }}
            >
              ← Volver a áreas
            </button>
          )}
          <h3 className="bandeja-tomar__area-titulo">
            {areaSeleccionada}
            <span>
              {libresArea.length} libre{libresArea.length === 1 ? "" : "s"}
            </span>
          </h3>

          {libresArea.length === 0 ? (
            <div className="bandeja-tomar__vacio">
              <strong>No hay libres en esta área</strong>
              <p>Vuelve a las cards o espera una solicitud nueva.</p>
            </div>
          ) : (
            <ul className="bandeja-tomar__lista">
              {libresArea.map((r) => (
                <li key={r.id} className="bandeja-tomar__card">
                  <div className="bandeja-tomar__info">
                    <strong>#{r.datos.numeroSolicitud || "—"}</strong>
                    <span>
                      {r.datos.maquinaEquipoLocacion || "Sin máquina"}
                      {r.datos.codigoMaquina ? ` (${r.datos.codigoMaquina})` : ""}
                    </span>
                    <span className="bandeja-tomar__desc">
                      {r.datos.descripcionSolicitud || "Sin descripción"}
                    </span>
                    <CronometroSolicitudBadge datos={r.datos} compacto />
                  </div>
                  <button
                    type="button"
                    className="btn bandeja-tomar__btn"
                    disabled={busyId === r.id || !perfil.personal_id || !okTabla}
                    onClick={() => void tomar(r.id)}
                  >
                    {busyId === r.id ? "Tomando…" : "TOMAR"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

function listaAbiertasLibres(
  regs: RegistroCorrectivo[],
  mapaAsig: Map<string, string[]>,
  areaFiltro: string | undefined,
): RegistroCorrectivo[] {
  return regs
    .filter((r) => {
      if (!solicitudAbierta(r)) return false;
      const dueños = mapaAsig.get(r.id) ?? [];
      if (dueños.length > 0) return false;
      if (areaFiltro && !coincideArea(r.area, areaFiltro)) return false;
      return true;
    })
    .sort((a, b) => (b.datos.numeroSolicitud || 0) - (a.datos.numeroSolicitud || 0));
}

export default BandejaTomarPanel;
