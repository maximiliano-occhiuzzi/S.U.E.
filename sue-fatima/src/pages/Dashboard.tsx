import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import Sidebar, { Topbar } from '@/components/Sidebar';
import SimulacroControl, { type ActiveSimulacro } from '@/components/SimulacroControl';
import { useSimulacroActivo } from '@/hooks/useSimulacroActivo';
import { useIncidencias } from '@/hooks/useIncidencias';
import { useHistorial } from '@/hooks/useHistorial';
import EstadoEnVivo from '@/components/EstadoEnVivo';
import AvisoEvacuacion from '@/components/AvisoEvacuacion';
import DashboardMetrics from '@/components/DashboardMetrics';
import Historial from '@/components/Historial';
import Usuarios from '@/components/Usuarios';

const SECTIONS: Record<string, string> = {
  inicio:    'Inicio / Operación',
  estado:    'Estado en vivo',
  dashboard: 'Dashboard',
  historial: 'Historial',
};

export default function Dashboard() {
  const { usuario } = useAuth();
  const [active,     setActive]     = useState('inicio');
  // Estado del simulacro sincronizado con el servidor (canal en vivo + respaldo por polling),
  // para que lo que haga otro usuario/dispositivo se vea acá sin recargar.
  const { activo, setActivo } = useSimulacroActivo();
  const [sectors,    setSectors]    = useState<{ id_sector: number; nombre: string }[]>([]);
  const [menu,       setMenu]       = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Incidencias del simulacro activo y el historial: se mantienen al día solos
  // y avisan cuándo están cargando por primera vez (para mostrar el efecto de carga).
  const { reports, cargando: cargandoIncidencias } = useIncidencias(activo, refreshKey);
  const { items: history, cargando: cargandoHistorial } = useHistorial(active === 'historial');

  const isDirectivo = usuario?.rol === 'directivo';
  const sections = isDirectivo ? { ...SECTIONS, usuarios: 'Usuarios' } : SECTIONS;

  // Los sectores casi no cambian: se piden una sola vez
  useEffect(() => {
    api.get('/api/incidencias/sectores')
      .then(({ data }) => setSectors(data?.sectores ?? []))
      .catch(() => undefined);
  }, []);

  const goTo = (key: string) => { setActive(key); setMenu(false); };

  const finalizarSimulacro = async () => {
    if (!activo) return;
    try {
      await api.put(`/api/simulacros/${activo.id_simulacro}/finalizar`);
    } catch (err: any) {
      // Si otro usuario ya lo finalizó (404/409), igual limpiamos el estado local.
      const status = err?.response?.status;
      if (status !== 404 && status !== 409) throw err;
    }
    // El historial se actualiza solo (evento en vivo / al abrir la pestaña).
    setActivo(null);
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
            {Object.entries(sections).map(([key, label]) => (
              <button key={key} onClick={() => goTo(key)}>{label}</button>
            ))}
          </div>
        )}

        <div className="desktop-grid">
          {activo && !isDirectivo && <AvisoEvacuacion />}

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
              loading={cargandoIncidencias}
            />
          )}

          {active === 'historial' && (
            <Historial items={history} loading={cargandoHistorial} />
          )}

          {active === 'usuarios' && isDirectivo && (
            <Usuarios />
          )}
        </div>
      </main>
    </div>
  );
}
