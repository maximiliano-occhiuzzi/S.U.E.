// src/routes/simulacros.js
const express                  = require('express');
const router                   = express.Router();
const db                       = require('../config/db');
const mqttClient               = require('../config/mqtt');
const { verifyToken, requireRol } = require('../middlewares/auth');

const TOPIC_SIMULACRO = 'sue/simulacro';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatearFecha(fecha) {
  return fecha ? new Date(fecha).toISOString() : null;
}

function calcularDuracion(inicio, fin) {
  if (!inicio || !fin) return null;
  const segundos = Math.floor((new Date(fin) - new Date(inicio)) / 1000);
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// ─── GET /api/simulacros/activo ───────────────────────────────────────────────
router.get('/activo', verifyToken, async (req, res) => {
  const conn = await db.getConnection();
  try {
    const [rows] = await conn.execute(
      `SELECT s.id_simulacro, s.tipo, s.nombre, s.estado, s.observaciones,
              s.fecha_inicio, s.fecha_fin,
              u.nombre AS directivo
       FROM simulacros s
       LEFT JOIN usuarios u ON u.id_usuario = s.id_directivo
       WHERE s.estado = 'activo'
       ORDER BY s.fecha_inicio DESC
       LIMIT 1`
    );

    return res.status(200).json({
      ok:        true,
      simulacro: rows[0] ?? null,
    });
  } catch (err) {
    console.error('[GET /simulacros/activo]', err.message);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  } finally {
    conn.release();
  }
});

// ─── GET /api/simulacros/historial ───────────────────────────────────────────
router.get('/historial', verifyToken, async (req, res) => {
  const conn = await db.getConnection();
  try {
    const [simulacros] = await conn.execute(
      `SELECT
         s.id_simulacro,
         s.tipo,
         s.nombre,
         s.estado,
         s.observaciones,
         s.fecha_inicio,
         s.fecha_fin,
         u.nombre AS directivo,
         COUNT(i.id_reporte) AS total_incidencias
       FROM simulacros s
       LEFT JOIN usuarios u ON u.id_usuario = s.id_directivo
       LEFT JOIN incidencias i ON i.id_simulacro = s.id_simulacro
       WHERE s.estado IN ('finalizado', 'cancelado')
       GROUP BY s.id_simulacro
       ORDER BY s.fecha_inicio DESC`
    );

    const resultado = simulacros.map(s => ({
      ...s,
      fecha_inicio:       formatearFecha(s.fecha_inicio),
      fecha_fin:          formatearFecha(s.fecha_fin),
      duracion:           calcularDuracion(s.fecha_inicio, s.fecha_fin),
      total_incidencias:  Number(s.total_incidencias),
    }));

    return res.status(200).json({ ok: true, simulacros: resultado });
  } catch (err) {
    console.error('[GET /simulacros/historial]', err.message);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  } finally {
    conn.release();
  }
});

// ─── GET /api/simulacros/:id ──────────────────────────────────────────────────
router.get('/:id', verifyToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ ok: false, mensaje: 'ID inválido.' });

  const conn = await db.getConnection();
  try {
    const [rows] = await conn.execute(
      `SELECT s.*, u.nombre AS directivo
       FROM simulacros s
       LEFT JOIN usuarios u ON u.id_usuario = s.id_directivo
       WHERE s.id_simulacro = ?`,
      [id]
    );

    if (rows.length === 0)
      return res.status(404).json({ ok: false, mensaje: 'Simulacro no encontrado.' });

    const s = rows[0];
    return res.status(200).json({
      ok: true,
      simulacro: {
        ...s,
        fecha_inicio: formatearFecha(s.fecha_inicio),
        fecha_fin:    formatearFecha(s.fecha_fin),
        duracion:     calcularDuracion(s.fecha_inicio, s.fecha_fin),
      },
    });
  } catch (err) {
    console.error('[GET /simulacros/:id]', err.message);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  } finally {
    conn.release();
  }
});

// ─── POST /api/simulacros/iniciar ─────────────────────────────────────────────
router.post('/iniciar', verifyToken, requireRol('directivo'), async (req, res) => {
  const { observaciones, tipo = 'simulacro', nombre } = req.body;
  const id_directivo = req.usuario.id_usuario;

  const tiposValidos = ['simulacro', 'emergencia'];
  if (!tiposValidos.includes(tipo)) {
    return res.status(400).json({ ok: false, mensaje: `tipo debe ser: ${tiposValidos.join(', ')}.` });
  }

  const conn = await db.getConnection();
  try {
    // Verificar que no haya otro simulacro activo
    const [activos] = await conn.execute(
      `SELECT id_simulacro FROM simulacros WHERE estado = 'activo' LIMIT 1`
    );

    if (activos.length > 0) {
      return res.status(409).json({
        ok:      false,
        mensaje: `Ya existe un simulacro activo (#${activos[0].id_simulacro}). Finalizalo antes de iniciar uno nuevo.`,
      });
    }

    const fechaInicio = new Date();

    const [result] = await conn.execute(
      `INSERT INTO simulacros (id_directivo, tipo, nombre, estado, observaciones, fecha_inicio)
       VALUES (?, ?, ?, 'activo', ?, ?)`,
      [id_directivo, tipo, nombre || null, observaciones || null, fechaInicio]
    );

    const id_simulacro = result.insertId;

    // Publicar MQTT
    const payload = JSON.stringify({
      evento:       'SIMULACRO_INICIADO',
      id_simulacro,
      tipo,
      estado:       'activo',
      directivo:    req.usuario.nombre,
      timestamp:    fechaInicio.toISOString(),
    });

    mqttClient.publish(TOPIC_SIMULACRO, payload, { qos: 1 }, (err) => {
      if (err) console.error('[MQTT] Error:', err.message);
      else     console.log(`[MQTT] -> ${TOPIC_SIMULACRO}:`, payload);
    });

    // Activar timbre via Tasmota
    mqttClient.publish('cmnd/drillmaster/POWER', 'ON', { qos: 1 });

    return res.status(201).json({
      ok:           true,
      mensaje:      'Simulacro iniciado correctamente.',
      id_simulacro,
      tipo,
      fecha_inicio: fechaInicio.toISOString(),
    });

  } catch (err) {
    console.error('[POST /simulacros/iniciar]', err.message);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  } finally {
    conn.release();
  }
});

