import { useEffect, useState } from "react";
import logoEpi from "../../assets/epi-logo.png";
import {
  CAUSAS_NO_CONFORME,
  CAUSAS_PARADA,
  CODIGO_FORMATO,
  duracionParada,
  VERSION_FORMATO,
  type ReporteProduccionDatos,
} from "./reporteProduccionDatos";

export const ID_REPORTE_PRODUCCION = "reporte-produccion-impresion";

function rellenar<T>(filas: T[], minimo: number): Array<T | null> {
  const copia: Array<T | null> = [...filas];
  while (copia.length < minimo) copia.push(null);
  return copia;
}

function recortarFirma(src: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const base = document.createElement("canvas");
      base.width = img.width;
      base.height = img.height;
      const ctx = base.getContext("2d", { willReadFrequently: true });
      if (!ctx || img.width === 0 || img.height === 0) {
        resolve(src);
        return;
      }
      ctx.drawImage(img, 0, 0);
      const { data, width, height } = ctx.getImageData(0, 0, img.width, img.height);
      let minX = width;
      let minY = height;
      let maxX = -1;
      let maxY = -1;
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const i = (y * width + x) * 4;
          const tinta = data[i + 3] > 12 && (data[i] < 245 || data[i + 1] < 245 || data[i + 2] < 245);
          if (!tinta) continue;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
      if (maxX < 0) {
        resolve(src);
        return;
      }
      const margen = 6;
      const sx = Math.max(0, minX - margen);
      const sy = Math.max(0, minY - margen);
      const sw = Math.min(width - sx, maxX - minX + 1 + margen * 2);
      const sh = Math.min(height - sy, maxY - minY + 1 + margen * 2);
      const salida = document.createElement("canvas");
      salida.width = sw;
      salida.height = sh;
      salida.getContext("2d")?.drawImage(base, sx, sy, sw, sh, 0, 0, sw, sh);
      resolve(salida.toDataURL("image/png"));
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

function FirmaLinea({
  imagen,
  nombre,
  leyenda,
}: {
  imagen: string | null;
  nombre: string;
  leyenda: string;
}) {
  const [src, setSrc] = useState<string | null>(imagen);

  useEffect(() => {
    if (!imagen) {
      setSrc(null);
      return;
    }
    let activo = true;
    void recortarFirma(imagen).then((recorte) => {
      if (activo) setSrc(recorte);
    });
    return () => {
      activo = false;
    };
  }, [imagen]);

  return (
    <div className="tj-carta__firma">
      <div className="tj-carta__firma-zona">
        {src ? <img src={src} alt={leyenda} /> : null}
      </div>
      <span className="tj-carta__firma-linea" />
      <span className="tj-carta__firma-leyenda">{leyenda}</span>
      <span className="tj-carta__firma-nombre">{nombre}</span>
    </div>
  );
}

function Celda({ children }: { children?: string }) {
  return <td>{children?.trim() ? children : "\u00a0"}</td>;
}

function ReporteProduccionVista({
  datos,
  id = ID_REPORTE_PRODUCCION,
}: {
  datos: ReporteProduccionDatos;
  id?: string;
}) {
  const esTrenzadora = datos.areaTrabajo === "Trenzadora";
  const columnasLiberacion = esTrenzadora ? 11 : 10;
  const anchosLiberacion = esTrenzadora
    ? ["7%", "8%", "8%", "10%", "7%", "9%", "9%", "10%", "11%", "10%", "11%"]
    : ["8%", "9%", "9%", "11%", "8%", "10%", "11%", "12%", "11%", "11%"];
  const paradas = rellenar(
    datos.paradas.filter(
      (fila) => fila.horaInicial || fila.horaFinal || fila.maquina || fila.codigo || fila.inspeccion,
    ),
    3,
  );
  const desperdicios = rellenar(
    datos.desperdicios.filter((fila) => fila.referencia || fila.cantidad || fila.causa),
    3,
  );
  const noConformes = rellenar(
    datos.noConformes.filter((fila) => fila.referencia || fila.cantidad || fila.causa),
    3,
  );
  const causasMarcadas = new Set(datos.paradas.map((fila) => fila.codigo).filter(Boolean));
  const noConformesLeyenda = [
    CAUSAS_NO_CONFORME.slice(0, 5),
    CAUSAS_NO_CONFORME.slice(5, 10),
    [...CAUSAS_NO_CONFORME.slice(10), { codigo: "13", texto: "" }],
  ];

  return (
    <article id={id} className="tj-carta">
      <table className="tj-carta__marca">
        <colgroup>
          <col style={{ width: "16%" }} />
          <col style={{ width: "52%" }} />
          <col style={{ width: "32%" }} />
        </colgroup>
        <tbody>
          <tr>
            <td className="tj-carta__logo">
              <img src={logoEpi} alt="EPI" />
            </td>
            <td className="tj-carta__titulo">Reporte de produccion area de tejidos</td>
            <td className="tj-carta__meta">
              Codigo: {CODIGO_FORMATO} &nbsp; Version {VERSION_FORMATO}
              <br />
              Fecha de elaboracion: Junio de 2019
              <br />
              Fecha de modificacion: Octubre/01/2025
            </td>
          </tr>
        </tbody>
      </table>

      <table className="tj-carta__datos">
        <colgroup>
          <col style={{ width: "14%" }} />
          <col style={{ width: "20%" }} />
          <col style={{ width: "12%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "20%" }} />
          <col style={{ width: "18%" }} />
        </colgroup>
        <tbody>
          <tr>
            <th>Fecha</th>
            <td>{datos.fecha || "\u00a0"}</td>
            <th>Turno</th>
            <td>{datos.turno || "\u00a0"}</td>
            <th>Area de trabajo</th>
            <td>{esTrenzadora ? "Trenzadora" : "Telares"}</td>
          </tr>
          <tr>
            <th>Operario</th>
            <td colSpan={3}>{datos.operario || "\u00a0"}</td>
            <th>Supervisor</th>
            <td>{datos.supervisor || "\u00a0"}</td>
          </tr>
        </tbody>
      </table>

      <table className="tj-carta__bloque tj-carta__lib">
        <colgroup>
          {anchosLiberacion.map((ancho, indice) => (
            <col key={indice} style={{ width: ancho }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th colSpan={columnasLiberacion}>Registro de liberacion de produccion</th>
          </tr>
          <tr>
            <th>Maquina</th>
            <th>
              Control
              <br />
              de medida
            </th>
            <th>
              Control
              <br />
              de medida
            </th>
            <th>Referencia</th>
            <th>Lote</th>
            <th>
              Producto
              <br />
              limpio
            </th>
            {esTrenzadora ? (
              <th>
                Cantidad
                <br />
                de almas
              </th>
            ) : null}
            <th>
              Tejido sin
              <br />
              despiste
            </th>
            <th>
              Tejido sin
              <br />
              deshilache
            </th>
            <th>
              Producto
              <br />
              uniforme
            </th>
            <th>
              Cantidad
              <br />
              producida
            </th>
          </tr>
        </thead>
        <tbody>
          {datos.filas.map((fila) => (
            <tr key={fila.maquina} className="tj-carta__dato">
              <td>{fila.maquina}</td>
              <Celda>{fila.medida1}</Celda>
              <Celda>{fila.medida2}</Celda>
              <Celda>{fila.referencia}</Celda>
              <Celda>{fila.lote}</Celda>
              <Celda>{fila.productoLimpio}</Celda>
              {esTrenzadora ? <Celda>{fila.cantidadAlmas}</Celda> : null}
              <Celda>{fila.sinDespiste}</Celda>
              <Celda>{fila.sinDeshilache}</Celda>
              <Celda>{fila.productoUniforme}</Celda>
              <Celda>{fila.cantidadProducida}</Celda>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="tj-carta__nota">
        Observacion: Si el producto cumple (OK), si el producto no cumple (NC), si el parametro
        verificado no aplica para este producto (NA)
      </p>

      <table className="tj-carta__bloque">
        <tbody>
          <tr>
            <th colSpan={2}>Observaciones</th>
          </tr>
          <tr>
            <td colSpan={2} className="tj-carta__obs">
              {datos.observaciones || "\u00a0"}
            </td>
          </tr>
          <tr>
            <td className="tj-carta__firma-celda">
              <FirmaLinea
                imagen={datos.firmaOperario}
                nombre={datos.operario}
                leyenda="Firma operario"
              />
            </td>
            <td className="tj-carta__firma-celda">
              <FirmaLinea
                imagen={datos.firmaSupervisor}
                nombre={datos.supervisor}
                leyenda="Firma supervisor"
              />
            </td>
          </tr>
        </tbody>
      </table>

      <div className="tj-carta__paradas">
        <div className="tj-carta__paradas-titulo">Causas de paradas</div>
        <div className="tj-carta__paradas-fila tj-carta__paradas-fila--11">
          {CAUSAS_PARADA.slice(0, 11).map((causa) => (
            <span
              key={causa.codigo}
              className={causasMarcadas.has(causa.codigo) ? "tj-carta__parada--si" : undefined}
            >
              {causasMarcadas.has(causa.codigo) ? <b className="tj-carta__equis">X</b> : null}
              {causa.codigo}- {causa.texto}
            </span>
          ))}
        </div>
        <div className="tj-carta__paradas-fila tj-carta__paradas-fila--10">
          {CAUSAS_PARADA.slice(11).map((causa) => (
            <span
              key={causa.codigo}
              className={causasMarcadas.has(causa.codigo) ? "tj-carta__parada--si" : undefined}
            >
              {causasMarcadas.has(causa.codigo) ? <b className="tj-carta__equis">X</b> : null}
              {causa.codigo}- {causa.texto}
            </span>
          ))}
        </div>
      </div>

      <table className="tj-carta__bloque tj-carta__noconforme">
        <colgroup>
          <col style={{ width: "6%" }} />
          <col style={{ width: "27%" }} />
          <col style={{ width: "6%" }} />
          <col style={{ width: "28%" }} />
          <col style={{ width: "6%" }} />
          <col style={{ width: "27%" }} />
        </colgroup>
        <tbody>
          <tr>
            <th colSpan={6}>Causas de no conformes</th>
          </tr>
          {[0, 1, 2, 3, 4].map((fila) => (
            <tr key={fila}>
              {noConformesLeyenda.flatMap((grupo, indice) => {
                const item = grupo[fila];
                return [
                  <td key={`${fila}-${indice}-n`} className="tj-carta__num">
                    {item?.codigo ?? ""}
                  </td>,
                  <td key={`${fila}-${indice}-t`} className="tj-carta__causa">
                    {item?.texto ?? ""}
                  </td>,
                ];
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <table className="tj-carta__bloque">
        <colgroup>
          <col style={{ width: "14%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "18%" }} />
          <col style={{ width: "24%" }} />
        </colgroup>
        <thead>
          <tr>
            <th colSpan={6}>Registro y control de paradas</th>
          </tr>
          <tr>
            <th>
              Hora
              <br />
              inicial
            </th>
            <th>
              Hora
              <br />
              final
            </th>
            <th>Duracion</th>
            <th>Maquina</th>
            <th>
              Codigo
              <br />
              de parada
            </th>
            <th>Inspeccion</th>
          </tr>
        </thead>
        <tbody>
          {paradas.map((fila, indice) => (
            <tr key={indice} className="tj-carta__dato">
              <Celda>{fila?.horaInicial}</Celda>
              <Celda>{fila?.horaFinal}</Celda>
              <Celda>{fila ? duracionParada(fila.horaInicial, fila.horaFinal) : ""}</Celda>
              <Celda>{fila?.maquina}</Celda>
              <Celda>{fila?.codigo}</Celda>
              <Celda>{fila?.inspeccion}</Celda>
            </tr>
          ))}
        </tbody>
      </table>

      <table className="tj-carta__bloque">
        <colgroup>
          <col style={{ width: "22%" }} />
          <col style={{ width: "12%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "22%" }} />
          <col style={{ width: "12%" }} />
          <col style={{ width: "16%" }} />
        </colgroup>
        <thead>
          <tr>
            <th colSpan={3}>Desperdicio</th>
            <th colSpan={3}>No conforme</th>
          </tr>
          <tr>
            <th>Referencia</th>
            <th>Kg</th>
            <th>Causa</th>
            <th>Referencia</th>
            <th>Mts</th>
            <th>Causa</th>
          </tr>
        </thead>
        <tbody>
          {desperdicios.map((des, indice) => {
            const noConforme = noConformes[indice];
            return (
              <tr key={indice} className="tj-carta__dato">
                <Celda>{des?.referencia}</Celda>
                <Celda>{des?.cantidad}</Celda>
                <Celda>{des?.causa}</Celda>
                <Celda>{noConforme?.referencia}</Celda>
                <Celda>{noConforme?.cantidad}</Celda>
                <Celda>{noConforme?.causa}</Celda>
              </tr>
            );
          })}
        </tbody>
      </table>
    </article>
  );
}

export default ReporteProduccionVista;
