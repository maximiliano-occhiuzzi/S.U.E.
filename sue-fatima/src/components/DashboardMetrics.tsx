import { AlertTriangle, Clock3, Map, Users } from 'lucide-react';
import { PanelHeading } from './SimulacroControl';
import type { Report } from './EstadoEnVivo';

type Props = { reports: Report[]; sectorCount: number; connectedTeachers?: number };

export default function DashboardMetrics({ reports, sectorCount, connectedTeachers = 0 }: Props) {
  const critical = reports.filter(r => ['incendio', 'persona_lesionada'].includes(r.tipo_incidencia)).length;
  const sectors  = new Set(reports.map(r => typeof r.sector === 'string' ? r.sector : r.sector?.nombre)).size;
  const latest   = reports[0];

  const cards = [
    { label: 'Incidencias totales',  value: reports.length,               icon: AlertTriangle, color: 'blue'  },
    { label: 'Incidencias críticas', value: critical,                      icon: AlertTriangle, color: 'red'   },
    { label: 'Sectores reportados',  value: `${sectors}/${sectorCount||'-'}`, icon: Map,        color: 'green' },
    { label: 'Docentes conectados',  value: connectedTeachers,             icon: Users,         color: 'amber' },
  ];

  return (
    <section className="panel metrics-panel">
      <PanelHeading number="3" title="Dashboard" subtitle="Resumen general del simulacro en tiempo real." color="violet" />

      <div className="metric-grid">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div className={`metric-card ${color}`} key={label}>
            <div><span>{label}</span><strong>{value}</strong></div>
            <Icon size={25} />
          </div>
        ))}
      </div>

      <div className="metric-bottom">
        <div className="average">
          <span>Tiempo promedio<br />de evacuación</span>
          <strong>—</strong>
          <small><Clock3 size={16} /> Sin datos suficientes</small>
        </div>

        <div className="general-status">
          <span>Estado general</span>
          <div>
            <i className="green" /> {reports.filter(r => r.estado_sector === 'evacuado_ok').length}
            <i className="amber" /> {reports.filter(r => r.estado_sector === 'en_proceso').length}
            <i className="red"   /> {reports.filter(r => r.estado_sector === 'peligro').length}
          </div>
        </div>

        <div className="latest">
          <span>Última incidencia</span>
          {latest ? (
            <>
              <strong>{latest.tipo_incidencia.replace(/_/g, ' ')}</strong>
              <small>{typeof latest.sector === 'string' ? latest.sector : (latest.sector?.nombre ?? 'Sin sector')}</small>
            </>
          ) : (
            <small>Aún no hay incidencias</small>
          )}
        </div>
      </div>
    </section>
  );
}