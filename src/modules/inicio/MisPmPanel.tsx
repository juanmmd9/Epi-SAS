import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { NOMBRES_MESES } from "../../lib/fechas";
import type { MisPmItem } from "./inicioMisPm";
import "./inicio.css";

interface ResumenMisPm {
  total: number;
  vencidos: number;
  hoy: number;
  proximos: number;
}

interface MisPmPanelProps {
  items: MisPmItem[];
  resumen?: ResumenMisPm;
  cargando?: boolean;
  /** Vista principal del operario (sin cronograma completo debajo). */
  modoPrincipal?: boolean;
}

function etiquetaEstado(estado: MisPmItem["estado"]): string {
  if (estado === "vencida") return "Vencido";
  if (estado === "no_realizado") return "No realizado";
  if (estado === "programada") return "Programado";
  if (estado === "reprogramada") return "Reprogramado";
  return estado;
}

function MisPmPanel({ items, resumen, cargando, modoPrincipal = false }: MisPmPanelProps) {
  const navegar = useNavigate();
  const stats = resumen ?? {
    total: items.length,
    vencidos: items.filter((i) => i.estado === "vencida" || i.estado === "no_realizado").length,
    hoy: 0,
    proximos: items.length,
  };

  const grupos = useMemo(() => {
    const hoyIso = new Date().toISOString().slice(0, 10);
    const urgentes: MisPmItem[] = [];
    const paraHoy: MisPmItem[] = [];
    const proximos: MisPmItem[] = [];
    for (const item of items) {
      if (item.estado === "vencida" || item.estado === "no_realizado") urgentes.push(item);
      else if (item.fechaProgramada === hoyIso) paraHoy.push(item);
      else proximos.push(item);
    }
    return { urgentes, paraHoy, proximos };
  }, [items]);

  if (cargando) return null;

  function registrar(item: MisPmItem) {
    navegar("/preventivo", {
      state: {
        registrarPm: {
          maquinaId: item.maquinaId,
          area: item.area,
          fecha: item.fechaProgramada,
          personalIds: [item.personalId],
        },
      },
    });
  }

  function bloque(titulo: string, lista: MisPmItem[], tono: "rojo" | "hoy" | "prox") {
    if (lista.length === 0) return null;
    return (
      <div className={`mis-tareas__grupo mis-tareas__grupo--${tono}`}>
        <div className="mis-tareas__grupo-titulo">
          <h3>{titulo}</h3>
          <span>{lista.length}</span>
        </div>
        <ul className="mis-tareas__lista">
          {lista.map((item) => (
            <li
              key={item.claveAsignacion}
              className={`mis-tareas__card mis-tareas__card--${item.estado.replaceAll("_", "-")}`}
            >
              <div className="mis-tareas__fecha">
                <strong>{item.dia}</strong>
                <span>{NOMBRES_MESES[item.mes - 1]?.slice(0, 3)}</span>
              </div>
              <div className="mis-tareas__info">
                <strong className="mis-tareas__nombre">{item.nombre}</strong>
                <span className="mis-tareas__meta">
                  {item.area} · {item.codigo}
                </span>
                <span
                  className={`mis-tareas__badge mis-tareas__badge--${item.estado.replaceAll("_", "-")}`}
                >
                  {etiquetaEstado(item.estado)}
                </span>
              </div>
              <button
                type="button"
                className="btn btn--primario mis-tareas__accion"
                onClick={() => registrar(item)}
              >
                Registrar
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <section className={"mis-tareas" + (modoPrincipal ? " mis-tareas--principal" : "")}>
      <div className="mis-tareas__cabecera">
        <div>
          <h2>{modoPrincipal ? "Mis preventivos" : "Lo mío — PM pendientes"}</h2>
          <p className="mis-tareas__subtitulo">
            Solo ves los PM que te asignaron. Completa los vencidos primero.
          </p>
        </div>
        <span className="mis-tareas__total">{stats.total} por hacer</span>
      </div>

      {stats.total > 0 && (
        <div className="mis-tareas__resumen">
          <div className="mis-tareas__stat mis-tareas__stat--rojo">
            <strong>{stats.vencidos}</strong>
            <span>Vencidos</span>
          </div>
          <div className="mis-tareas__stat mis-tareas__stat--hoy">
            <strong>{stats.hoy}</strong>
            <span>Hoy</span>
          </div>
          <div className="mis-tareas__stat mis-tareas__stat--prox">
            <strong>{stats.proximos}</strong>
            <span>Próximos</span>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="mis-tareas__vacio">
          <strong>No tienes PM pendientes</strong>
          <p>
            Cuando el administrador te asigne un mantenimiento preventivo, aparecerá aquí
            y te llegará aviso al celular.
          </p>
        </div>
      ) : (
        <>
          {bloque("Urgente — vencidos / no realizados", grupos.urgentes, "rojo")}
          {bloque("Para hoy", grupos.paraHoy, "hoy")}
          {bloque("Próximos", grupos.proximos, "prox")}
        </>
      )}
    </section>
  );
}

export default MisPmPanel;
