import { useEffect, useRef, useState } from 'react';
import { Camera, LogOut, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { quitarFoto, subirFoto, useFoto } from '@/hooks/useFoto';
import Avatar from '@/components/Avatar';

export default function Perfil() {
  const { usuario, logout } = useAuth();
  const { url } = useFoto(usuario?.id_usuario);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmaSalida, setConfirmaSalida] = useState(false);
  const esDirectivo = usuario?.rol === 'directivo';

  // "Cerrar sesión" pide una segunda pulsación: en una emergencia nadie debería salir por un
  // toque accidental. Se desarma solo a los 4 segundos.
  useEffect(() => {
    if (!confirmaSalida) return;
    const t = window.setTimeout(() => setConfirmaSalida(false), 4000);
    return () => window.clearTimeout(t);
  }, [confirmaSalida]);

  const elegir = async (file?: File) => {
    if (!file) return;
    setBusy(true); setError(null);
    try { await subirFoto(file); }
    catch (e) { setError((e as Error).message || 'No se pudo guardar la foto.'); }
    finally { setBusy(false); if (input.current) input.current.value = ''; }
  };

  const quitar = async () => {
    setBusy(true); setError(null);
    try { await quitarFoto(); } catch { setError('No se pudo quitar la foto.'); } finally { setBusy(false); }
  };

  return (
    <div className="m-more">
      <section className="m-profile big">
        <button type="button" className="perfil-foto" disabled={busy} onClick={() => input.current?.click()} aria-label="Cambiar foto de perfil">
          <Avatar nombre={usuario?.nombre} size={96} />
          <span className="perfil-cam"><Camera size={16} /></span>
        </button>
        <input ref={input} type="file" accept="image/*" hidden onChange={(e) => void elegir(e.target.files?.[0])} />
        <div className="m-profile-info center">
          <strong>{usuario?.nombre}</strong>
          <em className={`m-role ${usuario?.rol ?? ''}`}>{esDirectivo ? 'Directivo' : 'Docente'}</em>
        </div>
        <div className="perfil-acciones">
          <button type="button" className="perfil-link" disabled={busy} onClick={() => input.current?.click()}>
            {busy ? 'Guardando…' : url ? 'Cambiar foto' : 'Agregar foto'}
          </button>
          {url && !busy && (
            <button type="button" className="perfil-link danger" onClick={() => void quitar()}><Trash2 size={14} /> Quitar</button>
          )}
        </div>
        {error && <p className="perfil-error" role="alert">{error}</p>}
      </section>

      <button className={`m-logout ${confirmaSalida ? 'confirm' : ''}`}
              onClick={() => { if (!confirmaSalida) setConfirmaSalida(true); else void logout(); }}>
        <LogOut size={18} />
        {confirmaSalida ? 'Tocá de nuevo para salir' : 'Cerrar sesión'}
      </button>
    </div>
  );
}
