import { SQL_MIGRACION_AUTH } from "../../modules/auth/authSetup";
import "./avisoSetupPersonal.css";

function AvisoSetupAuth() {
  const projectRef =
    import.meta.env.VITE_SUPABASE_URL?.match(/https:\/\/([^.]+)\./)?.[1] ?? "_";
  const urlSql = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;

  function copiarSql() {
    void navigator.clipboard.writeText(SQL_MIGRACION_AUTH);
  }

  return (
    <aside className="aviso-setup-personal auth-login__aviso-rls">
      <h3>Aplicar RLS en Supabase (obligatorio para el login)</h3>
      <p>
        Supabase pide habilitar <strong>Row Level Security (RLS)</strong> con políticas por rol.
        Ejecuta el script de abajo <strong>completo</strong> en SQL Editor.
      </p>
      <ol>
        <li>Abre Supabase → <strong>SQL Editor</strong>.</li>
        <li>Pega todo el script y pulsa <strong>Run</strong>.</li>
        <li>Crea tu usuario en <strong>Authentication → Users</strong>.</li>
        <li>
          Inserta tu perfil en <code>usuarios_portal</code> con rol{" "}
          <strong>admin</strong> (ver comentario al final del script).
        </li>
        <li>Recarga esta página (Ctrl+F5).</li>
      </ol>
      <div className="aviso-setup-personal__acciones">
        <button type="button" className="btn" onClick={copiarSql}>
          Copiar script RLS
        </button>
        <a className="btn btn--primario" href={urlSql} target="_blank" rel="noreferrer">
          Abrir SQL Editor
        </a>
      </div>
      <pre className="aviso-setup-personal__sql">{SQL_MIGRACION_AUTH}</pre>
    </aside>
  );
}

export default AvisoSetupAuth;
