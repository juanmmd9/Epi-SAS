import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { listarCorrectivo } from "../correctivo/correctivoService";
import type { RegistroCorrectivo } from "../correctivo/types";
import { listarExcepciones } from "../cronograma/cronogramaService";
import type { ExcepcionCronograma } from "../cronograma/types";
import { listarHojas } from "../hojas/hojasService";
import type { HojaVida } from "../hojas/types";
import TablaAnual from "../indicadores/TablaAnual";
import { listarHorasProgramadas, type HorasProgramadas } from "../indicadores/horasService";
import "../indicadores/indicadores.css";
import { listarPreventivo } from "../preventivo/preventivoService";
import type { RegistroPreventivo } from "../preventivo/types";
import { resolverHorariosAnio } from "../permisos/horasLaborables";
import { listarFestivosAnio, listarHorarioAnio } from "../permisos/horarioService";
import type { Festivo, HorarioLaboral } from "../permisos/types";
import { useAuth } from "../auth/AuthContext";
import "./principal.css";

function IndicadoresConsultaPage() {
  const { perfil } = useAuth();
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [correctivos, setCorrectivos] = useState<RegistroCorrectivo[]>([]);
  const [maquinas, setMaquinas] = useState<HojaVida[]>([]);
  const [excepciones, setExcepciones] = useState<ExcepcionCronograma[]>([]);
  const [preventivo, setPreventivo] = useState<RegistroPreventivo[]>([]);
  const [horas, setHoras] = useState<HorasProgramadas[]>([]);
  const [horariosDb, setHorariosDb] = useState<HorarioLaboral[]>([]);
  const [festivos, setFestivos] = useState<Festivo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const horarios = useMemo(
    () => resolverHorariosAnio(anio, horariosDb),
    [anio, horariosDb],
  );

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError(null);
    Promise.all([
      listarCorrectivo(),
      listarHojas(),
      listarExcepciones(),
      listarPreventivo(),
      listarHorasProgramadas().catch(() => [] as HorasProgramadas[]),
    ])
      .then(([corr, hojas, excs, prev, hrs]) => {
        if (!activo) return;
        setCorrectivos(corr);
        setMaquinas(hojas);
        setExcepciones(excs);
        setPreventivo(prev);
        setHoras(hrs);
      })
      .catch((e: Error) => {
        if (activo) setError("No se pudieron cargar los indicadores: " + e.message);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    let activo = true;
    Promise.all([
      listarHorarioAnio(anio).catch(() => [] as HorarioLaboral[]),
      listarFestivosAnio(anio).catch(() => [] as Festivo[]),
    ]).then(([listaHorario, listaFestivos]) => {
      if (!activo) return;
      setHorariosDb(listaHorario);
      setFestivos(listaFestivos);
    });
    return () => {
      activo = false;
    };
  }, [anio]);

  if (perfil?.rol !== "operador") {
    return <Navigate to="/principal" replace />;
  }

  return (
    <section className="principal indicadores">
      <header className="principal__cabecera">
        <Link to="/principal" className="btn">
          ← Principal
        </Link>
        <h1>Indicadores</h1>
        <p>Consulta cómo van los indicadores. Esta vista no permite editar ni llenar formatos.</p>
      </header>
      <label className="principal__anio">
        Año
        <input
          type="number"
          value={anio}
          onChange={(e) => setAnio(Number.parseInt(e.target.value, 10) || hoy.getFullYear())}
        />
      </label>
      {error && <p className="indicadores__mensaje indicadores__mensaje--error">{error}</p>}
      {cargando ? (
        <p>Cargando indicadores...</p>
      ) : (
        <TablaAnual
          anio={anio}
          tipoMantenimiento=""
          maquinas={maquinas}
          excepciones={excepciones}
          preventivo={preventivo}
          correctivos={correctivos}
          horas={horas}
          horarios={horarios}
          festivos={festivos}
          soloLectura
        />
      )}
    </section>
  );
}

export default IndicadoresConsultaPage;
