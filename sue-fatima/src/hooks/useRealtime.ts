import { useEffect, useSyncExternalStore } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAccessToken, renovarSesion } from '@/services/api';
import { REFRESH_EVENT, SIMULACRO_EVENT } from '@/hooks/useSimulacroActivo';

// ─── Presencia (quién está conectado) ────────────────────────────────────────
export type DocenteConectado = { id_usuario: number; nombre: string; desde: string };
export type Presencia = { docentes: number; directivos: number; lista: DocenteConectado[] };

const VACIA: Presencia = { docentes: 0, directivos: 0, lista: [] };
let presenciaActual: Presencia = VACIA;
const suscriptores = new Set<() => void>();

function setPresencia(p: Presencia) {
  if (
    p.docentes === presenciaActual.docentes &&
    p.directivos === presenciaActual.directivos &&
    JSON.stringify(p.lista) === JSON.stringify(presenciaActual.lista)
  ) return;
  presenciaActual = p;
  suscriptores.forEach((fn) => fn());
}

/** Cantidad de docentes/directivos conectados ahora mismo (se actualiza en vivo). */
export function usePresencia(): Presencia {
  return useSyncExternalStore(
    (fn) => { suscriptores.add(fn); return () => { suscriptores.delete(fn); }; },
    () => presenciaActual,
  );
}

// ─── Canal en tiempo real (Server-Sent Events) ───────────────────────────────
const BASE = import.meta.env.VITE_API_URL ?? '';
const REINTENTO_MS = 3000;
// El servidor manda un latido cada 15 s; si pasan 45 s sin recibir nada la
// conexión se considera muerta (típico al volver de background) y se reabre.
const SIN_DATOS_MS = 45000;

function procesarBloque(bloque: string) {
  let evento = 'message';
  let datos = '';
  for (const linea of bloque.split('\n')) {
    if (linea.startsWith('event:')) evento = linea.slice(6).trim();
    else if (linea.startsWith('data:')) datos += linea.slice(5).trim();
  }
  if (!datos) return; // comentario / latido

  let payload: unknown = null;
  try { payload = JSON.parse(datos); } catch { return; }

  if (evento === 'presencia') {
    const p = payload as { docentes?: number; directivos?: number; docentes_lista?: unknown };
    // La lista de nombres solo la reciben los directivos; para un docente llega vacía.
    const lista = Array.isArray(p.docentes_lista)
      ? (p.docentes_lista as DocenteConectado[]).filter((d) => d && typeof d.nombre === 'string')
      : [];
    setPresencia({ docentes: Number(p.docentes) || 0, directivos: Number(p.directivos) || 0, lista });
  } else if (evento === 'simulacro' || evento === 'incidencia') {
    // Alguien inició/finalizó un simulacro o reportó algo: refrescar ya.
    window.dispatchEvent(new Event(REFRESH_EVENT));
    if (evento === 'simulacro') window.dispatchEvent(new Event(SIMULACRO_EVENT));
  }
}

/**
 * Mantiene abierta la conexión en vivo con el servidor mientras haya sesión.
 * Reemplaza la espera del polling: los cambios llegan al instante, y además
 * permite saber cuántos docentes están conectados. Si se corta, reintenta sola;
 * mientras tanto el polling de respaldo sigue sincronizando.
 */
export function useRealtime() {
  const { usuario } = useAuth();

  useEffect(() => {
    if (!usuario) return;

    let cancelado = false;
    let ctrl: AbortController | null = null;
    let reintento: number | undefined;
    let ultimoDato = Date.now();
    let reconectarYa = false;

    const conectar = async () => {
      if (cancelado) return;
      ctrl = new AbortController();
      const conexion = ctrl;
      ultimoDato = Date.now();
      const vigilante = window.setInterval(() => {
        if (Date.now() - ultimoDato > SIN_DATOS_MS) conexion.abort();
      }, 10000);

      try {
        const res = await fetch(`${BASE}/api/realtime/stream`, {
          headers: { Authorization: `Bearer ${getAccessToken() ?? ''}`, Accept: 'text/event-stream' },
          cache: 'no-store',
          signal: conexion.signal,
        });

        if (res.status === 401) {
          await renovarSesion(); // token vencido: se renueva y se reintenta
          throw new Error('token renovado');
        }
        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

        // Recién conectados: resincronizar por si nos perdimos algo mientras estuvimos desconectados.
        window.dispatchEvent(new Event(REFRESH_EVENT));

        const lector = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        for (;;) {
          const { done, value } = await lector.read();
          if (done) break;
          ultimoDato = Date.now();
          buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
          let corte = buffer.indexOf('\n\n');
          while (corte >= 0) {
            procesarBloque(buffer.slice(0, corte));
            buffer = buffer.slice(corte + 2);
            corte = buffer.indexOf('\n\n');
          }
        }
      } catch {
        /* corte de red, token vencido o conexión abortada: se reintenta abajo */
      } finally {
        window.clearInterval(vigilante);
      }

      if (!cancelado) {
        const espera = reconectarYa ? 0 : REINTENTO_MS;
        reconectarYa = false;
        reintento = window.setTimeout(() => void conectar(), espera);
      }
    };

    void conectar();

    // Al volver a la app, si la conexión quedó dormida (sin latidos), reabrirla de inmediato.
    const alVolver = () => {
      if (!document.hidden && Date.now() - ultimoDato > 20000) {
        reconectarYa = true;
        ctrl?.abort();
      }
    };
    document.addEventListener('visibilitychange', alVolver);

    return () => {
      cancelado = true;
      ctrl?.abort();
      window.clearTimeout(reintento);
      document.removeEventListener('visibilitychange', alVolver);
      setPresencia(VACIA);
    };
  }, [usuario]);
}
