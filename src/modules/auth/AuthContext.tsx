import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../../services/supabase";
import { cerrarSesion, obtenerPerfilUsuario } from "./authService";
import { type Permiso, type RolPortal, type UsuarioPortal, puede } from "./roles";

interface AuthContextValue {
  session: Session | null;
  perfil: UsuarioPortal | null;
  cargando: boolean;
  errorPerfil: string | null;
  rol: RolPortal | null;
  puede: (permiso: Permiso) => boolean;
  esAdmin: boolean;
  recargarPerfil: () => Promise<void>;
  salir: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<UsuarioPortal | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorPerfil, setErrorPerfil] = useState<string | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const perfilRef = useRef<UsuarioPortal | null>(null);
  const inicioListo = useRef(false);

  const aplicarSesion = useCallback((nueva: Session | null) => {
    const actual = sessionRef.current;
    // Solo actualizar React si cambia el usuario (no el access_token).
    // Renovar JWT no debe re-renderizar toda la app ni desmontar formularios.
    if (actual?.user.id === nueva?.user.id) {
      sessionRef.current = nueva ?? actual;
      return;
    }
    sessionRef.current = nueva;
    setSession(nueva);
  }, []);

  const cargarPerfil = useCallback(async (userId: string) => {
    try {
      const datos = await obtenerPerfilUsuario(userId);
      if (datos) {
        perfilRef.current = datos;
        setPerfil(datos);
        setErrorPerfil(null);
        return;
      }
      // Sin perfil en BD: no borrar el que ya teníamos (evita desmontar formularios).
      if (perfilRef.current?.id === userId) {
        setErrorPerfil(
          "No se pudo confirmar tu perfil. Sigue trabajando; si persiste, recarga más tarde.",
        );
        return;
      }
      perfilRef.current = null;
      setPerfil(null);
      setErrorPerfil(
        "Tu usuario no tiene perfil en el portal. Pide al administrador que te asigne un rol.",
      );
    } catch (e) {
      // Error de red al volver a la pestaña: conservar perfil actual.
      if (perfilRef.current?.id === userId) {
        setErrorPerfil(
          "Conexión inestable al verificar perfil. Tu sesión sigue activa.",
        );
        return;
      }
      perfilRef.current = null;
      setPerfil(null);
      setErrorPerfil("No se pudo cargar tu perfil: " + (e as Error).message);
    }
  }, []);

  const recargarPerfil = useCallback(async () => {
    const id = sessionRef.current?.user.id;
    if (!id) return;
    await cargarPerfil(id);
  }, [cargarPerfil]);

  useEffect(() => {
    let activo = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!activo) return;
      sessionRef.current = data.session;
      setSession(data.session);
      if (data.session?.user.id) {
        void cargarPerfil(data.session.user.id).finally(() => {
          if (activo) {
            inicioListo.current = true;
            setCargando(false);
          }
        });
      } else {
        inicioListo.current = true;
        setCargando(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, nuevaSession) => {
      if (event === "SIGNED_OUT") {
        sessionRef.current = null;
        perfilRef.current = null;
        setSession(null);
        setPerfil(null);
        setErrorPerfil(null);
        setCargando(false);
        return;
      }

      // Refresh / rehidratación: actualizar ref interno, cero setState de sesión.
      if (
        event === "TOKEN_REFRESHED" ||
        event === "INITIAL_SESSION" ||
        event === "USER_UPDATED"
      ) {
        if (nuevaSession) sessionRef.current = nuevaSession;
        return;
      }

      if (!nuevaSession?.user.id) {
        if (sessionRef.current) return;
        sessionRef.current = null;
        setSession(null);
        setPerfil(null);
        setErrorPerfil(null);
        setCargando(false);
        return;
      }

      const mismoUsuario = nuevaSession.user.id === sessionRef.current?.user.id;
      aplicarSesion(nuevaSession);

      if (mismoUsuario && perfilRef.current) return;

      if (!inicioListo.current) {
        setCargando(true);
        void cargarPerfil(nuevaSession.user.id).finally(() => {
          if (activo) {
            inicioListo.current = true;
            setCargando(false);
          }
        });
        return;
      }

      void cargarPerfil(nuevaSession.user.id);
    });

    return () => {
      activo = false;
      listener.subscription.unsubscribe();
    };
  }, [aplicarSesion, cargarPerfil]);

  const salir = useCallback(async () => {
    try {
      await cerrarSesion();
    } catch {
      // Si falla el servidor, igual limpiamos la sesión local en pantalla.
    } finally {
      sessionRef.current = null;
      perfilRef.current = null;
      setSession(null);
      setPerfil(null);
      setErrorPerfil(null);
      setCargando(false);
    }
  }, []);

  const rol = perfil?.rol ?? null;

  const valor = useMemo<AuthContextValue>(
    () => ({
      session,
      perfil,
      cargando,
      errorPerfil,
      rol,
      puede: (permiso: Permiso) => puede(rol, permiso),
      esAdmin: rol === "admin",
      recargarPerfil,
      salir,
    }),
    [session, perfil, cargando, errorPerfil, rol, recargarPerfil, salir],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return ctx;
}
