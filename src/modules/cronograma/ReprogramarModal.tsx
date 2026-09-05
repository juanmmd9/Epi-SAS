import { useMemo, useState } from "react";
import { diasEnMes, NOMBRES_MESES, valorFecha } from "../../lib/fechas";
import type { CitaCronograma } from "./types";

interface Props {
  abierto: boolean;
  guardando: boolean;
  area: string;
  anio: number;
  mesInicial: number;
  cita: CitaCronograma;
  origenDia: number;
  mapaCitas: Map<string, CitaCronograma[]>;
  onCerrar: () => void;
  onConfirmar: (mes: number, dia: number) => void;
}

function ReprogramarModal({
  abierto,
  guardando,
  area,
  anio,
  mesInicial,
  cita,
  origenDia,
  mapaCitas,
  onCerrar,
  onConfirmar,
}: Props) {
  const [mesVista, setMesVista] = useState(mesInicial);
  const [diaElegido, setDiaElegido] = useState<{ mes: number; dia: number } | null>(null);

  const hoy = useMemo(() => {
    const ahora = new Date();
    return valorFecha(ahora.getFullYear(), ahora.getMonth() + 1, ahora.getDate());
  }, []);

  if (!abierto) return null;

  const dias = diasEnMes(anio, mesVista);
  const primerDiaSemana = new Date(anio, mesVista - 1, 1).getDay();
  const offset = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;

  function claseDia(mes: number, dia: number): string {
    const valor = valorFecha(anio, mes, dia);
    const citas = mapaCitas.get(`${mes}|${dia}`) ?? [];
    const esOrigen = mes === mesInicial && dia === origenDia;
    const esElegido = diaElegido?.mes === mes && diaElegido?.dia === dia;

    let clase = "reprog-modal__dia";
    if (esOrigen) clase += " reprog-modal__dia--origen";
    if (esElegido) clase += " reprog-modal__dia--elegido";
    if (valor < hoy) clase += " reprog-modal__dia--pasado";
    else if (citas.length > 0) clase += " reprog-modal__dia--ocupado";
    else clase += " reprog-modal__dia--disponible";
    return clase;
  }

  function puedeElegir(mes: number, dia: number): boolean {
    if (mes === mesInicial && dia === origenDia) return false;
    return valorFecha(anio, mes, dia) >= hoy;
  }

  return (
    <div className="reprog-modal__overlay" onClick={onCerrar} role="presentation">
      <div
        className="reprog-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reprog-modal-titulo"
      >
        <header className="reprog-modal__cabecera">
          <h2 id="reprog-modal-titulo">Reprogramar actividad</h2>
          <p>
            {cita.nombre} ({cita.codigo}) · {area}
          </p>
          <p className="reprog-modal__origen">
            Fecha actual: <strong>{origenDia} de {NOMBRES_MESES[mesInicial - 1]} {anio}</strong>
          </p>
        </header>

        <div className="reprog-modal__mes-nav">
          <button
            type="button"
            className="btn"
            disabled={mesVista <= 1}
            onClick={() => setMesVista((m) => m - 1)}
          >
            ←
          </button>
          <span>{NOMBRES_MESES[mesVista - 1]} {anio}</span>
          <button
            type="button"
            className="btn"
            disabled={mesVista >= 12}
            onClick={() => setMesVista((m) => m + 1)}
          >
            →
          </button>
        </div>

        <div className="reprog-modal__calendario">
          {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
            <span key={d} className="reprog-modal__dia-semana">
              {d}
            </span>
          ))}
          {Array.from({ length: offset }, (_, i) => (
            <span key={`pad-${i}`} className="reprog-modal__celda-vacia" />
          ))}
          {Array.from({ length: dias }, (_, i) => {
            const dia = i + 1;
            const habilitado = puedeElegir(mesVista, dia);
            return (
              <button
                key={dia}
                type="button"
                className={claseDia(mesVista, dia)}
                disabled={!habilitado}
                onClick={() => setDiaElegido({ mes: mesVista, dia })}
              >
                {dia}
              </button>
            );
          })}
        </div>

        <div className="reprog-modal__leyenda">
          <span className="reprog-modal__leyenda-item reprog-modal__leyenda-item--disponible">
            Disponible
          </span>
          <span className="reprog-modal__leyenda-item reprog-modal__leyenda-item--ocupado">
            Con PM
          </span>
          <span className="reprog-modal__leyenda-item reprog-modal__leyenda-item--pasado">
            Pasado
          </span>
        </div>

        {diaElegido && (
          <p className="reprog-modal__seleccion">
            Nueva fecha:{" "}
            <strong>
              {diaElegido.dia} de {NOMBRES_MESES[diaElegido.mes - 1]} {anio}
            </strong>
          </p>
        )}

        <footer className="reprog-modal__pie">
          <button type="button" className="btn" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn--primario"
            disabled={!diaElegido || guardando}
            onClick={() => diaElegido && onConfirmar(diaElegido.mes, diaElegido.dia)}
          >
            {guardando ? "Guardando..." : "Confirmar"}
          </button>
        </footer>
      </div>
    </div>
  );
}

export default ReprogramarModal;
