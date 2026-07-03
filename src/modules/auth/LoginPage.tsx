import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AvisoSetupAuth from "../../components/setup/AvisoSetupAuth";
import { rutaPublica } from "../../lib/rutaPublica";
import { areaUsuario } from "../../lib/usuarioArea";
import { useAuth } from "./AuthContext";
import { existeTablaUsuarios, iniciarSesion } from "./authService";
import {
  borrarCredencialesRecordadas,
  guardarCredencialesRecordadas,
  leerCredencialesRecordadas,
} from "./credencialesRecordadas";
import { ETIQUETAS_ROL, rutaInicioParaRol } from "./roles";
import "./auth.css";

function LoginPage() {
  const navigate = useNavigate();
  const ubicacion = useLocation();
  const { session, perfil, cargando, salir } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarClave, setMostrarClave] = useState(false);
  const [recordar, setRecordar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [cerrandoSesion, setCerrandoSesion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faltaRls, setFaltaRls] = useState<boolean | null>(null);

  useEffect(() => {
    void existeTablaUsuarios()
      .then((ok) => setFaltaRls(!ok))
      .catch(() => setFaltaRls(false));
  }, []);

  useEffect(() => {
    const guardadas = leerCredencialesRecordadas();
    if (guardadas) {
      setEmail(guardadas.email);
      setPassword(guardadas.password);
      setRecordar(true);
    }
  }, []);

  const destinoExplicito =
    (ubicacion.state as { desde?: string } | null)?.desde &&
    (ubicacion.state as { desde?: string }).desde !== "/login"
      ? (ubicacion.state as { desde: string }).desde
      : null;

  const destino =
    destinoExplicito ?? rutaInicioParaRol(perfil?.rol, areaUsuario(perfil));

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
      const correo = email.trim();
      await iniciarSesion(correo, password);
      if (recordar) {
        guardarCredencialesRecordadas(correo, password);
      } else {
        borrarCredencialesRecordadas();
      }
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
        <div className="auth-login__marca">
          <img
            className="auth-login__logo"
            src={rutaPublica("/Image/EPI-Logo.png")}
            alt="EPI — Empresa de Producción Industrial"
            width={220}
            height={70}
          />
        </div>
        <div className="auth-login__cuerpo">
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
                <div className="auth-login__clave-fila">
                  <input
                    type={mostrarClave ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="auth-login__ver-clave"
                    onClick={() => setMostrarClave((v) => !v)}
                    aria-label={mostrarClave ? "Ocultar contraseña" : "Mostrar contraseña"}
                    title={mostrarClave ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {mostrarClave ? "Ocultar" : "Ver"}
                  </button>
                </div>
              </label>
              <label className="auth-login__recordar">
                <input
                  type="checkbox"
                  checked={recordar}
                  onChange={(e) => setRecordar(e.target.checked)}
                />
                Recordar correo y contraseña en este equipo
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
    </div>
  );
}

export default LoginPage;
