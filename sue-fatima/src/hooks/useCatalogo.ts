import { useEffect, useSyncExternalStore } from 'react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';

/** El servidor avisa (o la app se reconecta) -> volver a pedir sectores y tipos. */
export const CATALOGO_EVENT = 'sue:catalogo-cambio';

export type Sector = { id_sector: number; nombre: string; descripcion?: string | null; activo: boolean };
export type TipoIncidencia = {
  codigo: string; nombre: string; gravedad: 'critica' | 'moderada' | 'informativa';
  icono: string; color: string; orden: number; activo: boolean;
};
type Estado = { sectores: Sector[]; tipos: TipoIncidencia[]; cargado: boolean };

// Respaldo mientras llega la primera respuesta (o si el servidor es una versión vieja).
const TIPOS_BASE: TipoIncidencia[] = [
  { codigo: 'incendio',          nombre: 'Incendio',         gravedad: 'critica',     icono: 'flame',   color: 'red',    orden: 1,   activo: true },
  { codigo: 'humo',              nombre: 'Humo',             gravedad: 'moderada',    icono: 'cloud',   color: 'amber',  orden: 2,   activo: true },
  { codigo: 'acceso_bloqueado',  nombre: 'Acceso bloqueado', gravedad: 'moderada',    icono: 'barrier', color: 'orange', orden: 3,   activo: true },
  { codigo: 'persona_lesionada', nombre: 'Lesionado',        gravedad: 'critica',     icono: 'person',  color: 'blue',   orden: 4,   activo: true },
  { codigo: 'otro',              nombre: 'Otro',             gravedad: 'informativa', icono: 'dots',    color: 'green',  orden: 999, activo: true },
];

let estado: Estado = { sectores: [], tipos: TIPOS_BASE, cargado: false };
const subs = new Set<() => void>();
const set = (e: Estado) => { estado = e; subs.forEach((f) => f()); };

let pidiendo: Promise<void> | null = null;
export function recargarCatalogo(): Promise<void> {
  if (pidiendo) return pidiendo;
  pidiendo = api.get('/api/catalogo')
    .then(({ data }) => {
      if (!data?.ok) return;
      set({ sectores: data.sectores ?? [], tipos: data.tipos?.length ? data.tipos : TIPOS_BASE, cargado: true });
    })
    .catch(() => undefined)
    .finally(() => { pidiendo = null; });
  return pidiendo;
}

/** Datos neutros para un tipo que ya no existe en el catálogo (incidencias viejas). */
export function metaDeTipo(codigo: string, tipos: TipoIncidencia[] = estado.tipos) {
  const t = tipos.find((x) => x.codigo === codigo);
  return {
    label: t?.nombre ?? codigo.replace(/_/g, ' '),
    color: t?.color ?? 'green',
    icon: t?.icono ?? 'dots',
    gravedad: t?.gravedad ?? 'informativa',
  };
}

/**
 * Sectores y tipos de incidencia, compartidos por toda la app y siempre al día
 * (se actualizan solos cuando un directivo agrega o cambia algo).
 */
export function useCatalogo() {
  const { usuario } = useAuth();
  const e = useSyncExternalStore(
    (fn) => { subs.add(fn); return () => { subs.delete(fn); }; },
    () => estado,
  );

  useEffect(() => {
    if (!usuario) return;
    if (!estado.cargado) void recargarCatalogo();
    const alCambio = () => void recargarCatalogo();
    window.addEventListener(CATALOGO_EVENT, alCambio);
    return () => window.removeEventListener(CATALOGO_EVENT, alCambio);
  }, [usuario]);

  return {
    cargado: e.cargado,
    todosSectores: e.sectores,
    sectores: e.sectores.filter((s) => s.activo),
    todosTipos: e.tipos,
    tipos: e.tipos.filter((t) => t.activo),
    meta: (codigo: string) => metaDeTipo(codigo, e.tipos),
    recargar: recargarCatalogo,
  };
}
