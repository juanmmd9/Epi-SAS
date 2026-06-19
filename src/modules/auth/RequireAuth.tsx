import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "./auth.css";

function RequireAuth() {
  const { session, perfil, cargando, errorPerfil, salir } = useAuth();
  const ubicacion = useLocation();

  if (cargando) {
    return (
      <div className="auth-carga">
        <p>Verificando sesión...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />;
  }

  if (!perfil) {
    return (
      <div className="auth-sin-perfil">
        <h1>Sin acceso al portal</h1>
        <p>{errorPerfil ?? "Tu cuenta no tiene un rol asignado."}</p>
        <p className="auth-sin-perfil__ayuda">
          Si aún no ejecutaste la migración de seguridad, aplica RLS con el script{" "}
          <code>supabase/migrations/auth_usuarios.sql</code> en SQL Editor.
          Luego el administrador debe agregar tu fila en <code>usuarios_portal</code> con rol{" "}
          <strong>admin</strong>, <strong>operador</strong> o <strong>consulta</strong>.
        </p>
        <button type="button" className="btn" onClick={() => void salir()}>
          Cerrar sesión
        </button>
      </div>
    );
  }

  return <Outlet />;
}

export default RequireAuth;
