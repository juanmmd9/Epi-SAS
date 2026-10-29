import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import CargaPantalla from "../../components/CargaPantalla";
import { useAuth } from "./AuthContext";
import "./auth.css";

function RequireAuth() {
  const navegar = useNavigate();
  const { session, perfil, cargando, errorPerfil, salir, recargarPerfil } = useAuth();
  const ubicacion = useLocation();
  const accesoEstable = useRef(false);
  const [reintentando, setReintentando] = useState(false);
  if (session && perfil) accesoEstable.current = true;
  if (!session && !perfil && !cargando) accesoEstable.current = false;

  async function reintentar() {
    setReintentando(true);
    try {
      await recargarPerfil();
    } finally {
      setReintentando(false);
    }
  }

  async function manejarCerrarSesion() {
    accesoEstable.current = false;
    await salir();
    navegar("/login", { replace: true });
  }

  // Nunca desmontar la app si ya hubo acceso válido en esta pestaña.
  if (accesoEstable.current) {
    return <Outlet />;
  }

  if (cargando || reintentando) {
    return (
      <CargaPantalla
        mensaje={
          errorPerfil
            ? errorPerfil
            : "Verificando sesión… Si tarda más de 15 s, Supabase puede estar recuperándose."
        }
        pantallaCompleta
      />
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
        <button type="button" className="btn btn--primario" onClick={() => void reintentar()}>
          Reintentar
        </button>
        <button type="button" className="btn" onClick={() => void manejarCerrarSesion()}>
          Cerrar sesión
        </button>
      </div>
    );
  }

  return <Outlet />;
}

export default RequireAuth;
