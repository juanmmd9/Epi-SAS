import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { listarPersonal } from "../personal/personalService";
import type { Persona } from "../personal/types";
import { useAuth } from "./AuthContext";
import { ETIQUETAS_ROL, type RolPortal } from "./roles";
import {
  actualizarPerfilUsuario,
  crearPerfilUsuario,
  esUuidValido,
  listarUsuariosPortal,
} from "./usuariosService";
import type { UsuarioPortal } from "./roles";
import "./usuarios.css";

const formularioVacio = {
  id: "",
  email: "",
  nombre: "",
  rol: "operador" as RolPortal,
  personal_id: "",
};

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

    if (!esUuidValido(campos.id)) {
      setError("El UUID no es válido. Cópialo desde Supabase → Authentication → Users → User UID.");
      return;
    }

    setGuardando(true);
    try {
      await crearPerfilUsuario({
        id: campos.id.trim(),
        email: campos.email.trim(),
        nombre: campos.nombre.trim(),
        rol: campos.rol,
        personal_id: campos.personal_id || null,
      });
      setCampos(formularioVacio);
      setMensaje("Usuario del portal creado. Ya puede iniciar sesión con su contraseña de Auth.");
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
    setGuardando(true);
    try {
      await actualizarPerfilUsuario(usuario.id, {
        nombre: usuario.nombre,
        rol: usuario.rol,
        personal_id: usuario.personal_id,
        activo: usuario.activo,
      });
      setMensaje(`Perfil de ${usuario.nombre || usuario.email} actualizado.`);
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
            Administra quién puede entrar y con qué rol. La contraseña se crea en Supabase Auth.
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
            Supabase → <strong>Authentication → Users → Add user</strong> (correo + contraseña).
          </li>
          <li>Copia el <strong>User UID</strong> de ese usuario.</li>
          <li>Pégalo abajo y elige rol <strong>operador</strong> o <strong>consulta</strong>.</li>
          <li>
            Si es operador de mantenimiento, vincula su fila de <strong>personal</strong> (para la
            matriz).
          </li>
        </ol>
      </aside>

      {mensaje && <p className="usuarios__mensaje usuarios__mensaje--ok">{mensaje}</p>}
      {error && <p className="usuarios__mensaje usuarios__mensaje--error">{error}</p>}

      <form className="usuarios-form" onSubmit={(e) => void manejarCrear(e)}>
        <h2>Agregar perfil al portal</h2>
        <div className="usuarios-form__grid">
          <label className="usuarios-form__uuid">
            User UID (UUID de Supabase Auth)
            <input
              type="text"
              required
              placeholder="f47ac10b-58cc-4372-a567-0e02b2c3d479"
              value={campos.id}
              onChange={(e) => setCampos({ ...campos, id: e.target.value.trim() })}
            />
          </label>
          <label>
            Correo (igual que en Auth)
            <input
              type="email"
              required
              value={campos.email}
              onChange={(e) => setCampos({ ...campos, email: e.target.value })}
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
            </select>
          </label>
          <label>
            Técnico vinculado (opcional)
            <select
              value={campos.personal_id}
              onChange={(e) => setCampos({ ...campos, personal_id: e.target.value })}
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
            {guardando ? "Guardando..." : "Crear perfil"}
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
                <th>Correo</th>
                <th>Rol</th>
                <th>Técnico</th>
                <th>Activo</th>
                <th>UUID</th>
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
                  <td>{u.email}</td>
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
                    </select>
                  </td>
                  <td>
                    <select
                      value={u.personal_id ?? ""}
                      onChange={(e) =>
                        actualizarCampoLista(u.id, {
                          personal_id: e.target.value || null,
                        })
                      }
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
                  <td className="usuarios-tabla__uuid">{u.id}</td>
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
