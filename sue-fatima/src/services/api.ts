import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // necesario para que el navegador mande/reciba la cookie httpOnly de refresh
});

let accessToken: string | null = null;
let refreshRequest: Promise<string | null> | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original?._retry || original?.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }
    original._retry = true;
    refreshRequest ??= api.post('/api/auth/refresh').then(({ data }) => {
      if (data?.token) {
        accessToken = data.token;
        return data.token as string;
      }
      return null;
    }).catch(() => null).finally(() => { refreshRequest = null; });
    const token = await refreshRequest;
    if (!token) return Promise.reject(error);
    original.headers.Authorization = `Bearer ${token}`;
    return api(original);
  },
);

export default api;