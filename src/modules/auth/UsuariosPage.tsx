import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { AREAS_SISTEMA } from "../../lib/areas";
import { listarPersonal } from "../personal/personalService";
import type { Persona } from "../personal/types";
import { useAuth } from "./AuthContext";
import { esUsuarioValido, normalizarUsuario } from "./loginUsuario";
import { ETIQUETAS_ROL, type RolPortal } from "./roles";
import {
  actualizarPerfilUsuario,
  crearUsuarioPortalCompleto,
  listarUsuariosPortal,
} from "./usuariosService";
import type { UsuarioPortal } from "./roles";
import "./usuarios.css";

const formularioVacio = {
  usuario: "",
  password: "",
  nombre: "",
  rol: "operador" as RolPortal,
  personal_id: "",
  area: "",
};

function requiereArea(_rol: RolPortal): boolean {
  return false;
}

function badgeRol(rol: RolPortal) {
  return `usuarios__badge usuarios__badge--${rol}`;
}

function UsuariosPage() {
  const { puede, perfil: yo } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioPortal[]>([]);
  const [personal, setPersonal] = useState<Persona[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [campos, setCampos] = useState(formularioVacio);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [lista, tecnicos] = await Promise.all([listarUsuariosPortal(), listarPersonal()]);
      setUsuarios(lista);
      setPersonal(tecnicos.filter((p) => p.activo));
    } catch (e) {
      setError("No se pudieron cargar los usuarios: " + (e as Error).message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  if (!puede("gestionar.usuarios")) {
    return <Navigate to="/" replace />;
  }

  async function manejarCrear(evento: FormEvent) {
    evento.preventDefault();
    setMensaje(null);
    setError(null);

    const login = normalizarUsuario(campos.usuario);
    if (!esUsuarioValido(login)) {
      setError(
        "Usuario inválido. Usa 2–63 caracteres: letras minúsculas, números, punto, guion o guion bajo.",
      );
      return;
    }
    if (campos.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (requiereArea(campos.rol) && !campos.area) {
      setError("El rol Solicitante de área requiere elegir el área de planta.");
      return;
    }

    setGuardando(true);
    try {
      const creado = await crearUsuarioPortalCompleto({
        usuario: login,
        password: campos.password,
        nombre: campos.nombre.trim(),
        rol: campos.rol,
        personal_id: campos.personal_id || null,
        area: campos.area || null,
      });
      setCampos(formularioVacio);
      setMensaje(
        `Usuario "${creado.usuario}" creado. Ya puede iniciar sesión con ese usuario y la contraseña que definiste.`,
      );
      await recargar();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  async function guardarFila(usuario: UsuarioPortal) {
    setMensaje(null);
    setError(null);

    if (requiereArea(usuario.rol) && !usuario.area) {
      setError(
        `Asigna un área a ${usuario.nombre || usuario.usuario || usuario.email} (rol solicitante).`,
      );
      return;
    }

    setGuardando(true);
    try {
      await actualizarPerfilUsuario(usuario.id, {
        nombre: usuario.nombre,
        rol: usuario.rol,
        personal_id: usuario.personal_id,
        area: usuario.area,
        activo: usuario.activo,
      });
      setMensaje(`Perfil de ${usuario.nombre || usuario.usuario || usuario.email} actualizado.`);
    } catch (e) {
      setError((e as Error).message);
      await recargar();
    } finally {
      setGuardando(false);
    }
  }

  function actualizarCampoLista(id: string, cambios: Partial<UsuarioPortal>) {
    setUsuarios((lista) =>
      lista.map((u) => (u.id === id ? { ...u, ...cambios } : u)),
    );
  }

  return (
    <div className="usuarios">
      <div className="usuarios__encabezado">
        <div>
          <h1>Usuarios del portal</h1>
          <p className="usuarios__descripcion">
            Crea usuario y contraseña para cada operario. Las cuentas admin actuales pueden seguir
            entrando con su Gmail o correo.
          </p>
        </div>
        <Link className="btn" to="/personal">
          ← Volver a personal
        </Link>
      </div>

      <aside className="usuarios__pasos">
        <strong>Cómo dar acceso a alguien nuevo</strong>
        <ol>
          <li>
            Elige un <strong>usuario</strong> (ej. <code>jperez</code>) y una{" "}
            <strong>contraseña</strong>; el personal entra con esos datos.
          </li>
          <li>
            Asigna rol: <strong>operador</strong>, <strong>consulta</strong>,{" "}
            <strong>solicitante de área</strong> o <strong>administrador</strong>.
          </li>
          <li>
            Para personal de producción: rol <strong>solicitante de área</strong>. Verán Inicio,
            el tablero de solicitudes y Hojas de vida.
          </li>
          <li>
            Si es operador de mantenimiento, vincula su fila de <strong>personal</strong> (para la
            matriz).
          </li>
        </ol>
        <p className="usuarios__nota-migracion">
          <strong>Cuentas actuales (Gmail / correo):</strong> no las toques en Authentication.
          Solo ejecuta <code>usuarios_login_usuario.sql</code> una vez. Los operarios nuevos se
          crean aquí con usuario + contraseña. Guía:{" "}
          <code>presentacion/migrar-login-usuario.txt</code>.
        </p>
      </aside>

      {mensaje && <p className="usuarios__mensaje usuarios__mensaje--ok">{mensaje}</p>}
      {error && <p className="usuarios__mensaje usuarios__mensaje--error">{error}</p>}

      <form className="usuarios-form" onSubmit={(e) => void manejarCrear(e)}>
        <h2>Crear usuario del portal</h2>
        <div className="usuarios-form__grid">
          <label>
            Usuario (login)
            <input
              type="text"
              required
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="jperez"
              value={campos.usuario}
              onChange={(e) => setCampos({ ...campos, usuario: e.target.value })}
            />
          </label>
          <label>
            Contraseña
            <input
              type="text"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
              value={campos.password}
              onChange={(e) => setCampos({ ...campos, password: e.target.value })}
            />
          </label>
          <label>
            Nombre en el portal
            <input
              type="text"
              required
              value={campos.nombre}
              onChange={(e) => setCampos({ ...campos, nombre: e.target.value })}
            />
          </label>
          <label>
            Rol
            <select
              value={campos.rol}
              onChange={(e) => setCampos({ ...campos, rol: e.target.value as RolPortal })}
            >
              <option value="admin">Administrador</option>
              <option value="operador">Operador</option>
              <option value="consulta">Consulta</option>
              <option value="solicitante">Solicitante de área</option>
            </select>
          </label>
          <label>
            Área de planta {requiereArea(campos.rol) ? "*" : "(opcional)"}
            <select
              required={requiereArea(campos.rol)}
              value={campos.area}
              onChange={(e) => setCampos({ ...campos, area: e.target.value })}
            >
              <option value="">— Sin área —</option>
              {AREAS_SISTEMA.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </label>
          <label>
            Técnico vinculado (opcional)
            <select
              value={campos.personal_id}
              onChange={(e) => {
                const personalId = e.target.value;
                const persona = personal.find((p) => p.id === personalId);
                setCampos({
                  ...campos,
                  personal_id: personalId,
                  area: persona?.area && !campos.area ? persona.area : campos.area,
                });
              }}
            >
              <option value="">— Sin vincular —</option>
              {personal.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                  {p.cargo ? ` (${p.cargo})` : ""}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="usuarios-form__acciones">
          <button type="submit" className="btn btn--primario" disabled={guardando}>
            {guardando ? "Creando..." : "Crear usuario"}
          </button>
        </div>
      </form>

      <h2>Usuarios registrados</h2>
      {cargando ? (
        <p>Cargando...</p>
      ) : (
        <div className="usuarios-tabla-wrap">
          <table className="usuarios-tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Área</th>
                <th>Técnico</th>
                <th>Activo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className={u.activo ? "" : "usuarios-tabla__inactivo"}>
                  <td>
                    <input
                      type="text"
                      value={u.nombre}
                      onChange={(e) => actualizarCampoLista(u.id, { nombre: e.target.value })}
                    />
                  </td>
                  <td>
                    <code>{u.usuario || "—"}</code>
                  </td>
                  <td>
                    <span className={badgeRol(u.rol)}>{ETIQUETAS_ROL[u.rol]}</span>
                    <select
                      value={u.rol}
                      onChange={(e) =>
                        actualizarCampoLista(u.id, { rol: e.target.value as RolPortal })
                      }
                    >
                      <option value="admin">Administrador</option>
                      <option value="operador">Operador</option>
                      <option value="consulta">Consulta</option>
                      <option value="solicitante">Solicitante de área</option>
                    </select>
                  </td>
                  <td>
                    <select
                      value={u.area ?? ""}
                      onChange={(e) =>
                        actualizarCampoLista(u.id, { area: e.target.value || null })
                      }
                    >
                      <option value="">—</option>
                      {AREAS_SISTEMA.map((area) => (
                        <option key={area} value={area}>
                          {area}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={u.personal_id ?? ""}
                      onChange={(e) => {
                        const personalId = e.target.value || null;
                        const persona = personal.find((p) => p.id === personalId);
                        actualizarCampoLista(u.id, {
                          personal_id: personalId,
                          ...(!u.area && persona?.area ? { area: persona.area } : {}),
                        });
                      }}
                    >
                      <option value="">—</option>
                      {personal.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={u.activo}
                      disabled={u.id === yo?.id}
                      title={u.id === yo?.id ? "No puedes desactivarte a ti mismo" : undefined}
                      onChange={(e) => actualizarCampoLista(u.id, { activo: e.target.checked })}
                    />
                  </td>
                  <td>
                    <div className="usuarios-tabla__acciones">
                      <button
                        type="button"
                        className="btn btn--primario"
                        disabled={guardando}
                        onClick={() => void guardarFila(u)}
                      >
                        Guardar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default UsuariosPage;
