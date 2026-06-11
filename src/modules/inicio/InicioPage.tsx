import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AREAS_CON_PM, coincideArea } from "../../lib/areas";
import { aFechaIso, NOMBRES_MESES, valorFecha } from "../../lib/fechas";
import { mapaCitasDelAnio } from "../cronograma/cronogramaCalculo";
import { listarExcepciones } from "../cronograma/cronogramaService";
import type { CitaCronograma, ExcepcionCronograma } from "../cronograma/types";
import { listarHojas } from "../hojas/hojasService";
import type { HojaVida } from "../hojas/types";
import { listarPreventivo } from "../preventivo/preventivoService";
import type { RegistroPreventivo } from "../preventivo/types";
import ImportadorRespaldo from "../importador/ImportadorRespaldo";
import "./inicio.css";

interface CitaMes extends CitaCronograma {
  dia: number;
  completada: boolean;
}

interface BloqueMes {
  mes: number;
  citas: CitaMes[];
  completadas: number;
}

interface DatosArea {
  area: string;
  totalMaquinas: number;
  maquinasActivas: number;
  totalCitas: number;
  citasCompletadas: number;
  porMes: BloqueMes[];
  proximaCita: { nombre: string; codigo: string; dia: number; mes: number } | null;
}

function construirDatosArea(
  area: string,
  anio: number,
  maquinas: HojaVida[],
  excepciones: ExcepcionCronograma[],
  preventivo: RegistroPreventivo[],
): DatosArea {
  const maquinasArea = maquinas.filter((m) => coincideArea(m.area, area));
  const mapa = mapaCitasDelAnio(maquinas, excepciones, area, anio);

  // Indice de PM completados: por fecha exacta y por maquina+mes
  const completadasExactas = new Set<string>();
  const completadasPorMes = new Set<string>();
  for (const registro of preventivo) {
    if (!registro.hoja_id || !registro.fecha?.startsWith(String(anio))) continue;
    completadasExactas.add(`${registro.hoja_id}|${registro.fecha}`);
    completadasPorMes.add(`${registro.hoja_id}|${registro.fecha.slice(0, 7)}`);
  }

  const hoy = new Date();
  const valorHoy = valorFecha(hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate());

  const porMes: BloqueMes[] = [];
  let totalCitas = 0;
  let citasCompletadas = 0;
  let proximaCita: DatosArea["proximaCita"] = null;

  for (let mes = 1; mes <= 12; mes++) {
    const citasMes: CitaMes[] = [];
    for (const [clave, citas] of mapa) {
      const [mesClave, diaClave] = clave.split("|").map(Number);
      if (mesClave !== mes) continue;
      for (const cita of citas) {
        const fechaIso = aFechaIso(anio, mes, diaClave);
        const completada =
          completadasExactas.has(`${cita.maquinaId}|${fechaIso}`) ||
          completadasPorMes.has(`${cita.maquinaId}|${fechaIso.slice(0, 7)}`);
        citasMes.push({ ...cita, dia: diaClave, completada });
        totalCitas += 1;
        if (completada) citasCompletadas += 1;
        if (
          !completada &&
          valorFecha(anio, mes, diaClave) >= valorHoy &&
          (!proximaCita || valorFecha(anio, mes, diaClave) < valorFecha(anio, proximaCita.mes, proximaCita.dia))
        ) {
          proximaCita = { nombre: cita.nombre, codigo: cita.codigo, dia: diaClave, mes };
        }
      }
    }
    if (citasMes.length > 0) {
      citasMes.sort((a, b) => a.dia - b.dia);
      porMes.push({
        mes,
        citas: citasMes,
        completadas: citasMes.filter((c) => c.completada).length,
      });
    }
  }

  return {
    area,
    totalMaquinas: maquinasArea.length,
    maquinasActivas: maquinasArea.filter((m) => m.activa).length,
    totalCitas,
    citasCompletadas,
    porMes,
    proximaCita,
  };
}

