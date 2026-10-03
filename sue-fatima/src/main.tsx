import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from '@/context/AuthContext';
import './index.css';

// Si un chunk lazy (Dashboard, Mobile, PinLock, SetupPin) no se puede
// descargar porque el navegador tiene en caché un index.html viejo que
// apunta a un archivo con hash que ya no existe, recargamos la página
// una sola vez en vez de mostrar la pantalla en blanco / error.
window.addEventListener('vite:preloadError', () => {
  const yaRecargo = sessionStorage.getItem('sue-reload-once');
  if (!yaRecargo) {
    sessionStorage.setItem('sue-reload-once', '1');
    window.location.reload();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider><App /></AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);