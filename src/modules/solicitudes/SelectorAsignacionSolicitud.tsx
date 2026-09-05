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
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const ids = asignaciones.map((a) => a.personal_id);
  const etiqueta = nombresAsignados(asignaciones, mapaNombres);
  const texto =
    etiqueta.length === 0
      ? "En bandeja"
      : etiqueta.length === 1
        ? etiqueta[0]
        : `${etiqueta.length} operarios`;

  function actualizarPos() {
    const btn = btnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const ancho = 200;
    let left = r.left;
    if (left + ancho > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - ancho - 8);
    }
    setPanelPos({ top: r.bottom + 4, left });
  }

  useEffect(() => {
    if (!abierto) return;
    actualizarPos();
    function fuera(ev: MouseEvent) {
      const t = ev.target as Node;
      if (btnRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setAbierto(false);
    }
    function alScroll() {
      actualizarPos();
    }
    document.addEventListener("mousedown", fuera);
    document.addEventListener("scroll", alScroll, true);
    window.addEventListener("resize", alScroll);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("scroll", alScroll, true);
      window.removeEventListener("resize", alScroll);
    };
  }, [abierto]);

  async function aplicar(nuevosIds: string[]) {
    setGuardando(true);
    setError(null);
    try {
      const filas = await guardarAsignacionesCorrectivo(correctivoId, area, nuevosIds);
      onActualizado(correctivoId, filas);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  function alternar(id: string) {
    const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
    void aplicar(next);
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
            onMouseDown={(e) => e.stopPropagation()}
          >
            <p className="solicitud-asignar-panel__hint">Asignar / cambiar dueño</p>
            {operarios.length === 0 ? (
              <p className="solicitud-asignar-panel__vacio">
                No hay operarios con técnico vinculado.
              </p>
            ) : (
              operarios.map((op) => (
                <label key={op.personalId} className="solicitud-asignar-panel__item">
                  <input
                    type="checkbox"
                    checked={ids.includes(op.personalId)}
                    disabled={guardando}
                    onChange={() => alternar(op.personalId)}
                  />
                  <span>
                    {op.nombre}
                    {op.area ? ` · ${op.area}` : ""}
                  </span>
                </label>
              ))
            )}
            {ids.length > 0 && (
              <button
                type="button"
                className="solicitud-asignar-panel__limpiar"
                disabled={guardando}
                onClick={() => void aplicar([])}
              >
                Quitar todos
              </button>
            )}
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
          "solicitud-asignar-btn" + (ids.length ? " solicitud-asignar-btn--activo" : "")
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
