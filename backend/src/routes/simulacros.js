const express         = require('express');
const router          = express.Router();
const db              = require('../config/db');
const mqttClient      = require('../config/mqtt');
const { verifyToken } = require('../config/auth');

const TOPIC_TIMBRE = 'cmnd/drillmaster/POWER';

router.post('/iniciar', verifyToken, async (req, res) => {
  const { observaciones } = req.body;
  // Extraemos el id del token. Si en el JWT se guardó como id_usuario, lo asignamos a id_directivo
  const id_directivo      = req.usuario.id_usuario || req.usuario.id_directivo;

  const conn = await db.getConnection();
  try {
    const fechaInicio = new Date();

    // CORREGIDO: Se cambió id_usuario por id_directivo en la consulta SQL
    const [result] = await conn.execute(
      `INSERT INTO simulacros (id_directivo, fecha_inicio, estado, observaciones)
       VALUES (?, ?, 'activo', ?)`,
      [id_directivo, fechaInicio, observaciones || null]
    );

    const id_simulacro = result.insertId;

    // Tasmota recibe "ON" en texto plano para encender el relay
    const payload = 'ON';

    mqttClient.publish(TOPIC_TIMBRE, payload, { qos: 1 }, (err) => {
      if (err) console.error('[MQTT] Error al publicar:', err.message);
      else     console.log(`[MQTT] -> ${TOPIC_TIMBRE}:`, payload);
    });

    return res.status(201).json({
      ok: true,
      mensaje: 'Simulacro iniciado correctamente.',
      id_simulacro,
      fecha_inicio: fechaInicio.toISOString(),
    });

  } catch (err) {
    console.error('[POST /iniciar] Error:', err.message);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  } finally {
    conn.release();
  }
});

/**
 * PUT /api/simulacros/:id/finalizar
 * Headers: Authorization: Bearer <token>
 */
router.put('/:id/finalizar', verifyToken, async (req, res) => {
  const id_simulacro = parseInt(req.params.id, 10);

  if (isNaN(id_simulacro)) {
    return res.status(400).json({ ok: false, mensaje: 'ID de simulacro inválido.' });
  }

  const conn = await db.getConnection();
  try {
    // Verificar que existe y está activo
    const [rows] = await conn.execute(
      `SELECT id_simulacro FROM simulacros
       WHERE id_simulacro = ? AND estado = 'activo' LIMIT 1`,
      [id_simulacro]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: 'No existe un simulacro activo con ese ID.',
      });
    }

    // Actualizar estado y fecha_fin en MySQL
    const fechaFin = new Date();
    await conn.execute(
      `UPDATE simulacros
       SET estado = 'finalizado', fecha_fin = ?
       WHERE id_simulacro = ?`,
      [fechaFin, id_simulacro]
    );

    // Tasmota recibe "OFF" en texto plano para apagar el relay
    const payload = 'OFF';

    mqttClient.publish(TOPIC_TIMBRE, payload, { qos: 1 }, (err) => {
      if (err) console.error('[MQTT] Error al publicar:', err.message);
      else     console.log(`[MQTT] -> ${TOPIC_TIMBRE}:`, payload);
    });

    return res.status(200).json({
      ok:       true,
      mensaje:  'Simulacro finalizado correctamente.',
      id_simulacro,
      fecha_fin: fechaFin.toISOString(),
    });

  } catch (err) {
    console.error('[PUT /finalizar] Error:', err.message);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  } finally {
    conn.release();
  }
});

module.exports = router;
