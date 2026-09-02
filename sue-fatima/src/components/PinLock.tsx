import { useState, useEffect, useRef } from 'react';
import { LockKeyhole } from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';

const MAX_INTENTOS = 3;

export default function PinLock({ onUnlock }: { onUnlock: () => void }) {
  const { usuario, logout } = useAuth();
  const [pin,        setPin]        = useState('');
  const [error,      setError]      = useState('');
  const [intentos,   setIntentos]   = useState(0);
  const [verificando,setVerificando]= useState(false);
  const [sacudiendo, setSacudiendo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const verificar = async (valor: string) => {
    if (verificando) return;
    setVerificando(true);
    try {
      await api.post('/api/auth/verify-pin', { pin: valor });
      setPin('');
      setError('');
      onUnlock();
    } catch {
      const nuevosIntentos = intentos + 1;
      setIntentos(nuevosIntentos);
      setSacudiendo(true);
      setTimeout(() => setSacudiendo(false), 500);
      setPin('');

      if (nuevosIntentos >= MAX_INTENTOS) {
        setError('Demasiados intentos incorrectos. Cerrando sesión...');
        setTimeout(() => logout(), 1500);
      } else {
        setError(`PIN incorrecto. Intentos restantes: ${MAX_INTENTOS - nuevosIntentos}`);
      }
    } finally {
      setVerificando(false);
    }
  };

  const handleDigito = (d: string) => {
    if (verificando || pin.length >= 4) return;
    const nuevo = pin + d;
    setPin(nuevo);
    if (nuevo.length === 4) verificar(nuevo);
  };

  const handleBorrar = () => {
    if (!verificando) setPin(p => p.slice(0, -1));
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#0f172a',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      gap: '0.75rem',
    }}>
      {/* Logo */}
      <p style={{ color: '#f59e0b', fontSize: 24, fontWeight: 700, letterSpacing: 2, margin: 0 }}>S.U.E.</p>

      {/* Ícono */}
      <div style={{
        width: 52, height: 52, borderRadius: '50%',
        background: '#1e293b', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        color: '#93c5fd', marginBottom: 4,
      }}>
        <LockKeyhole size={24} />
      </div>

      {/* Usuario */}
      <p style={{ color: '#cbd5e1', fontSize: 14, fontWeight: 500, margin: 0 }}>{usuario?.nombre}</p>
      <p style={{ color: '#475569', fontSize: 12, margin: 0 }}>Ingresá tu PIN para continuar</p>

      {/* Puntos del PIN */}
      <div style={{
        display: 'flex', gap: 16, margin: '1rem 0 0.5rem',
        animation: sacudiendo ? 'shake 0.5s ease' : 'none',
      }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            width: 14, height: 14, borderRadius: '50%',
            background: i < pin.length ? '#f59e0b' : 'transparent',
            border: `2px solid ${i < pin.length ? '#f59e0b' : '#334155'}`,
            transition: 'all 0.15s',
          }} />
        ))}
      </div>

      {/* Error */}
      {error ? (
        <p style={{ color: '#f87171', fontSize: 12, margin: '0 0 0.5rem', textAlign: 'center', maxWidth: 240 }}>
          {error}
        </p>
      ) : (
        <div style={{ height: 20, marginBottom: '0.5rem' }} />
      )}

      {/* Teclado numérico */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <Tecla key={n} label={String(n)} onClick={() => handleDigito(String(n))} />
        ))}
        <div />
        <Tecla label="0" onClick={() => handleDigito('0')} />
        <Tecla label="⌫" onClick={handleBorrar} secundaria />
      </div>

      {/* Input oculto para teclado físico */}
      <input
        ref={inputRef}
        type="password"
        inputMode="numeric"
        maxLength={4}
        value={pin}
        onChange={e => {
          const val = e.target.value.replace(/\D/g, '').slice(0, 4);
          setPin(val);
          if (val.length === 4) verificar(val);
        }}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 1, height: 1 }}
      />

      {/* Cerrar sesión */}
      <button
        onClick={() => void logout()}
        style={{
          marginTop: '1rem', background: 'transparent', border: 'none',
          color: '#475569', fontSize: 12, cursor: 'pointer', textDecoration: 'underline',
        }}
      >
        Cerrar sesión
      </button>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-8px); }
          40%      { transform: translateX(8px); }
          60%      { transform: translateX(-8px); }
          80%      { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}

function Tecla({ label, onClick, secundaria }: { label: string; onClick: () => void; secundaria?: boolean }) {
  const [presionado, setPresionado] = useState(false);
  return (
    <button
      onClick={onClick}
      onPointerDown={() => setPresionado(true)}
      onPointerUp={() => setPresionado(false)}
      onPointerLeave={() => setPresionado(false)}
      style={{
        width: 70, height: 70, borderRadius: '50%',
        background: presionado
          ? (secundaria ? '#1e293b' : '#1e3a5f')
          : (secundaria ? 'transparent' : '#1e293b'),
        border: secundaria ? 'none' : '1px solid #334155',
        color: secundaria ? '#64748b' : '#e2e8f0',
        fontSize: secundaria ? 20 : 22,
        fontWeight: 600, cursor: 'pointer',
        transition: 'background 0.1s',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {label}
    </button>
  );
}