import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/context/AuthContext';
import Login from '@/pages/Login';
import StatusOverlay from '@/components/StatusOverlay';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useRealtime } from '@/hooks/useRealtime';
import ResumenFinal from '@/components/ResumenFinal';

// Lazy: solo se descargan cuando hacen falta (despues del login), asi la
// pantalla de login aparece de inmediato sin esperar el bundle del Dashboard.
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Mobile    = lazy(() => import('@/pages/Mobile'));
const PinLock   = lazy(() => import('@/components/PinLock'));
const SetupPin  = lazy(() => import('@/components/SetupPin'));

const PIN_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos sin actividad -> pide PIN

function ScreenLoader() {
  return (
    <div className="loading-screen">
      <span className="spinner" />Cargando S.U.E.
    </div>
  );
}

function Protected() {
  const { usuario, loading } = useAuth();
  const location = useLocation();

  const [desbloqueado,   setDesbloqueado]   = useState(false);
  const [pinConfigurado, setPinConfigurado] = useState(false);
  const [ultimaAct,      setUltimaAct]      = useState(Date.now());

  useEffect(() => {
    if (usuario) {
      setPinConfigurado(!!usuario.tiene_pin);
      setDesbloqueado(!usuario.tiene_pin);
    }
  }, [usuario]);

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

  // Bloquear al volver de background — inmediato, no espera a los 5 minutos.
  // Es justamente el caso que pediste: minimizar/cerrar la app siempre pide PIN de nuevo.
  const estabaOculto = useRef(false);
  useEffect(() => {
    const handler = () => {
      if (document.hidden) {
        estabaOculto.current = true;
        return;
      }
      if (estabaOculto.current && pinConfigurado) {
        setDesbloqueado(false);
      }
      estabaOculto.current = false;
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [pinConfigurado]);

  if (loading) return <ScreenLoader />;

  if (!usuario) return <Navigate to="/login" replace state={{ from: location }} />;

  if (!pinConfigurado) {
    return (
      <SetupPin onDone={() => {
        setPinConfigurado(true);
        setDesbloqueado(true);
        setUltimaAct(Date.now());
      }} />
    );
  }

  if (!desbloqueado) {
    return (
      <PinLock onUnlock={() => {
        setDesbloqueado(true);
        setUltimaAct(Date.now());
      }} />
    );
  }

  return (
    <>
      <Outlet />
      {/* Aviso de cierre ("evacuación exitosa") para todos los usuarios con sesión y PIN desbloqueado */}
      <ResumenFinal />
    </>
  );
}

function InicioSegunPlataforma() {
  // La app instalada (Capacitor) siempre usa la versión con pestañas abajo,
  // pensada para celular. El navegador de escritorio sigue viendo el Dashboard.
  return Capacitor.isNativePlatform() ? <Mobile /> : <Dashboard />;
}

function App() {
  const { logoutPhase } = useAuth();
  usePushNotifications();
  useRealtime(); // canal en vivo: cambios al instante + docentes conectados

  return (
    <>
      <Suspense fallback={<ScreenLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Protected />}>
            <Route path="/"       element={<InicioSegunPlataforma />} />
            <Route path="/mobile" element={<Mobile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      <StatusOverlay
        show={logoutPhase !== 'idle'}
        phase={logoutPhase === 'loading' ? 'loading' : 'success'}
        title="Cerrando sesión"
        subtitle={logoutPhase === 'loading' ? 'Espere por favor...' : 'Ha cerrado sesión'}
      />
    </>
  );
}

export default App;