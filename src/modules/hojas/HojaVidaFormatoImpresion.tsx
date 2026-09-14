import { areaTienePreventivo, coincideArea } from "../../lib/areas";
import type { HistorialMaquina } from "./hojasService";
import type { HojaVida } from "./types";
import "./hojaVidaImpresion.css";

export const ID_HOJA_VIDA_IMPRESION = "hoja-vida-formato-impresion";

type Props = {
  hoja: HojaVida;
  historial: HistorialMaquina | null;
};

function textoOGuion(valor: string | null | undefined): string {
  const t = (valor ?? "").trim();
  return t || "—";
}

function HojaVidaFormatoImpresion({ hoja, historial }: Props) {
  const preventivos = historial?.preventivos ?? [];
  const correctivos = historial?.correctivos ?? [];
  const fechaHoy = new Date().toLocaleDateString("es-CO");
  const esMoldes = coincideArea(hoja.area, "Moldes");

  return (
    <article id={ID_HOJA_VIDA_IMPRESION} className="hv-print" aria-label="Formato imprimible hoja de vida">
      <header className="hv-print__cabecera">
        <div className="hv-print__empresa">
          <strong>EPI SAS</strong>
          <span>Portal de Mantenimiento</span>
        </div>
        <div className="hv-print__titulo">
          <h1>Hoja de vida de máquina</h1>
          <p>Registro técnico e historial de mantenimientos</p>
        </div>
        <div className="hv-print__meta">
          <span>Fecha impresión</span>
          <strong>{fechaHoy}</strong>
        </div>
      </header>

      <section className="hv-print__identificacion">
        <div className="hv-print__foto">
          {hoja.foto_url ? (
            <img src={hoja.foto_url} alt={hoja.nombre} />
          ) : (
            <span>Sin foto</span>
          )}
        </div>
        <div className="hv-print__datos-principales">
          <h2>{hoja.nombre}</h2>
          <p className="hv-print__chip">
            {textoOGuion(hoja.codigo)} · {hoja.area} · {hoja.activa ? "Activa" : "Fuera de circulación"}
          </p>
          <dl className="hv-print__grid">
            <div>
              <dt>Código</dt>
              <dd>{textoOGuion(hoja.codigo)}</dd>
            </div>
            <div>
              <dt>Área</dt>
              <dd>{hoja.area}</dd>
            </div>
            <div>
              <dt>Marca</dt>
              <dd>{textoOGuion(hoja.datos.marca)}</dd>
            </div>
            {esMoldes ? (
              <>
                <div>
                  <dt>Peso del molde</dt>
                  <dd>{textoOGuion(hoja.datos.peso)}</dd>
                </div>
                <div>
                  <dt>Medidas del molde</dt>
                  <dd>{textoOGuion(hoja.datos.medidas)}</dd>
                </div>
              </>
            ) : (
              <>
                <div>
                  <dt>Modelo</dt>
                  <dd>{textoOGuion(hoja.datos.modelo)}</dd>
                </div>
                <div>
                  <dt>Serial</dt>
                  <dd>{textoOGuion(hoja.datos.serial)}</dd>
                </div>
              </>
            )}
            <div>
              <dt>Ubicación</dt>
              <dd>{textoOGuion(hoja.datos.ubicacion)}</dd>
            </div>
            <div>
              <dt>Frecuencia PM</dt>
              <dd>
                {areaTienePreventivo(hoja.area)
                  ? `Cada ${hoja.frecuencia_pm_meses ?? 12} mes(es)`
                  : "No aplica"}
              </dd>
            </div>
            <div>
              <dt>Primer PM</dt>
              <dd>{textoOGuion(hoja.primer_pm)}</dd>
            </div>
            <div>
              <dt>Registrada</dt>
              <dd>{hoja.creado_en.slice(0, 10)}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>{hoja.activa ? "Activa" : "Fuera de circulación"}</dd>
            </div>
            {!hoja.activa && (
              <>
                <div>
                  <dt>Fecha de baja</dt>
                  <dd>{textoOGuion(hoja.datos.fechaBaja)}</dd>
                </div>
                <div>
                  <dt>Motivo de baja</dt>
                  <dd>{textoOGuion(hoja.datos.motivoBaja)}</dd>
                </div>
              </>
            )}
          </dl>
        </div>
      </section>

      <section className="hv-print__bloque">
        <h3>1. Mantenimiento preventivo ({preventivos.length})</h3>
        {preventivos.length === 0 ? (
          <p className="hv-print__vacio">Sin registros de mantenimiento preventivo.</p>
        ) : (
          <table className="hv-print__tabla">
            <thead>
              <tr>
                <th style={{ width: "12%" }}>Fecha</th>
                <th style={{ width: "28%" }}>Personal</th>
                <th>Descripción / actividad</th>
              </tr>
            </thead>
            <tbody>
              {preventivos.map((registro) => (
                <tr key={registro.id}>
                  <td>{registro.fecha}</td>
                  <td>
                    {registro.datos.personalNombres?.join(", ") ||
                      registro.datos.personalNombre ||
                      "—"}
                  </td>
                  <td>{registro.descripcion || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="hv-print__bloque">
        <h3>2. Mantenimiento correctivo ({correctivos.length})</h3>
        {correctivos.length === 0 ? (
          <p className="hv-print__vacio">Sin solicitudes correctivas vinculadas.</p>
        ) : (
          <table className="hv-print__tabla">
            <thead>
              <tr>
                <th style={{ width: "8%" }}>No.</th>
                <th style={{ width: "11%" }}>Fecha</th>
                <th style={{ width: "14%" }}>Tipo</th>
                <th style={{ width: "28%" }}>Descripción</th>
                <th style={{ width: "28%" }}>Solución</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {correctivos.map((registro) => (
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
        )}
      </section>

      <footer className="hv-print__firmas">
        <div>
          <div className="hv-print__linea" />
          <strong>Elaboró / Técnico</strong>
          <small>Nombre y firma</small>
        </div>
        <div>
          <div className="hv-print__linea" />
          <strong>Revisó</strong>
          <small>Nombre y firma</small>
        </div>
        <div>
          <div className="hv-print__linea" />
          <strong>Aprobó</strong>
          <small>Nombre y firma</small>
        </div>
      </footer>
    </article>
  );
}

export default HojaVidaFormatoImpresion;
