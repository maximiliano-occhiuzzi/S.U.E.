// src/routes/incidencias.js
const express                     = require('express');
const router                      = express.Router();
const db                          = require('../config/db');
const mqttClient                  = require('../config/mqtt');
const { verifyToken, requireRol } = require('../middlewares/auth');

const TOPIC_INCIDENCIAS = 'sue/incidencias';

// ─── Constantes ───────────────────────────────────────────────────────────────

const TIPOS_VALIDOS   = ['incendio', 'humo', 'acceso_bloqueado', 'persona_lesionada', 'otro'];
const ESTADOS_VALIDOS = ['evacuado_ok', 'peligro', 'en_proceso'];

const GRAVEDAD_POR_TIPO = {
  incendio:          'critica',
  persona_lesionada: 'critica',
  humo:              'moderada',
  acceso_bloqueado:  'moderada',
  otro:              'informativa',
};

// ─── GET /api/incidencias/sectores ────────────────────────────────────────────
router.get('/sectores', verifyToken, async (req, res) => {
  const conn = await db.getConnection();
  try {
    const [sectores] = await conn.execute(
      `SELECT id_sector, nombre, descripcion
       FROM sectores
       WHERE activo = 1
       ORDER BY nombre ASC`
    );
    return res.status(200).json({ ok: true, sectores });
  } catch (err) {
    console.error('[GET /incidencias/sectores]', err.message);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  } finally {
    conn.release();
  }
});

// ─── GET /api/incidencias/:id_simulacro ───────────────────────────────────────
router.get('/:id_simulacro', verifyToken, async (req, res) => {
  const id_simulacro = parseInt(req.params.id_simulacro, 10);
  if (isNaN(id_simulacro))
    return res.status(400).json({ ok: false, mensaje: 'ID de simulacro inválido.' });

  const conn = await db.getConnection();
  try {
    const [incidencias] = await conn.execute(
      `SELECT
         i.id_reporte,
         i.id_simulacro,
         i.tipo_incidencia,
         i.gravedad,
         i.estado_sector,
         i.estado,
         i.detalle,
         i.fecha_reporte,
         s.nombre  AS sector,
         u.nombre  AS docente
       FROM incidencias i
       LEFT JOIN sectores  s ON s.id_sector  = i.id_sector
       LEFT JOIN usuarios  u ON u.id_usuario = i.id_docente
       WHERE i.id_simulacro = ?
       ORDER BY i.fecha_reporte DESC`,
      [id_simulacro]
    );

    return res.status(200).json({ ok: true, incidencias });
  } catch (err) {
    console.error('[GET /incidencias/:id_simulacro]', err.message);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  } finally {
    conn.release();
  }
});

