import { useState, useEffect } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Login     from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Mobile    from '@/pages/Mobile';
import PinLock   from '@/components/PinLock';
import SetupPin  from '@/components/SetupPin';

const PIN_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos sin actividad → pide PIN

function Protected() {
  const { usuario, loading } = useAuth();
  const location = useLocation();

  const [desbloqueado,   setDesbloqueado]   = useState(false);
  const [pinConfigurado, setPinConfigurado] = useState(false);
  const [ultimaAct,      setUltimaAct]      = useState(Date.now());

  // Detectar si el usuario tiene PIN configurado
  useEffect(() => {
    if (usuario) {
      setPinConfigurado(!!usuario.tiene_pin);
      // Si no tiene PIN → setup; si tiene → bloquear hasta verificar
      setDesbloqueado(!usuario.tiene_pin);
    }
  }, [usuario]);

  // Timer de inactividad
  useEffect(() => {
    if (!desbloqueado || !pinConfigurado) return;
    const eventos = ['mousemove', 'keydown', 'pointerdown', 'touchstart', 'scroll'];
    const reset = () => setUltimaAct(Date.now());
    eventos.forEach(e => window.addEventListener(e, reset, { passive: true }));

    const interval = setInterval(() => {
      if (Date.now() - ultimaAct > PIN_TIMEOUT_MS) {
        setDesbloqueado(false);
      }
    }, 30000);

    return () => {
      eventos.forEach(e => window.removeEventListener(e, reset));
      clearInterval(interval);
    };
  }, [desbloqueado, pinConfigurado, ultimaAct]);

  // Bloquear al volver de background
  useEffect(() => {
    const handler = () => {
      if (!document.hidden) return;
      if (pinConfigurado && desbloqueado) {
        const inactivo = Date.now() - ultimaAct;
        if (inactivo > PIN_TIMEOUT_MS) setDesbloqueado(false);
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [pinConfigurado, desbloqueado, ultimaAct]);

  if (loading) return (
    <div className="loading-screen">
      <span className="spinner" />Cargando S.U.E.
    </div>
  );

  if (!usuario) return <Navigate to="/login" replace state={{ from: location }} />;

  // Primera vez → configurar PIN
  if (!pinConfigurado) {
    return (
      <SetupPin onDone={() => {
        setPinConfigurado(true);
        setDesbloqueado(true);
        setUltimaAct(Date.now());
      }} />
    );
  }

  // Tiene PIN pero está bloqueado → verificar
  if (!desbloqueado) {
    return (
      <PinLock onUnlock={() => {
        setDesbloqueado(true);
        setUltimaAct(Date.now());
      }} />
    );
  }

  return <Outlet />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protected />}>
        <Route path="/"       element={<Dashboard />} />
        <Route path="/mobile" element={<Mobile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;