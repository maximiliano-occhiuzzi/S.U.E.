import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import Sidebar, { Topbar } from '@/components/Sidebar';
import SimulacroControl, { type ActiveSimulacro } from '@/components/SimulacroControl';
import { useSimulacroActivo } from '@/hooks/useSimulacroActivo';
import { useIncidencias } from '@/hooks/useIncidencias';
import { useHistorial } from '@/hooks/useHistorial';
import { useCatalogo } from '@/hooks/useCatalogo';
import EstadoEnVivo from '@/components/EstadoEnVivo';
import AvisoEvacuacion from '@/components/AvisoEvacuacion';
import DashboardMetrics from '@/components/DashboardMetrics';
import Historial from '@/components/Historial';
import Usuarios from '@/components/Usuarios';
import Catalogo from '@/components/Catalogo';
import Perfil from '@/components/Perfil';
import { useFoto } from '@/hooks/useFoto';

const SECTIONS: Record<string, string> = {
  inicio:    'Inicio / Operación',
  estado:    'Estado en vivo',
  dashboard: 'Dashboard',
  historial: 'Historial',
};

export default function Dashboard() {
  const { usuario } = useAuth();
  const [active,     setActive]     = useState('inicio');
  useFoto(usuario?.id_usuario);
  // Estado del simulacro sincronizado con el servidor (canal en vivo + respaldo por polling),
  // para que lo que haga otro usuario/dispositivo se vea acá sin recargar.
  const { activo, setActivo } = useSimulacroActivo();
  // Sectores y tipos de incidencia: los administra la dirección y se actualizan solos.
  const { sectores: sectors } = useCatalogo();
  const [menu,       setMenu]       = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Incidencias del simulacro activo y el historial: se mantienen al día solos
  // y avisan cuándo están cargando por primera vez (para mostrar el efecto de carga).
  const { reports, cargando: cargandoIncidencias } = useIncidencias(activo, refreshKey);
  const { items: history, cargando: cargandoHistorial } = useHistorial(active === 'historial');

  const isDirectivo = usuario?.rol === 'directivo';
  const sections = isDirectivo ? { ...SECTIONS, usuarios: 'Usuarios', catalogo: 'Sectores e incidentes' } : SECTIONS;

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
        <Topbar activo={activo} onProfile={() => setActive('perfil')} />

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

          {active === 'perfil' && (
            <div className="perfil-desktop"><Perfil /></div>
          )}

          {active === 'catalogo' && isDirectivo && (
            <Catalogo />
          )}
        </div>
      </main>
    </div>
  );
}