// ─── POST /api/incidencias ────────────────────────────────────────────────────
router.post('/', verifyToken, async (req, res) => {
  const { id_simulacro, id_sector, estado_sector, tipo_incidencia, detalle } = req.body;
  const id_docente = req.usuario.id_usuario;

  // ── Validaciones ──
  if (!id_simulacro || !id_sector || !estado_sector || !tipo_incidencia) {
    return res.status(400).json({
      ok:      false,
      mensaje: 'id_simulacro, id_sector, estado_sector y tipo_incidencia son obligatorios.',
    });
  }

  if (!TIPOS_VALIDOS.includes(tipo_incidencia)) {
    return res.status(400).json({
      ok:      false,
      mensaje: `tipo_incidencia debe ser: ${TIPOS_VALIDOS.join(', ')}.`,
    });
  }

  if (!ESTADOS_VALIDOS.includes(estado_sector)) {
    return res.status(400).json({
      ok:      false,
      mensaje: `estado_sector debe ser: ${ESTADOS_VALIDOS.join(', ')}.`,
    });
  }

  // El backend determina la gravedad — no se confía en el frontend
  const gravedad = GRAVEDAD_POR_TIPO[tipo_incidencia] ?? 'informativa';

  const conn = await db.getConnection();
  try {
    // Verificar que el simulacro existe y está activo
    const [simRows] = await conn.execute(
      `SELECT id_simulacro FROM simulacros
       WHERE id_simulacro = ? AND estado = 'activo' LIMIT 1`,
      [id_simulacro]
    );

    if (simRows.length === 0) {
      return res.status(404).json({
        ok:      false,
        mensaje: 'No existe un simulacro activo con ese ID. No se pueden registrar incidencias.',
      });
    }

    // Verificar que el sector existe y está activo
    const [sectorRows] = await conn.execute(
      `SELECT id_sector, nombre FROM sectores WHERE id_sector = ? AND activo = 1 LIMIT 1`,
      [id_sector]
    );

    if (sectorRows.length === 0) {
      return res.status(404).json({
        ok:      false,
        mensaje: 'Sector no encontrado o inactivo.',
      });
    }

    const nombre_sector = sectorRows[0].nombre;
    const fecha_reporte = new Date();

    // Insertar incidencia
    const [result] = await conn.execute(
      `INSERT INTO incidencias
         (id_simulacro, id_docente, id_sector, tipo_incidencia, gravedad, estado_sector, estado, detalle, fecha_reporte)
       VALUES (?, ?, ?, ?, ?, ?, 'activa', ?, ?)`,
      [id_simulacro, id_docente, id_sector, tipo_incidencia, gravedad, estado_sector, detalle || null, fecha_reporte]
    );

    const id_reporte = result.insertId;

    // Publicar en MQTT
    const payload = JSON.stringify({
      evento:          'INCIDENCIA_CREADA',
      id_reporte,
      id_simulacro,
      tipo_incidencia,
      gravedad,
      estado_sector,
      sector:          nombre_sector,
      docente:         req.usuario.nombre,
      detalle:         detalle || null,
      timestamp:       fecha_reporte.toISOString(),
    });

    mqttClient.publish(TOPIC_INCIDENCIAS, payload, { qos: 1 }, (err) => {
      if (err) console.error('[MQTT] Error al publicar incidencia:', err.message);
      else     console.log(`[MQTT] -> ${TOPIC_INCIDENCIAS}:`, payload);
    });

    return res.status(201).json({
      ok:           true,
      mensaje:      'Incidencia registrada correctamente.',
      id_reporte,
      gravedad,
      fecha_reporte: fecha_reporte.toISOString(),
    });

  } catch (err) {
    console.error('[POST /incidencias]', err.message);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  } finally {
    conn.release();
  }
});

// ─── PATCH /api/incidencias/:id/estado ────────────────────────────────────────
// Permite cambiar el estado de una incidencia: activa → atendida → resuelta
router.patch('/:id/estado', verifyToken, async (req, res) => {
  const id_reporte = parseInt(req.params.id, 10);
  const { estado } = req.body;

  if (isNaN(id_reporte))
    return res.status(400).json({ ok: false, mensaje: 'ID inválido.' });

  const estadosIncidencia = ['activa', 'atendida', 'resuelta', 'cancelada'];
  if (!estadosIncidencia.includes(estado)) {
    return res.status(400).json({
      ok:      false,
      mensaje: `estado debe ser: ${estadosIncidencia.join(', ')}.`,
    });
  }

  const conn = await db.getConnection();
  try {
    const [rows] = await conn.execute(
      `SELECT id_reporte FROM incidencias WHERE id_reporte = ? LIMIT 1`,
      [id_reporte]
    );

    if (rows.length === 0)
      return res.status(404).json({ ok: false, mensaje: 'Incidencia no encontrada.' });

    await conn.execute(
      `UPDATE incidencias SET estado = ? WHERE id_reporte = ?`,
      [estado, id_reporte]
    );

    return res.status(200).json({
      ok:      true,
      mensaje: `Incidencia actualizada a: ${estado}.`,
      id_reporte,
      estado,
    });
  } catch (err) {
    console.error('[PATCH /incidencias/:id/estado]', err.message);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  } finally {
    conn.release();
  }
});

module.exports = router;