import type { ReactNode } from "react";
import type { RegistroCorrectivo } from "../correctivo/types";
import CronometroSolicitudBadge from "./CronometroSolicitudBadge";
import { diasAbierta, quienCerroSolicitud, solicitudEsperaRepuesto } from "./solicitudesCalculo";
import { formatearDuracion, leerCronometro } from "./cronometroSolicitud";
import "./solicitudes.css";

export type EstadoSolicitudVisual = "bandeja" | "curso" | "espera" | "cerrada";

interface Props {
  registro: RegistroCorrectivo;
  asignados?: string[];
  destacada?: boolean;
  acciones?: ReactNode;
}

export function estadoVisualSolicitud(
  registro: RegistroCorrectivo,
  asignados: string[] = [],
): EstadoSolicitudVisual {
  if (registro.datos.fechaCierre?.trim()) return "cerrada";
  if (solicitudEsperaRepuesto(registro)) return "espera";
  if (asignados.length === 0) return "bandeja";
  return "curso";
}

const ETIQUETAS_ESTADO: Record<EstadoSolicitudVisual, string> = {
  bandeja: "En bandeja",
  curso: "En curso",
  espera: "Espera repuesto",
  cerrada: "Cerrada",
};

function SolicitudGestionCard({ registro, asignados = [], destacada, acciones }: Props) {
  const estado = estadoVisualSolicitud(registro, asignados);
  const cerrada = estado === "cerrada";
  const enEspera = estado === "espera";
  const dias = diasAbierta(registro);
  const quienCerro = cerrada ? quienCerroSolicitud(registro) : null;
  const cron = leerCronometro(registro.datos);
  const tiempoGuardado =
    cron.acumuladoSeg > 0 || cron.estado === "stopped"
      ? formatearDuracion(cron.acumuladoSeg)
      : null;

  return (
    <article
      className={
        "sol-gestion-card" +
        (enEspera ? " sol-gestion-card--espera" : "") +
        (estado === "bandeja" ? " sol-gestion-card--bandeja" : "") +
        (cerrada ? " sol-gestion-card--cerrada" : "") +
        (destacada ? " sol-gestion-card--nueva" : "")
      }
    >
      <header className="sol-gestion-card__cabecera">
        <div className="sol-gestion-card__titulo">
          <span className="sol-gestion-card__num">#{registro.datos.numeroSolicitud || "—"}</span>
          <span className={`sol-gestion-card__estado sol-gestion-card__estado--${estado}`}>
            {ETIQUETAS_ESTADO[estado]}
          </span>
        </div>
        <time className="sol-gestion-card__fecha" dateTime={registro.fecha}>
          {registro.fecha.slice(0, 10)}
        </time>
      </header>

      <div className="sol-gestion-card__cuerpo">
        <h3 className="sol-gestion-card__maquina">
          {registro.datos.maquinaEquipoLocacion || "Sin máquina"}
          {registro.datos.codigoMaquina ? (
            <span className="sol-gestion-card__codigo"> ({registro.datos.codigoMaquina})</span>
          ) : null}
        </h3>
        <p className="sol-gestion-card__desc">
          {registro.datos.descripcionSolicitud || "Sin descripción"}
        </p>

        <div className="sol-gestion-card__meta">
          {registro.datos.nombreSolicitante && (
            <span>Solicita: {registro.datos.nombreSolicitante}</span>
          )}
          {dias !== null && <span>{dias} día(s) abierta</span>}
          {asignados.length > 0 && (
            <span className="sol-gestion-card__asignados">
              Técnico{asignados.length > 1 ? "s" : ""}: {asignados.join(", ")}
            </span>
          )}
          {quienCerro && <span>Cerró: {quienCerro}</span>}
          {cerrada && registro.datos.fechaCierre && (
            <span>
              Cierre: {registro.datos.fechaCierre.slice(0, 10)}
              {registro.datos.horaCierre ? ` ${registro.datos.horaCierre.slice(0, 5)}` : ""}
            </span>
          )}
        </div>

        <div className="sol-gestion-card__tiempo">
          {!cerrada ? (
            <CronometroSolicitudBadge datos={registro.datos} />
          ) : tiempoGuardado ? (
            <span className="sol-gestion-card__tiempo-fijo" title="Tiempo laboral registrado">
              ⏱ {tiempoGuardado} <span>· tiempo total</span>
            </span>
          ) : (
            <span className="sol-gestion-card__tiempo-fijo sol-gestion-card__tiempo-fijo--vacio">
              Sin tiempo registrado
            </span>
          )}
        </div>
      </div>

      {acciones && <footer className="sol-gestion-card__acciones">{acciones}</footer>}
    </article>
  );
}

export default SolicitudGestionCard;
