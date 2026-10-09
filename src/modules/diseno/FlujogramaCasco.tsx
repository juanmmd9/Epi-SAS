import { Link } from "react-router-dom";
import type { ItemGerencia } from "../gerencia/types";
import { PASOS_CASCO, type PasoDiseno } from "./disenoPasos";

const ETAPA_INICIAL = "planificacion";

const SIGUIENTE_ETAPA: Record<string, string> = {
  planificacion: "entradas",
  entradas: "casco",
  casco: "herramental",
  herramental: "revision",
  revision: "verificacion",
  verificacion: "validacion",
  validacion: "decision",
  cambios: "verificacion",
  salidas: "serie",
};

const ANTERIOR_ETAPA: Record<string, string> = {
  entradas: "planificacion",
  casco: "entradas",
  herramental: "casco",
  revision: "herramental",
  verificacion: "revision",
  validacion: "verificacion",
  decision: "validacion",
  cambios: "decision",
  salidas: "decision",
  serie: "salidas",
};

function paso(id: string): PasoDiseno {
  const encontrado = PASOS_CASCO.find((item) => item.id === id);
  if (!encontrado) throw new Error(`Falta el paso ${id}`);
  return encontrado;
}

function enEtapa(items: ItemGerencia[], etapaId: string): ItemGerencia[] {
  return items.filter((item) => (item.etapa_diseno || ETAPA_INICIAL) === etapaId);
}

function Nodo({
  id,
  variante,
  conProyectos,
}: {
  id: string;
  variante?: "decision" | "no" | "si" | "fin";
  conProyectos: boolean;
}) {
  const item = paso(id);
  return (
    <div
      className={
        "flujo__nodo" +
        (variante ? ` flujo__nodo--${variante}` : "") +
        (conProyectos ? " flujo__nodo--va" : "")
      }
    >
      <span>{item.numero}</span>
      <strong>{item.titulo}</strong>
      <small>{item.norma}</small>
    </div>
  );
}

function Flecha() {
  return <div className="flujo__flecha" aria-hidden />;
}

function Pasar({
  etapaId,
  itemId,
  guardando,
  onAvanzar,
}: {
  etapaId: string;
  itemId: string;
  guardando: boolean;
  onAvanzar: (itemId: string, etapaId: string) => void;
}) {
  const anterior = ANTERIOR_ETAPA[etapaId];
  const siguiente = SIGUIENTE_ETAPA[etapaId];
  const esDecision = etapaId === "decision";
  if (!anterior && !siguiente && !esDecision) return null;
  return (
    <span className="flujo__pasos">
      {anterior ? (
        <button type="button" className="flujo__pasar" disabled={guardando} onClick={() => onAvanzar(itemId, anterior)}>
          Atrás
        </button>
      ) : null}
      {esDecision ? (
        <>
          <button type="button" className="flujo__pasar flujo__pasar--sigue" disabled={guardando} onClick={() => onAvanzar(itemId, "salidas")}>
            Sí
          </button>
          <button type="button" className="flujo__pasar" disabled={guardando} onClick={() => onAvanzar(itemId, "cambios")}>
            No
          </button>
        </>
      ) : siguiente ? (
        <button type="button" className="flujo__pasar flujo__pasar--sigue" disabled={guardando} onClick={() => onAvanzar(itemId, siguiente)}>
          Siguiente etapa
        </button>
      ) : (
        <span className="flujo__final">Etapa final</span>
      )}
    </span>
  );
}

function Columna({
  id,
  variante,
  items,
  lineaId,
  guardandoId,
  onAvanzar,
}: {
  id: string;
  variante?: "decision" | "no" | "si" | "fin";
  items: ItemGerencia[];
  lineaId: string;
  guardandoId: string;
  onAvanzar: (itemId: string, etapaId: string) => void;
}) {
  const proyectos = enEtapa(items, id);
  return (
    <div className="flujo__columna">
      <Nodo id={id} variante={variante} conProyectos={proyectos.length > 0} />
      {proyectos.length > 0 ? <span className="flujo__baja" aria-hidden /> : null}
      <div className="flujo__bajo">
        {proyectos.map((proyecto) => {
          const etapaId = proyecto.etapa_diseno || ETAPA_INICIAL;
          return (
            <div key={proyecto.id} className="flujo-proyectos__asignado">
              <strong>{proyecto.titulo}</strong>
              <span>{proyecto.encargados[0] || "Sin auxiliar"}</span>
              <Link
                to={`/diseno/${etapaId}`}
                state={{ desdeProyecto: lineaId }}
                className="flujo__docs"
              >
                Documentos
              </Link>
              <Pasar
                etapaId={etapaId}
                itemId={proyecto.id}
                guardando={guardandoId === proyecto.id}
                onAvanzar={onAvanzar}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FlujogramaCasco({
  items,
  lineaId,
  guardandoId,
  onAvanzar,
}: {
  items: ItemGerencia[];
  lineaId: string;
  guardandoId: string;
  onAvanzar: (itemId: string, etapaId: string) => void;
}) {
  const columna = (id: string, variante?: "decision" | "no" | "si" | "fin") => (
    <Columna
      key={id}
      id={id}
      variante={variante}
      items={items}
      lineaId={lineaId}
      guardandoId={guardandoId}
      onAvanzar={onAvanzar}
    />
  );

  return (
    <div className="flujo flujo--h">
      {columna("planificacion")}
      <Flecha />
      {columna("entradas")}
      <Flecha />
      <div className="flujo__paralelo">
        {columna("casco")}
        {columna("herramental")}
        <p className="flujo__nota">En paralelo</p>
      </div>
      <Flecha />
      {columna("revision")}
      <Flecha />
      {columna("verificacion")}
      <Flecha />
      {columna("validacion")}
      <Flecha />
      {columna("decision", "decision")}
      <Flecha />
      <div className="flujo__ramas">
        <div className="flujo__rama">
          <span className="flujo__etiqueta flujo__etiqueta--no">No</span>
          <Flecha />
          {columna("cambios", "no")}
        </div>
        <div className="flujo__rama">
          <span className="flujo__etiqueta flujo__etiqueta--si">Sí</span>
          <Flecha />
          {columna("salidas", "si")}
          <Flecha />
          {columna("serie", "fin")}
        </div>
      </div>
    </div>
  );
}

export default FlujogramaCasco;
