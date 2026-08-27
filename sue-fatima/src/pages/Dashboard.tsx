import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import Sidebar, { Topbar } from '@/components/Sidebar';
import SimulacroControl, { type ActiveSimulacro } from '@/components/SimulacroControl';
import EstadoEnVivo from '@/components/EstadoEnVivo';

const SECTIONS: Record<string, string> = {
  inicio: 'Inicio / Operación',
  estado: 'Estado en vivo',
  dashboard: 'Dashboard',
  historial: 'Historial',
};

export default function Dashboard() {
  const { usuario } = useAuth();
  const [active, setActive] = useState('inicio');
  const [activo, setActivo] = useState<ActiveSimulacro>(null);
  const [sectors, setSectors] = useState<{ id_sector: number; nombre: string }[]>([]);
  const [menu, setMenu] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const isDirectivo = usuario?.rol === 'directivo';

  useEffect(() => {
    api
      .get('/api/simulacros/activo')
      .then(({ data }) => setActivo(data?.simulacro ?? null))
      .catch(() => undefined);
    api
      .get('/api/reportes/sectores')
      .then(({ data }) => setSectors(data?.sectores ?? []))
      .catch(() => undefined);
  }, []);

  const goTo = (key: string) => {
    setActive(key);
    setMenu(false);
  };

  const finalizarSimulacro = async () => {
    if (!activo) return;
    await api.put(`/api/simulacros/${activo.id_simulacro}/finalizar`);
    setActivo(null);
  };

  // Cuando cambia el simulacro activo (inicia o finaliza), forzamos que
  // EstadoEnVivo vuelva a pedir los reportes.
  const handleSimulacroChange = (value: ActiveSimulacro) => {
    setActivo(value);
    setRefreshKey((key) => key + 1);
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

        <button className="mobile-menu" onClick={() => setMenu((open) => !open)}>
          <Menu size={20} />
        </button>

        {menu && (
          <div className="mobile-menu-pop">
            {Object.entries(SECTIONS).map(([key, label]) => (
              <button key={key} onClick={() => goTo(key)}>
                {label}
              </button>
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

          {active !== 'inicio' && active !== 'estado' && (
            <div className="panel more-card full-span">
              <h2>{SECTIONS[active]}</h2>
              <p>Esta sección se está rediseñando y vuelve pronto.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}