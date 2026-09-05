import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import type { OperarioAsignable } from "../preventivo/asignacionPmTypes";
import type { AsignacionPm } from "../preventivo/asignacionPmTypes";
import { personalIdsDeAsignaciones } from "../preventivo/asignacionPmClave";
import type { EstadoCitaPm } from "../cronograma/types";
import "./inicio.css";

interface CitaPmItemProps {
  maquinaId: string;
  nombre: string;
  codigo: string;
  frecuencia: number;
  dia: number;
  mes: number;
  anio: number;
  area: string;
  estado: EstadoCitaPm;
  reprogramadoA: { anio: number; mes: number; dia: number } | null;
  fechaProgramada: string;
  asignaciones?: AsignacionPm[];
  operarios: OperarioAsignable[];
  mapaNombres: Map<string, string>;
  puedeModificarPm: boolean;
  puedeAsignar: boolean;
  guardandoAsignacion: boolean;
  onAsignar: (personalIds: string[]) => void;
}

function CitaPmItem({
  maquinaId,
  nombre,
  codigo,
  frecuencia,
  dia,
  area,
  estado,
  reprogramadoA,
  fechaProgramada,
  asignaciones,
  operarios,
  mapaNombres,
  puedeModificarPm,
  puedeAsignar,
  guardandoAsignacion,
  onAsignar,
}: CitaPmItemProps) {
  const navegar = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const soloLectura = !puedeModificarPm || estado === "de_baja";
  const personalIds = personalIdsDeAsignaciones(asignaciones);
  const nombresAsignados = personalIds
    .map((id) => mapaNombres.get(id))
    .filter(Boolean) as string[];
  const etiquetaAsignados =
    nombresAsignados.length === 0
      ? "Sin asignar"
      : nombresAsignados.length === 1
        ? nombresAsignados[0]
        : `${nombresAsignados.length} operarios`;

  function actualizarPosicion() {
    const btn = btnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const anchoPanel = 180;
    const margen = 8;
    let left = r.left;
    if (left + anchoPanel > window.innerWidth - margen) {
      left = Math.max(margen, window.innerWidth - anchoPanel - margen);
    }
    setPanelPos({ top: r.bottom + 4, left });
  }

  useLayoutEffect(() => {
    if (!abierto) {
      setPanelPos(null);
      return;
    }
    actualizarPosicion();
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    function fuera(ev: MouseEvent) {
      const t = ev.target as Node;
      if (btnRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setAbierto(false);
    }
    function alScrollOResize() {
      actualizarPosicion();
    }
    document.addEventListener("mousedown", fuera);
    window.addEventListener("resize", alScrollOResize);
    // Captura scroll en contenedores anidados (lista de meses).
    document.addEventListener("scroll", alScrollOResize, true);
    return () => {
      document.removeEventListener("mousedown", fuera);
      window.removeEventListener("resize", alScrollOResize);
      document.removeEventListener("scroll", alScrollOResize, true);
    };
  }, [abierto]);

  function abrirRegistro() {
    navegar("/preventivo", {
      state: {
        registrarPm: {
          maquinaId,
          area,
          fecha: fechaProgramada,
          personalIds: personalIds.length ? personalIds : undefined,
        },
      },
    });
  }

  function alternarOperario(id: string) {
    const next = personalIds.includes(id)
      ? personalIds.filter((x) => x !== id)
      : [...personalIds, id];
    onAsignar(next);
  }

  const panel =
    abierto && panelPos
      ? createPortal(
          <div
            ref={panelRef}
            className="cita__asignar-panel cita__asignar-panel--fijo"
            role="group"
            aria-label="Asignar operarios"
            style={{ top: panelPos.top, left: panelPos.left }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <p className="cita__asignar-hint">Puedes marcar varios</p>
            {operarios.length === 0 ? (
              <p className="cita__asignar-vacio">
                Vincula técnicos a usuarios operador/admin.
              </p>
            ) : (
              operarios.map((op) => (
                <label key={op.personalId} className="cita__asignar-item">
                  <input
                    type="checkbox"
                    checked={personalIds.includes(op.personalId)}
                    disabled={guardandoAsignacion}
                    onChange={() => alternarOperario(op.personalId)}
                  />
                  <span>{op.nombre}</span>
                </label>
              ))
            )}
            {personalIds.length > 0 && (
              <button
                type="button"
                className="cita__asignar-limpiar"
                disabled={guardandoAsignacion}
                onClick={() => onAsignar([])}
              >
                Quitar todos
              </button>
            )}
          </div>,
          document.body,
        )
      : null;

  return (
    <li
      className={
        `cita cita--${estado.replaceAll("_", "-")}` +
        (soloLectura ? " cita--solo-lectura" : "") +
        (abierto ? " cita--asignando" : "")
      }
      role={soloLectura ? undefined : "button"}
      tabIndex={soloLectura ? undefined : 0}
      title={`${nombre} — ${estado === "de_baja" ? "De baja" : estado}${
        nombresAsignados.length ? ` · ${nombresAsignados.join(", ")}` : ""
      }`}
      onClick={soloLectura ? undefined : abrirRegistro}
      onKeyDown={
        soloLectura
          ? undefined
          : (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                abrirRegistro();
              }
            }
      }
    >
      {estado === "completada" && <span className="cita__check">✓</span>}
      {estado === "no_realizado" && <span className="cita__icono">!</span>}
      <span className="cita__dia">{dia}</span>
      <span className="cita__nombre">{nombre}</span>

      {puedeAsignar && estado !== "completada" && estado !== "de_baja" && (
        <div
          className="cita__asignar-wrap"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <button
            ref={btnRef}
            type="button"
            className={
              "cita__asignar-btn" +
              (personalIds.length ? " cita__asignar-btn--activo" : "")
            }
            disabled={guardandoAsignacion}
            title="Asignar uno o varios operarios"
            onClick={() => setAbierto((v) => !v)}
          >
            👤 {etiquetaAsignados}
          </button>
          {panel}
        </div>
      )}

      {!puedeAsignar && nombresAsignados.length > 0 && (
        <span className="cita__operario" title={nombresAsignados.join(", ")}>
          👤 {etiquetaAsignados}
        </span>
      )}

      <span className="cita__codigo">
        {codigo} · cada {frecuencia}m
        {reprogramadoA && estado === "no_realizado" && (
          <> · → {reprogramadoA.dia}/{reprogramadoA.mes}</>
        )}
      </span>
    </li>
  );
}

export default CitaPmItem;