// ─── PUT /api/simulacros/:id/finalizar ────────────────────────────────────────
router.put('/:id/finalizar', verifyToken, requireRol('directivo'), async (req, res) => {
  const id_simulacro = parseInt(req.params.id, 10);
  if (isNaN(id_simulacro))
    return res.status(400).json({ ok: false, mensaje: 'ID inválido.' });

  const conn = await db.getConnection();
  try {
    const [rows] = await conn.execute(
      `SELECT * FROM simulacros WHERE id_simulacro = ? LIMIT 1`,
      [id_simulacro]
    );

    if (rows.length === 0)
      return res.status(404).json({ ok: false, mensaje: 'Simulacro no encontrado.' });

    if (rows[0].estado !== 'activo')
      return res.status(409).json({ ok: false, mensaje: `El simulacro ya está ${rows[0].estado}.` });

    const fechaFin = new Date();

    await conn.execute(
      `UPDATE simulacros SET estado = 'finalizado', fecha_fin = ? WHERE id_simulacro = ?`,
      [fechaFin, id_simulacro]
    );

    const duracion = calcularDuracion(rows[0].fecha_inicio, fechaFin);

    // Publicar MQTT
    const payload = JSON.stringify({
      evento:       'SIMULACRO_FINALIZADO',
      id_simulacro,
      estado:       'finalizado',
      duracion,
      directivo:    req.usuario.nombre,
      timestamp:    fechaFin.toISOString(),
    });

    mqttClient.publish(TOPIC_SIMULACRO, payload, { qos: 1 }, (err) => {
      if (err) console.error('[MQTT] Error:', err.message);
      else     console.log(`[MQTT] -> ${TOPIC_SIMULACRO}:`, payload);
    });

    // Apagar timbre via Tasmota
    mqttClient.publish('cmnd/drillmaster/POWER', 'OFF', { qos: 1 });

    return res.status(200).json({
      ok:           true,
      mensaje:      'Simulacro finalizado correctamente.',
      id_simulacro,
      fecha_fin:    fechaFin.toISOString(),
      duracion,
    });

  } catch (err) {
    console.error('[PUT /simulacros/:id/finalizar]', err.message);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  } finally {
    conn.release();
  }
});

// ─── GET /api/simulacros/:id/dashboard ────────────────────────────────────────
router.get('/:id/dashboard', verifyToken, async (req, res) => {
  const id_simulacro = parseInt(req.params.id, 10);
  if (isNaN(id_simulacro))
    return res.status(400).json({ ok: false, mensaje: 'ID inválido.' });

  const conn = await db.getConnection();
  try {
    const [simRows] = await conn.execute(
      `SELECT s.*, u.nombre AS directivo FROM simulacros s
       LEFT JOIN usuarios u ON u.id_usuario = s.id_directivo
       WHERE s.id_simulacro = ?`,
      [id_simulacro]
    );

    if (simRows.length === 0)
      return res.status(404).json({ ok: false, mensaje: 'Simulacro no encontrado.' });

    const sim = simRows[0];

    const [incidencias] = await conn.execute(
      `SELECT i.*, s.nombre AS sector, u.nombre AS docente
       FROM incidencias i
       LEFT JOIN sectores s ON s.id_sector = i.id_sector
       LEFT JOIN usuarios u ON u.id_usuario = i.id_docente
       WHERE i.id_simulacro = ?
       ORDER BY i.fecha_reporte DESC`,
      [id_simulacro]
    );

    const criticas    = incidencias.filter(i => i.gravedad === 'critica').length;
    const porTipo     = incidencias.reduce((acc, i) => { acc[i.tipo_incidencia] = (acc[i.tipo_incidencia] || 0) + 1; return acc; }, {});
    const sectoresRep = [...new Set(incidencias.map(i => i.sector))].filter(Boolean);

    return res.status(200).json({
      ok: true,
      dashboard: {
        id_simulacro,
        tipo:               sim.tipo,
        estado:             sim.estado,
        directivo:          sim.directivo,
        fecha_inicio:       formatearFecha(sim.fecha_inicio),
        fecha_fin:          formatearFecha(sim.fecha_fin),
        duracion:           calcularDuracion(sim.fecha_inicio, sim.fecha_fin ?? new Date()),
        total_incidencias:  incidencias.length,
        incidencias_criticas: criticas,
        por_tipo:           porTipo,
        sectores_reportados: sectoresRep,
        ultima_incidencia:  incidencias[0] ?? null,
        incidencias,
      },
    });
  } catch (err) {
    console.error('[GET /simulacros/:id/dashboard]', err.message);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  } finally {
    conn.release();
  }
});

module.exports = router;