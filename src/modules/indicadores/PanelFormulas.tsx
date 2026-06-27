import { Link } from "react-router-dom";
import { NOMBRES_MESES } from "../../lib/fechas";
import {
  AREAS_CORRECTIVO_TABLA,
  DIAS_ESPERA_TOPE_HORAS_PERDIDAS,
  DIAS_MAX_HORAS_PERDIDAS_INDICADOR,
  formatearNumero,
} from "./indicadoresCalculo";

interface Props {
  mes: number;
  anio: number;
  area: string;
  cumplimientoPm: number | null;
  promedioRespuesta: number | null;
  porcentajeHoras: number | null;
  horasIndicador: number;
  horasProgramadas: number | null;
  horasCalendarioMes: number;
  horasGuardadasManual: boolean;
  solicitudesValidas: number;
  festivosCargados: number;
}

function FilaFormula({
  titulo,
  meta,
  frecuencia,
  formula,
  notas,
  ejemplo,
  periodoLabel,
}: {
  titulo: string;
  meta: string;
  frecuencia: string;
  formula: string;
  notas: string[];
  ejemplo?: string | null;
  periodoLabel: string;
}) {
  return (
    <article className="formula-card">
      <header className="formula-card__encabezado">
        <h3>{titulo}</h3>
        <div className="formula-card__metas">
          <span className="formula-card__chip">Meta: {meta}</span>
          <span className="formula-card__chip formula-card__chip--suave">{frecuencia}</span>
        </div>
      </header>
      <p className="formula-card__expresion">{formula}</p>
      <ul className="formula-card__notas">
        {notas.map((nota) => (
          <li key={nota}>{nota}</li>
        ))}
      </ul>
      {ejemplo && (
        <p className="formula-card__ejemplo">
          <strong>Ejemplo ({periodoLabel}):</strong> {ejemplo}
        </p>
      )}
    </article>
  );
}

function PanelFormulas({
  mes,
  anio,
  area,
  cumplimientoPm,
  promedioRespuesta,
  porcentajeHoras,
  horasIndicador,
  horasProgramadas,
  horasCalendarioMes,
  horasGuardadasManual,
  solicitudesValidas,
  festivosCargados,
}: Props) {
  const periodo = `${NOMBRES_MESES[mes - 1]} ${anio}`;

  const ejemploPm =
    cumplimientoPm !== null
      ? `Resultado = ${cumplimientoPm}% (todas las áreas con preventivo en ${periodo}).`
      : null;

  const ejemploRespuesta =
    area && promedioRespuesta !== null
      ? `En ${area}: promedio G = ${formatearNumero(promedioRespuesta)} min (${solicitudesValidas} solicitud(es) con tiempos completos).`
      : area
        ? `En ${area}: sin solicitudes válidas en ${periodo}.`
        : null;

  const ejemploHoras =
    area && porcentajeHoras !== null && horasProgramadas !== null
      ? `En ${area}: ${formatearNumero(horasIndicador)} h ÷ ${formatearNumero(horasProgramadas)} h × 100 = ${formatearNumero(porcentajeHoras)}% (${
          horasGuardadasManual ? "horas guardadas manualmente" : "horas del calendario laboral"
        }).`
      : area
        ? `En ${area}: faltan horas programadas o solicitudes válidas en ${periodo}.`
        : null;

  return (
    <div className="indicadores__formulas">
      <p className="indicadores__formulas-intro">
        Referencia de cómo se calculan los indicadores del SGC en este sistema. Las fórmulas
        están definidas en el programa; aquí solo se documentan. Para cambiar horas de
        producción use el campo <em>Horas programadas</em>; para jornada y festivos vaya a{" "}
        <Link to="/personal/horario">Personal → Horario y festivos</Link>.
      </p>

      <FilaFormula
        titulo="Cumplimiento a mantenimientos preventivos"
        meta="100%"
        frecuencia="Mensual · todas las áreas con PM"
        formula="(Cumplidas ÷ (Cumplidas + Pendientes)) × 100"
        periodoLabel={periodo}
        notas={[
          "Cumplida: hay registro PM de la máquina en ese mes (misma lógica que el cronograma en verde).",
          "No cuentan máquinas fuera de circulación ni citas solo reprogramadas.",
          "El % global de la tabla anual suma todas las áreas con preventivo.",
          "Meses futuros muestran celda vacía hasta que llegue el periodo.",
        ]}
        ejemplo={ejemploPm}
      />

      {AREAS_CORRECTIVO_TABLA.map((areaTabla) => (
        <FilaFormula
          key={`resp-${areaTabla}`}
          titulo={`Tiempo de respuesta promedio del servicio de mantenimiento correctivo (${areaTabla.toUpperCase()})`}
          meta="≤ 10 min (alerta hasta 15 min)"
          frecuencia="Mensual"
          formula="Promedio de G, donde G = (hora respuesta − hora solicitud) en minutos"
          periodoLabel={periodo}
          notas={[
            "Solo solicitudes del área y mes con hora de solicitud, respuesta y cierre completas.",
            "H = tiempo de mantenimiento; I = G + H (I no entra en este indicador).",
            "Filtro opcional por tipo de mantenimiento en los selectores superiores.",
          ]}
          ejemplo={
            area === areaTabla
              ? ejemploRespuesta
              : area
                ? null
                : `Seleccione ${areaTabla} en el filtro Área para ver el ejemplo de ${periodo}.`
          }
        />
      ))}

      {AREAS_CORRECTIVO_TABLA.map((areaTabla) => (
        <FilaFormula
          key={`horas-${areaTabla}`}
          titulo={`Porcentaje de horas perdidas por mantenimiento correctivo (${areaTabla.toUpperCase()})`}
          meta="≤ 1% (alerta hasta 2%)"
          frecuencia="Mensual"
          formula="(Horas para indicador ÷ Horas programadas del mes) × 100"
          periodoLabel={periodo}
          notas={[
            `Horas para indicador = suma de I (min) ÷ 60, con tope si la solicitud dura más de ${DIAS_ESPERA_TOPE_HORAS_PERDIDAS} días calendario: máximo ${DIAS_MAX_HORAS_PERDIDAS_INDICADOR} jornadas laborales (según horario y festivos).`,
            "Horas programadas: valor guardado por área y mes, o automático desde calendario laboral.",
            `Calendario actual del mes: ${formatearNumero(horasCalendarioMes)} h (${festivosCargados} festivos cargados en ${anio}).`,
            "El tiempo real (sin tope) se muestra en Detalle del mes; aquí solo cuenta lo que entra al indicador.",
          ]}
          ejemplo={
            area === areaTabla
              ? ejemploHoras
              : area
                ? null
                : `Seleccione ${areaTabla} en el filtro Área para ver el ejemplo de ${periodo}.`
          }
        />
      ))}

      <article className="formula-card formula-card--secundaria">
        <h3>Variables de tiempo correctivo</h3>
        <dl className="formula-card__glosario">
          <div>
            <dt>G</dt>
            <dd>Tiempo de respuesta (min): desde la hora de solicitud hasta la hora de respuesta.</dd>
          </div>
          <div>
            <dt>H</dt>
            <dd>Tiempo de mantenimiento (min): desde la hora de respuesta hasta la hora de cierre.</dd>
          </div>
          <div>
            <dt>I</dt>
            <dd>Tiempo total (min): G + H. Base para horas perdidas (con topes si aplica).</dd>
          </div>
        </dl>
        <p className="formula-card__pie">
          Promedio anual en la tabla = media de los meses que tienen dato (no incluye celdas vacías).
        </p>
      </article>
    </div>
  );
}

export default PanelFormulas;
