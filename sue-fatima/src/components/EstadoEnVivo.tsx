import { useEffect, useState } from 'react';
import api from '@/services/api';
import { Clock3 } from 'lucide-react';
import { IncidentIcon, PanelHeading } from './SimulacroControl';
import type { ActiveSimulacro } from './SimulacroControl';

export type Report = {
  id_reporte:      number;
  estado_sector:   string;
  tipo_incidencia: string;
  gravedad?:       string;
  detalle?:        string;
  fecha_reporte:   string;
  docente?:        string | { nombre: string };
  sector?:         string | { nombre: string };
};

const labels: Record<string, { label: string; color: string; icon: string }> = {
  incendio:          { label: 'Incendio',         color: 'red',    icon: 'flame'   },
  humo:              { label: 'Humo',             color: 'amber',  icon: 'cloud'   },
  acceso_bloqueado:  { label: 'Acceso bloqueado', color: 'orange', icon: 'barrier' },
  persona_lesionada: { label: 'Lesionado',        color: 'blue',   icon: 'person'  },
  otro:              { label: 'Otro',             color: 'green',  icon: 'dots'    },
};

const GRAVEDAD_COLOR: Record<string, string> = {
  critica:     '#dc2626',
  moderada:    '#d97706',
  informativa: '#16a34a',
};

const nameOf = (value?: string | { nombre: string }) =>
  typeof value === 'string' ? value : (value?.nombre ?? '—');

const ago = (date: string) => {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
  return seconds < 60 ? `Hace ${seconds} seg` : `Hace ${Math.floor(seconds / 60)} min`;
};

export default function EstadoEnVivo({
  activo,
  compact = false,
  refreshKey = 0,
}: {
  activo: ActiveSimulacro;
  compact?: boolean;
  refreshKey?: number;
}) {
  const [reports, setReports] = useState<Report[]>([]);
  const [filter,  setFilter]  = useState('todas');

  useEffect(() => {
    if (!activo) { setReports([]); return; }
    let mounted = true;
    const load = () =>
      api.get(`/api/incidencias/${activo.id_simulacro}`)
        .then(({ data }) => {
          if (mounted) setReports(Array.isArray(data?.incidencias) ? data.incidencias : []);
        })
        .catch(() => undefined);
    load();
    const timer = window.setInterval(load, 10000);
    return () => { mounted = false; window.clearInterval(timer); };
  }, [activo, refreshKey]);

  const filters = ['todas', ...Object.keys(labels)];
  const shown   = filter === 'todas' ? reports : reports.filter(r => r.tipo_incidencia === filter);

  return (
    <section className={`panel live-panel ${compact ? 'compact-panel' : ''}`}>
      <PanelHeading number="2" title="Estado en vivo" subtitle="Incidencias reportadas en tiempo real." color="green" />

      <div className="filter-row">
        {filters.map(item => (
          <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>
            {item === 'todas' ? 'Todas' : <IncidentIcon type={labels[item].icon} />}
          </button>
        ))}
      </div>

      <div className="report-list">
        {shown.length === 0 ? (
          <div className="empty-state">
            <Clock3 size={24} />
            <strong>{activo ? 'Esperando reportes' : 'Sin simulacro activo'}</strong>
            <span>{activo ? 'Las nuevas incidencias aparecerán aquí.' : 'Iniciá un simulacro para ver el estado en vivo.'}</span>
          </div>
        ) : shown.map(report => {
          const meta = labels[report.tipo_incidencia] ?? labels.otro;
          return (
            <div className={`report-card ${meta.color}`} key={report.id_reporte}>
              <div className="report-icon">
                <IncidentIcon type={meta.icon} />
              </div>
              <div className="report-info">
                <strong>{meta.label}</strong>
                <b>{nameOf(report.sector)}</b>
                {/* ── Docente que envió la incidencia ── */}
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
                  👤 {nameOf(report.docente)}
                  {report.gravedad && (
                    <span style={{ marginLeft: 8, color: GRAVEDAD_COLOR[report.gravedad] ?? '#64748b', fontWeight: 600 }}>
                      · {report.gravedad.toUpperCase()}
                    </span>
                  )}
                </span>
                {report.detalle && <span>{report.detalle}</span>}
              </div>
              <div className="report-time">
                <time>{new Date(report.fecha_reporte).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</time>
                <small>{ago(report.fecha_reporte)}</small>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

