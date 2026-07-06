import { estadoMetaPreventivo } from "./indicadoresCalculo";
import {
  serieCorrectivosAnual,
  seriePreventivoAnual,
  type SerieBarrasAnual,
  type DatoBarraMes,
} from "./indicadoresGraficos";
import type { RegistroCorrectivo } from "../correctivo/types";
import type { ExcepcionCronograma } from "../cronograma/types";
import type { HojaVida } from "../hojas/types";
import type { RegistroPreventivo } from "../preventivo/types";

interface GraficoBarrasProps {
  serie: SerieBarrasAnual;
  mesActivo?: number;
  onSeleccionarMes?: (mes: number) => void;
}

function claseBarraPreventivo(valor: number | null, futuro: boolean): string {
  if (futuro || valor === null) return "grafico-barras__barra--vacia";
  const estado = estadoMetaPreventivo(valor);
  if (estado === "ok") return "grafico-barras__barra--ok";
  if (valor >= 90) return "grafico-barras__barra--alerta";
  return "grafico-barras__barra--fail";
}

function claseBarraCorrectivo(valor: number | null, futuro: boolean): string {
  if (futuro || valor === null || valor === 0) return "grafico-barras__barra--vacia";
  return "grafico-barras__barra--correctivo";
}

function formatearValor(punto: DatoBarraMes, serie: SerieBarrasAnual): string {
  if (punto.futuro) return "—";
  if (punto.valor === null) return "—";
  return serie.tipo === "porcentaje" ? `${punto.valor}%` : String(punto.valor);
}

function GraficoBarras({ serie, mesActivo, onSeleccionarMes }: GraficoBarrasProps) {
  const max = serie.maxEscala;

  return (
    <section className="grafico-barras">
      <header className="grafico-barras__cabecera">
        <div>
          <h3>{serie.titulo}</h3>
          <p>{serie.subtitulo}</p>
        </div>
        {serie.meta !== undefined && (
          <span className="grafico-barras__meta-chip">{serie.metaEtiqueta ?? `Meta ${serie.meta}%`}</span>
        )}
      </header>

      {serie.aviso && <p className="grafico-barras__aviso">{serie.aviso}</p>}

      <div className="grafico-barras__contenedor">
        {serie.meta !== undefined && (
          <div
            className="grafico-barras__linea-meta"
            style={{ bottom: `calc(${((serie.meta / max) * 100).toFixed(1)}% + 1.6rem)` }}
            title={serie.metaEtiqueta}
          >
            <span>{serie.meta}%</span>
          </div>
        )}

        <div className="grafico-barras__columnas" role="img" aria-label={serie.titulo}>
          {serie.puntos.map((punto) => {
            const altura =
              punto.valor !== null && !punto.futuro
                ? Math.max(4, (punto.valor / max) * 100)
                : 0;
            const claseBarra =
              serie.tipo === "porcentaje"
                ? claseBarraPreventivo(punto.valor, punto.futuro)
                : claseBarraCorrectivo(punto.valor, punto.futuro);

            return (
              <button
                key={punto.mes}
                type="button"
                className={
                  "grafico-barras__col" +
                  (mesActivo === punto.mes ? " grafico-barras__col--activa" : "") +
                  (punto.futuro ? " grafico-barras__col--futuro" : "")
                }
                title={punto.detalle}
                onClick={() => onSeleccionarMes?.(punto.mes)}
              >
                <span className="grafico-barras__valor">{formatearValor(punto, serie)}</span>
                <span className="grafico-barras__pista">
                  <span
                    className={`grafico-barras__barra ${claseBarra}`}
                    style={{ height: `${altura}%` }}
                  />
                </span>
                <span className="grafico-barras__mes">{punto.etiqueta}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="grafico-barras__pie">
        Clic en un mes para ver el detalle en la pestaña «Detalle del mes».
      </p>
    </section>
  );
}

interface PanelGraficosBarrasProps {
  anio: number;
  mes: number;
  area: string;
  tipoMantenimiento: string;
  correctivos: RegistroCorrectivo[];
  maquinas: HojaVida[];
  excepciones: ExcepcionCronograma[];
  preventivo: RegistroPreventivo[];
  onSeleccionarMes: (mes: number) => void;
}

function PanelGraficosBarras({
  anio,
  mes,
  area,
  tipoMantenimiento,
  correctivos,
  maquinas,
  excepciones,
  preventivo,
  onSeleccionarMes,
}: PanelGraficosBarrasProps) {
  const serieCorrectivo = serieCorrectivosAnual(correctivos, anio, area, tipoMantenimiento);
  const seriePreventivo = seriePreventivoAnual(maquinas, excepciones, preventivo, anio, area);

  return (
    <div className="panel-graficos">
      <p className="panel-graficos__intro">
        Vista anual {anio}. Usa los filtros de área y tipo de arriba. Las barras muestran el
        volumen de correctivos y el % de cumplimiento preventivo mes a mes.
      </p>
      <div className="panel-graficos__grid">
        <GraficoBarras
          serie={serieCorrectivo}
          mesActivo={mes}
          onSeleccionarMes={onSeleccionarMes}
        />
        <GraficoBarras
          serie={seriePreventivo}
          mesActivo={mes}
          onSeleccionarMes={onSeleccionarMes}
        />
      </div>
    </div>
  );
}

export default PanelGraficosBarras;
