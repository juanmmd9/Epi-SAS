import { Fragment, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { NOMBRES_MESES } from "../../lib/fechas";
import type { RegistroCorrectivo } from "../correctivo/types";
import type { ExcepcionCronograma } from "../cronograma/types";
import type { HojaVida } from "../hojas/types";
import type { RegistroPreventivo } from "../preventivo/types";
import type { Festivo, HorarioLaboral } from "../permisos/types";
import type { HorasProgramadas } from "./horasService";
import {
  AREAS_CORRECTIVO_TABLA,
  cumplimientoPreventivoGlobal,
  estadoMetaHorasPerdidas,
  estadoMetaPreventivo,
  estadoMetaTiempoRespuesta,
  formatearNumero,
  formatearNumeroMax,
  porcentajeHorasPerdidasArea,
  promedioRespuestaArea,
  promedioValoresMensuales,
  type EstadoMeta,
} from "./indicadoresCalculo";

const MESES_CORTOS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

export interface PayloadNc {
  area: string;
  indicador: string;
  meta: string;
  valor: string;
  mes: number;
  anio: number;
  descripcion: string;
}

interface FilaIndicador {
  objetivo: string;
  indicador: string;
  meta: string;
  frecuencia: string;
  area: string;
  valores: (number | null)[];
  formatear: (valor: number) => string;
  estadoMeta: (valor: number | null) => EstadoMeta;
}

interface Props {
  anio: number;
  tipoMantenimiento: string;
  maquinas: HojaVida[];
  excepciones: ExcepcionCronograma[];
  preventivo: RegistroPreventivo[];
  correctivos: RegistroCorrectivo[];
  horas: HorasProgramadas[];
  horarios: HorarioLaboral[];
  festivos: Festivo[];
}

function claseDeEstado(estado: EstadoMeta): string {
  if (estado === "ok") return "celda-meta-ok";
  if (estado === "alerta") return "celda-meta-alerta";
  if (estado === "fail") return "celda-meta-fail";
  return "";
}

function formatearPromedioAnual(valor: number, fila: FilaIndicador): string {
  if (fila.indicador.includes("CUMPLIMIENTO") || fila.indicador.includes("HORAS PERDIDAS")) {
    return `${formatearNumeroMax(valor, 3)}%`;
  }
  return formatearNumeroMax(valor, 3);
}

function TablaAnual({
  anio,
  tipoMantenimiento,
  maquinas,
  excepciones,
  preventivo,
  correctivos,
  horas,
  horarios,
  festivos,
}: Props) {
  const navegar = useNavigate();

  const filas = useMemo<FilaIndicador[]>(() => {
    const valoresPreventivo: (number | null)[] = [];
    for (let mes = 1; mes <= 12; mes++) {
      valoresPreventivo.push(
        cumplimientoPreventivoGlobal(maquinas, excepciones, preventivo, anio, mes),
      );
    }

    const resultado: FilaIndicador[] = [
      {
        objetivo: "MEJORAR CONTINUAMENTE LOS PROCESOS",
        indicador: "CUMPLIMIENTO A MANTENIMIENTOS PREVENTIVOS",
        meta: "100%",
        frecuencia: "MENSUAL",
        area: "",
        valores: valoresPreventivo,
        formatear: (v) => `${v}%`,
        estadoMeta: estadoMetaPreventivo,
      },
    ];

    for (const area of AREAS_CORRECTIVO_TABLA) {
      const valoresRespuesta: (number | null)[] = [];
      const valoresHoras: (number | null)[] = [];
      for (let mes = 1; mes <= 12; mes++) {
        valoresRespuesta.push(
          promedioRespuestaArea(
            correctivos, anio, mes, area, tipoMantenimiento, horarios, festivos,
          ),
        );
        valoresHoras.push(
          porcentajeHorasPerdidasArea(
            correctivos, horas, anio, mes, area, tipoMantenimiento, horarios, festivos,
          ),
        );
      }
      resultado.push({
        objetivo: "",
        indicador: `TIEMPO DE RESPUESTA PROMEDIO DEL SERVICIO DE MANTENIMIENTO CORRECTIVO (${area.toUpperCase()})`,
        meta: "10 MINUTOS",
        frecuencia: "MENSUAL",
        area,
        valores: valoresRespuesta,
        formatear: (v) => formatearNumero(v),
        estadoMeta: estadoMetaTiempoRespuesta,
      });
      resultado.push({
        objetivo: "",
        indicador: `PORCENTAJE DE HORAS PERDIDAS POR MANTENIMIENTO CORRECTIVO (${area.toUpperCase()})`,
        meta: "1%",
        frecuencia: "MENSUAL",
        area,
        valores: valoresHoras,
        formatear: (v) => `${formatearNumero(v)}%`,
        estadoMeta: estadoMetaHorasPerdidas,
      });
    }

    return resultado;
  }, [anio, tipoMantenimiento, maquinas, excepciones, preventivo, correctivos, horas, horarios, festivos]);

  function abrirNc(fila: FilaIndicador, mes: number, texto: string) {
    const payload: PayloadNc = {
      area: fila.area,
      indicador: fila.indicador,
      meta: fila.meta,
      valor: texto,
      mes,
      anio,
      descripcion: `Indicador "${fila.indicador}" no cumple la meta (${fila.meta}). Valor obtenido: ${texto}. Periodo: ${NOMBRES_MESES[mes - 1]} ${anio}.${fila.area ? ` Area: ${fila.area}.` : ""}`,
    };
    navegar("/formatos/gc-re-009", { state: { nc: payload } });
  }

  let areaAnterior = "";

  return (
    <div>
      <div className="indicadores__tabla-contenedor">
        <table className="indicadores__tabla tabla-anual">
          <thead>
            <tr className="tabla-anual__titulo">
              <th colSpan={17}>INDICADORES {anio}</th>
            </tr>
            <tr>
              <th>OBJETIVOS DE CALIDAD</th>
              <th>INDICADORES</th>
              <th>META</th>
              <th>FRECUENCIA</th>
              {MESES_CORTOS.map((m) => (
                <th key={m}>{m}</th>
              ))}
              <th>PROMEDIO</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila, indiceFila) => {
              const filaArea =
                fila.area && fila.area !== areaAnterior ? (
                  <tr key={`area-${fila.area}`} className="tabla-anual__fila-area">
                    <td colSpan={17}>{fila.area}</td>
                  </tr>
                ) : null;
              areaAnterior = fila.area;

              const promedio = promedioValoresMensuales(fila.valores);
              const estadoPromedio = fila.estadoMeta(promedio);

              return (
                <Fragment key={indiceFila}>
                  {filaArea}
                  <tr>
                    <td className="tabla-anual__objetivo">{fila.objetivo}</td>
                    <td className="tabla-anual__indicador">{fila.indicador}</td>
                    <td>{fila.meta}</td>
                    <td>{fila.frecuencia}</td>
                    {fila.valores.map((valor, indiceMes) => {
                      const estado = fila.estadoMeta(valor);
                      const texto = valor === null ? "—" : fila.formatear(valor);
                      const clicable = estado === "fail" || estado === "alerta";
                      return (
                        <td
                          key={indiceMes}
                          className={
                            claseDeEstado(estado) + (clicable ? " celda-meta-clicable" : "")
                          }
                          title={
                            clicable
                              ? `Click para llenar el formato GC-RE-009 de ${NOMBRES_MESES[indiceMes]}`
                              : undefined
                          }
                          onClick={clicable ? () => abrirNc(fila, indiceMes + 1, texto) : undefined}
                        >
                          {texto}
                        </td>
                      );
                    })}
                    <td className={"tabla-anual__promedio " + claseDeEstado(estadoPromedio)}>
                      <strong>{promedio === null ? "—" : formatearPromedioAnual(promedio, fila)}</strong>
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="tabla-anual__leyenda">
        <span className="leyenda leyenda--ok">Verde</span> cumple meta —{" "}
        <span className="leyenda leyenda--alerta">Amarillo</span> cerca del límite —{" "}
        <span className="leyenda leyenda--fail">Rojo</span> fuera de meta. Horas perdidas
        requieren horas programadas guardadas por área y mes.{" "}
        <strong>
          Haz clic en una celda roja o amarilla para llenar el formato GC-RE-009 de ese mes.
        </strong>
      </p>
    </div>
  );
}

export default TablaAnual;
