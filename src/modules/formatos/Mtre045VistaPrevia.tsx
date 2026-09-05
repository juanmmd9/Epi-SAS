import { fechaPartes, type Mtre045Datos } from "./mtre045Types";
import "./mtre045.css";

interface Props {
  datos: Mtre045Datos;
  id?: string;
}

function CeldaAn({ valor }: { valor: string }) {
  return (
    <span className="mtre045-an">
      <span className={valor === "A" ? "mtre045-an--activo" : ""}>A</span>
      <span className={valor === "NA" ? "mtre045-an--activo" : ""}>NA</span>
    </span>
  );
}

function FechaCajas({ dia, mes, anio }: { dia: string; mes: string; anio: string }) {
  return (
    <span className="mtre045-preview__fecha-cajas">
      <span className="mtre045-preview__fecha-caja">{dia || " "}</span>
      <span>/</span>
      <span className="mtre045-preview__fecha-caja">{mes || " "}</span>
      <span>/</span>
      <span className="mtre045-preview__fecha-caja mtre045-preview__fecha-caja--anio">
        {anio || " "}
      </span>
    </span>
  );
}

function lineasRepuestos(texto: string): string[] {
  const lineas = (texto || "")
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  while (lineas.length < 8) lineas.push("");
  return lineas.slice(0, 8);
}

