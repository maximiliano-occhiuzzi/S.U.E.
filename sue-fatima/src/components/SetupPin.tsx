import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function SetupPin({ onDone }: { onDone: () => void }) {
  const { usuario } = useAuth();
  const [paso,       setPaso]       = useState<'ingresar' | 'confirmar'>('ingresar');
  const [pin,        setPin]        = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [error,      setError]      = useState('');
  const [guardando,  setGuardando]  = useState(false);
  const [sacudiendo, setSacudiendo] = useState(false);

  const pinActual = paso === 'ingresar' ? pin : pinConfirm;
  const setPinActual = paso === 'ingresar' ? setPin : setPinConfirm;

  const handleDigito = (d: string) => {
    if (guardando || pinActual.length >= 4) return;
    const nuevo = pinActual + d;
    setPinActual(nuevo);

    if (nuevo.length === 4) {
      if (paso === 'ingresar') {
        setTimeout(() => { setPaso('confirmar'); }, 300);
      } else {
        confirmar(nuevo);
      }
    }
  };

  const handleBorrar = () => {
    if (!guardando) setPinActual(p => p.slice(0, -1));
  };

  const confirmar = async (confirmado: string) => {
    if (confirmado !== pin) {
      setSacudiendo(true);
      setTimeout(() => setSacudiendo(false), 500);
      setError('Los PINs no coinciden. Intentá de nuevo.');
      setPinConfirm('');
      setPaso('ingresar');
      setPin('');
      return;
    }
    setGuardando(true);
    try {
      await api.post('/api/auth/set-pin', { pin });
      onDone();
    } catch {
      setError('Error al guardar el PIN. Intentá de nuevo.');
      setPinConfirm('');
      setPaso('ingresar');
      setPin('');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#0f172a',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif', gap: '0.75rem',
    }}>
      <p style={{ color: '#f59e0b', fontSize: 24, fontWeight: 700, letterSpacing: 2, margin: 0 }}>S.U.E.</p>

      <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e', marginBottom: 4 }}>
        <ShieldCheck size={24} />
      </div>

      <p style={{ color: '#cbd5e1', fontSize: 14, fontWeight: 500, margin: 0 }}>{usuario?.nombre}</p>
      <p style={{ color: '#f59e0b', fontSize: 13, fontWeight: 600, margin: 0 }}>
        {paso === 'ingresar' ? 'Configurá tu PIN de seguridad' : 'Confirmá tu PIN'}
      </p>
      <p style={{ color: '#475569', fontSize: 12, margin: 0, textAlign: 'center', maxWidth: 260 }}>
        {paso === 'ingresar'
          ? 'Vas a usar este PIN cada vez que entrés a la app'
          : 'Ingresá el mismo PIN para confirmar'}
      </p>

      {/* Indicador de paso */}
      <div style={{ display: 'flex', gap: 8, margin: '0.5rem 0' }}>
        {['ingresar', 'confirmar'].map(p => (
          <div key={p} style={{ width: 8, height: 8, borderRadius: '50%', background: paso === p ? '#f59e0b' : '#334155' }} />
        ))}
      </div>

      {/* Puntos del PIN */}
      <div style={{
        display: 'flex', gap: 16, margin: '0.5rem 0',
        animation: sacudiendo ? 'shake 0.5s ease' : 'none',
      }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            width: 14, height: 14, borderRadius: '50%',
            background: i < pinActual.length ? '#f59e0b' : 'transparent',
            border: `2px solid ${i < pinActual.length ? '#f59e0b' : '#334155'}`,
            transition: 'all 0.15s',
          }} />
        ))}
      </div>

      {error ? (
        <p style={{ color: '#f87171', fontSize: 12, margin: '0 0 0.5rem', textAlign: 'center', maxWidth: 240 }}>{error}</p>
      ) : (
        <div style={{ height: 20, marginBottom: '0.5rem' }} />
      )}

      {/* Teclado */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <Tecla key={n} label={String(n)} onClick={() => handleDigito(String(n))} />
        ))}
        <div />
        <Tecla label="0" onClick={() => handleDigito('0')} />
        <Tecla label="⌫" onClick={handleBorrar} secundaria />
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-8px); }
          80% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}

function Tecla({ label, onClick, secundaria }: { label: string; onClick: () => void; secundaria?: boolean }) {
  const [presionado, setPresionado] = useState(false);
  return (
    <button onClick={onClick} onPointerDown={() => setPresionado(true)} onPointerUp={() => setPresionado(false)} onPointerLeave={() => setPresionado(false)}
      style={{
        width: 70, height: 70, borderRadius: '50%',
        background: presionado ? (secundaria ? '#1e293b' : '#1e3a5f') : (secundaria ? 'transparent' : '#1e293b'),
        border: secundaria ? 'none' : '1px solid #334155',
        color: secundaria ? '#64748b' : '#e2e8f0',
        fontSize: secundaria ? 20 : 22, fontWeight: 600, cursor: 'pointer',
        transition: 'background 0.1s', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
      {label}
    </button>
  );
}