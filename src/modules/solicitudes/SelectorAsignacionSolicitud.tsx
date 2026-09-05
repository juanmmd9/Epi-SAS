import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  guardarAsignacionesCorrectivo,
  nombresAsignados,
} from "./asignacionCorrectivoService";
import type { AsignacionCorrectivo } from "./asignacionCorrectivoTypes";
import "./solicitudes.css";

interface Props {
  correctivoId: string;
  area: string;
  asignaciones: AsignacionCorrectivo[];
  operarios: Array<{ personalId: string; nombre: string; area: string | null }>;
  mapaNombres: Map<string, string>;
  puedeEditar: boolean;
  onActualizado: (correctivoId: string, filas: AsignacionCorrectivo[]) => void;
}

function SelectorAsignacionSolicitud({
  correctivoId,
  area,
  asignaciones,
  operarios,
  mapaNombres,
  puedeEditar,
  onActualizado,
}: Props) {
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const idsGuardados = asignaciones.map((a) => a.personal_id);
  const etiqueta = nombresAsignados(asignaciones, mapaNombres);
  const texto =
    etiqueta.length === 0
      ? "En bandeja"
      : etiqueta.length === 1
        ? etiqueta[0]
        : `${etiqueta.length} operarios`;

  const mismaSeleccion =
    seleccion.length === idsGuardados.length &&
    seleccion.every((id) => idsGuardados.includes(id));

  function actualizarPos() {
    const btn = btnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const ancho = 240;
    let left = r.left;
    if (left + ancho > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - ancho - 8);
    }
    let top = r.bottom + 4;
    if (top + 280 > window.innerHeight) {
      top = Math.max(8, r.top - 284);
    }
    setPanelPos({ top, left });
  }

  useEffect(() => {
    if (!abierto) return;
    setSeleccion(idsGuardados);
    setError(null);
    setMensaje(null);
    actualizarPos();

    function fuera(ev: PointerEvent) {
      const t = ev.target as Node;
      if (btnRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setAbierto(false);
    }
    function alScroll() {
      actualizarPos();
    }
    document.addEventListener("pointerdown", fuera);
    document.addEventListener("scroll", alScroll, true);
    window.addEventListener("resize", alScroll);
    return () => {
      document.removeEventListener("pointerdown", fuera);
      document.removeEventListener("scroll", alScroll, true);
      window.removeEventListener("resize", alScroll);
    };
    // Solo al abrir: no resetear selección mientras el admin marca checkboxes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  function alternar(id: string) {
    setSeleccion((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    setError(null);
    setMensaje(null);
  }

  async function guardar() {
    setGuardando(true);
    setError(null);
    setMensaje(null);
    try {
      const filas = await guardarAsignacionesCorrectivo(correctivoId, area, seleccion);
      onActualizado(correctivoId, filas);
      setMensaje(
        seleccion.length === 0
          ? "Devuelta a bandeja."
          : `Asignado a ${seleccion.length} operario(s).`,
      );
      window.setTimeout(() => setAbierto(false), 450);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  if (!puedeEditar) {
    return (
      <span className="solicitud-asignados" title={etiqueta.join(", ") || "Sin asignar"}>
        👤 {texto}
      </span>
    );
  }

  const panel =
    abierto && panelPos
      ? createPortal(
          <div
            ref={panelRef}
            className="solicitud-asignar-panel"
            style={{ top: panelPos.top, left: panelPos.left }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="solicitud-asignar-panel__hint">
              Marca operario(s) y pulsa <strong>Asignar</strong>
            </p>
            {operarios.length === 0 ? (
              <p className="solicitud-asignar-panel__vacio">
                No hay operarios con técnico vinculado.
              </p>
            ) : (
              <ul className="solicitud-asignar-panel__lista">
                {operarios.map((op) => {
                  const marcado = seleccion.includes(op.personalId);
                  return (
                    <li key={op.personalId}>
                      <button
                        type="button"
                        className={
                          "solicitud-asignar-panel__item" +
                          (marcado ? " solicitud-asignar-panel__item--ok" : "")
                        }
                        disabled={guardando}
                        aria-pressed={marcado}
                        onClick={() => alternar(op.personalId)}
                      >
                        <span
                          className={
                            "solicitud-asignar-panel__check" +
                            (marcado ? " solicitud-asignar-panel__check--on" : "")
                          }
                          aria-hidden="true"
                        >
                          {marcado ? "✓" : ""}
                        </span>
                        <span className="solicitud-asignar-panel__nombre">
                          {op.nombre}
                          {op.area ? ` · ${op.area}` : ""}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="solicitud-asignar-panel__acciones">
              {seleccion.length > 0 && (
                <button
                  type="button"
                  className="solicitud-asignar-panel__limpiar"
                  disabled={guardando}
                  onClick={() => {
                    setSeleccion([]);
                    setMensaje(null);
                  }}
                >
                  Quitar todos
                </button>
              )}
              <button
                type="button"
                className="btn btn--primario solicitud-asignar-panel__guardar"
                disabled={guardando || mismaSeleccion}
                onClick={() => void guardar()}
              >
                {guardando ? "Guardando…" : "Asignar"}
              </button>
            </div>
            {mensaje && <p className="solicitud-asignar-panel__ok">{mensaje}</p>}
            {error && <p className="solicitud-asignar-panel__error">{error}</p>}
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="solicitud-asignar-wrap">
      <button
        ref={btnRef}
        type="button"
        className={
          "solicitud-asignar-btn" + (idsGuardados.length ? " solicitud-asignar-btn--activo" : "")
        }
        disabled={guardando}
        title="Asignar operarios"
        onClick={() => setAbierto((v) => !v)}
      >
        👤 {texto}
      </button>
      {panel}
    </div>
  );
}

export default SelectorAsignacionSolicitud;
