import { SQL_MIGRACION_PERSONAL } from "../../modules/personal/personalSetup";
import "./avisoSetupPersonal.css";

interface Props {
  titulo?: string;
}

function AvisoSetupPersonal({
  titulo = "Falta crear la tabla personal en Supabase",
}: Props) {
  const projectRef =
    import.meta.env.VITE_SUPABASE_URL?.match(/https:\/\/([^.]+)\./)?.[1] ?? "_";
  const urlSql = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;

  function copiarSql() {
    void navigator.clipboard.writeText(SQL_MIGRACION_PERSONAL);
  }

  return (
    <aside className="aviso-setup-personal">
      <h3>{titulo}</h3>
      <ol>
        <li>Abre tu proyecto en Supabase → <strong>SQL Editor</strong>.</li>
        <li>Pega el script de abajo y pulsa <strong>Run</strong>.</li>
        <li>Recarga esta página (Ctrl+F5).</li>
      </ol>
      <div className="aviso-setup-personal__acciones">
        <button type="button" className="btn" onClick={copiarSql}>
          Copiar script SQL
        </button>
        <a
          className="btn btn--primario"
          href={urlSql}
          target="_blank"
          rel="noreferrer"
        >
          Abrir SQL Editor
        </a>
      </div>
      <pre className="aviso-setup-personal__sql">{SQL_MIGRACION_PERSONAL}</pre>
    </aside>
  );
}

export default AvisoSetupPersonal;
