import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, BellOff, CheckCheck, Flag, Megaphone, TriangleAlert, X } from 'lucide-react';
import { marcarLeido, marcarLeidos, useAvisos, vaciarAvisos, FINAL_EVENT, type Aviso } from '@/hooks/useAvisos';

const ICONO: Record<Aviso['tipo'], typeof Bell> = { inicio: Megaphone, fin: Flag, incidencia: TriangleAlert };

function hace(ts: number) {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return 'ahora';
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  return h < 24 ? `hace ${h} h` : new Date(ts).toLocaleDateString('es-AR');
}

/**
 * Campanita de avisos: historial de lo que fue pasando (simulacro iniciado/finalizado y,
 * para la dirección, incidencias nuevas), con contador de no leídos.
 * Tocar un aviso de cierre vuelve a abrir el resumen.
 */
export default function CampanaAvisos({ className = 'icon-button', size = 19, color }: { className?: string; size?: number; color?: string }) {
  const { items, noLeidos } = useAvisos();
  const [abierto, setAbierto] = useState(false);
  const [, repintar] = useState(0);

  useEffect(() => {
    if (!abierto) return;
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') setAbierto(false); };
    window.addEventListener('keydown', tecla);
    const t = window.setInterval(() => repintar((n) => n + 1), 30000);
    return () => { window.removeEventListener('keydown', tecla); window.clearInterval(t); };
  }, [abierto]);

  const tocar = (a: Aviso) => {
    marcarLeido(a.id);
    if (a.tipo === 'fin' && a.id_simulacro) {
      setAbierto(false);
      // el resumen se muestra una sola vez por simulacro; desde la campanita se puede volver a ver
      window.dispatchEvent(new CustomEvent(FINAL_EVENT, { detail: { id_simulacro: a.id_simulacro, forzar: true } }));
    }
  };

  return (
    <>
      <button type="button" className={className} aria-label={noLeidos ? `Avisos: ${noLeidos} sin leer` : 'Avisos'} onClick={() => setAbierto(true)}>
        <Bell size={size} color={color} />
        {noLeidos > 0 && <b>{noLeidos > 9 ? '9+' : noLeidos}</b>}
      </button>

      {abierto && createPortal(
        <div className="sheet-backdrop" onClick={() => setAbierto(false)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Avisos" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-head">
              <div>
                <h3>Avisos</h3>
                <p>{noLeidos ? `${noLeidos} sin leer` : 'Estás al día'}</p>
              </div>
              <button type="button" className="sheet-close" onClick={() => setAbierto(false)} aria-label="Cerrar"><X size={18} /></button>
            </div>

            {items.length === 0 ? (
              <div className="sheet-empty">
                <BellOff size={26} />
                <strong>Todavía no hay avisos</strong>
                <span>Acá vas a ver cuándo empieza y termina un simulacro.</span>
              </div>
            ) : (
              <>
                <ul className="sheet-list avisos-list">
                  {items.map((a) => {
                    const Icono = ICONO[a.tipo];
                    return (
                      <li key={a.id} className={`aviso-item ${a.tipo} ${a.leido ? '' : 'nuevo'}`} onClick={() => tocar(a)}>
                        <span className="aviso-ico"><Icono size={18} /></span>
                        <div className="sheet-person">
                          <strong>{a.titulo}</strong>
                          <span>{a.texto}</span>
                          <small>{hace(a.ts)}</small>
                        </div>
                        {!a.leido && <i className="sheet-dot" aria-label="Sin leer" />}
                      </li>
                    );
                  })}
                </ul>
                <div className="avisos-pie">
                  <button type="button" onClick={marcarLeidos}><CheckCheck size={15} /> Marcar todo como leído</button>
                  <button type="button" onClick={vaciarAvisos}>Vaciar</button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
