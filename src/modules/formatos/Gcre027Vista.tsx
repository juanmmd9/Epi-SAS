import logoEpi from "../../assets/epi-logo.png";
import { MAX_ACTIVIDADES_PLAN, type RegistroGc027Datos } from "./gcre027Types";

function fecha(valor: string): string {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor.trim());
  if (!coincidencia) return valor.trim();
  return `${coincidencia[3]}/${coincidencia[2]}/${coincidencia[1]}`;
}

function Gcre027Vista({ datos }: { datos: RegistroGc027Datos; numero: number | null }) {
  const filasPlan = Array.from({ length: MAX_ACTIVIDADES_PLAN }, (_, indice) => datos.plan[indice]);

  return (
    <article id="gc-re-027-copia" className="gc027-carta">
      <header className="gc027-carta__marca">
        <img src={logoEpi} alt="EPI" />
        <h1>Gestión del cambio</h1>
      </header>

      <table className="gc027-carta__tabla">
        <colgroup>
          <col style={{ width: "22%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "18%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "16%" }} />
        </colgroup>
        <tbody>
          <tr>
            <th>Fecha de diligenciamiento:</th>
            <td>{fecha(datos.fechaDiligenciamiento)}</td>
            <th>Proceso o área:</th>
            <td>{datos.proceso}</td>
            <th>Responsable:</th>
            <td>{datos.responsable}</td>
          </tr>
          <tr>
            <th>Fecha última revisión:</th>
            <td>{fecha(datos.fechaUltimaRevision)}</td>
            <td colSpan={4} className="gc027-carta__nota">
              Nota: En caso que no aplique alguno de los espacios indicar &quot;N/A&quot;
            </td>
          </tr>
          <tr>
            <th colSpan={6} className="gc027-carta__seccion">
              1. Descripción del cambio
            </th>
          </tr>
          <tr>
            <td colSpan={6} className="gc027-carta__cuerpo">
              {datos.descripcion}
            </td>
          </tr>
          <tr>
            <th colSpan={6} className="gc027-carta__seccion">
              2. Análisis de posibles riesgos
            </th>
          </tr>
          <tr>
            <td colSpan={6} className="gc027-carta__cuerpo">
              {datos.riesgos}
            </td>
          </tr>
          <tr>
            <th colSpan={6} className="gc027-carta__seccion">
              3. Análisis de posibles oportunidades
            </th>
          </tr>
          <tr>
            <td colSpan={6} className="gc027-carta__cuerpo">
              {datos.oportunidades}
            </td>
          </tr>
          <tr>
            <th colSpan={6} className="gc027-carta__seccion">
              4. Requisitos legales aplicables
            </th>
          </tr>
          <tr>
            <td colSpan={6} className="gc027-carta__cuerpo">
              {datos.requisitosLegales}
            </td>
          </tr>
          <tr>
            <th colSpan={6} className="gc027-carta__seccion">
              5. Análisis del impacto
            </th>
          </tr>
          <tr>
            <td colSpan={6} className="gc027-carta__cuerpo">
              {datos.impacto}
            </td>
          </tr>
        </tbody>
      </table>

      <table className="gc027-carta__plan">
        <colgroup>
          <col style={{ width: "28%" }} />
          <col style={{ width: "18%" }} />
          <col style={{ width: "22%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "16%" }} />
        </colgroup>
        <thead>
          <tr>
            <th colSpan={5} className="gc027-carta__seccion">
              6. Planeación del cambio
            </th>
          </tr>
          <tr>
            <th>Actividad</th>
            <th>Responsable</th>
            <th>Comunicar cambio a:</th>
            <th>Fecha ejecución</th>
            <th>Fecha seguimiento</th>
          </tr>
        </thead>
        <tbody>
          {filasPlan.map((fila, indice) => (
            <tr key={indice}>
              <td>{fila?.actividad ?? ""}</td>
              <td>{fila?.responsable ?? ""}</td>
              <td>{fila?.comunicar ?? ""}</td>
              <td>{fecha(fila?.fechaEjecucion ?? "")}</td>
              <td>{fecha(fila?.fechaSeguimiento ?? "")}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="gc027-carta__pie">GC-RE-027 VERSIÓN 1 OCTUBRE DE 2017</p>
    </article>
  );
}

export default Gcre027Vista;
