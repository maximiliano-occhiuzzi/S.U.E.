import { useEffect, useState } from 'react';
import { Activity, BarChart3, Bell, ChevronRight, ClipboardList, House, LogOut, MoreHorizontal, ShieldCheck } from 'lucide-react';
import api from '@/services/api';
import { useSimulacroActivo } from '@/hooks/useSimulacroActivo';
import { useIncidencias } from '@/hooks/useIncidencias';
import { useHistorial } from '@/hooks/useHistorial';
import { useAuth } from '@/context/AuthContext';
import SimulacroControl, { IncidentForm, IncidentIcon } from '@/components/SimulacroControl';
import EstadoEnVivo from '@/components/EstadoEnVivo';
import AvisoEvacuacion from '@/components/AvisoEvacuacion';
import DashboardMetrics from '@/components/DashboardMetrics';
import Historial from '@/components/Historial';
import Usuarios from '@/components/Usuarios';

// `sector` puede venir como string o como objeto { nombre }; renderizarlo
// directo ({r.sector}) rompe la vista si llega como objeto.
const nameOf = (value?: string | { nombre: string }) =>
  typeof value === 'string' ? value : (value?.nombre ?? '—');

const NAV = [
  { id: 'inicio',    label: 'Inicio',    Icon: House         },
  { id: 'estado',    label: 'Estado',    Icon: Activity      },
  { id: 'dashboard', label: 'Dashboard', Icon: BarChart3     },
  { id: 'historial', label: 'Historial', Icon: ClipboardList },
  { id: 'mas',       label: 'Más',       Icon: MoreHorizontal},
];

const TIPO: Record<string, { label: string; icon: string }> = {
  incendio:          { label: 'Incendio',          icon: 'flame'  },
  humo:              { label: 'Humo',              icon: 'cloud'  },
  acceso_bloqueado:  { label: 'Acceso bloqueado',  icon: 'barrier'},
  persona_lesionada: { label: 'Persona lesionada', icon: 'person' },
  otro:              { label: 'Otro',              icon: 'dots'   },
};

const ESTADO_SECTOR: Record<string, { label: string; tone: string }> = {
  peligro:     { label: 'Peligro',    tone: 'red'   },
  en_proceso:  { label: 'En proceso', tone: 'amber' },
  evacuado_ok: { label: 'Evacuado',   tone: 'green' },
};

