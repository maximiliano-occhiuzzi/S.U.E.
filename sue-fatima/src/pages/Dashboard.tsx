import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import Sidebar, { Topbar } from '@/components/Sidebar';
import SimulacroControl, { type ActiveSimulacro } from '@/components/SimulacroControl';
import EstadoEnVivo from '@/components/EstadoEnVivo';
import DashboardMetrics from '@/components/DashboardMetrics';
import Historial, { type Simulacro } from '@/components/Historial';
import type { Report } from '@/components/EstadoEnVivo';

const SECTIONS: Record<string, string> = {
  inicio:    'Inicio / Operación',
  estado:    'Estado en vivo',
  dashboard: 'Dashboard',
  historial: 'Historial',
};

export default function Dashboard() {
  const { usuario } = useAuth();
  const [active,     setActive]     = useState('inicio');
  const [activo,     setActivo]     = useState<ActiveSimulacro>(null);
  const [sectors,    setSectors]    = useState<{ id_sector: number; nombre: string }[]>([]);
  const [reports,    setReports]    = useState<Report[]>([]);
  const [history,    setHistory]    = useState<Simulacro[]>([]);
  const [menu,       setMenu]       = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const isDirectivo = usuario?.rol === 'directivo';

  // Cargar simulacro activo y sectores al montar
  useEffect(() => {
    api.get('/api/simulacros/activo')
      .then(({ data }) => setActivo(data?.simulacro ?? null))
      .catch(() => undefined);

    api.get('/api/incidencias/sectores')
      .then(({ data }) => setSectors(data?.sectores ?? []))
      .catch(() => undefined);

    api.get('/api/simulacros/historial')
      .then(({ data }) => setHistory(data?.simulacros ?? []))
      .catch(() => undefined);
  }, []);

  // Cargar incidencias cuando hay simulacro activo
  useEffect(() => {
    if (!activo) { setReports([]); return; }

    const load = () =>
      api.get(`/api/incidencias/${activo.id_simulacro}`)
        .then(({ data }) => setReports(data?.incidencias ?? []))
        .catch(() => undefined);

    load();
    const timer = window.setInterval(load, 10000);
    return () => window.clearInterval(timer);
  }, [activo, refreshKey]);

  const goTo = (key: string) => { setActive(key); setMenu(false); };

  const finalizarSimulacro = async () => {
    if (!activo) return;
    await api.put(`/api/simulacros/${activo.id_simulacro}/finalizar`);
    setActivo(null);
    setReports([]);
    api.get('/api/simulacros/historial')
      .then(({ data }) => setHistory(data?.simulacros ?? []))
      .catch(() => undefined);
  };

  const handleSimulacroChange = (value: ActiveSimulacro) => {
    setActivo(value);
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="app-shell">
      <Sidebar
        active={active}
        onNavigate={setActive}
        activo={activo}
        isDirectivo={isDirectivo}
        onFinalize={finalizarSimulacro}
      />
      <main className="main-area">
        <Topbar activo={activo} />

        <button className="mobile-menu" onClick={() => setMenu(o => !o)}>
          <Menu size={20} />
        </button>

        {menu && (
          <div className="mobile-menu-pop">
            {Object.entries(SECTIONS).map(([key, label]) => (
              <button key={key} onClick={() => goTo(key)}>{label}</button>
            ))}
          </div>
        )}

        <div className="desktop-grid">
          {active === 'inicio' && (
            <SimulacroControl
              activo={activo}
              isDirectivo={isDirectivo}
              onChange={handleSimulacroChange}
              sectors={sectors}
            />
          )}

          {active === 'estado' && (
            <EstadoEnVivo activo={activo} refreshKey={refreshKey} />
          )}

          {active === 'dashboard' && (
            <DashboardMetrics
              reports={reports}
              sectorCount={sectors.length}
            />
          )}

          {active === 'historial' && (
            <Historial items={history} />
          )}
        </div>
      </main>
    </div>
  );
}