function Mtre045VistaPrevia({ datos, id = "mtre045-formato-impresion" }: Props) {
  const { dia, mes, anio } = fechaPartes(datos.fecha);
  const repuestosPm = lineasRepuestos(datos.cambioRepuestos);
  const repuestosCorr = lineasRepuestos(datos.cambioRepuestosCorrectivo);

  return (
    <article id={id} className="mtre045-preview">
      <table className="mtre045-preview__meta">
        <tbody>
          <tr>
            <td>
              <strong>PROCESO CODIGO:</strong> MT-RE-045 &nbsp;&nbsp; <strong>VERSION:</strong> 1
            </td>
            <td className="mtre045-preview__meta-derecha">
              <strong>MANTENIMIENTO</strong> &nbsp; FECHA DE ELABORACIÓN: ABR 2025
            </td>
          </tr>
        </tbody>
      </table>

      <p className="mtre045-preview__procedimiento">PROCEDIMIENTO</p>
      <h2 className="mtre045-preview__titulo-principal">MANTENIMIENTO PREVENTIVO</h2>

      <table className="mtre045-preview__tabla mtre045-preview__tabla--encabezado">
        <tbody>
          <tr>
            <th className="mtre045-preview__th-num">NÚMERO DE REPORTE</th>
            <td className="mtre045-preview__td-valor">{datos.numeroReporte || ""}</td>
            <th className="mtre045-preview__th-fecha">FECHA:</th>
            <td className="mtre045-preview__td-fecha">
              <FechaCajas dia={dia} mes={mes} anio={anio} />
            </td>
          </tr>
        </tbody>
      </table>

      <table className="mtre045-preview__tabla">
        <thead>
          <tr>
            <th colSpan={2}>INFORMACIÓN DEL EQUIPO</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th className="mtre045-preview__th-etiqueta">EQUIPO</th>
            <td className="mtre045-preview__celda-texto">{datos.equipo || ""}</td>
          </tr>
          <tr>
            <th className="mtre045-preview__th-etiqueta">MARCA.</th>
            <td className="mtre045-preview__celda-texto">{datos.marca || ""}</td>
          </tr>
          <tr>
            <th className="mtre045-preview__th-etiqueta">SERIE:</th>
            <td className="mtre045-preview__celda-texto">{datos.serie || ""}</td>
          </tr>
          <tr>
            <th className="mtre045-preview__th-etiqueta">ÁREA:</th>
            <td className="mtre045-preview__celda-texto mtre045-preview__celda-area">
              {datos.area || ""}
            </td>
          </tr>
        </tbody>
      </table>

      <h3 className="mtre045-preview__subtitulo">DIAGNÓSTICO DE MANTENIMIENTO PREVENTIVO</h3>

      <table className="mtre045-preview__tabla mtre045-preview__tabla--cols3">
        <thead>
          <tr>
            <th>MANTENIMIENTO PREVENTIVO</th>
            <th>MANTENIMIENTO CORRECTIVO</th>
            <th>VERIFICACIÓN</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={3} className="mtre045-preview__fila-titulo">
              ACTIVIDAD REALIZADA
            </td>
          </tr>
          <tr>
            <td className="mtre045-preview__celda-texto mtre045-preview__celda-alta">
              {datos.actividadRealizada || ""}
            </td>
            <td className="mtre045-preview__celda-texto mtre045-preview__celda-alta">
              {datos.actividadCorrectivo || ""}
            </td>
            <td className="mtre045-preview__celda-texto" />
          </tr>
          <tr>
            <td colSpan={3} className="mtre045-preview__fila-titulo">
              CAMBIO DE REPUESTOS O INSUMOS
            </td>
          </tr>
          <tr>
            <td className="mtre045-preview__celda-repuestos">
              <ol className="mtre045-preview__lista-num">
                {repuestosPm.map((linea, i) => (
                  <li key={`pm-${i}`}>{linea}</li>
                ))}
              </ol>
            </td>
            <td className="mtre045-preview__celda-repuestos">
              <ol className="mtre045-preview__lista-num">
                {repuestosCorr.map((linea, i) => (
                  <li key={`corr-${i}`}>{linea}</li>
                ))}
              </ol>
            </td>
            <td />
          </tr>
          <tr>
            <td colSpan={3} className="mtre045-preview__fila-titulo">
              VERIFICACIÓN DEL EQUIPO
            </td>
          </tr>
          <tr>
            <td className="mtre045-preview__celda-texto">{datos.verificacionEquipoPm || ""}</td>
            <td className="mtre045-preview__celda-texto">{datos.verificacionCorrectivo || ""}</td>
            <td />
          </tr>
          <tr>
            <th>INSPECCIÓN VISUAL</th>
            <th>PRUEBAS DE FUNCIONAMIENTO</th>
            <th />
          </tr>
          <tr>
            <td className="mtre045-preview__celda-an">
              <CeldaAn valor={datos.inspeccionVisual} />
            </td>
            <td className="mtre045-preview__celda-an">
              <CeldaAn valor={datos.pruebasFuncionamiento} />
            </td>
            <td />
          </tr>
        </tbody>
      </table>

      <p className="mtre045-preview__leyenda">
        A: aprobado / NA: no aprobado
        {datos.noAprobo ? ` — No aprobó: ${datos.noAprobo}` : ""}
      </p>

      <div className="mtre045-preview__firmas">
        <div>
          <div className="mtre045-preview__zona-firma">
            {datos.firmaMantenimiento ? (
              <img
                src={datos.firmaMantenimiento}
                alt="Firma de mantenimiento"
                className="mtre045-preview__img-firma"
              />
            ) : null}
            <div className="mtre045-preview__linea-firma" />
          </div>
          <p>Firma</p>
          <p className="mtre045-preview__nombre-firma">{datos.responsableMantenimiento || ""}</p>
          <small>Nombre del responsable del mantenimiento</small>
        </div>
        <div>
          <div className="mtre045-preview__zona-firma">
            {datos.firmaVerificacion ? (
              <img
                src={datos.firmaVerificacion}
                alt="Firma de verificación"
                className="mtre045-preview__img-firma"
              />
            ) : null}
            <div className="mtre045-preview__linea-firma" />
          </div>
          <p>Firma</p>
          <p className="mtre045-preview__nombre-firma">{datos.responsableVerificacion || ""}</p>
          <small>Nombre del responsable de la verificación</small>
        </div>
      </div>
    </article>
  );
}

export default Mtre045VistaPrevia;
