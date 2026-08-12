require('dotenv/config');
const express = require('express');
const cors    = require('cors');

require('./config/db');
require('./config/mqtt');

const authRouter       = require('./routes/auth');
const simulacrosRouter = require('./routes/simulacros');
const reportesRouter   = require('./routes/reportes');
const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) =>
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
);

app.use('/api/auth',       authRouter);
app.use('/api/simulacros', simulacrosRouter);
app.use('/api/reportes', reportesRouter);
app.use((_req, res) =>
  res.status(404).json({ ok: false, mensaje: 'Ruta no encontrada.' })
);

app.listen(PORT, () =>
  console.log(`[Server] DrillMaster corriendo en http://localhost:${PORT}`)
);