// src/routes/realtime.js
const express = require('express');
const router  = express.Router();
const { verifyToken } = require('../middlewares/auth');
const realtime = require('../utils/realtime');

// GET /api/realtime/stream
// Conexión larga (Server-Sent Events). El cliente la mantiene abierta y recibe:
//   event: simulacro   -> alguien inició o finalizó un simulacro
//   event: incidencia  -> se registró una incidencia nueva
//   event: presencia   -> cambió la cantidad de docentes/directivos conectados
router.get('/stream', verifyToken, (req, res) => {
  req.socket.setTimeout(0);
  req.socket.setNoDelay(true);
  req.socket.setKeepAlive(true);

  res.status(200).set({
    'Content-Type':      'text/event-stream; charset=utf-8',
    'Cache-Control':     'no-cache, no-transform',
    'Connection':        'keep-alive',
    'X-Accel-Buffering': 'no', // por si hay nginx adelante: no bufferear
  });
  res.flushHeaders();

  // Si se corta, el navegador reintenta a los 3 s.
  res.write('retry: 3000\n\n');

  realtime.agregar(req.usuario, res);

  const limpiar = () => realtime.quitar(res);
  req.on('close', limpiar);
  res.on('error', limpiar);
});

module.exports = router;
