import { useSyncExternalStore } from 'react';

// Centro de avisos de la campanita: lo que fue pasando (simulacros, incidencias).
// Se guarda en el dispositivo para que no se pierda al cerrar la app.
export type Aviso = {
  id: string;            // único: sirve para no repetir el mismo aviso
  ts: number;
  tipo: 'inicio' | 'fin' | 'incidencia';
  titulo: string;
  texto: string;
  leido: boolean;
  id_simulacro?: number;
};

/** Terminó un simulacro: mostrar el resumen ("evacuación exitosa"). detail = { id_simulacro } */
export const FINAL_EVENT = 'sue:simulacro-final';

const CLAVE = 'sue_avisos_v1';
const MAX = 30;

function cargar(): Aviso[] {
  try {
    const raw = localStorage.getItem(CLAVE);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.slice(0, MAX) : [];
  } catch { return []; }
}

let lista: Aviso[] = cargar();
const subs = new Set<() => void>();
function guardar(nueva: Aviso[]) {
  lista = nueva.slice(0, MAX);
  try { localStorage.setItem(CLAVE, JSON.stringify(lista)); } catch { /* sin almacenamiento: queda en memoria */ }
  subs.forEach((f) => f());
}

export function agregarAviso(a: Omit<Aviso, 'ts' | 'leido'>) {
  if (lista.some((x) => x.id === a.id)) return;
  guardar([{ ...a, ts: Date.now(), leido: false }, ...lista]);
}
export const marcarLeidos = () => guardar(lista.map((a) => ({ ...a, leido: true })));
export const marcarLeido = (id: string) => guardar(lista.map((a) => (a.id === id ? { ...a, leido: true } : a)));
export const vaciarAvisos = () => guardar([]);

export function useAvisos() {
  const items = useSyncExternalStore(
    (fn) => { subs.add(fn); return () => { subs.delete(fn); }; },
    () => lista,
  );
  return { items, noLeidos: items.filter((a) => !a.leido).length };
}
