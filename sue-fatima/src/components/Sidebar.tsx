import { Activity, BarChart3, Bell, ChevronDown, CircleHelp, CircleStop, ClipboardList, House, LogOut, Settings, ShieldCheck, UserRound, Users, Wifi } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { type ActiveSimulacro, useElapsed } from '@/components/SimulacroControl';

type Props = {
  active: string;
  onNavigate?: (value: string) => void;
  activo?: ActiveSimulacro;
  isDirectivo?: boolean;
  onFinalize?: () => void | Promise<void>;
};

const items = [
  { label: 'Inicio / Operación', icon: House, value: 'inicio' },
  { label: 'Estado en vivo', icon: Activity, value: 'estado' },
  { label: 'Dashboard', icon: BarChart3, value: 'dashboard' },
  { label: 'Historial', icon: ClipboardList, value: 'historial' },
];

export default function Sidebar({ active, onNavigate, activo = null, isDirectivo = false, onFinalize }: Props) {
  const { usuario, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="brand">
        <div>
          <div className="brand-title">S.U.E</div>
          <div className="brand-subtitle">
            Sistema de Unificación
            <br />
            de Emergencias
          </div>
        </div>
      </div>

      <div className="school">
        <div className="school-emblem">
          <ShieldCheck size={22} />
        </div>
        <span>
          Instituto Técnico
          <br />
          <strong>Nuestra Señora de Fátima</strong>
        </span>
      </div>

      <nav className="side-nav">
       {items.map(({ label, icon: Icon, value }) => (
  <button
    key={value}
    className={`side-link ${active === value ? 'active' : ''}`}
    onClick={() => onNavigate?.(value)}
  >
    <Icon size={18} />
    <span>{label}</span>
  </button>
))}
      </nav>

      <div className="side-extra">
        <button className="side-link">
          <Users size={18} />
          <span>Usuarios</span>
        </button>
        <button className="side-link">
          <Settings size={18} />
          <span>Configuración</span>
        </button>
        <button className="side-link">
          <CircleHelp size={18} />
          <span>Ayuda</span>
        </button>
      </div>

      <div className="sidebar-bottom">
        {isDirectivo && activo && onFinalize && (
          <button className="quick-finalize" onClick={() => void onFinalize()}>
            <CircleStop size={16} /> Finalizar simulacro
          </button>
        )}

        <div className="connection">
          <div className="connection-title">
            <Wifi size={14} /> Conexión MQTT
          </div>
          <div className="online">
            <i /> Conectado
          </div>
          <small>
            Broker: EMQX
            <br />
            Última actualización: {new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </small>
        </div>

        <button className="logout" onClick={() => void logout()}>
          <LogOut size={17} /> Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

export function Topbar({ activo = null }: { activo?: ActiveSimulacro }) {
  const { usuario } = useAuth();
  const elapsed = useElapsed(activo?.fecha_inicio);

  return (
    <header className="topbar">
      <div className="institution">
        <div className="crest">
          <ShieldCheck size={18} />
        </div>
        <span>
          Instituto Técnico
          <br />
          <strong>Nuestra Señora de Fátima</strong>
        </span>
      </div>

      <div className={`top-status ${activo ? 'is-active' : ''}`}>
        <i /> {activo ? 'SIMULACRO ACTIVO' : 'SIN SIMULACRO'} <strong>{elapsed}</strong>
      </div>

      <div className="top-actions">
        <button className="icon-button">
          <Bell size={19} />
          <b>3</b>
        </button>
        <div className="profile">
          <div className="avatar">
            <UserRound size={18} />
          </div>
          <span>
            <strong>{usuario?.nombre ?? 'Director'}</strong>
            <small>Rol: {usuario?.rol ?? 'Coordinador'}</small>
          </span>
          <ChevronDown size={16} className="chevron" />
        </div>
      </div>
    </header>
  );
}