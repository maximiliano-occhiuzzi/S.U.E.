import { useEffect, useState } from 'react';
import { Activity, BarChart3, ClipboardList, House, MoreHorizontal, Bell } from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import SimulacroControl, { IncidentForm, useElapsed, type ActiveSimulacro } from '@/components/SimulacroControl';
import EstadoEnVivo from '@/components/EstadoEnVivo';
import DashboardMetrics from '@/components/DashboardMetrics';
import Historial, { type Simulacro } from '@/components/Historial';
import type { Report } from '@/components/EstadoEnVivo';

const NAV = [
  { id: 'inicio',    label: 'Inicio',    Icon: House         },
  { id: 'estado',    label: 'Estado',    Icon: Activity      },
  { id: 'dashboard', label: 'Dashboard', Icon: BarChart3     },
  { id: 'historial', label: 'Historial', Icon: ClipboardList },
  { id: 'mas',       label: 'Más',       Icon: MoreHorizontal},
];

export default function Mobile() {
  const { usuario, logout } = useAuth();
  const [tab,     setTab]     = useState('inicio');
  const [activo,  setActivo]  = useState<ActiveSimulacro>(null);
  const [sectors, setSectors] = useState<{ id_sector: number; nombre: string }[]>([]);
  const [history, setHistory] = useState<Simulacro[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const elapsed = useElapsed(activo?.fecha_inicio);

  useEffect(() => {
    api.get('/api/simulacros/activo').then(({ data }) => setActivo(data?.simulacro ?? null)).catch(() => undefined);
    api.get('/api/reportes/sectores').then(({ data }) => setSectors(data?.sectores ?? [])).catch(() => undefined);
    api.get('/api/simulacros/historial').then(({ data }) => setHistory(data?.simulacros ?? [])).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!activo) { setReports([]); return; }
    const load = () => api.get(`/api/reportes/${activo.id_simulacro}`).then(({ data }) => setReports(data?.reportes ?? [])).catch(() => undefined);
    load();
    const timer = window.setInterval(load, 10000);
    return () => window.clearInterval(timer);
  }, [activo]);

  return (
    <div className="mobile-app">
      {/* Header */}
      <header className="mobile-header">
        <div className="mobile-brand">
          S.U.E.<span>Fátima</span>
        </div>
        <button className="mobile-header-btn" onClick={() => undefined}>
          <Bell size={20} color="white" />
        </button>
      </header>

      {/* Contenido por tab */}
      <main className="mobile-content">

        {/* ── TAB INICIO ── */}
        {tab === 'inicio' && (
          <>
            {/* Estado del simulacro */}
            <div className="m-status-card">
              <div className="m-status-top">
                <span className="m-eyebrow">SIMULACRO</span>
                <div className={`m-status-badge ${activo ? 'active' : ''}`}>
                  <i className="m-dot" />
                  {activo ? 'ACTIVO' : 'INACTIVO'}
                </div>
              </div>
              <div className="m-timer">{elapsed}</div>

              {/* Botón circular directivo (el formulario de incidencia lo
                  renderizamos aparte más abajo, SimulacroControl no lo duplica
                  cuando mobile=true) */}
              {usuario?.rol === 'directivo' && (
                <SimulacroControl
                  activo={activo}
                  isDirectivo
                  onChange={setActivo}
                  sectors={sectors}
                  mobile
                />
              )}
            </div>

            {/* Formulario de incidencia */}
            <IncidentForm
              activo={activo}
              sectors={sectors}
              onSent={() => {
                if (activo) {
                  api
                    .get(`/api/reportes/${activo.id_simulacro}`)
                    .then(({ data }) => setReports(data?.reportes ?? []))
                    .catch(() => undefined);
                }
              }}
            />

            {/* Últimas incidencias */}
            {reports.length > 0 && (
              <div className="m-section">
                <div className="m-section-title">Últimas incidencias</div>
                {reports.slice(0, 3).map((r) => (
                  <div key={r.id_reporte} className="m-report-row">
                    <div className={`m-report-icon ${r.tipo_incidencia ?? 'otro'}`}>
                      {r.tipo_incidencia === 'incendio'
                        ? '🔥'
                        : r.tipo_incidencia === 'humo'
                          ? '💨'
                          : r.tipo_incidencia === 'acceso_bloqueado'
                            ? '🚧'
                            : r.tipo_incidencia === 'persona_lesionada'
                              ? '🧑‍⚕️'
                              : '⚙️'}
                    </div>
                    <div className="m-report-info">
                      <strong>{r.tipo_incidencia?.replace('_', ' ') ?? 'Otro'}</strong>
                      <span>{r.sector}</span>
                    </div>
                    <time>{new Date(r.fecha_reporte).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</time>
                  </div>
                ))}
                <button className="m-ver-todas" onClick={() => setTab('estado')}>
                  ☰ Ver todas →
                </button>
              </div>
            )}
          </>
        )}

        {/* ── TAB ESTADO ── */}
        {tab === 'estado' && <EstadoEnVivo activo={activo} compact />}

        {/* ── TAB DASHBOARD ── */}
        {tab === 'dashboard' && <DashboardMetrics reports={reports} sectorCount={sectors.length} />}

        {/* ── TAB HISTORIAL ── */}
        {tab === 'historial' && <Historial items={history} />}

        {/* ── TAB MÁS ── */}
        {tab === 'mas' && (
          <div className="m-more">
            <div className="m-more-avatar">{usuario?.nombre?.[0]?.toUpperCase()}</div>
            <strong>{usuario?.nombre}</strong>
            <span>{usuario?.rol}</span>
            <button className="m-logout" onClick={() => void logout()}>Cerrar sesión</button>
          </div>
        )}
      </main>

      {/* Bottom nav */}
      <nav className="bottom-tabs">
        {NAV.map(({ id, label, Icon }) => (
          <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
            <Icon size={22} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}