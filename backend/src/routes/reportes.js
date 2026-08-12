// src/routes/reportes.js
const express         = require('express');
const router          = express.Router();
const db              = require('../config/db');
const mqttClient      = require('../config/mqtt');
const { verifyToken } = require('../config/auth');

const TOPIC_ALERTAS = 'drillmaster/sectores/alertas';

/**
 * POST /api/reportes
 * Headers: Authorization: Bearer <token>
 * Body: { id_simulacro, id_sector, estado_sector, detalle? }
 */
router.post('/', verifyToken, async (req, res) => {
  const { id_simulacro, id_sector, estado_sector, detalle } = req.body;
  const id_usuario = req.usuario.id_usuario;

  // Validación
  if (!id_simulacro || !id_sector || !estado_sector) {
    return res.status(400).json({
      ok: false,
      mensaje: 'id_simulacro, id_sector y estado_sector son obligatorios.',
    });
  }

  const estadosValidos = ['evacuado_ok', 'peligro', 'en_proceso'];
  if (!estadosValidos.includes(estado_sector)) {
    return res.status(400).json({
      ok: false,
      mensaje: `estado_sector debe ser: ${estadosValidos.join(', ')}.`,
    });
  }

  const conn = await db.getConnection();
  try {
    const fechaReporte = new Date();

    // Verificar que el simulacro existe y está activo
    const [simulacro] = await conn.execute(
      `SELECT id_simulacro FROM simulacros
       WHERE id_simulacro = ? AND estado = 'activo' LIMIT 1`,
      [id_simulacro]
    );

    if (simulacro.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: 'No existe un simulacro activo con ese ID.',
      });
    }

    // Insertar reporte en MySQL
    const [result] = await conn.execute(
      `INSERT INTO reportes
         (id_simulacro, id_usuario, id_sector, estado_sector, detalle, fecha_reporte)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_simulacro, id_usuario, id_sector, estado_sector, detalle || null, fechaReporte]
    );

    const id_reporte = result.insertId;

    // Publicar en MQTT para actualizar el panel en tiempo real
    const payload = JSON.stringify({
      id_reporte,
      id_simulacro,
      id_sector,
      id_usuario,
      nombre_usuario: req.usuario.nombre,
      estado_sector,
      detalle:        detalle || null,
      timestamp:      fechaReporte.toISOString(),
    });

    mqttClient.publish(TOPIC_ALERTAS, payload, { qos: 1 }, (err) => {
      if (err) console.error('[MQTT] Error al publicar alerta:', err.message);
      else     console.log(`[MQTT] -> ${TOPIC_ALERTAS}:`, payload);
    });

    return res.status(201).json({
      ok: true,
      mensaje: 'Reporte enviado correctamente.',
      id_reporte,
      fecha_reporte: fechaReporte.toISOString(),
    });

  } catch (err) {
    console.error('[POST /reportes] Error:', err.message);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  } finally {
    conn.release();
  }
});

module.exports = router;