// src/routes/reportes.js
const express         = require('express');
const router          = express.Router();
const db              = require('../config/db');
const mqttClient      = require('../config/mqtt');
const { verifyToken } = require('../config/auth');

const TOPIC_ALERTAS = 'drillmaster/sectores/alertas';

/**
 * GET /api/reportes/sectores
 * Headers: Authorization: Bearer <token>
 * Devuelve el listado de sectores activos para poblar el combo del formulario.
 */
router.get('/sectores', verifyToken, async (req, res) => {
  const conn = await db.getConnection();
  try {
    const [sectores] = await conn.execute(
      `SELECT id_sector, nombre, descripcion
       FROM sectores
       WHERE activo = 1
       ORDER BY nombre ASC`
    );

    return res.status(200).json({
      ok: true,
      sectores,
    });
  } catch (err) {
    console.error('[GET /reportes/sectores] Error:', err.message);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  } finally {
    conn.release();
  }
});

/**
 * GET /api/reportes/:id_simulacro
 * Headers: Authorization: Bearer <token>
 * Devuelve los reportes de un simulacro, con nombre de sector y docente.
 */
router.get('/:id_simulacro', verifyToken, async (req, res) => {
  const { id_simulacro } = req.params;

  const conn = await db.getConnection();
  try {
 const [reportes] = await conn.execute(
  `SELECT
     r.id_reporte,
     r.estado_sector,
     r.tipo_incidencia,
     r.detalle,
     r.fecha_reporte,
     s.nombre AS sector,
     u.nombre AS docente
   FROM reportes r
   LEFT JOIN sectores s ON s.id_sector = r.id_sector
   LEFT JOIN usuarios u ON u.id_usuario = r.id_docente
   WHERE r.id_simulacro = ?
   ORDER BY r.fecha_reporte DESC`,
  [id_simulacro]
);

// ← AGREGÁ ESTA LÍNEA TEMPORALMENTE
console.log('[DEBUG] reporte[0]:', JSON.stringify(reportes[0]));

    return res.status(200).json({
      ok: true,
      reportes,
    });
  } catch (err) {
    console.error('[GET /reportes/:id_simulacro] Error:', err.message);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  } finally {
    conn.release();
  }
});

/**
 * POST /api/reportes
 * Headers: Authorization: Bearer <token>
 * Body: { id_simulacro, id_sector, estado_sector, tipo_incidencia?, detalle? }
 */
router.post('/', verifyToken, async (req, res) => {
  const { id_simulacro, id_sector, estado_sector, tipo_incidencia, detalle } = req.body;
  
  // ← AGREGÁ ESTA LÍNEA
  console.log('[DEBUG POST /reportes] body:', JSON.stringify(req.body));
  const id_docente = req.usuario.id_usuario;

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

  const tiposValidos = ['incendio', 'humo', 'acceso_bloqueado', 'persona_lesionada', 'otro'];
  if (tipo_incidencia && !tiposValidos.includes(tipo_incidencia)) {
    return res.status(400).json({
      ok: false,
      mensaje: `tipo_incidencia debe ser: ${tiposValidos.join(', ')}.`,
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

    // Traer el nombre del sector para el payload de MQTT
    const [sectorRows] = await conn.execute(
      `SELECT nombre FROM sectores WHERE id_sector = ? LIMIT 1`,
      [id_sector]
    );
    const nombre_sector = sectorRows[0]?.nombre ?? null;

    // Insertar reporte en MySQL
    const [result] = await conn.execute(
      `INSERT INTO reportes
         (id_simulacro, id_docente, id_sector, estado_sector, tipo_incidencia, detalle, fecha_reporte)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id_simulacro, id_docente, id_sector, estado_sector, tipo_incidencia || 'otro', detalle || null, fechaReporte]
    );

    const id_reporte = result.insertId;

    // Publicar en MQTT para actualizar el panel en tiempo real
    const payload = JSON.stringify({
      id_reporte,
      id_simulacro,
      id_sector,
      nombre_sector,
      id_docente,
      nombre_usuario: req.usuario.nombre,
      estado_sector,
      tipo_incidencia: tipo_incidencia || 'otro',
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