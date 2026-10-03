import { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/services/api';
import type { ActiveSimulacro } from '@/components/SimulacroControl';

// Cada cuántos ms se le pregunta al servidor si hay un simulacro activo.
// Es lo que mantiene sincronizados a todos los dispositivos/usuarios: si Juan
// inicia o finaliza desde la PC, Pepe lo ve en el celular en pocos segundos.
// (Ahora es solo un respaldo: lo instantáneo lo da el canal en vivo de useRealtime.)
const POLL_MS = 5000;

// Evento que dispara usePushNotifications cuando llega un push con la app abierta.
export const REFRESH_EVENT = 'sue:refresh-simulacro';

// Evento más específico: alguien INICIÓ o FINALIZÓ un simulacro (se usa para actualizar el historial).
export const SIMULACRO_EVENT = 'sue:simulacro-cambio';

/**
 * Fuente única de verdad del "simulacro activo".
 *
 * Antes cada pantalla (Mobile y Dashboard) lo pedía UNA sola vez al montarse,
 * y nadie lo volvía a consultar: cada dispositivo se quedaba con la última
 * foto que vio. Ahora se consulta periódicamente, al volver a la app (foco /
 * visibilidad) y cuando llega una notificación push.
 */
export function useSimulacroActivo() {
  const [activo, setActivoState] = useState<ActiveSimulacro>(null);
  // Se incrementa cada vez que la UI cambia el estado a mano (iniciar/finalizar).
  // Una respuesta del polling que arrancó ANTES de ese cambio se descarta, para
  // que no "resucite" un simulacro recién finalizado.
  const generacion = useRef(0);

  const aplicar = useCallback((nuevo: ActiveSimulacro) => {
    setActivoState((prev) => {
      if (prev === null && nuevo === null) return prev;
      // Mismo simulacro: conservar la misma referencia para no reiniciar los
      // efectos que dependen de `activo` (polling de incidencias, cronómetro).
      if (prev && nuevo && prev.id_simulacro === nuevo.id_simulacro) return prev;
      return nuevo;
    });
  }, []);

  // Para cambios hechos por esta misma pantalla (botón iniciar/finalizar).
  const setActivo = useCallback((nuevo: ActiveSimulacro) => {
    generacion.current += 1;
    aplicar(nuevo);
  }, [aplicar]);

  const refresh = useCallback(async () => {
    const gen = generacion.current;
    try {
      const { data } = await api.get('/api/simulacros/activo', { params: { _: Date.now() } });
      if (gen !== generacion.current) return; // el usuario cambió algo mientras tanto
      aplicar(data?.simulacro ?? null);
    } catch {
      // Error de red o token vencido: se conserva el último estado conocido
      // (el interceptor de api.ts ya intenta renovar el token).
    }
  }, [aplicar]);

  useEffect(() => {
    void refresh();

    const timer = window.setInterval(() => {
      if (!document.hidden) void refresh();
    }, POLL_MS);

    const alVolver = () => { if (!document.hidden) void refresh(); };
    const alPush = () => { void refresh(); };

    document.addEventListener('visibilitychange', alVolver);
    window.addEventListener('focus', alVolver);
    window.addEventListener(REFRESH_EVENT, alPush);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', alVolver);
      window.removeEventListener('focus', alVolver);
      window.removeEventListener(REFRESH_EVENT, alPush);
    };
  }, [refresh]);

  return { activo, setActivo, refresh };
}
