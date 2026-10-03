import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import { sincronizarReloj } from '@/services/clock';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // en navegador: manda/recibe la cookie httpOnly de refresh
});

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};
export const getAccessToken = () => accessToken;

// ─── Sesión persistente en la app del celular ────────────────────────────────
// En la app (Capacitor) el origen es http://suefatima.local y el backend está en
// otra dirección (IP): para Android eso es "cross-site" y descarta la cookie de
// refresh, así que al cerrar la app se perdía la sesión y pedía el correo de
// nuevo. Por eso, en la app, el refresh token también se guarda en el
// dispositivo y se envía en el body de /api/auth/refresh.
// (En el navegador de la PC se sigue usando solo la cookie httpOnly.)
const REFRESH_KEY = 'sue_refresh_token';
const esApp = () => Capacitor.isNativePlatform();

export const getRefreshToken = (): string | null => {
  if (!esApp()) return null;
  try { return localStorage.getItem(REFRESH_KEY); } catch { return null; }
};

export const setRefreshToken = (token: string | null) => {
  if (!esApp()) return;
  try {
    if (token) localStorage.setItem(REFRESH_KEY, token);
    else localStorage.removeItem(REFRESH_KEY);
  } catch { /* sin almacenamiento: queda solo la sesión en memoria */ }
};

export type DatosSesion = {
  token: string;
  refreshToken?: string;
  nombre: string;
  rol: 'directivo' | 'docente';
  tiene_pin?: boolean;
};

let renovando: Promise<DatosSesion> | null = null;

/**
 * Renueva la sesión con el refresh token (cookie o el guardado en la app).
 * Si varios pedidos la piden a la vez, comparten una sola renovación.
 * Solo borra el token guardado si el servidor lo rechazó (401); un corte de
 * red NO cierra la sesión.
 */
export function renovarSesion(): Promise<DatosSesion> {
  renovando ??= api
    .post('/api/auth/refresh', { refreshToken: getRefreshToken() ?? undefined })
    .then(({ data }) => {
      if (!data?.token) throw new Error('Respuesta de sesión inválida');
      accessToken = data.token as string;
      if (data.refreshToken) setRefreshToken(data.refreshToken as string);
      return data as DatosSesion;
    })
    .catch((err) => {
      if (err?.response?.status === 401) setRefreshToken(null);
      throw err;
    })
    .finally(() => { renovando = null; });
  return renovando;
}

api.interceptors.request.use((config) => {
  (config as { _t0?: number })._t0 = Date.now(); // para medir la latencia y calibrar el reloj
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => {
    // Los endpoints de estado devuelven la hora del servidor: se usa para el cronómetro.
    const hora = response.data?.servidor_ahora;
    if (typeof hora === 'string') {
      sincronizarReloj(hora, (response.config as { _t0?: number })._t0 ?? Date.now(), Date.now());
    }
    return response;
  },
  async (error) => {
    const original = error.config;
    const url: string = original?.url ?? '';
    if (
      error.response?.status !== 401 ||
      original?._retry ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/login')
    ) {
      return Promise.reject(error);
    }
    original._retry = true;
    try {
      const sesion = await renovarSesion();
      original.headers.Authorization = `Bearer ${sesion.token}`;
      return api(original);
    } catch {
      return Promise.reject(error);
    }
  },
);

export default api;
