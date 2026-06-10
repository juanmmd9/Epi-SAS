import { useEffect, useMemo, useState } from "react";
import { AREAS_CON_PM, AREAS_SISTEMA } from "../../lib/areas";
import { NOMBRES_MESES } from "../../lib/fechas";
import { listarCorrectivo } from "../correctivo/correctivoService";
import { TIPOS_SOLICITUD, type RegistroCorrectivo } from "../correctivo/types";
import { listarExcepciones } from "../cronograma/cronogramaService";
import type { ExcepcionCronograma } from "../cronograma/types";
import { listarHojas } from "../hojas/hojasService";
import type { HojaVida } from "../hojas/types";
import { listarPreventivo } from "../preventivo/preventivoService";
import type { RegistroPreventivo } from "../preventivo/types";
import { useNavigate } from "react-router-dom";
import {
  calcularResumenCorrectivo,
  calcularTiemposCorrectivo,
  clasificarCitasPreventivas,
  filtrarCorrectivos,
  formatearNumero,
  metasIncumplidasMes,
  type CitaClasificada,
} from "./indicadoresCalculo";
import {
  guardarHorasProgramadas,
  listarHorasProgramadas,
  periodoDe,
  type HorasProgramadas,
} from "./horasService";
import TablaAnual, { type PayloadNc } from "./TablaAnual";
import "./indicadores.css";

function ListaCitas({ items, clase, vacio }: { items: CitaClasificada[]; clase: string; vacio: string }) {
  if (items.length === 0) return <p className="indicadores__lista-vacia">{vacio}</p>;
  return (
    <ul className="indicadores__lista-citas">
      {items.map((item, indice) => (
        <li key={`${item.maquinaId}-${item.dia}-${indice}`} className={clase}>
          <strong>
            {item.nombre} ({item.codigo || "sin código"})
          </strong>
          <span>
            Programada: día {item.dia}
            {item.fechaPm && ` — PM: ${item.fechaPm}`}
            {item.destino &&
              ` → Reprogramada a ${item.destino.dia} ${NOMBRES_MESES[item.destino.mes - 1]} ${item.destino.anio}`}
          </span>
        </li>
      ))}
    </ul>
  );
}

