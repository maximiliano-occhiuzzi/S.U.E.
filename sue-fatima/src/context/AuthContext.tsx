import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import api, { setAccessToken } from '@/services/api';

export type Role = 'directivo' | 'docente';
export type Usuario = { nombre: string; rol: Role; tiene_pin?: boolean };
type AuthContextValue = { usuario: Usuario | null; loading: boolean; login: (email: string, password: string) => Promise<void>; logout: () => Promise<void> };

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.post('/api/auth/refresh').then(({ data }) => {
      if (data?.token && data?.nombre && data?.rol) {
        setAccessToken(data.token);
        setUsuario({ nombre: data.nombre, rol: data.rol, tiene_pin: data.tiene_pin });
      }
    }).catch(() => undefined).finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    usuario,
    loading,
    async login(email, password) {
      const { data } = await api.post('/api/auth/login', { email, password });
      if (!data?.ok || !data.token || !data.nombre || !data.rol) throw new Error('No se pudo iniciar sesion');
      setAccessToken(data.token);
      setUsuario({ nombre: data.nombre, rol: data.rol, tiene_pin: data.tiene_pin });
    },
    async logout() {
      try { await api.post('/api/auth/logout'); } finally { setAccessToken(null); setUsuario(null); }
    },
  }), [usuario, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
