import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, X } from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { FINAL_EVENT } from '@/hooks/useAvisos';
import { useCatalogo } from '@/hooks/useCatalogo';
import { IncidentIcon } from './SimulacroControl';

type Resumen = {
  id_simulacro: number; tipo: string; nombre?: string | null; duracion: string | null;
  total_incidencias: number; sectores_reportados: number;
  por_estado: { evacuado_ok: number; en_proceso: number; peligro: number };
  incidencias: { id_reporte: number; tipo_incidencia: string; tipo_nombre: string; sector: string; estado_sector: string; fecha_reporte: string; docente?: string }[];
};

const AUTO_CIERRE_S = 30;
const ESTADO: Record<string, string> = { evacuado_ok: 'Evacuado', en_proceso: 'En proceso', peligro: 'Peligro' };
const hora = (iso: string) => new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

/**
 * Cuando termina un simulacro, todos ven este aviso: "evacuación exitosa" + el detalle de
 * las incidencias. Se puede cerrar con la X (o tocando afuera) y se cierra solo a los 30 s.
 * Se activa por el canal en vivo y también al tocar la notificación push.
 */
export default function ResumenFinal() {
  const { usuario } = useAuth();
  const { meta } = useCatalogo();
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [resta, setResta] = useState(AUTO_CIERRE_S);
  const yaMostrados = useRef(new Set<number>());

  const cerrar = useCallback(() => setResumen(null), []);

  useEffect(() => {
    if (!usuario) return;
    const alFinal = async (e: Event) => {
      const d = (e as CustomEvent<{ id_simulacro?: number; forzar?: boolean }>).detail;
      const id = d?.id_simulacro;
      if (typeof id !== 'number' || (!d?.forzar && yaMostrados.current.has(id))) return;
      yaMostrados.current.add(id); // el canal en vivo y la notificación pueden avisar los dos: se muestra una vez
      try {
        const { data } = await api.get(`/api/simulacros/${id}/resumen`);
        if (data?.ok && data.resumen) { setResta(AUTO_CIERRE_S); setResumen(data.resumen as Resumen); }
      } catch { /* sin red: el aviso queda en la campanita */ }
    };
    window.addEventListener(FINAL_EVENT, alFinal);
    return () => window.removeEventListener(FINAL_EVENT, alFinal);
  }, [usuario]);

  // cuenta regresiva para el cierre automático
  useEffect(() => {
    if (!resumen) return;
    const t = window.setInterval(() => setResta((s) => s - 1), 1000);
    return () => window.clearInterval(t);
  }, [resumen]);
  useEffect(() => { if (resumen && resta <= 0) cerrar(); }, [resta, resumen, cerrar]);

  useEffect(() => {
    if (!resumen) return;
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') cerrar(); };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [resumen, cerrar]);

  if (!resumen) return null;
  const emergencia = resumen.tipo === 'emergencia';
  const mostrar = resumen.incidencias.slice(0, 6);
  const mas = resumen.incidencias.length - mostrar.length;

  return createPortal(
    <div className="sheet-backdrop" onClick={cerrar}>
      <div className="sheet final-sheet" role="dialog" aria-modal="true" aria-label="Resumen del simulacro" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="sheet-close final-close" onClick={cerrar} aria-label="Cerrar"><X size={18} /></button>

        <div className="final-hero">
          <span className="final-check"><CheckCircle2 size={34} strokeWidth={2.2} /></span>
          <h3>{emergencia ? 'Emergencia finalizada' : '¡Evacuación exitosa!'}</h3>
          <p>
            {emergencia
              ? 'La emergencia terminó. Gracias por seguir las indicaciones.'
              : 'Gracias por mantener la calma y seguir las indicaciones. Ya pueden volver a sus actividades.'}
          </p>
        </div>

        <div className="final-stats">
          <div><strong>{resumen.duracion ?? '—'}</strong><span>Duración</span></div>
          <div><strong>{resumen.total_incidencias}</strong><span>{resumen.total_incidencias === 1 ? 'Incidencia' : 'Incidencias'}</span></div>
          <div><strong>{resumen.sectores_reportados}</strong><span>{resumen.sectores_reportados === 1 ? 'Sector' : 'Sectores'}</span></div>
        </div>

        <h4 className="final-sub">Detalle de incidencias</h4>
        {resumen.incidencias.length === 0 ? (
          <p className="final-vacio">No se reportaron incidencias durante este simulacro.</p>
        ) : (
          <ul className="final-list">
            {mostrar.map((i) => {
              const m = meta(i.tipo_incidencia);
              return (
                <li key={i.id_reporte}>
                  <span className={`cat-ico ${m.color}`}><IncidentIcon type={m.icon} /></span>
                  <div>
                    <strong>{i.tipo_nombre || m.label}</strong>
                    <span>{i.sector}{i.docente ? ` · ${i.docente}` : ''}</span>
                  </div>
                  <div className="final-meta">
                    <time>{hora(i.fecha_reporte)}</time>
                    <em className={`m-chip ${i.estado_sector === 'peligro' ? 'red' : i.estado_sector === 'en_proceso' ? 'amber' : 'green'}`}>
                      {ESTADO[i.estado_sector] ?? i.estado_sector}
                    </em>
                  </div>
                </li>
              );
            })}
            {mas > 0 && <li className="final-mas">y {mas} {mas === 1 ? 'incidencia más' : 'incidencias más'}</li>}
          </ul>
        )}

        <div className="final-timer" aria-hidden="true"><i style={{ width: `${(resta / AUTO_CIERRE_S) * 100}%` }} /></div>
        <button type="button" className="final-ok" onClick={cerrar}>Entendido</button>
      </div>
    </div>,
    document.body,
  );
}