export default function Mobile() {
  const { usuario, logout } = useAuth();
  const [tab,     setTab]     = useState('inicio');
  // Estado del simulacro sincronizado con el servidor (canal en vivo + respaldo por polling).
  const { activo, setActivo } = useSimulacroActivo();
  const [sectors, setSectors] = useState<{ id_sector: number; nombre: string }[]>([]);
  // Incidencias del simulacro activo y el historial: se mantienen al día solos y avisan cuándo
  // están cargando por primera vez (para mostrar el efecto de carga).
  const { reports, cargando: cargandoIncidencias, recargar } = useIncidencias(activo);
  const { items: history, cargando: cargandoHistorial } = useHistorial(tab === 'historial');
  const [confirmaSalida, setConfirmaSalida] = useState(false);

  const esDirectivo = usuario?.rol === 'directivo';

  useEffect(() => {
    api.get('/api/incidencias/sectores').then(({ data }) => setSectors(data?.sectores ?? [])).catch(() => undefined);
  }, []);

  // "Cerrar sesión" pide una segunda pulsación: en una emergencia nadie debería
  // salir de la app por un toque accidental. Se desarma solo a los 4 segundos.
  useEffect(() => {
    if (!confirmaSalida) return;
    const t = window.setTimeout(() => setConfirmaSalida(false), 4000);
    return () => window.clearTimeout(t);
  }, [confirmaSalida]);

  const pedirSalida = () => {
    if (!confirmaSalida) { setConfirmaSalida(true); return; }
    void logout();
  };

  return (
    <div className="mobile-app">
      {/* Header */}
      <header className="mobile-header">
        <div className="mobile-brand">
          <div className="mobile-brand-mark"><ShieldCheck size={21} strokeWidth={2.4} /></div>
          <div className="mobile-brand-text">
            <b>S.U.E.</b>
            <small>Fátima</small>
          </div>
        </div>
        <button className="mobile-header-btn" aria-label="Notificaciones" onClick={() => undefined}>
          <Bell size={20} color="white" />
        </button>
      </header>

      {/* Contenido por tab */}
      <main className="mobile-content">

        {/* Aviso de evacuación: los docentes lo ven en todas las pestañas mientras haya simulacro */}
        {activo && !esDirectivo && <AvisoEvacuacion compact />}

        {/* ── TAB INICIO ── */}
        {tab === 'inicio' && (
          <>
            {/* Estado + reloj del simulacro (el botón iniciar/finalizar solo lo ve el directivo;
                el docente ve el mismo estado y reloj, sin botón) */}
            <SimulacroControl
              activo={activo}
              isDirectivo={esDirectivo}
              onChange={setActivo}
              sectors={sectors}
              mobile
            />

            {/* Formulario de incidencia */}
            <IncidentForm
              activo={activo}
              sectors={sectors}
              onSent={() => void recargar()}
            />

            {/* Últimas incidencias */}
            {reports.length > 0 && (
              <section className="m-section">
                <div className="m-section-head">
                  <h3 className="m-section-title">Últimas incidencias</h3>
                  <span className="m-count">{reports.length}</span>
                </div>

                <ul className="m-report-list">
                  {reports.slice(0, 3).map((r) => {
                    const tipo   = TIPO[r.tipo_incidencia] ?? TIPO.otro;
                    const estado = ESTADO_SECTOR[r.estado_sector];
                    return (
                      <li key={r.id_reporte} className={`m-report-row grav-${r.gravedad ?? 'informativa'}`}>
                        <div className={`m-report-icon ${TIPO[r.tipo_incidencia] ? r.tipo_incidencia : 'otro'}`}>
                          <IncidentIcon type={tipo.icon} />
                        </div>
                        <div className="m-report-info">
                          <strong>{tipo.label}</strong>
                          <span>{nameOf(r.sector)}</span>
                        </div>
                        <div className="m-report-meta">
                          <time>
                            {new Date(r.fecha_reporte).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                          </time>
                          {estado && <em className={`m-chip ${estado.tone}`}>{estado.label}</em>}
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <button className="m-ver-todas" onClick={() => setTab('estado')}>
                  Ver todas <ChevronRight size={16} />
                </button>
              </section>
            )}
          </>
        )}

        {/* ── TAB ESTADO ── */}
        {tab === 'estado' && <EstadoEnVivo activo={activo} compact />}

        {/* ── TAB DASHBOARD ── */}
        {tab === 'dashboard' && <DashboardMetrics reports={reports} sectorCount={sectors.length} loading={cargandoIncidencias} />}

        {/* ── TAB HISTORIAL ── */}
        {tab === 'historial' && <Historial items={history} loading={cargandoHistorial} />}

        {/* ── TAB MÁS ── */}
        {tab === 'mas' && (
          <div className="m-more">
            <section className="m-profile">
              <div className="m-more-avatar">{usuario?.nombre?.[0]?.toUpperCase()}</div>
              <div className="m-profile-info">
                <strong>{usuario?.nombre}</strong>
                <em className={`m-role ${usuario?.rol ?? ''}`}>{esDirectivo ? 'Directivo' : 'Docente'}</em>
              </div>
            </section>

            <button className={`m-logout ${confirmaSalida ? 'confirm' : ''}`} onClick={pedirSalida}>
              <LogOut size={18} />
              {confirmaSalida ? 'Tocá de nuevo para salir' : 'Cerrar sesión'}
            </button>

            {esDirectivo && <Usuarios />}
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
