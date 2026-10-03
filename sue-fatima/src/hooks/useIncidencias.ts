import { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/services/api';
import { REFRESH_EVENT } from '@/hooks/useSimulacroActivo';
import type { ActiveSimulacro } from '@/components/SimulacroControl';
import type { Report } from '@/components/EstadoEnVivo';

/**
 * Incidencias del simulacro activo, compartido por Inicio, Estado y Dashboard
 * (antes cada pantalla tenía su propia copia de este código).
 *
 *  - Se recarga sola cada 10 s y al instante cuando llega un evento en vivo.
 *  - `cargando` es true solo durante la PRIMERA carga de cada simulacro: sirve para
 *    mostrar el efecto de carga sin que parpadee en cada actualización.
 */
export function useIncidencias(activo: ActiveSimulacro, refreshKey = 0) {
  const [reports, setReports]   = useState<Report[]>([]);
  const [cargando, setCargando] = useState(false);
  const id = activo?.id_simulacro ?? null;
  const cargadoPara = useRef<number | null>(null);

  const pedir = useCallback(async (idSimulacro: number): Promise<Report[] | null> => {
    try {
      const { data } = await api.get(`/api/incidencias/${idSimulacro}`);
      return Array.isArray(data?.incidencias) ? data.incidencias : [];
    } catch {
      return null; // error de red: se conserva lo último que se vio
    }
  }, []);

  useEffect(() => {
    if (id == null) {
      cargadoPara.current = null;
      setReports([]);
      setCargando(false);
      return;
    }

    let vigente = true;
    if (cargadoPara.current !== id) setCargando(true);

    const load = async () => {
      const lista = await pedir(id);
      if (!vigente) return;
      if (lista) setReports(lista);
      cargadoPara.current = id;
      setCargando(false);
    };

    void load();
    const timer = window.setInterval(() => void load(), 10000);
    // Evento en vivo (alguien reportó una incidencia / cambió el simulacro): recargar ya.
    const alEvento = () => void load();
    window.addEventListener(REFRESH_EVENT, alEvento);

    return () => {
      vigente = false;
      window.clearInterval(timer);
      window.removeEventListener(REFRESH_EVENT, alEvento);
    };
  }, [id, refreshKey, pedir]);

  /** Recarga inmediata (p. ej. justo después de enviar una incidencia). */
  const recargar = useCallback(async () => {
    if (id == null) return;
    const lista = await pedir(id);
    if (lista) setReports(lista);
  }, [id, pedir]);

  return { reports, cargando, recargar };
}
