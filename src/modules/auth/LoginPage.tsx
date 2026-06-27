import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AvisoSetupAuth from "../../components/setup/AvisoSetupAuth";
import { useAuth } from "./AuthContext";
import { existeTablaUsuarios, iniciarSesion } from "./authService";
import { ETIQUETAS_ROL } from "./roles";
import "./auth.css";

function LoginPage() {
  const navigate = useNavigate();
  const ubicacion = useLocation();
  const { session, perfil, cargando, salir } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [cerrandoSesion, setCerrandoSesion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faltaRls, setFaltaRls] = useState<boolean | null>(null);

  useEffect(() => {
    void existeTablaUsuarios()
      .then((ok) => setFaltaRls(!ok))
      .catch(() => setFaltaRls(false));
  }, []);

  const destino =
    (ubicacion.state as { desde?: string } | null)?.desde &&
    (ubicacion.state as { desde?: string }).desde !== "/login"
      ? (ubicacion.state as { desde: string }).desde
      : "/";

  async function manejarCerrarSesion() {
    setError(null);
    setCerrandoSesion(true);
    try {
      await salir();
    } finally {
      setCerrandoSesion(false);
    }
  }

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await iniciarSesion(email.trim(), password);
      navigate(destino, { replace: true });
    } catch (e) {
      setError("No se pudo iniciar sesión: " + (e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  const sesionActiva = !cargando && session && perfil;

  return (
    <div className="auth-login">
      {faltaRls && <AvisoSetupAuth />}
      <div className="auth-login__tarjeta">
        <img
          className="auth-login__logo"
          src="/Image/EPI-Logo.png"
          alt="EPI"
          width={220}
          height={70}
        />
        <h1>Portal de Mantenimiento</h1>
        <p className="auth-login__subtitulo">Inicia sesión con tu cuenta corporativa</p>

        {sesionActiva && (
          <div className="auth-login__sesion-activa">
            <p>
              Ya hay una sesión abierta como <strong>{perfil.nombre || perfil.email}</strong> (
              {ETIQUETAS_ROL[perfil.rol]}).
            </p>
            <div className="auth-login__sesion-acciones">
              <button
                type="button"
                className="btn btn--primario auth-login__btn"
                onClick={() => navigate(destino, { replace: true })}
              >
                Continuar con esta cuenta
              </button>
              <button
                type="button"
                className="btn auth-login__btn"
                disabled={cerrandoSesion}
                onClick={() => void manejarCerrarSesion()}
              >
                {cerrandoSesion ? "Cerrando..." : "Cerrar sesión y usar otra cuenta"}
              </button>
            </div>
            <p className="auth-login__nota-compartido">
              En el mismo navegador solo puede haber una cuenta a la vez. Para que otra persona
              entre, cierra sesión o usa otro navegador o ventana privada.
            </p>
          </div>
        )}

        {!sesionActiva && (
          <form className="auth-login__form" onSubmit={(e) => void manejarEnvio(e)}>
            <label>
              Correo electrónico
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              Contraseña
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {error && <p className="auth-login__error">{error}</p>}
            <button type="submit" className="btn btn--primario auth-login__btn" disabled={enviando}>
              {enviando ? "Entrando..." : "Entrar"}
            </button>
          </form>
        )}

        <p className="auth-login__roles">
          Roles: {Object.values(ETIQUETAS_ROL).join(" · ")}
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
