// src/app.js
require('dotenv/config');
const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');

require('./config/db');
require('./config/mqtt');

const authRouter        = require('./routes/auth');
const simulacrosRouter  = require('./routes/simulacros');
const incidenciasRouter = require('./routes/incidencias');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin:      ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) =>
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
);

app.use('/api/auth',        authRouter);
app.use('/api/simulacros',  simulacrosRouter);
app.use('/api/incidencias', incidenciasRouter);

app.use((_req, res) =>
  res.status(404).json({ ok: false, mensaje: 'Ruta no encontrada.' })
);

app.listen(PORT, () =>
  console.log(`[Server] S.U.E. corriendo en http://localhost:${PORT}`)
);