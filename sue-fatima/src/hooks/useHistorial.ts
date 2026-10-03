import { useCallback, useEffect, useState } from 'react';
import api from '@/services/api';
import { SIMULACRO_EVENT } from '@/hooks/useSimulacroActivo';
import type { Simulacro } from '@/components/Historial';

/**
 * Historial de simulacros finalizados.
 *
 * Antes se pedía UNA sola vez al abrir la app, así que el último simulacro recién
 * terminado no aparecía hasta recargar. Ahora se actualiza:
 *   - cuando alguien inicia/finaliza un simulacro (evento en vivo),
 *   - cada vez que se abre la pestaña Historial (`visible` pasa a true).
 * `cargando` es true solo en la primera carga (para mostrar el efecto de carga).
 */
export function useHistorial(visible: boolean) {
  const [items, setItems]       = useState<Simulacro[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get('/api/simulacros/historial');
      setItems(data?.simulacros ?? []);
    } catch {
      /* se conserva lo último que se vio */
    } finally {
      setCargando(false);
    }
  }, []);

  // Primera carga + cada vez que cambia un simulacro (se espera un instante para
  // que el servidor termine de guardar antes de consultar).
  useEffect(() => {
    void cargar();
    let espera: number | undefined;
    const alCambio = () => {
      window.clearTimeout(espera);
      espera = window.setTimeout(() => void cargar(), 400);
    };
    window.addEventListener(SIMULACRO_EVENT, alCambio);
    return () => {
      window.clearTimeout(espera);
      window.removeEventListener(SIMULACRO_EVENT, alCambio);
    };
  }, [cargar]);

  // Al abrir la pestaña, traer lo último.
  useEffect(() => {
    if (visible) void cargar();
  }, [visible, cargar]);

  return { items, cargando, recargar: cargar };
}
