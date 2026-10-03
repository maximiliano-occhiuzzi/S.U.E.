import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, ChevronRight, Clock3, Map, Users, X } from 'lucide-react';
import { PanelHeading } from './SimulacroControl';
import type { Report } from './EstadoEnVivo';
import { Skeleton } from './Skeleton';
import { useAuth } from '@/context/AuthContext';
import { usePresencia } from '@/hooks/useRealtime';
import { ahoraServidor } from '@/services/clock';
import { useCatalogo } from '@/hooks/useCatalogo';

type Props = {
  reports: Report[];
  sectorCount: number;
  connectedTeachers?: number;
  /** true durante la primera carga de las incidencias: muestra el efecto de carga. */
  loading?: boolean;
};

const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

function haceCuanto(iso: string) {
  const min = Math.max(0, Math.floor((ahoraServidor() - new Date(iso).getTime()) / 60000));
  if (min < 1) return 'recién conectado';
  if (min < 60) return `hace ${min} min`;
  return `hace ${Math.floor(min / 60)} h ${min % 60} min`;
}

export default function DashboardMetrics({ reports, sectorCount, connectedTeachers, loading = false }: Props) {
  const { usuario } = useAuth();
  // Docentes conectados ahora mismo (se actualiza en vivo; connectedTeachers fuerza un valor si se pasa).
  const { docentes } = usePresencia();
  const [verDocentes, setVerDocentes] = useState(false);
  const { meta: metaTipo } = useCatalogo();
  // Solo los directivos pueden ver QUIÉNES están conectados (el servidor solo les manda la lista a ellos).
  const puedeVerLista = usuario?.rol === 'directivo';

  // Crítica = gravedad "critica" (la define el tipo de incidencia en el catálogo)
  const critical = reports.filter(r => (r.gravedad ?? metaTipo(r.tipo_incidencia).gravedad) === 'critica').length;
  const sectors  = new Set(reports.map(r => typeof r.sector === 'string' ? r.sector : r.sector?.nombre)).size;
  const latest   = reports[0];

  const cards = [
    { label: 'Incidencias totales',  value: reports.length,                   icon: AlertTriangle, color: 'blue',  cargando: loading },
    { label: 'Incidencias críticas', value: critical,                          icon: AlertTriangle, color: 'red',   cargando: loading },
    { label: 'Sectores reportados',  value: `${sectors}/${sectorCount||'-'}`,  icon: Map,           color: 'green', cargando: loading },
    {
      label: 'Docentes conectados', value: connectedTeachers ?? docentes, icon: Users, color: 'amber', cargando: false,
      onClick: puedeVerLista ? () => setVerDocentes(true) : undefined,
    },
  ];

  return (
    <section className="panel metrics-panel">
      <PanelHeading number="3" title="Dashboard" subtitle="Resumen general del simulacro en tiempo real." color="violet" />

      <div className="metric-grid">
        {cards.map(({ label, value, icon: Icon, color, cargando, onClick }) => {
          const contenido = (
            <>
              <div>
                <span>{label}</span>
                <strong>{cargando ? <Skeleton w={44} h={26} r={7} style={{ marginTop: 6 }} /> : value}</strong>
              </div>
              <Icon size={25} />
            </>
          );
          return onClick ? (
            <button type="button" className={`metric-card ${color} clickable`} key={label} onClick={onClick}
                    aria-label={`${label}: ver quiénes son`}>
              {contenido}
              <ChevronRight className="metric-go" size={16} />
            </button>
          ) : (
            <div className={`metric-card ${color}`} key={label}>{contenido}</div>
          );
        })}
      </div>

      <div className="metric-bottom">
        <div className="average">
          <span>Tiempo promedio<br />de evacuación</span>
          <strong>—</strong>
          <small><Clock3 size={16} /> Sin datos suficientes</small>
        </div>

        <div className="general-status">
          <span>Estado general</span>
          {loading ? (
            <div><Skeleton w={110} h={14} /></div>
          ) : (
            <div>
              <i className="green" /> {reports.filter(r => r.estado_sector === 'evacuado_ok').length}
              <i className="amber" /> {reports.filter(r => r.estado_sector === 'en_proceso').length}
              <i className="red"   /> {reports.filter(r => r.estado_sector === 'peligro').length}
            </div>
          )}
        </div>

        <div className="latest">
          <span>Última incidencia</span>
          {loading ? (
            <>
              <Skeleton w="60%" h={14} style={{ marginTop: 6 }} />
              <Skeleton w="40%" h={11} style={{ marginTop: 6 }} />
            </>
          ) : latest ? (
            <>
              <strong>{metaTipo(latest.tipo_incidencia).label}</strong>
              <small>{typeof latest.sector === 'string' ? latest.sector : (latest.sector?.nombre ?? 'Sin sector')}</small>
            </>
          ) : (
            <small>Aún no hay incidencias</small>
          )}
        </div>
      </div>

      {verDocentes && <DocentesConectados onClose={() => setVerDocentes(false)} />}
    </section>
  );
}

/** Ventana con el detalle de qué docentes están conectados ahora (se actualiza en vivo). */
function DocentesConectados({ onClose }: { onClose: () => void }) {
  const { lista, docentes } = usePresencia();
  const [, repintar] = useState(0);

  useEffect(() => {
    const alTecla = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', alTecla);
    // "hace X min" se refresca solo cada medio minuto
    const t = window.setInterval(() => repintar((n) => n + 1), 30000);
    return () => { window.removeEventListener('keydown', alTecla); window.clearInterval(t); };
  }, [onClose]);

  // Portal al <body>: así la ventana tapa toda la pantalla y no depende del panel donde se abrió.
  return createPortal(
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label="Docentes conectados"
           onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <div>
            <h3>Docentes conectados</h3>
            <p><span className="sheet-live" /> En vivo · {docentes} {docentes === 1 ? 'docente' : 'docentes'}</p>
          </div>
          <button type="button" className="sheet-close" onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
        </div>

        {lista.length === 0 ? (
          <div className="sheet-empty">
            <Users size={26} />
            <strong>Ningún docente conectado</strong>
            <span>Cuando un docente abra la app va a aparecer acá.</span>
          </div>
        ) : (
          <ul className="sheet-list">
            {lista.map((d) => (
              <li key={d.id_usuario}>
                <div className="sheet-avatar">{d.nombre?.[0]?.toUpperCase() ?? '?'}</div>
                <div className="sheet-person">
                  <strong>{d.nombre}</strong>
                  <span>Conectado desde las {hora(d.desde)} · {haceCuanto(d.desde)}</span>
                </div>
                <i className="sheet-dot" aria-label="En línea" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>,
    document.body,
  );
}
