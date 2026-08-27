import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Mobile from '@/pages/Mobile';

function Protected() {
  const { usuario, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="loading-screen"><span className="spinner" />Cargando S.U.E.</div>;
  return usuario ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
}

function App() {
  return <Routes>
    <Route path="/login" element={<Login />} />
    <Route element={<Protected />}>
      <Route path="/" element={<Dashboard />} />
      <Route path="/mobile" element={<Mobile />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}

export default App;