function InicioPage() {
  const anioActual = new Date().getFullYear();
  const mesActual = new Date().getMonth() + 1;
  const navegar = useNavigate();
  const [anio, setAnio] = useState(anioActual);
  const [maquinas, setMaquinas] = useState<HojaVida[]>([]);
  const [excepciones, setExcepciones] = useState<ExcepcionCronograma[]>([]);
  const [preventivo, setPreventivo] = useState<RegistroPreventivo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    recargarDatos();
  }, []);

  function recargarDatos() {
    setCargando(true);
    Promise.all([listarHojas(), listarExcepciones(), listarPreventivo()])
      .then(([hojas, excs, prev]) => {
        setMaquinas(hojas);
        setExcepciones(excs);
        setPreventivo(prev);
      })
      .catch((e: Error) => setError("No se pudieron cargar los datos: " + e.message))
      .finally(() => setCargando(false));
  }

  const datosPorArea = useMemo(
    () =>
      AREAS_CON_PM.map((area) =>
        construirDatosArea(area, anio, maquinas, excepciones, preventivo),
      ),
    [anio, maquinas, excepciones, preventivo],
  );

  return (
    <section className="inicio">
      <div className="inicio__cabecera">
        <div>
          <h1>Panel de mantenimiento preventivo</h1>
          <p className="inicio__descripcion">
            Programación anual por área. Verde = PM ya registrado ese mes.
          </p>
        </div>
        <div className="inicio__anio">
          <button className="btn" onClick={() => setAnio(anio - 1)}>←</button>
          <span>{anio}</span>
          <button className="btn" onClick={() => setAnio(anio + 1)}>→</button>
        </div>
      </div>

      {error && <p className="inicio__error">{error}</p>}

      <ImportadorRespaldo onImportado={recargarDatos} />

      {cargando && <p>Cargando panel...</p>}

      <div className="inicio__areas">
        {!cargando &&
          datosPorArea.map((datos) => (
            <article key={datos.area} className="area-card">
              <div className="area-card__cabecera">
                <h3>{datos.area}</h3>
                <div className="area-card__stats">
                  <span className="chip">{datos.totalMaquinas} máquina(s)</span>
                  <span className="chip">{datos.maquinasActivas} activa(s)</span>
                  <span className="chip chip--pm">{datos.totalCitas} PM en {anio}</span>
                  {datos.citasCompletadas > 0 && (
                    <span className="chip chip--ok">{datos.citasCompletadas} registrado(s)</span>
                  )}
                </div>
              </div>

              {datos.totalMaquinas === 0 ? (
                <p className="area-card__vacio">
                  Registra equipos en <Link to="/hojas-de-vida">Hojas de vida</Link> con
                  área {datos.area}, primer PM y frecuencia en meses.
                </p>
              ) : (
                <>
                  <p className="area-card__proximo">
                    {datos.proximaCita ? (
                      <>
                        <strong>Próximo PM:</strong> {datos.proximaCita.nombre} (
                        {datos.proximaCita.codigo}) — {datos.proximaCita.dia}{" "}
                        {NOMBRES_MESES[datos.proximaCita.mes - 1]} {anio}
                      </>
                    ) : (
                      <>
                        <strong>{anio}:</strong> no hay PM pendientes a futuro en esta área.
                      </>
                    )}
                  </p>

                  {datos.porMes.length === 0 ? (
                    <p className="area-card__vacio">
                      Hay máquinas pero ningún PM calculado para {anio}. Revisa primer
                      PM y frecuencia.
                    </p>
                  ) : (
                    <div className="area-card__meses">
                      {datos.porMes.map((bloque) => (
                        <div
                          key={bloque.mes}
                          className={
                            "mes-bloque" +
                            (anio === anioActual && bloque.mes === mesActual
                              ? " mes-bloque--actual"
                              : "")
                          }
                        >
                          <div className="mes-bloque__titulo">
                            <span>{NOMBRES_MESES[bloque.mes - 1]}</span>
                            <span>{bloque.completadas}/{bloque.citas.length} hecho(s)</span>
                          </div>
                          <ul>
                            {bloque.citas.map((cita) => (
                              <li
                                key={`${cita.maquinaId}-${cita.dia}`}
                                className={cita.completada ? "cita cita--completada" : "cita"}
                                role="button"
                                tabIndex={0}
                                title={
                                  cita.completada
                                    ? `PM registrado: ${cita.nombre}`
                                    : `Registrar actividad de ${cita.nombre}`
                                }
                                onClick={() =>
                                  navegar("/preventivo", {
                                    state: {
                                      registrarPm: {
                                        maquinaId: cita.maquinaId,
                                        area: datos.area,
                                        fecha: aFechaIso(anio, bloque.mes, cita.dia),
                                      },
                                    },
                                  })
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    navegar("/preventivo", {
                                      state: {
                                        registrarPm: {
                                          maquinaId: cita.maquinaId,
                                          area: datos.area,
                                          fecha: aFechaIso(anio, bloque.mes, cita.dia),
                                        },
                                      },
                                    });
                                  }
                                }}
                              >
                                {cita.completada && <span className="cita__check">✓</span>}
                                <span className="cita__dia">{cita.dia}</span>
                                <span className="cita__nombre">{cita.nombre}</span>
                                <span className="cita__codigo">
                                  {cita.codigo} · cada {cita.frecuencia}m
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              <div className="area-card__pie">
                <Link className="btn" to="/preventivo/cronograma">Ver calendario</Link>
                <Link className="btn btn--primario" to="/preventivo">Registrar PM</Link>
              </div>
            </article>
          ))}
      </div>
    </section>
  );
}

export default InicioPage;
