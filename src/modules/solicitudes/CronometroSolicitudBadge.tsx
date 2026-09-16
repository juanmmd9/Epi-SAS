import { useEffect, useMemo, useState } from "react";
import { aFechaIso } from "../../lib/fechas";
import { resolverHorariosAnio } from "../permisos/horasLaborables";
import { esFestivo, minutosDesdeHora } from "../permisos/permisosCalculo";
import type { CorrectivoDatos } from "../correctivo/types";
import {
  cargarContextoHorarioParaRango,
  estaEnJornadaLaboral,
  segundosActivosLaborales,
  type ContextoHorarioCronometro,
} from "./cronometroLaboral";
import {
  etiquetaEstadoCronometro,
  formatearDuracion,
  leerCronometro,
} from "./cronometroSolicitud";
import "./solicitudes.css";

interface Props {
  datos: CorrectivoDatos;
  compacto?: boolean;
}

const REFRESCO_HORARIO_MS = 30_000;

function resumenJornadaHoy(ctx: ContextoHorarioCronometro | null): string {
  if (!ctx) return "Cargando horario…";
  const ahora = new Date();
  const fechaIso = aFechaIso(ahora.getFullYear(), ahora.getMonth() + 1, ahora.getDate());
  if (esFestivo(ctx.festivos, fechaIso)) return "Hoy es festivo (no suma)";

  const delAnio = ctx.horarios.filter((h) => h.anio === ahora.getFullYear());
  const turnos = resolverHorariosAnio(ahora.getFullYear(), delAnio)
    .filter((h) => h.dia_semana === ahora.getDay() && h.activo)
    .sort(
      (a, b) =>
        minutosDesdeHora(a.hora_inicio.slice(0, 5)) -
        minutosDesdeHora(b.hora_inicio.slice(0, 5)),
    );

  if (turnos.length === 0) return "Hoy no hay jornada configurada";

  const tramos = turnos
    .map((t) => `${t.hora_inicio.slice(0, 5)}–${t.hora_fin.slice(0, 5)}`)
    .join(" · ");
  const fuente = ctx.desdeBd
    ? "Horario laboral (BD)"
    : "Estándar EPI (sin filas en BD este año)";
  return `${fuente}: ${tramos}`;
}

/** Cronómetro en vivo: solo suma tiempo según horario_laboral de la BD. */
function CronometroSolicitudBadge({ datos, compacto }: Props) {
  const estado = datos.cronometro?.estado ?? "idle";
  const segmentoInicio = datos.cronometro?.segmentoInicio ?? null;
  const acumuladoSeg = datos.cronometro?.acumuladoSeg ?? 0;
  const cron = leerCronometro(datos);
  const [ctx, setCtx] = useState<ContextoHorarioCronometro | null>(null);
  const [seg, setSeg] = useState(() => segundosActivosLaborales(cron, null));
  const [enJornada, setEnJornada] = useState(true);

  const jornadaHoy = useMemo(() => resumenJornadaHoy(ctx), [ctx]);

  useEffect(() => {
    const desde = segmentoInicio ? Date.parse(segmentoInicio) : Date.now();
    const base = Number.isNaN(desde) ? Date.now() : desde;
    let cancelado = false;

    async function recargar() {
      const c = await cargarContextoHorarioParaRango(base, Date.now());
      if (!cancelado) setCtx(c);
    }

    void recargar();
    const id = window.setInterval(() => void recargar(), REFRESCO_HORARIO_MS);

    function alVolverVisible() {
      if (document.visibilityState === "visible") void recargar();
    }
    document.addEventListener("visibilitychange", alVolverVisible);
    window.addEventListener("focus", alVolverVisible);

    return () => {
      cancelado = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", alVolverVisible);
      window.removeEventListener("focus", alVolverVisible);
    };
  }, [segmentoInicio, estado]);

  useEffect(() => {
    const actual = leerCronometro(datos);
    setSeg(segundosActivosLaborales(actual, ctx));
    if (ctx) {
      setEnJornada(estaEnJornadaLaboral(Date.now(), ctx.horarios, ctx.festivos));
    }
    if (actual.estado !== "running" || !ctx) return;
    const id = window.setInterval(() => {
      const ahora = Date.now();
      setSeg(segundosActivosLaborales(leerCronometro(datos), ctx, ahora));
      setEnJornada(estaEnJornadaLaboral(ahora, ctx.horarios, ctx.festivos));
    }, 1000);
    return () => window.clearInterval(id);
  }, [estado, segmentoInicio, acumuladoSeg, datos, ctx]);

  if (estado === "idle" && acumuladoSeg === 0) {
    return compacto ? null : (
      <span className="cronometro cronometro--idle">⏱ Sin iniciar</span>
    );
  }

  let etiqueta = etiquetaEstadoCronometro(estado);
  if (estado === "running" && ctx && !enJornada) {
    etiqueta = "No suma · fuera de horario";
  } else if (estado === "running" && !ctx) {
    etiqueta = "Cargando horario…";
  }

  return (
    <span
      className={
        "cronometro" +
        (estado === "running" ? " cronometro--running" : "") +
        (estado === "running" && ctx && !enJornada ? " cronometro--fuera" : "") +
        (estado === "paused" ? " cronometro--paused" : "") +
        (estado === "stopped" ? " cronometro--stopped" : "") +
        (compacto ? " cronometro--compacto" : "")
      }
      title={`${jornadaHoy}. Solo suma dentro de turnos; almuerzo/noche/festivo no cuentan.`}
    >
      <span className="cronometro__tiempo">⏱ {formatearDuracion(seg)}</span>
      {!compacto && <span className="cronometro__estado">{etiqueta}</span>}
    </span>
  );
}

export default CronometroSolicitudBadge;
