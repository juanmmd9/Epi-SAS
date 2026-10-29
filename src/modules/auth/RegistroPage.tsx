import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AREAS_SISTEMA } from "../../lib/areas";
import BrandLogo from "../../components/BrandLogo";
import { cargosDeArea } from "./cargosArea";
import { registrarPerfilPropio, type RolRegistroPropio } from "./registroPropio";
import "./auth.css";

function RegistroPage() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [area, setArea] = useState("");
  const [rol, setRol] = useState<RolRegistroPropio | "">("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    setAviso(null);
    setEnviando(true);
    try {
      const resultado = await registrarPerfilPropio({
        nombre,
        correo,
        password,
        area,
        rol: rol as RolRegistroPropio,
      });
      if (resultado === "entro") {
        navigate("/", { replace: true });
        return;
      }
      setAviso(
        "Perfil creado. Revisa el correo de Outlook, confirma la cuenta y luego entra con ese mismo correo.",
      );
      setPassword("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="auth-login">
      <div className="auth-login__tarjeta auth-login__tarjeta--amplia">
        <header className="auth-login__marca">
          <BrandLogo className="auth-login__logo" width={240} height={76} />
          <p className="auth-login__marca-texto">Empresa de Producción Industrial</p>
        </header>
        <div className="auth-login__cuerpo">
          <h1>Crear mi perfil</h1>
          <p className="auth-login__subtitulo">
            Elige el área y el cargo de esa área. Si no corresponde, el administrador lo corrige.
          </p>
          <form className="auth-login__form" onSubmit={(e) => void manejarEnvio(e)}>
            <label>
              Nombre
              <input
                type="text"
                required
                autoComplete="name"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </label>
            <label>
              Correo de Outlook
              <input
                type="email"
                required
                autoComplete="email"
                autoCapitalize="none"
                placeholder="nombre@empresa.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
              />
            </label>
            <label>
              Contraseña
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <label>
              Área
              <select
                required
                value={area}
                onChange={(e) => {
                  const siguiente = e.target.value;
                  setArea(siguiente);
                  setRol(cargosDeArea(siguiente)[0]?.rol ?? "");
                }}
              >
                <option value="">Elige el área</option>
                {AREAS_SISTEMA.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Cargo
              <select
                required
                value={rol}
                disabled={!area}
                onChange={(e) => setRol(e.target.value as RolRegistroPropio)}
              >
                {!area ? <option value="">Primero elige el área</option> : null}
                {cargosDeArea(area).map((item) => (
                  <option key={item.rol} value={item.rol}>
                    {item.etiqueta}
                  </option>
                ))}
              </select>
            </label>
            {error ? <p className="auth-login__error">{error}</p> : null}
            {aviso ? <p className="auth-login__aviso">{aviso}</p> : null}
            <button type="submit" className="btn btn--primario auth-login__btn" disabled={enviando}>
              {enviando ? "Creando..." : "Crear perfil"}
            </button>
          </form>
          <p className="auth-login__pie">
            <Link to="/login">Ya tengo perfil. Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegistroPage;
