import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { coincideArea } from "../../lib/areas";
import { rutaPublica } from "../../lib/rutaPublica";
import { areaUsuario } from "../../lib/usuarioArea";
import { useAuth } from "../auth/AuthContext";
import { actualizarItemGerencia, listarMisPedidosGerencia } from "../gerencia/gerenciaService";
import type { ItemGerencia } from "../gerencia/types";
import FlujogramaCasco from "./FlujogramaCasco";
import { proyectoDisenoPorId } from "./proyectosDiseno";
import "../inicio/inicio.css";

function ProyectoDisenoPage() {
  const { proyectoId } = useParams();
  const { perfil, rol } = useAuth();
  const area = areaUsuario(perfil);
  const esDiseno = rol === "lider" && Boolean(area) && coincideArea(area ?? "", "Diseno y Desarrollo");
  const proyecto = proyectoDisenoPorId(proyectoId);
  const usuarioId = perfil?.id ?? "";
  const [items, setItems] = useState<ItemGerencia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [guardandoId, setGuardandoId] = useState("");

  useEffect(() => {
    if (!esDiseno || !usuarioId || !proyecto) return;
    let vigente = true;
    setCargando(true);
    void listarMisPedidosGerencia(usuarioId)
      .then((lista) => {
        if (!vigente) return;
        setItems(
          lista.filter(
            (item) => item.linea_diseno === proyecto.id && item.estado !== "eliminado",
          ),
        );
      })
      .catch(() => {
        if (vigente) setItems([]);
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [esDiseno, proyecto, usuarioId]);

  async function avanzar(itemId: string, etapaId: string) {
    const anterior = items;
    setItems((previo) =>
      previo.map((item) => (item.id === itemId ? { ...item, etapa_diseno: etapaId } : item)),
    );
    setGuardandoId(itemId);
    setError("");
    try {
      const actualizado = await actualizarItemGerencia(itemId, { etapa_diseno: etapaId });
      setItems((previo) => previo.map((item) => (item.id === actualizado.id ? actualizado : item)));
    } catch (fallo: unknown) {
      setItems(anterior);
      setError(fallo instanceof Error ? fallo.message : "No se pudo pasar a la siguiente etapa.");
    } finally {
      setGuardandoId("");
    }
  }

  if (!esDiseno) return <Navigate to="/" replace />;
  if (!proyecto) return <Navigate to="/" replace />;

  return (
    <section className="inicio inicio-diseno inicio-diseno--flujo">
      <img
        className="inicio-diseno__fondo"
        src={rutaPublica("/Image/fondo-diseno.png")}
        alt=""
      />
      <p>
        <Link to="/" className="inicio-diseno__volver">
          ← Inicio
        </Link>
      </p>
      <h1 className="flujograma__titulo">Flujograma</h1>
      <p className="inicio__descripcion flujograma__persona">{proyecto.titulo}</p>
      {error ? <p className="inicio-asignar__error">{error}</p> : null}
      {cargando ? <p>Cargando...</p> : null}
      {!cargando && items.length === 0 ? (
        <p className="equipo__vacio">
          Todavía no hay proyectos en esta línea. Asígnelos desde el tablero.
        </p>
      ) : null}
      {!cargando && items.length > 0 ? (
        <div className="flujo-lienzo flujo-lienzo--lleno">
          <FlujogramaCasco
            items={items}
            lineaId={proyecto.id}
            guardandoId={guardandoId}
            onAvanzar={(itemId, etapaId) => void avanzar(itemId, etapaId)}
          />
        </div>
      ) : null}
    </section>
  );
}

export default ProyectoDisenoPage;
