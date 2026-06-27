import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

    supabase.auth.getSession().then(({ data }) => {
      if (!activo) return;
      setSession(data.session);
      if (data.session?.user.id) {
        void cargarPerfil(data.session.user.id).finally(() => {
          if (activo) setCargando(false);
        });
      } else {
        setCargando(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nuevaSession) => {
      setSession(nuevaSession);
      if (nuevaSession?.user.id) {
        setCargando(true);
        void cargarPerfil(nuevaSession.user.id).finally(() => setCargando(false));
      } else {
        setPerfil(null);
        setErrorPerfil(null);
        setCargando(false);
      }
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
