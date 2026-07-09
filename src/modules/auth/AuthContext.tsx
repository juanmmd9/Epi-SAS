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

function mismaSesion(a: Session | null, b: Session | null): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.user.id === b.user.id && a.access_token === b.access_token;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<UsuarioPortal | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorPerfil, setErrorPerfil] = useState<string | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const perfilRef = useRef<UsuarioPortal | null>(null);
  const inicioListo = useRef(false);

  sessionRef.current = session;
  perfilRef.current = perfil;

  const cargarPerfil = useCallback(async (userId: string) => {
    try {
      const datos = await obtenerPerfilUsuario(userId);
      setPerfil(datos);
      setErrorPerfil(
        datos
          ? null
          : "Tu usuario no tiene perfil en el portal. Pide al administrador que te asigne un rol.",
      );
    } catch (e) {
      setPerfil(null);
      setErrorPerfil("No se pudo cargar tu perfil: " + (e as Error).message);
    }
  }, []);

  const recargarPerfil = useCallback(async () => {
    if (!session?.user.id) return;
    await cargarPerfil(session.user.id);
  }, [session?.user.id, cargarPerfil]);

  useEffect(() => {
    let activo = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!activo) return;
      setSession(data.session);
      sessionRef.current = data.session;
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
      // Cierre real de sesión: solo entonces limpiamos y desmontamos.
      if (event === "SIGNED_OUT") {
        setSession(null);
        sessionRef.current = null;
        setPerfil(null);
        perfilRef.current = null;
        setErrorPerfil(null);
        setCargando(false);
        return;
      }

      // Renovación de JWT / rehidratación: no tocar cargando ni perfil.
      // Si nuevaSession viene null de forma momentánea, NO limpiar (evita remount).
      if (
        event === "TOKEN_REFRESHED" ||
        event === "INITIAL_SESSION" ||
        event === "USER_UPDATED"
      ) {
        if (nuevaSession && !mismaSesion(sessionRef.current, nuevaSession)) {
          setSession(nuevaSession);
          sessionRef.current = nuevaSession;
        }
        return;
      }

      if (!nuevaSession?.user.id) {
        // Ignorar nulls transitorios mientras ya hay sesión activa.
        if (sessionRef.current) return;
        setSession(null);
        setPerfil(null);
        setErrorPerfil(null);
        setCargando(false);
        return;
      }

      const mismoUsuario = nuevaSession.user.id === sessionRef.current?.user.id;

      if (!mismaSesion(sessionRef.current, nuevaSession)) {
        setSession(nuevaSession);
        sessionRef.current = nuevaSession;
      }

      // Mismo usuario ya con perfil: no recargar ni mostrar "Verificando sesión".
      if (mismoUsuario && perfilRef.current) return;

      // Login nuevo o cambio de usuario: cargar perfil sin bloquear la UI si ya estábamos dentro.
      if (inicioListo.current && mismoUsuario) {
        void cargarPerfil(nuevaSession.user.id);
        return;
      }

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
  }, [cargarPerfil]);

  const salir = useCallback(async () => {
    try {
      await cerrarSesion();
    } catch {
      // Si falla el servidor, igual limpiamos la sesión local en pantalla.
    } finally {
      setSession(null);
      sessionRef.current = null;
      setPerfil(null);
      perfilRef.current = null;
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