function IndicadoresPage() {
  const hoy = new Date();
  const navegar = useNavigate();
  const [panel, setPanel] = useState<"detalle" | "tabla">("detalle");
  const [area, setArea] = useState("");
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [tipo, setTipo] = useState("");
  const [horasInput, setHorasInput] = useState("");

  const [correctivos, setCorrectivos] = useState<RegistroCorrectivo[]>([]);
  const [maquinas, setMaquinas] = useState<HojaVida[]>([]);
  const [excepciones, setExcepciones] = useState<ExcepcionCronograma[]>([]);
  const [preventivo, setPreventivo] = useState<RegistroPreventivo[]>([]);
  const [horas, setHoras] = useState<HorasProgramadas[]>([]);
  const [cargando, setCargando] = useState(true);
  const [estado, setEstado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      listarCorrectivo(),
      listarHojas(),
      listarExcepciones(),
      listarPreventivo(),
      listarHorasProgramadas(),
    ])
      .then(([corr, hojas, excs, prev, hrs]) => {
        setCorrectivos(corr);
        setMaquinas(hojas);
        setExcepciones(excs);
        setPreventivo(prev);
        setHoras(hrs);
      })
      .catch((e: Error) => setError("No se pudieron cargar los datos: " + e.message))
      .finally(() => setCargando(false));
  }, []);

  const horasProgramadasActual = useMemo(() => {
    if (!area) return null;
    const registro = horas.find(
      (h) => h.periodo === periodoDe(anio, mes) && h.area === area,
    );
    return registro && registro.horas > 0 ? registro.horas : null;
  }, [horas, area, anio, mes]);

  useEffect(() => {
    setHorasInput(horasProgramadasActual !== null ? String(horasProgramadasActual) : "");
  }, [horasProgramadasActual]);

  const filas = useMemo(() => {
    if (!area) return [];
    return filtrarCorrectivos(correctivos, area, anio, mes, tipo).map((registro) => ({
      registro,
      tiempos: calcularTiemposCorrectivo(registro),
    }));
  }, [correctivos, area, anio, mes, tipo]);

  const resumen = useMemo(() => calcularResumenCorrectivo(filas), [filas]);

  const preventivoPorArea = useMemo(
    () =>
      AREAS_CON_PM.map((a) => ({
        area: a,
        datos: clasificarCitasPreventivas(maquinas, excepciones, preventivo, a, anio, mes),
      })),
    [maquinas, excepciones, preventivo, anio, mes],
  );

  async function manejarGuardarHoras() {
    setEstado(null);
    setError(null);
    if (!area) {
      setError("Selecciona un área para guardar las horas programadas.");
      return;
    }
    const valor = Number.parseFloat(horasInput);
    if (!Number.isFinite(valor) || valor <= 0) {
      setError("Ingresa un número válido de horas programadas.");
      return;
    }
    try {
      const guardado = await guardarHorasProgramadas(anio, mes, area, valor);
      setHoras((previas) => {
        const sinActual = previas.filter((h) => h.id !== guardado.id);
        return [...sinActual, guardado];
      });
      setEstado(`Horas programadas guardadas: ${valor} h (${area}).`);
    } catch (e) {
      setError("No fue posible guardar las horas: " + (e as Error).message);
    }
  }

  const ratio = horasProgramadasActual ? resumen.horas / horasProgramadasActual : null;

  const metasIncumplidas = useMemo(
    () =>
      metasIncumplidasMes(
        maquinas, excepciones, preventivo, correctivos, horas, anio, mes, tipo, area,
      ),
    [maquinas, excepciones, preventivo, correctivos, horas, anio, mes, tipo, area],
  );

  function abrirNcDesdeMetaIncumplida(meta: (typeof metasIncumplidas)[number]) {
    const payload: PayloadNc = {
      area: meta.area === "Todas las areas PM" ? area : meta.area,
      indicador: meta.indicador,
      meta: meta.meta,
      valor: meta.valor,
      mes: meta.mes,
      anio: meta.anio,
      descripcion: `Indicador "${meta.indicador}" no cumple la meta (${meta.meta}). Valor obtenido: ${meta.valor}. Periodo: ${NOMBRES_MESES[meta.mes - 1]} ${meta.anio}. Area: ${meta.area}.`,
    };
    navegar("/formatos/gc-re-009", { state: { nc: payload } });
  }

  return (
    <section className="indicadores">
      <h1>Indicadores de mantenimiento</h1>
      <p className="indicadores__descripcion">
        Tiempos de respuesta correctivos y cumplimiento del cronograma preventivo.
      </p>

      <div className="indicadores__pestanas">
        <button
          className={"pestana" + (panel === "detalle" ? " pestana--activa" : "")}
          onClick={() => setPanel("detalle")}
        >
          Detalle del mes
        </button>
        <button
          className={"pestana" + (panel === "tabla" ? " pestana--activa" : "")}
          onClick={() => setPanel("tabla")}
        >
          Tabla anual
        </button>
      </div>

      <div className="indicadores__filtros">
        <label>
          Área
          <select value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="">Selecciona un área</option>
            {AREAS_SISTEMA.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </label>
        <label>
          Mes
          <select value={mes} onChange={(e) => setMes(Number(e.target.value))}>
            {NOMBRES_MESES.map((nombre, i) => (
              <option key={nombre} value={i + 1}>{nombre}</option>
            ))}
          </select>
        </label>
        <label>
          Año
          <input
            type="number"
            value={anio}
            onChange={(e) => setAnio(Number.parseInt(e.target.value, 10) || hoy.getFullYear())}
          />
        </label>
        <label>
          Tipo de mantenimiento
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Todos</option>
            {TIPOS_SOLICITUD.map((t) => (
              <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </label>
        <label>
          Horas programadas del mes
          <div className="indicadores__horas">
            <input
              type="number"
              min={1}
              placeholder={area ? "Ej. 1376" : "Selecciona un área"}
              disabled={!area}
              value={horasInput}
              onChange={(e) => setHorasInput(e.target.value)}
            />
            <button className="btn" disabled={!area} onClick={manejarGuardarHoras}>
              Guardar
            </button>
          </div>
        </label>
      </div>

      {estado && <p className="indicadores__mensaje indicadores__mensaje--ok">{estado}</p>}
      {error && <p className="indicadores__mensaje indicadores__mensaje--error">{error}</p>}
      {cargando && <p>Cargando indicadores...</p>}

      {panel === "tabla" && !cargando && (
        <TablaAnual
          anio={anio}
          tipoMantenimiento={tipo}
          maquinas={maquinas}
          excepciones={excepciones}
          preventivo={preventivo}
          correctivos={correctivos}
          horas={horas}
        />
      )}

      {panel === "detalle" && (
      <>
      <h2>Metas del mes — {NOMBRES_MESES[mes - 1]} {anio}</h2>

      {metasIncumplidas.length === 0 ? (
        <p className="indicadores__vacio">
          Todas las metas del mes ({NOMBRES_MESES[mes - 1]} {anio}) se cumplen o no hay
          datos para evaluar.
        </p>
      ) : (
        <div className="metas-fallidas">
          {metasIncumplidas.map((meta, indice) => (
            <div
              key={indice}
              className={
                "meta-fallida" +
                (meta.severidad === "fail" ? " meta-fallida--fail" : " meta-fallida--alerta")
              }
            >
              <div>
                <strong>{meta.indicador}</strong>
                <div className="meta-fallida__detalle">
                  {meta.area} · Meta {meta.meta} · Valor {meta.valor}
                </div>
              </div>
              <button className="btn" onClick={() => abrirNcDesdeMetaIncumplida(meta)}>
                Llenar GC-RE-009
              </button>
            </div>
          ))}
        </div>
      )}

      <h2>Correctivo — tiempos de respuesta</h2>

      <div className="indicadores__tarjetas">
        <article className="tarjeta-indicador">
          <span>Total tiempo real (h)</span>
          <strong>{formatearNumero(resumen.horas)}</strong>
          <small>
            {formatearNumero(resumen.totalI, 0)} min en {resumen.cantidad} solicitudes
          </small>
        </article>
        <article className="tarjeta-indicador">
          <span>Horas programadas</span>
          <strong>{horasProgramadasActual ?? "—"}</strong>
          <small>
            {NOMBRES_MESES[mes - 1]} {anio}{area ? ` — ${area}` : ""}
          </small>
        </article>
        <article className="tarjeta-indicador">
          <span>Indicador (Turnos)</span>
          <strong>{ratio !== null ? `${formatearNumero(ratio * 100)}%` : "—"}</strong>
          <small>
            {ratio !== null
              ? `Ratio ${formatearNumero(ratio, 4)} = ${formatearNumero(resumen.horas)} / ${horasProgramadasActual}`
              : "Guarda las horas programadas del mes para calcular el indicador."}
          </small>
        </article>
      </div>

      {!area && (
        <p className="indicadores__vacio">
          Selecciona un área para ver la tabla de tiempos correctivos.
        </p>
      )}
      {area && filas.length === 0 && !cargando && (
        <p className="indicadores__vacio">
          No hay solicitudes correctivas en {area} para {NOMBRES_MESES[mes - 1]} {anio}.
        </p>
      )}

      {filas.length > 0 && (
        <div className="indicadores__tabla-contenedor">
          <table className="indicadores__tabla">
            <thead>
              <tr>
                <th>Máquina</th>
                <th colSpan={2}>Solicitud</th>
                <th>Hora respuesta</th>
                <th colSpan={2}>Entrega</th>
                <th>T. respuesta (min) G</th>
                <th>T. mantenimiento (min) H</th>
                <th>T. real mant. I</th>
              </tr>
              <tr className="indicadores__subencabezado">
                <th></th>
                <th>Fecha</th>
                <th>Hora</th>
                <th></th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>G</th>
                <th>H</th>
                <th>I = G + H</th>
              </tr>
            </thead>
            <tbody>
              {filas.map(({ registro, tiempos }) => (
                <tr key={registro.id} className={tiempos.advertencia ? "fila-advertencia" : ""}>
                  <td>{registro.datos.maquinaEquipoLocacion || "—"}</td>
                  <td>{registro.fecha || "—"}</td>
                  <td>{registro.datos.horaSolicitud || "—"}</td>
                  <td>{registro.datos.horaRespuesta || "—"}</td>
                  <td>{registro.datos.fechaCierre || "—"}</td>
                  <td>{registro.datos.horaCierre || "—"}</td>
                  <td>{formatearNumero(tiempos.g, tiempos.valido ? 0 : 2)}</td>
                  <td>{formatearNumero(tiempos.h, tiempos.valido ? 0 : 2)}</td>
                  <td className="indicadores__col-real">
                    {formatearNumero(tiempos.i, tiempos.valido ? 0 : 2)}
                  </td>
                </tr>
              ))}
              <tr className="indicadores__fila-resumen">
                <td colSpan={6}><strong>Total</strong></td>
                <td>{formatearNumero(resumen.totalG, 0)}</td>
                <td>{formatearNumero(resumen.totalH, 0)}</td>
                <td>{formatearNumero(resumen.totalI, 0)}</td>
              </tr>
              <tr className="indicadores__fila-resumen">
                <td colSpan={6}><strong>Promedio</strong></td>
                <td>{formatearNumero(resumen.promedioG)}</td>
                <td>{formatearNumero(resumen.promedioH)}</td>
                <td>{formatearNumero(resumen.promedioI)}</td>
              </tr>
              <tr className="indicadores__fila-resumen">
                <td colSpan={6}><strong>Horas</strong> (total I / 60)</td>
                <td colSpan={3}>{formatearNumero(resumen.horas)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <h2>Preventivo — cumplimiento del cronograma</h2>

      <div className="indicadores__preventivo">
        {preventivoPorArea.map(({ area: a, datos }) => (
          <section key={a} className="bloque-preventivo">
            <header>
              <h4>{a}</h4>
              <span>{NOMBRES_MESES[mes - 1]} {anio}</span>
            </header>
            <div className="indicadores__tarjetas indicadores__tarjetas--compactas">
              <article className="tarjeta-indicador">
                <span>Cumplimiento PM</span>
                <strong>{datos.porcentaje}%</strong>
                <small>{datos.cumplidas.length} de {datos.total} citas cumplidas</small>
              </article>
              <article className="tarjeta-indicador">
                <span>Cumplidas</span>
                <strong>{datos.cumplidas.length}</strong>
              </article>
              <article className="tarjeta-indicador">
                <span>Reprogramadas</span>
                <strong>{datos.reprogramadas.length}</strong>
              </article>
              <article className="tarjeta-indicador">
                <span>Pendientes</span>
                <strong>{datos.pendientes.length}</strong>
              </article>
            </div>
            <div className="bloque-preventivo__listas">
              <div>
                <h5>Cumplidas ({datos.cumplidas.length})</h5>
                <ListaCitas
                  items={datos.cumplidas}
                  clase="cita-cumplida"
                  vacio="Ninguna cita cumplida este mes."
                />
              </div>
              <div>
                <h5>Reprogramadas ({datos.reprogramadas.length})</h5>
                <ListaCitas
                  items={datos.reprogramadas}
                  clase="cita-reprogramada"
                  vacio="Ninguna reprogramación registrada."
                />
              </div>
              <div>
                <h5>Pendientes ({datos.pendientes.length})</h5>
                <ListaCitas
                  items={datos.pendientes}
                  clase="cita-pendiente"
                  vacio="Sin pendientes."
                />
              </div>
            </div>
          </section>
        ))}
      </div>
      </>
      )}
    </section>
  );
}

export default IndicadoresPage;
