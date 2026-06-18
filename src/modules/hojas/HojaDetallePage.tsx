import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { areaTienePreventivo } from "../../lib/areas";
import type { PrefillMtre045DesdePreventivo } from "../formatos/mtre045Types";
import {
  idsDesdeRegistroPreventivo,
  nombresPersonalEnRegistro,
} from "../personal/personalVinculo";
import { listarPersonalActivo } from "../personal/personalService";
import type { Persona } from "../personal/types";
import { obtenerHistorialMaquina, obtenerHojaPorId } from "./hojasService";
import type { HistorialMaquina } from "./hojasService";
import type { HojaVida } from "./types";
import "./hojas.css";

function HojaDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [hoja, setHoja] = useState<HojaVida | null>(null);
  const [historial, setHistorial] = useState<HistorialMaquina | null>(null);
  const [personal, setPersonal] = useState<Persona[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listarPersonalActivo().then(setPersonal).catch(() => setPersonal([]));
  }, []);

  useEffect(() => {
    if (!id) {
      setError("No se indicó la máquina a consultar.");
      setCargando(false);
      return;
    }

    setCargando(true);
    setError(null);

    obtenerHojaPorId(id)
      .then(async (encontrada) => {
        if (!encontrada) {
          setError("No se encontró esa máquina en el catálogo.");
          setHoja(null);
          setHistorial(null);
          return;
        }
        setHoja(encontrada);
        const datosHistorial = await obtenerHistorialMaquina(encontrada);
        setHistorial(datosHistorial);
      })
      .catch((e: Error) => {
        setError("No se pudo cargar la hoja de vida: " + e.message);
      })
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) {
    return (
      <section className="hojas hoja-detalle">
        <p>Cargando hoja de vida...</p>
      </section>
    );
  }

  if (error || !hoja) {
    return (
      <section className="hojas hoja-detalle">
        <Link className="hoja-detalle__volver" to="/hojas-de-vida">
          ← Volver al catálogo
        </Link>
        <p className="hojas__mensaje hojas__mensaje--error">{error ?? "Máquina no encontrada."}</p>
      </section>
    );
  }

  const totalMantenimientos =
    (historial?.preventivos.length ?? 0) + (historial?.correctivos.length ?? 0);

  async function abrirMtre045(registro: HistorialMaquina["preventivos"][number]) {
    if (!hoja) return;
    const prefill: PrefillMtre045DesdePreventivo = {
      preventivoId: registro.id,
      numeroReporte: registro.id.slice(0, 8).toUpperCase(),
      fecha: registro.fecha,
      equipo: hoja.nombre,
      marca: hoja.datos.marca ?? "",
      serie: hoja.datos.serial ?? hoja.codigo ?? "",
      area: registro.area,
      actividadRealizada: registro.descripcion ?? "",
      responsableMantenimiento: nombresPersonalEnRegistro(
        idsDesdeRegistroPreventivo(registro),
        personal,
        registro.datos.personalNombres,
      ),
      mtre045: registro.datos.mtre045,
    };
    navigate("/formatos/mt-re-045", { state: { mtre045: prefill } });
  }

  return (
    <section className="hojas hoja-detalle">
      <header className="hoja-detalle__encabezado">
        <Link className="hoja-detalle__volver" to="/hojas-de-vida">
          ← Volver al catálogo
        </Link>
        <div className="hoja-detalle__titulo">
          <div>
            <h1>{hoja.nombre}</h1>
            <p className="hoja-detalle__subtitulo">
              {hoja.codigo || "Sin código"} · {hoja.area}
              {!hoja.activa ? " · Fuera de circulación" : ""}
            </p>
          </div>
          <button type="button" className="btn" onClick={() => navigate("/hojas-de-vida")}>
            Cambiar máquina
          </button>
        </div>
      </header>

      <div className="hoja-detalle__layout">
        <aside className="hoja-detalle__ficha">
          <div className="hoja-detalle__foto">
            {hoja.foto_url ? (
              <img src={hoja.foto_url} alt={hoja.nombre} />
            ) : (
              <span>Sin foto</span>
            )}
          </div>

          <dl className="hoja-detalle__datos">
            <div>
              <dt>Código</dt>
              <dd>{hoja.codigo || "—"}</dd>
            </div>
            <div>
              <dt>Área</dt>
              <dd>{hoja.area}</dd>
            </div>
            <div>
              <dt>Marca</dt>
              <dd>{hoja.datos.marca || "—"}</dd>
            </div>
            <div>
              <dt>Modelo</dt>
              <dd>{hoja.datos.modelo || "—"}</dd>
            </div>
            <div>
              <dt>Serial</dt>
              <dd>{hoja.datos.serial || "—"}</dd>
            </div>
            <div>
              <dt>Ubicación</dt>
              <dd>{hoja.datos.ubicacion || "—"}</dd>
            </div>
            <div>
              <dt>Frecuencia PM</dt>
              <dd>
                {areaTienePreventivo(hoja.area)
                  ? `Cada ${hoja.frecuencia_pm_meses ?? 12} mes(es)`
                  : "No aplica PM en esta área"}
              </dd>
            </div>
            <div>
              <dt>Primer PM</dt>
              <dd>{hoja.primer_pm || "—"}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>{hoja.activa ? "Activa" : "Fuera de circulación"}</dd>
            </div>
            {!hoja.activa && hoja.datos.fechaBaja && (
              <div>
                <dt>Fecha de baja</dt>
                <dd>{hoja.datos.fechaBaja}</dd>
              </div>
            )}
            {!hoja.activa && hoja.datos.motivoBaja && (
              <div>
                <dt>Motivo de baja</dt>
                <dd>{hoja.datos.motivoBaja}</dd>
              </div>
            )}
            <div>
              <dt>Registrada</dt>
              <dd>{hoja.creado_en.slice(0, 10)}</dd>
            </div>
          </dl>
        </aside>

        <div className="hoja-detalle__historial">
          <header className="hoja-detalle__historial-encabezado">
            <h2>Historial de mantenimientos</h2>
            <p>{totalMantenimientos} registro(s) vinculados a esta máquina.</p>
          </header>

          <section className="hoja-detalle__bloque">
            <h3>Mantenimiento preventivo ({historial?.preventivos.length ?? 0})</h3>
            {!historial?.preventivos.length ? (
              <p className="hoja-detalle__vacio">Aún no hay PM registrados para esta máquina.</p>
            ) : (
              <div className="hoja-detalle__tabla-scroll">
                <table className="hoja-detalle__tabla">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Descripción</th>
                      <th>Personal</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.preventivos.map((registro) => (
                      <tr key={registro.id}>
                        <td>{registro.fecha}</td>
                        <td>{registro.descripcion || "—"}</td>
                        <td>
                          {registro.datos.personalNombres?.join(", ") ||
                            registro.datos.personalNombre ||
                            "—"}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn"
                            onClick={() => void abrirMtre045(registro)}
                          >
                            MT-RE-045
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="hoja-detalle__bloque">
            <h3>Mantenimiento correctivo ({historial?.correctivos.length ?? 0})</h3>
            {!historial?.correctivos.length ? (
              <p className="hoja-detalle__vacio">
                Aún no hay solicitudes correctivas vinculadas a esta máquina.
              </p>
            ) : (
              <div className="hoja-detalle__tabla-scroll">
                <table className="hoja-detalle__tabla">
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Descripción</th>
                      <th>Solución</th>
                      <th>Estado máquina</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.correctivos.map((registro) => (
                      <tr key={registro.id}>
                        <td>{registro.datos.numeroSolicitud || "—"}</td>
                        <td>{registro.fecha}</td>
                        <td>{(registro.datos.tiposSolicitud || []).join(", ") || "—"}</td>
                        <td>{registro.datos.descripcionSolicitud || "—"}</td>
                        <td>{registro.datos.solucionSolicitud || "—"}</td>
                        <td>{registro.datos.estadoMaquina || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}

export default HojaDetallePage;
