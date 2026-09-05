import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listarAccionesMejora } from "./gcre001Service";
import type { RegistroAm } from "./gcre001Types";
import { listarGestionCambio } from "./gcre027Service";
import type { RegistroGc027 } from "./gcre027Types";
import { listarNoConformidades } from "./formatosService";
import type { RegistroNc } from "./types";
import "./formatos.css";

function FormatosPage() {
  const [registros, setRegistros] = useState<RegistroNc[]>([]);
  const [mejoras, setMejoras] = useState<RegistroAm[]>([]);
  const [cambios, setCambios] = useState<RegistroGc027[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    Promise.all([
      listarNoConformidades(),
      listarAccionesMejora(),
      listarGestionCambio().catch(() => [] as RegistroGc027[]),
    ])
      .then(([nc, am, gc]) => {
        setRegistros(nc);
        setMejoras(am);
        setCambios(gc);
      })
      .finally(() => setCargando(false));
  }, []);

  return (
    <section className="formatos">
      <h1>Formatos</h1>
      <p className="formatos__descripcion">
        Catálogo de formatos del sistema de gestión de calidad.
      </p>

      <article className="formato-card">
        <h2>GC-RE-001</h2>
        <p>
          Acciones de mejora del SGC. Registre oportunidades de mejora, evaluación y plan de acción.
          Vinculable a la matriz de riesgos.
        </p>
        <Link to="/formatos/gc-re-001" className="btn btn--primario">
          Abrir formato GC-RE-001
        </Link>
      </article>

      <article className="formato-card">
        <h2>GC-RE-009</h2>
        <p>
          Reporte de no conformidades y acciones correctivas. Los datos se guardan en el sistema; el
          formato impreso se archiva en carpeta física.
        </p>
        <Link to="/formatos/gc-re-009" className="btn btn--primario">
          Abrir formato GC-RE-009
        </Link>
      </article>

      <article className="formato-card">
        <h2>GC-RE-027</h2>
        <p>
          Gestión del cambio. Crea registros, edítalos y descarga el Excel oficial diligenciado.
          Incluye ejemplo del Portal de Mantenimiento.
        </p>
        <Link to="/formatos/gc-re-027" className="btn btn--primario">
          Abrir formato GC-RE-027
        </Link>
      </article>

      <article className="formato-card">
        <h2>MT-RE-045</h2>
        <p>
          Reporte de mantenimiento preventivo laboratorio. Vista previa del PDF e impresión directa
          desde el navegador.
        </p>
        <Link to="/formatos/mt-re-045" className="btn btn--primario">
          Abrir formato MT-RE-045
        </Link>
      </article>

      <article className="formato-card">
        <h2>GH-RE-030</h2>
        <p>
          Solicitud de permiso del personal: salidas, llegadas y tiempo concedido. Imprimir y
          archivar en carpeta física.
        </p>
        <Link to="/formatos/gh-re-030" className="btn btn--primario">
          Abrir formato GH-RE-030
        </Link>
      </article>

      <h2>Registros recientes</h2>
      {cargando && <p>Cargando...</p>}
      {!cargando && registros.length === 0 && mejoras.length === 0 && cambios.length === 0 && (
        <p className="formatos__vacio">Aún no hay registros guardados.</p>
      )}
      <div className="formatos__lista-recientes">
        {mejoras.slice(0, 5).map((registro) => (
          <article key={registro.id} className="item-nc item-nc--compacto">
            <strong>
              GC-RE-001 No. {registro.numero} — {registro.datos.proceso}
            </strong>
            <p>
              {registro.datos.fechaRegistro} · {registro.datos.descripcion.slice(0, 60)}...
            </p>
          </article>
        ))}
        {registros.slice(0, 5).map((registro) => (
          <article key={registro.id} className="item-nc item-nc--compacto">
            <strong>
              GC-RE-009 No. {registro.numero} — {registro.datos.area}
            </strong>
            <p>
              {registro.datos.fechaDeteccion} · {registro.datos.descripcion.slice(0, 60)}...
            </p>
          </article>
        ))}
        {cambios.slice(0, 5).map((registro) => (
          <article key={registro.id} className="item-nc item-nc--compacto">
            <strong>
              GC-RE-027 No. {registro.numero} — {registro.datos.proceso}
            </strong>
            <p>
              {registro.datos.fechaDiligenciamiento} ·{" "}
              {(registro.datos.descripcion || "").slice(0, 60)}...
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default FormatosPage;
