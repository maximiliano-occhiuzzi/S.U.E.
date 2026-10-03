import { useEffect, useSyncExternalStore } from 'react';
import api from '@/services/api';

// Foto de perfil del usuario logueado. Vive en el servidor; acá se guarda una copia en memoria
// (como URL de objeto) para mostrarla en el header, el perfil y la barra de abajo sin pedirla
// de nuevo cada vez.
type Estado = { url: string | null; cargando: boolean };
let estado: Estado = { url: null, cargando: false };
let cargadaPara: number | string | null = null;
const oyentes = new Set<() => void>();
const emitir = () => oyentes.forEach((f) => f());
const poner = (s: Partial<Estado>) => { estado = { ...estado, ...s }; emitir(); };
const soltar = () => { if (estado.url) URL.revokeObjectURL(estado.url); };

export async function cargarFoto(clave: number | string) {
  if (cargadaPara === clave) return;
  cargadaPara = clave;
  poner({ cargando: true });
  try {
    const r = await api.get('/api/perfil/foto', { responseType: 'blob', validateStatus: (s) => s === 200 || s === 204 });
    soltar();
    poner({ url: r.status === 200 && r.data?.size ? URL.createObjectURL(r.data) : null, cargando: false });
  } catch {
    cargadaPara = null; // reintenta la próxima vez
    poner({ cargando: false });
  }
}

export function olvidarFoto() {
  soltar();
  cargadaPara = null;
  estado = { url: null, cargando: false };
  emitir();
}

/** Recorta al centro, achica a 320 px y convierte a JPEG liviano. */
async function prepararImagen(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const lado = Math.min(bmp.width, bmp.height);
  const salida = 320;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = salida;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Sin canvas');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, salida, salida);
  ctx.drawImage(bmp, (bmp.width - lado) / 2, (bmp.height - lado) / 2, lado, lado, 0, 0, salida, salida);
  bmp.close?.();
  return new Promise((ok, fail) =>
    canvas.toBlob((b) => (b ? ok(b) : fail(new Error('No se pudo procesar la imagen'))), 'image/jpeg', 0.85));
}

export async function subirFoto(file: File) {
  if (!file.type.startsWith('image/')) throw new Error('Elegí un archivo de imagen.');
  const blob = await prepararImagen(file);
  await api.put('/api/perfil/foto', blob, { headers: { 'Content-Type': 'image/jpeg' } });
  soltar();
  poner({ url: URL.createObjectURL(blob) });
}

export async function quitarFoto() {
  await api.delete('/api/perfil/foto');
  soltar();
  poner({ url: null });
}

export function useFoto(clave?: number | string | null) {
  const s = useSyncExternalStore(
    (f) => { oyentes.add(f); return () => { oyentes.delete(f); }; },
    () => estado,
  );
  useEffect(() => { if (clave != null) void cargarFoto(clave); }, [clave]);
  return s;
}
