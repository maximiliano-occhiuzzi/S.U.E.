import { useState } from 'react';
import { Activity, AlertTriangle, BarChart3, ChevronLeft, ChevronRight, ClipboardList, House, MapPin, MoreHorizontal, ShieldCheck, Users, type LucideIcon } from 'lucide-react';
import api from '@/services/api';
import { useSimulacroActivo } from '@/hooks/useSimulacroActivo';
import { useIncidencias } from '@/hooks/useIncidencias';
import { useHistorial } from '@/hooks/useHistorial';
import { useCatalogo } from '@/hooks/useCatalogo';
import { useAuth } from '@/context/AuthContext';
import SimulacroControl, { IncidentForm, IncidentIcon } from '@/components/SimulacroControl';
import EstadoEnVivo from '@/components/EstadoEnVivo';
import AvisoEvacuacion from '@/components/AvisoEvacuacion';
import DashboardMetrics from '@/components/DashboardMetrics';
import Historial from '@/components/Historial';
import Usuarios from '@/components/Usuarios';
import Catalogo from '@/components/Catalogo';
import CampanaAvisos from '@/components/CampanaAvisos';
import Perfil from '@/components/Perfil';
import Avatar from '@/components/Avatar';
import { useFoto } from '@/hooks/useFoto';

// `sector` puede venir como string o como objeto { nombre }; renderizarlo
// directo ({r.sector}) rompe la vista si llega como objeto.
const nameOf = (value?: string | { nombre: string }) =>
  typeof value === 'string' ? value : (value?.nombre ?? '—');

const NAV = [
  { id: 'inicio',    label: 'Inicio',    Icon: House         },
  { id: 'estado',    label: 'Estado',    Icon: Activity      },
  { id: 'dashboard', label: 'Dashboard', Icon: BarChart3     },
  { id: 'mas',       label: 'Más',       Icon: MoreHorizontal},
  { id: 'perfil',    label: 'Perfil',    Icon: null          },
] as { id: string; label: string; Icon: LucideIcon | null }[];

// Opciones de la pestaña "Más". `soloDirectivo`: las pantallas de administración.
const MAS: { id: string; label: string; desc: string; Icon: LucideIcon; soloDirectivo?: boolean }[] = [
  { id: 'historial', label: 'Historial',  desc: 'Simulacros y emergencias anteriores', Icon: ClipboardList },
  { id: 'usuarios',  label: 'Usuarios',   desc: 'Altas, bajas y contraseñas',          Icon: Users,         soloDirectivo: true },
  { id: 'tipos',     label: 'Incidencias', desc: 'Tipos de incidencia que se pueden reportar', Icon: AlertTriangle, soloDirectivo: true },
  { id: 'sectores',  label: 'Sectores',   desc: 'Aulas y espacios de la institución',  Icon: MapPin,        soloDirectivo: true },
];

const ESTADO_SECTOR: Record<string, { label: string; tone: string }> = {
  peligro:     { label: 'Peligro',    tone: 'red'   },
  en_proceso:  { label: 'En proceso', tone: 'amber' },
  evacuado_ok: { label: 'Evacuado',   tone: 'green' },
};

export default function Mobile() {
  const { usuario } = useAuth();
  const [tab,     setTab]     = useState('inicio');
  const [sub,     setSub]     = useState<string | null>(null); // pantalla abierta dentro de "Más"
  useFoto(usuario?.id_usuario);
  // Estado del simulacro sincronizado con el servidor (canal en vivo + respaldo por polling).
  const { activo, setActivo } = useSimulacroActivo();
  // Sectores y tipos de incidencia: los administra la dirección y se actualizan solos.
  const { sectores: sectors, meta: metaTipo } = useCatalogo();
  // Incidencias del simulacro activo y el historial: se mantienen al día solos y avisan cuándo
  // están cargando por primera vez (para mostrar el efecto de carga).
  const { reports, cargando: cargandoIncidencias, recargar } = useIncidencias(activo);
  const { items: history, cargando: cargandoHistorial } = useHistorial(tab === 'mas' && sub === 'historial');
  const esDirectivo = usuario?.rol === 'directivo';
  const opciones = MAS.filter((o) => esDirectivo || !o.soloDirectivo);
  const abierta = opciones.find((o) => o.id === sub) ?? null;
  const irA = (id: string) => { setTab(id); if (id === 'mas') setSub(null); };

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
        <CampanaAvisos className="mobile-header-btn" size={20} color="white" />
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
                    const tipo   = metaTipo(r.tipo_incidencia);
                    const estado = ESTADO_SECTOR[r.estado_sector];
                    return (
                      <li key={r.id_reporte} className={`m-report-row grav-${r.gravedad ?? 'informativa'}`}>
                        <div className={`m-report-icon ${tipo.color}`}>
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

        {/* ── TAB MÁS ── */}
        {tab === 'mas' && !abierta && (
          <div className="m-menu-list">
            {opciones.map(({ id, label, desc, Icon }) => (
              <button key={id} className="m-menu-item" onClick={() => setSub(id)}>
                <span className="m-menu-ico"><Icon size={22} /></span>
                <span className="m-menu-txt"><strong>{label}</strong><small>{desc}</small></span>
                <ChevronRight size={18} className="m-menu-arrow" />
              </button>
            ))}
          </div>
        )}
        {tab === 'mas' && abierta && (
          <>
            <button className="m-back" onClick={() => setSub(null)}>
              <ChevronLeft size={18} /> Más <b>/ {abierta.label}</b>
            </button>
            {abierta.id === 'historial' && <Historial items={history} loading={cargandoHistorial} />}
            {abierta.id === 'usuarios'  && <Usuarios />}
            {abierta.id === 'tipos'     && <Catalogo parte="tipos" />}
            {abierta.id === 'sectores'  && <Catalogo parte="sectores" />}
          </>
        )}

        {/* ── TAB PERFIL ── */}
        {tab === 'perfil' && <Perfil />}
      </main>

      {/* Bottom nav */}
      <nav className="bottom-tabs">
        {NAV.map(({ id, label, Icon }) => (
          <button key={id} className={tab === id ? 'active' : ''} onClick={() => irA(id)}>
            {Icon ? <Icon size={22} /> : <Avatar nombre={usuario?.nombre} size={22} className={tab === id ? 'ring' : ''} />}
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
