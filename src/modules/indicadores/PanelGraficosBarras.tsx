import { estadoMetaPreventivo } from "./indicadoresCalculo";
import {
  serieCorrectivosAnual,
  seriePreventivoAnual,
  type SerieBarrasAnual,
  type DatoBarraMes,
} from "./indicadoresGraficos";
import {
  mixIntervencionesMes,
  rankingIntervencionesPorMaquina,
  type IntervencionMaquina,
  type MixIntervenciones,
} from "./indicadoresGraficosMaquinas";
import { NOMBRES_MESES } from "../../lib/fechas";
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

function etiquetaMaquina(fila: IntervencionMaquina): string {
  if (fila.codigo) return `${fila.nombre} (${fila.codigo})`;
  return fila.nombre;
}

function RankingMaquinas({
  filas,
  anio,
  mes,
  area,
}: {
  filas: IntervencionMaquina[];
  anio: number;
  mes: number;
  area: string;
}) {
  const maxTotal = Math.max(...filas.map((f) => f.total), 1);
  const areaTexto = area || "todas las áreas";
  const periodo = `${NOMBRES_MESES[mes - 1]} ${anio}`;

  return (
    <section className="grafico-ranking">
      <header className="grafico-ranking__cabecera">
        <div>
          <h3>Intervenciones por máquina</h3>
          <p>
            Top 10 · {areaTexto} · {periodo} · preventivo + correctivo
          </p>
        </div>
      </header>

      {filas.length === 0 ? (
        <p className="grafico-ranking__vacio">Sin intervenciones registradas en el mes.</p>
      ) : (
        <ul className="grafico-ranking__lista" aria-label="Ranking de intervenciones por máquina">
          {filas.map((fila) => {
            const ancho = Math.max(4, (fila.total / maxTotal) * 100);
            const pctPrev = fila.total > 0 ? (fila.preventivo / fila.total) * 100 : 0;
            const pctCorr = fila.total > 0 ? (fila.correctivo / fila.total) * 100 : 0;
            return (
              <li key={fila.clave} className="grafico-ranking__fila">
                <div className="grafico-ranking__etiqueta" title={etiquetaMaquina(fila)}>
                  <span className="grafico-ranking__nombre">{fila.nombre}</span>
                  {fila.codigo ? (
                    <span className="grafico-ranking__codigo">{fila.codigo}</span>
                  ) : null}
                </div>
                <div className="grafico-ranking__pista" title={`PM ${fila.preventivo} · Corr. ${fila.correctivo}`}>
                  <div className="grafico-ranking__barra" style={{ width: `${ancho}%` }}>
                    {fila.preventivo > 0 && (
                      <span
                        className="grafico-ranking__seg grafico-ranking__seg--prev"
                        style={{ width: `${pctPrev}%` }}
                      />
                    )}
                    {fila.correctivo > 0 && (
                      <span
                        className="grafico-ranking__seg grafico-ranking__seg--corr"
                        style={{ width: `${pctCorr}%` }}
                      />
                    )}
                  </div>
                </div>
                <div className="grafico-ranking__conteos">
                  <span className="grafico-ranking__total">{fila.total}</span>
                  <span className="grafico-ranking__detalle">
                    {fila.preventivo} PM · {fila.correctivo} corr.
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="grafico-ranking__leyenda">
        <span>
          <i className="grafico-ranking__punto grafico-ranking__punto--prev" /> Preventivo
        </span>
        <span>
          <i className="grafico-ranking__punto grafico-ranking__punto--corr" /> Correctivo
        </span>
      </div>
    </section>
  );
}

function DonaMix({
  mix,
  anio,
  mes,
  area,
}: {
  mix: MixIntervenciones;
  anio: number;
  mes: number;
  area: string;
}) {
  const areaTexto = area || "todas las áreas";
  const periodo = `${NOMBRES_MESES[mes - 1]} ${anio}`;
  const total = mix.total;
  const pctPrev = total > 0 ? Math.round((mix.preventivo / total) * 100) : 0;
  const pctCorr = total > 0 ? 100 - pctPrev : 0;
  const gradiente =
    total === 0
      ? "#e2e8f0 0deg 360deg"
      : mix.preventivo === 0
        ? `#2563eb 0deg 360deg`
        : mix.correctivo === 0
          ? `#16a34a 0deg 360deg`
          : `#16a34a 0deg ${(pctPrev / 100) * 360}deg, #2563eb ${(pctPrev / 100) * 360}deg 360deg`;

  return (
    <section className="grafico-dona">
      <header className="grafico-dona__cabecera">
        <div>
          <h3>Mix preventivo / correctivo</h3>
          <p>
            {areaTexto} · {periodo}
          </p>
        </div>
      </header>

      <div className="grafico-dona__cuerpo">
        <div
          className="grafico-dona__anillo"
          style={{ background: `conic-gradient(${gradiente})` }}
          role="img"
          aria-label={`Preventivo ${pctPrev}%, correctivo ${pctCorr}%`}
        >
          <div className="grafico-dona__centro">
            <strong>{total}</strong>
            <span>total</span>
          </div>
        </div>

        <ul className="grafico-dona__stats">
          <li>
            <i className="grafico-ranking__punto grafico-ranking__punto--prev" />
            <span>Preventivo</span>
            <strong>
              {mix.preventivo} ({pctPrev}%)
            </strong>
          </li>
          <li>
            <i className="grafico-ranking__punto grafico-ranking__punto--corr" />
            <span>Correctivo</span>
            <strong>
              {mix.correctivo} ({pctCorr}%)
            </strong>
          </li>
          {mix.correctivoAbiertas > 0 && (
            <li className="grafico-dona__abiertas">
              <span>Correctivos abiertos</span>
              <strong>{mix.correctivoAbiertas}</strong>
            </li>
          )}
        </ul>
      </div>
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
  const ranking = rankingIntervencionesPorMaquina(
    maquinas,
    preventivo,
    correctivos,
    anio,
    mes,
    area,
    tipoMantenimiento,
  );
  const mix = mixIntervencionesMes(preventivo, correctivos, anio, mes, area, tipoMantenimiento);

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

      <p className="panel-graficos__intro panel-graficos__intro--secundario">
        Debajo: intervenciones por máquina y mix preventivo/correctivo del mes seleccionado
        ({NOMBRES_MESES[mes - 1]} {anio}). Cambia el mes arriba o haz clic en una barra.
      </p>
      <div className="panel-graficos__grid panel-graficos__grid--maquinas">
        <RankingMaquinas filas={ranking} anio={anio} mes={mes} area={area} />
        <DonaMix mix={mix} anio={anio} mes={mes} area={area} />
      </div>
    </div>
  );
}

export default PanelGraficosBarras;
