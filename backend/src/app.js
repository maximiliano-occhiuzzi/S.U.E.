// src/app.js
require('dotenv/config');
const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const path         = require('path');
const fs           = require('fs');

// Sin secretos no se arranca: firmar tokens con un secreto vacío o por defecto sería regalar el acceso.
for (const k of ['JWT_SECRET']) {
  if (!process.env[k]) { console.error(`[Seguridad] Falta ${k} en el .env. No se inicia.`); process.exit(1); }
}
if (process.env.JWT_SECRET.length < 32)
  console.warn('[Seguridad] JWT_SECRET es corto (<32 caracteres). Generá uno largo: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');

require('./config/db');
require('./config/mqtt');

const authRouter        = require('./routes/auth');
const simulacrosRouter  = require('./routes/simulacros');
const incidenciasRouter = require('./routes/incidencias');
const usuariosRouter    = require('./routes/usuarios');
const realtimeRouter    = require('./routes/realtime');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin:      ['http://localhost:5173', 'http://localhost:5174', 'http://suefatima.local', 'https://suefatima.local'],
  credentials: true,
}));

// Los endpoints de estado (simulacro activo, incidencias) cambian todo el tiempo: que ningun
// navegador/WebView/proxy los cachee ni responda 304 con datos viejos.
app.set('etag', false);
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.set('Pragma', 'no-cache');
  next();
});

// Cabeceras de seguridad básicas + el servidor no avisa que es Express.
app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('Referrer-Policy', 'no-referrer');
  next();
});

app.use(cookieParser());
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) =>
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
);

app.use('/api/auth',        authRouter);
app.use('/api/simulacros',  simulacrosRouter);
app.use('/api/incidencias', incidenciasRouter);
app.use('/api/usuarios',    usuariosRouter);
app.use('/api/realtime',    realtimeRouter);

// ─── Interfaz web ────────────────────────────────────────────────────────────
// Si existe la web compilada (npm run build:web en sue-fatima), este mismo programa la
// sirve en http://IP:3001/ : en el colegio alcanza con UN solo proceso (API + web) y
// ya no hace falta correr `npm run dev`. La carpeta se puede cambiar con WEB_DIST.
const WEB_DIST = process.env.WEB_DIST
  ? path.resolve(process.env.WEB_DIST)
  : path.resolve(__dirname, '../../sue-fatima/dist-web');
const WEB_INDEX = path.join(WEB_DIST, 'index.html');

if (fs.existsSync(WEB_INDEX)) {
  app.use(express.static(WEB_DIST, {
    index: false,
    maxAge: '7d', // los archivos llevan hash en el nombre: pueden cachearse
    setHeaders(res, file) {
      // index.html nunca se cachea: así una versión nueva se ve apenas se actualiza
      if (file.endsWith('index.html')) res.setHeader('Cache-Control', 'no-cache');
    },
  }));
  // Cualquier ruta que no sea /api ni /health devuelve la app (navegación del lado del cliente)
  app.get(/^\/(?!api\/|health$).*/, (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(WEB_INDEX);
  });
  console.log(`[Web] Sirviendo la interfaz web desde ${WEB_DIST}`);
} else {
  console.log('[Web] No hay web compilada (sue-fatima/dist-web): solo se sirve la API.');
}

app.use((_req, res) =>
  res.status(404).json({ ok: false, mensaje: 'Ruta no encontrada.' })
);

app.listen(PORT, () =>
  console.log(`[Server] S.U.E. corriendo en http://localhost:${PORT}`)
);