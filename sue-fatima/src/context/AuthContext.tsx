import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import api, { renovarSesion, setAccessToken, setRefreshToken } from '@/services/api';

export type Role = 'directivo' | 'docente';
export type Usuario = { nombre: string; rol: Role; tiene_pin?: boolean };
type LogoutPhase = 'idle' | 'loading' | 'done';
type AuthContextValue = {
  usuario: Usuario | null;
  loading: boolean;
  logoutPhase: LogoutPhase;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutPhase, setLogoutPhase] = useState<LogoutPhase>('idle');

  useEffect(() => {
    // Recupera la sesión al abrir la app (cookie en la PC, token guardado en el celu)
    renovarSesion().then((data) => {
      if (data?.token && data?.nombre && data?.rol) {
        setUsuario({ nombre: data.nombre, rol: data.rol, tiene_pin: data.tiene_pin });
      }
    }).catch(() => undefined).finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    usuario,
    loading,
    logoutPhase,
    async login(email, password) {
      const { data } = await api.post('/api/auth/login', { email, password });
      if (!data?.ok || !data.token || !data.nombre || !data.rol) throw new Error('No se pudo iniciar sesion');
      setAccessToken(data.token);
      setRefreshToken(data.refreshToken ?? null);
      setUsuario({ nombre: data.nombre, rol: data.rol, tiene_pin: data.tiene_pin });
    },
    async logout() {
      setLogoutPhase('loading');
      try {
        await api.post('/api/auth/logout');
      } finally {
        setAccessToken(null);
        setRefreshToken(null);
      }
      setLogoutPhase('done');
      await new Promise(resolve => setTimeout(resolve, 800));
      setUsuario(null);
      setLogoutPhase('idle');
    },
  }), [usuario, loading, logoutPhase]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
