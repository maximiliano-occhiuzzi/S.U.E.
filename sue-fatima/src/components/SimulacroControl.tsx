import {
  AlertTriangle,
  Building2,
  ChevronDown,
  CircleStop,
  Cloud,
  Droplets,
  Flame,
  FlaskConical,
  HeartPulse,
  Lock,
  MoreHorizontal,
  Play,
  Send,
  ShieldAlert,
  TriangleAlert,
  UserRound,
  Wind,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '@/services/api';
import { ahoraServidor } from '@/services/clock';
import { REFRESH_EVENT } from '@/hooks/useSimulacroActivo';
import { useCatalogo } from '@/hooks/useCatalogo';

export type ActiveSimulacro = { id_simulacro: number; fecha_inicio: string; observaciones?: string } | null;

export type Sector = { id_sector: number; nombre: string };

type Props = {
  activo: ActiveSimulacro;
  isDirectivo: boolean;
  onChange: (simulacro: ActiveSimulacro) => void;
  sectors: Sector[];
  mobile?: boolean;
};

export function useElapsed(start?: string) {
  // Hora según el SERVIDOR (no la del dispositivo): así todos los dispositivos muestran el mismo
  // tiempo y el cronómetro no queda en 00:00:00 si el reloj del celu/PC va atrasado.
  const [now, setNow] = useState(ahoraServidor);
  useEffect(() => {
    if (!start) return;
    setNow(ahoraServidor());
    // 250 ms: el segundo cambia casi a la vez en todos los dispositivos (con 1000 ms podía atrasar hasta 1 s)
    const timer = window.setInterval(() => setNow(ahoraServidor()), 250);
    return () => window.clearInterval(timer);
  }, [start]);
  if (!start) return '00:00:00';
  const seconds = Math.max(0, Math.floor((now - new Date(start).getTime()) / 1000));
  return [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}

export default function SimulacroControl({ activo, isDirectivo, onChange, sectors, mobile = false }: Props) {
  const [observaciones, setObservaciones] = useState('');
  const [busy, setBusy] = useState(false);
  const elapsed = useElapsed(activo?.fecha_inicio);

  const handleAction = async () => {
    setBusy(true);
    try {
      if (activo) {
        try {
          await api.put(`/api/simulacros/${activo.id_simulacro}/finalizar`);
        } catch (err: any) {
          // Si otro usuario ya lo finalizó (404/409), igual sincronizamos a "sin simulacro".
          const status = err?.response?.status;
          if (status !== 404 && status !== 409) throw err;
        }
        onChange(null);
      } else {
        let data: { id_simulacro: number; fecha_inicio: string };
        try {
          ({ data } = await api.post('/api/simulacros/iniciar', { observaciones }));
        } catch (err: any) {
          // 409: otro usuario ya inició uno al mismo tiempo. No es un error para quien tocó INICIAR:
          // se sincroniza y pasa a ver el simulacro activo.
          if (err?.response?.status === 409) {
            window.dispatchEvent(new Event(REFRESH_EVENT));
            return;
          }
          throw err;
        }
        onChange({
  id_simulacro: data.id_simulacro,
  fecha_inicio: data.fecha_inicio,
  observaciones: observaciones,
});
        setObservaciones('');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={`panel operation-panel full ${mobile ? 'mobile-operation' : ''}`}>
      {!mobile && (
        <PanelHeading
          number="1"
          title="Inicio / Operación"
          subtitle="Iniciar simulacro y reportar incidencias rápidamente."
          color="blue"
        />
      )}

      <div className="operation-content">
        <div className="operation-state">
          <div className="eyebrow">SIMULACRO</div>
          <div className={`state-label ${activo ? 'is-active' : ''}`}>
            <i /> {activo ? 'ACTIVO' : 'SIN SIMULACRO'}
          </div>
          <div className="timer">{elapsed}</div>
        </div>

        {isDirectivo && (
          <button className={`action-circle ${activo ? 'stop' : 'start'}`} onClick={() => void handleAction()} disabled={busy}>
            <span>{activo ? <CircleStop size={34} /> : <Play size={34} fill="currentColor" />}</span>
            {activo ? 'FINALIZAR' : 'INICIAR'}
          </button>
        )}
      </div>

      {isDirectivo && !activo && (
        <label className="field-label operation-note">
          Observaciones del simulacro
          <textarea
            value={observaciones}
            onChange={(event) => setObservaciones(event.target.value)}
            placeholder="Agrega una observación opcional..."
            rows={2}
          />
        </label>
      )}

{!mobile && activo && <IncidentForm activo={activo} sectors={sectors} onSent={() => undefined} />}  </section>
  );
}

export function IncidentForm({
  sectors,
  activo,
  onSent,
}: {
  sectors: Sector[];
  activo: ActiveSimulacro;
  onSent: () => void;
}) {
  // Los tipos de incidencia los administra la dirección: llegan del servidor y se actualizan solos.
  const { tipos } = useCatalogo();
  const [type, setType] = useState('');
  const [sector, setSector] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

 const send = async () => {
  if (!activo || !type || !sector) return;
  setBusy(true);
  try {
    await api.post('/api/incidencias', {
      id_simulacro: activo.id_simulacro,
      id_sector: Number(sector),
      estado_sector: 'en_proceso',
      tipo_incidencia: type,
    });
    setType('');
    setSector('');
    setSent(true);
    onSent();
    window.setTimeout(() => setSent(false), 2500);
  } finally {
    setBusy(false);
  }
};

  return (
    <div className="incident-form">
      <h3>¿Qué sucede?</h3>

      <div className="incident-buttons">
        {tipos.map((item) => (
          <button
            key={item.codigo}
            className={`incident-button ${item.color} ${type === item.codigo ? 'selected' : ''}`}
            onClick={() => setType(item.codigo)}
          >
            <IncidentIcon type={item.icono} />
            <span>{item.nombre}</span>
          </button>
        ))}
      </div>

      <label className="field-label sector-field">
        SECTOR
        <div className="select-shell">
          <Building2 size={18} />
          <select value={sector} onChange={(event) => setSector(event.target.value)}>
            <option value="">Selecciona un sector</option>
            {sectors.map((item) => (
              <option key={item.id_sector} value={item.id_sector}>
                {item.nombre}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="select-chevron" />
        </div>
      </label>

      <button className="send-button" onClick={() => void send()} disabled={!activo || !type || !sector || busy}>
        <Send size={17} /> {sent ? 'INCIDENCIA ENVIADA' : 'ENVIAR INCIDENCIA'}
      </button>

      {!activo && (
        <div className="form-hint">
          <AlertTriangle size={16} /> No hay un simulacro activo para reportar.
        </div>
      )}
    </div>
  );
}

export function IncidentIcon({ type }: { type: string }) {
  const props = { size: 26, strokeWidth: 2 };
  if (type === 'flame') return <Flame {...props} />;
  if (type === 'cloud') return <Cloud {...props} />;
  if (type === 'barrier') return <ShieldAlert {...props} />;
  if (type === 'person') return <UserRound {...props} />;
  if (type === 'zap') return <Zap {...props} />;
  if (type === 'droplet') return <Droplets {...props} />;
  if (type === 'wind') return <Wind {...props} />;
  if (type === 'alert') return <TriangleAlert {...props} />;
  if (type === 'heart') return <HeartPulse {...props} />;
  if (type === 'lock') return <Lock {...props} />;
  if (type === 'flask') return <FlaskConical {...props} />;
  return <MoreHorizontal {...props} />;
}

export function PanelHeading({
  number,
  title,
  subtitle,
  color,
}: {
  number: string;
  title: string;
  subtitle: string;
  color: string;
}) {
  return (
    <div className="panel-heading">
      <div className={`section-number ${color}`}>{number}</div>
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}