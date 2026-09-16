import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { RegistroCorrectivo } from "../correctivo/types";
import CronometroSolicitudBadge from "./CronometroSolicitudBadge";
import { quitarEsperaYReanudarCronometro } from "./cronometroAcciones";
import PedirRepuestoRapido from "./PedirRepuestoRapido";
import { solicitudAbierta } from "./solicitudesCalculo";
import "./solicitudes.css";

interface Props {
  items: RegistroCorrectivo[];
  personalId: string | null;
  modoPrincipal?: boolean;
  onDevuelta?: () => void;
  /** Para refrescar listas tras iniciar el cronómetro o pedir repuesto. */
  onAtendida?: () => void;
}

function MisSolicitudesPanel({ items, personalId, modoPrincipal, onAtendida }: Props) {
  const navegar = useNavigate();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [repuestoId, setRepuestoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abiertas = items.filter(solicitudAbierta);
  const enCurso = abiertas.filter((r) => !r.datos.esperaRepuesto);
  const enEspera = abiertas.filter((r) => r.datos.esperaRepuesto);

  function atender(registro: RegistroCorrectivo) {
    setError(null);
    // CorrectivoPage abre el formulario e inicia/reanuda el cronómetro.
    navegar("/correctivo", {
      state: {
        editarCorrectivoId: registro.id,
        filtroArea: registro.area,
      },
    });
  }

  async function repuestoListo(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await quitarEsperaYReanudarCronometro(id);
      setRepuestoId(null);
      onAtendida?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  function renderLista(lista: RegistroCorrectivo[], titulo?: string) {
    if (lista.length === 0) return null;
    return (
      <div className="mis-solicitudes__grupo">
        {titulo && <h3 className="mis-solicitudes__grupo-titulo">{titulo}</h3>}
        <ul className="mis-solicitudes__lista">
          {lista.map((r) => (
            <li key={r.id} className="mis-solicitudes__card">
              <div className="mis-solicitudes__fila">
                <div className="mis-solicitudes__info">
                  <strong>
                    #{r.datos.numeroSolicitud || "—"} · {r.area}
                  </strong>
                  <span>
                    {r.datos.maquinaEquipoLocacion || "Sin máquina"}
                    {r.datos.codigoMaquina ? ` (${r.datos.codigoMaquina})` : ""}
                  </span>
                  <span className="mis-solicitudes__desc">
                    {r.datos.descripcionSolicitud || "Sin descripción"}
                  </span>
                  <CronometroSolicitudBadge datos={r.datos} />
                  {r.datos.esperaRepuesto && (
                    <span className="mis-solicitudes__badge">Espera repuesto · tiempo pausado</span>
                  )}
                </div>
                <div className="mis-solicitudes__acciones">
                  <button
                    type="button"
                    className="btn btn--primario"
                    disabled={busyId === r.id}
                    onClick={() => atender(r)}
                  >
                    Atender
                  </button>
                  {r.datos.esperaRepuesto ? (
                    <button
                      type="button"
                      className="btn"
                      disabled={busyId === r.id}
                      onClick={() => void repuestoListo(r.id)}
                    >
                      Repuesto listo
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn--repuesto"
                      disabled={busyId === r.id}
                      onClick={() =>
                        setRepuestoId((prev) => (prev === r.id ? null : r.id))
                      }
                    >
                      Repuestos
                    </button>
                  )}
                </div>
              </div>
              {repuestoId === r.id && !r.datos.esperaRepuesto && (
                <PedirRepuestoRapido
                  area={r.area}
                  correctivoId={r.id}
                  hojaId={r.datos.maquinaId || null}
                  mostrarBoton={false}
                  abierto
                  onAbrirChange={(abierto) => {
                    if (!abierto) setRepuestoId(null);
                  }}
                  onCreado={() => {
                    setRepuestoId(null);
                    onAtendida?.();
                  }}
                />
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <section className={"mis-solicitudes" + (modoPrincipal ? " mis-solicitudes--principal" : "")}>
      <div className="mis-solicitudes__cabecera">
        <div>
          <h2>Mis solicitudes</h2>
          <p>
            Solo las que tomaste o te asignaron
            {personalId ? "" : " (vincula tu técnico en Usuarios)"}. Pulsa Atender para
            abrir el formulario de correctivo y arrancar el cronómetro; Repuestos pausa el
            tiempo.
          </p>
        </div>
        <span className="mis-solicitudes__total">{abiertas.length} abierta(s)</span>
      </div>

      {error && <p className="mis-solicitudes__error">{error}</p>}

      {abiertas.length === 0 ? (
        <div className="mis-solicitudes__vacio">
          <strong>No tienes solicitudes asignadas</strong>
          <p>
            En <strong>Solicitudes</strong> usa la bandeja de arriba y pulsa{" "}
            <strong>TOMAR</strong> en la que vayas a atender.
          </p>
        </div>
      ) : (
        <>
          {renderLista(enCurso, enEspera.length ? "En curso" : undefined)}
          {renderLista(enEspera, "En espera de repuesto")}
        </>
      )}
    </section>
  );
}

export default MisSolicitudesPanel;
