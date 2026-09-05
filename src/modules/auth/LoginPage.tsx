import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AvisoSetupAuth from "../../components/setup/AvisoSetupAuth";
import { rutaPublica } from "../../lib/rutaPublica";
import { useAuth } from "./AuthContext";
import { existeTablaUsuarios, iniciarSesion } from "./authService";
import {
  borrarCredencialesRecordadas,
  guardarCredencialesRecordadas,
  leerCredencialesRecordadas,
} from "./credencialesRecordadas";
import { ETIQUETAS_ROL, rutaInicioParaRol, type RolPortal } from "./roles";
import "./auth.css";

/** Destino tras login: el solicitante siempre entra al tablero de áreas. */
function destinoSeguro(
  rol: RolPortal | null | undefined,
  desde: string | null | undefined,
): string {
  if (rol === "solicitante") return "/solicitudes";
  if (rol === "lider") return "/preventivo/aprobaciones";
  if (desde && desde !== "/login" && !desde.startsWith("/login")) return desde;
  return rutaInicioParaRol(rol);
}

function etiquetaPerfil(perfil: { nombre: string; usuario: string; email: string }): string {
  return perfil.nombre || perfil.usuario || perfil.email;
}

function LoginPage() {
  const navigate = useNavigate();
  const ubicacion = useLocation();
  const { session, perfil, cargando, salir } = useAuth();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarClave, setMostrarClave] = useState(false);
  const [recordar, setRecordar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [cerrandoSesion, setCerrandoSesion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faltaRls, setFaltaRls] = useState<boolean | null>(null);
  const [pendienteEntrada, setPendienteEntrada] = useState(false);

  useEffect(() => {
    void existeTablaUsuarios()
      .then((ok) => setFaltaRls(!ok))
      .catch(() => setFaltaRls(false));
  }, []);

  useEffect(() => {
    const guardadas = leerCredencialesRecordadas();
    if (guardadas) {
      setUsuario(guardadas.usuario);
      setPassword(guardadas.password);
      setRecordar(true);
    }
  }, []);

  const destinoExplicito =
    (ubicacion.state as { desde?: string } | null)?.desde &&
    (ubicacion.state as { desde?: string }).desde !== "/login"
      ? (ubicacion.state as { desde: string }).desde
      : null;

  const destino = destinoSeguro(perfil?.rol, destinoExplicito);

  useEffect(() => {
    if (!pendienteEntrada || cargando || !session || !perfil) return;
    setPendienteEntrada(false);
    navigate(destinoSeguro(perfil.rol, destinoExplicito), { replace: true });
  }, [pendienteEntrada, cargando, session, perfil, destinoExplicito, navigate]);

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
      const login = usuario.trim();
      await iniciarSesion(login, password);
      if (recordar) {
        guardarCredencialesRecordadas(login, password);
      } else {
        borrarCredencialesRecordadas();
      }
      setPendienteEntrada(true);
    } catch (e) {
      setError("No se pudo iniciar sesión: " + (e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  const sesionActiva = !cargando && session && perfil;

  return (
    <div className="auth-login">
      {faltaRls && (
        <div className="auth-login__aviso-rls">
          <AvisoSetupAuth />
        </div>
      )}

      <div className="auth-login__tarjeta">
        <header className="auth-login__marca">
          <img
            className="auth-login__logo"
            src={rutaPublica("/Image/EPI-Logo.png")}
            alt="EPI — Empresa de Producción Industrial"
            width={240}
            height={76}
          />
          <p className="auth-login__marca-texto">Empresa de Producción Industrial</p>
        </header>

        <div className="auth-login__cuerpo">
          <h1>Portal de Mantenimiento</h1>
          <p className="auth-login__subtitulo">Inicia sesión con tu usuario o correo</p>

          {sesionActiva && (
            <div className="auth-login__sesion-activa">
              <p>
                Ya hay una sesión abierta como <strong>{etiquetaPerfil(perfil)}</strong> (
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
                Usuario o correo
                <input
                  type="text"
                  required
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="next"
                  placeholder="ej. jperez o tu correo"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                />
              </label>
              <label>
                Contraseña
                <div className="auth-login__clave-fila">
                  <input
                    type={mostrarClave ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    enterKeyHint="go"
                    placeholder="••••••••"
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
                Recordar usuario/correo y contraseña en este equipo
              </label>
              {error && <p className="auth-login__error">{error}</p>}
              <button type="submit" className="btn btn--primario auth-login__btn" disabled={enviando}>
                {enviando ? "Entrando..." : "Iniciar sesión"}
              </button>
            </form>
          )}

          <p className="auth-login__pie">Mantenimiento EPI</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
