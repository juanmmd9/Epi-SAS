import { rutaPublica } from "../../lib/rutaPublica";
import { fechaPartes, type Mtre045Datos } from "./mtre045Types";
import "./mtre045.css";

interface Props {
  datos: Mtre045Datos;
  id?: string;
}

function CeldaAn({ valor, detalle }: { valor: string; detalle?: string }) {
  return (
    <div className="mtre045-preview__celda-verificacion">
      {detalle ? <p className="mtre045-preview__detalle-verificacion">{detalle}</p> : null}
      <span className="mtre045-an" aria-label={valor === "A" ? "Aprobado" : valor === "NA" ? "No aprobado" : "Sin marcar"}>
        <span className={`mtre045-an__opcion${valor === "A" ? " mtre045-an__opcion--activa" : ""}`}>
          <span className="mtre045-an__caja" aria-hidden>
            {valor === "A" ? "✓" : ""}
          </span>
          A
        </span>
        <span className={`mtre045-an__opcion${valor === "NA" ? " mtre045-an__opcion--activa" : ""}`}>
          <span className="mtre045-an__caja" aria-hidden>
            {valor === "NA" ? "✓" : ""}
          </span>
          NA
        </span>
      </span>
    </div>
  );
}

function FechaCajas({ dia, mes, anio }: { dia: string; mes: string; anio: string }) {
  return (
    <span className="mtre045-preview__fecha-cajas">
      <span className="mtre045-preview__fecha-caja">{dia || "____"}</span>
      <span>/</span>
      <span className="mtre045-preview__fecha-caja">{mes || "____"}</span>
      <span>/</span>
      <span className="mtre045-preview__fecha-caja mtre045-preview__fecha-caja--anio">
        {anio || "________"}
      </span>
    </span>
  );
}

function Casilla({ marcada, etiqueta }: { marcada: boolean; etiqueta: string }) {
  return (
    <span className="mtre045-preview__casilla">
      <span className="mtre045-preview__check" aria-hidden>
        {marcada ? "X" : ""}
      </span>
      <span>{etiqueta}</span>
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
  const marcaCorrectivo = Boolean(
    (datos.actividadCorrectivo || "").trim() ||
      (datos.cambioRepuestosCorrectivo || "").trim() ||
      (datos.verificacionCorrectivo || "").trim(),
  );
  const marcaVerificacion = Boolean(
    datos.inspeccionVisual ||
      datos.pruebasFuncionamiento ||
      (datos.detalleInspeccionVisual || "").trim() ||
      (datos.detallePruebasFuncionamiento || "").trim() ||
      (datos.firmaVerificacion || "").trim() ||
      (datos.responsableVerificacion || "").trim(),
  );

  return (
    <article id={id} className="mtre045-preview">
      <table className="mtre045-preview__cabecera-oficial">
        <tbody>
          <tr>
            <td className="mtre045-preview__logo-celda" rowSpan={2}>
              <img
                className="mtre045-preview__logo"
                src={rutaPublica("/Image/EPI-Logo-documento.png")}
                alt="E.P.I. Equipos de Protección Individual"
              />
            </td>
            <td className="mtre045-preview__proceso">PROCESO</td>
            <td className="mtre045-preview__codigo-celda">
              <div>
                <strong>CODIGO:</strong> MT-RE-045
              </div>
              <div>
                <strong>VERSION:</strong> 1
              </div>
            </td>
          </tr>
          <tr>
            <td className="mtre045-preview__proceso">MANTENIMIENTO</td>
            <td className="mtre045-preview__fecha-elab">
              <strong>FECHA DE ELABORACIÓN:</strong> ABRIL 2025
            </td>
          </tr>
          <tr>
            <td className="mtre045-preview__titulo-oficial" colSpan={3}>
              REPORTE DE MANTENIMIENTO PREVENTIVO
            </td>
          </tr>
        </tbody>
      </table>

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

      <table className="mtre045-preview__tabla mtre045-preview__tabla--diagnostico-tipo">
        <thead>
          <tr>
            <th colSpan={3}>DIAGNÓSTICO DE MANTENIMIENTO PREVENTIVO</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <Casilla marcada etiqueta="MANTENIMIENTO PREVENTIVO" />
            </td>
            <td>
              <Casilla marcada={marcaCorrectivo} etiqueta="MANTENIMIENTO CORRECTIVO" />
            </td>
            <td>
              <Casilla marcada={marcaVerificacion} etiqueta="VERIFICACIÓN" />
            </td>
          </tr>
        </tbody>
      </table>

      <table className="mtre045-preview__tabla mtre045-preview__tabla--cols2">
        <tbody>
          <tr>
            <td colSpan={2} className="mtre045-preview__fila-titulo">
              ACTIVIDAD REALIZADA
            </td>
          </tr>
          <tr>
            <td
              className="mtre045-preview__celda-texto mtre045-preview__celda-alta"
              colSpan={marcaCorrectivo ? 1 : 2}
            >
              {datos.actividadRealizada || ""}
            </td>
            {marcaCorrectivo ? (
              <td className="mtre045-preview__celda-texto mtre045-preview__celda-alta">
                {datos.actividadCorrectivo || ""}
              </td>
            ) : null}
          </tr>
          <tr>
            <td colSpan={2} className="mtre045-preview__fila-titulo">
              CAMBIO DE REPUESTOS O INSUMOS
            </td>
          </tr>
          <tr>
            <td
              className="mtre045-preview__celda-repuestos"
              colSpan={marcaCorrectivo ? 1 : 2}
            >
              <ol className="mtre045-preview__lista-num mtre045-preview__lista-num--horizontal">
                {repuestosPm.map((linea, i) => (
                  <li key={`pm-${i}`}>{linea || "\u00a0"}</li>
                ))}
              </ol>
            </td>
            {marcaCorrectivo ? (
              <td className="mtre045-preview__celda-repuestos">
                <ol className="mtre045-preview__lista-num mtre045-preview__lista-num--horizontal">
                  {repuestosCorr.map((linea, i) => (
                    <li key={`corr-${i}`}>{linea || "\u00a0"}</li>
                  ))}
                </ol>
              </td>
            ) : null}
          </tr>
          <tr>
            <td colSpan={2} className="mtre045-preview__fila-titulo">
              VERIFICACIÓN DEL EQUIPO
            </td>
          </tr>
          <tr>
            <td
              className="mtre045-preview__celda-texto"
              colSpan={marcaCorrectivo ? 1 : 2}
            >
              {datos.verificacionEquipoPm || ""}
            </td>
            {marcaCorrectivo ? (
              <td className="mtre045-preview__celda-texto">{datos.verificacionCorrectivo || ""}</td>
            ) : null}
          </tr>
          <tr>
            <th>INSPECCIÓN VISUAL</th>
            <th>PRUEBAS DE FUNCIONAMIENTO</th>
          </tr>
          <tr>
            <td className="mtre045-preview__celda-an">
              <CeldaAn
                valor={datos.inspeccionVisual}
                detalle={datos.detalleInspeccionVisual}
              />
            </td>
            <td className="mtre045-preview__celda-an">
              <CeldaAn
                valor={datos.pruebasFuncionamiento}
                detalle={datos.detallePruebasFuncionamiento}
              />
            </td>
          </tr>
        </tbody>
      </table>

      <p className="mtre045-preview__leyenda">
        ✓ A: aprobado / ✓ NA: no aprobado
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
