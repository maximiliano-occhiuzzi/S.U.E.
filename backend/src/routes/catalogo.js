// src/routes/catalogo.js
// Catálogo editable: SECTORES del colegio y TIPOS DE INCIDENCIA.
// Todos los usuarios logueados lo leen; solo el directivo lo modifica.
// Cada cambio se avisa en vivo ('catalogo') para que todos los dispositivos lo vean sin recargar.
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const realtime = require('../utils/realtime');
const { verifyToken, requireRol } = require('../middlewares/auth');

const ICONOS  = ['flame','cloud','barrier','person','dots','zap','droplet','wind','alert','heart','lock','flask'];
const COLORES = ['red','amber','orange','blue','green'];
const GRAVEDADES = ['critica','moderada','informativa'];

const limpiar = (v) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '');
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 36) || 'tipo';
const avisar = () => realtime.emitir('catalogo', {});
const error500 = (res, ruta, err) => {
  console.error(`[${ruta}]`, err.message);
  return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
};

// ─── GET /api/catalogo ────────────────────────────────────────────────────────
// Devuelve TODO (incluidos los desactivados): los desactivados siguen haciendo falta
// para mostrar el nombre en incidencias viejas. Los formularios filtran por `activo`.
router.get('/', verifyToken, async (_req, res) => {
  try {
    const [sectores] = await db.execute(
      'SELECT id_sector, nombre, descripcion, activo FROM sectores ORDER BY nombre ASC');
    const [tipos] = await db.execute(
      'SELECT codigo, nombre, gravedad, icono, color, orden, activo FROM tipos_incidencia ORDER BY orden ASC, nombre ASC');
    return res.json({
      ok: true,
      sectores: sectores.map(s => ({ ...s, activo: !!s.activo })),
      tipos:    tipos.map(t => ({ ...t, activo: !!t.activo })),
      iconos: ICONOS, colores: COLORES,
    });
  } catch (err) { return error500(res, 'GET /catalogo', err); }
});

// ═════════════════════════════ SECTORES ══════════════════════════════════════
router.post('/sectores', verifyToken, requireRol('directivo'), async (req, res) => {
  const nombre = limpiar(req.body?.nombre);
  const descripcion = limpiar(req.body?.descripcion) || null;
  if (nombre.length < 2 || nombre.length > 100)
    return res.status(400).json({ ok: false, mensaje: 'El nombre del sector debe tener entre 2 y 100 caracteres.' });
  if (descripcion && descripcion.length > 300)
    return res.status(400).json({ ok: false, mensaje: 'La descripción es demasiado larga (máx. 300).' });
  try {
    const [dup] = await db.execute('SELECT id_sector FROM sectores WHERE LOWER(nombre) = LOWER(?) LIMIT 1', [nombre]);
    if (dup.length) return res.status(409).json({ ok: false, mensaje: 'Ya existe un sector con ese nombre.' });
    const [r] = await db.execute('INSERT INTO sectores (nombre, descripcion, activo) VALUES (?, ?, 1)', [nombre, descripcion]);
    avisar();
    return res.status(201).json({ ok: true, id_sector: r.insertId });
  } catch (err) { return error500(res, 'POST /catalogo/sectores', err); }
});

router.patch('/sectores/:id', verifyToken, requireRol('directivo'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ ok: false, mensaje: 'ID inválido.' });
  const campos = [], valores = [];
  if (req.body?.nombre !== undefined) {
    const nombre = limpiar(req.body.nombre);
    if (nombre.length < 2 || nombre.length > 100)
      return res.status(400).json({ ok: false, mensaje: 'El nombre del sector debe tener entre 2 y 100 caracteres.' });
    campos.push('nombre = ?'); valores.push(nombre);
  }
  if (req.body?.descripcion !== undefined) {
    const d = limpiar(req.body.descripcion) || null;
    if (d && d.length > 300) return res.status(400).json({ ok: false, mensaje: 'La descripción es demasiado larga (máx. 300).' });
    campos.push('descripcion = ?'); valores.push(d);
  }
  if (req.body?.activo !== undefined) { campos.push('activo = ?'); valores.push(req.body.activo ? 1 : 0); }
  if (!campos.length) return res.status(400).json({ ok: false, mensaje: 'No hay nada para modificar.' });
  try {
    if (req.body?.nombre !== undefined) {
      const [dup] = await db.execute(
        'SELECT id_sector FROM sectores WHERE LOWER(nombre) = LOWER(?) AND id_sector <> ? LIMIT 1', [limpiar(req.body.nombre), id]);
      if (dup.length) return res.status(409).json({ ok: false, mensaje: 'Ya existe un sector con ese nombre.' });
    }
    const [r] = await db.execute(`UPDATE sectores SET ${campos.join(', ')} WHERE id_sector = ?`, [...valores, id]);
    if (r.affectedRows === 0) return res.status(404).json({ ok: false, mensaje: 'Sector no encontrado.' });
    avisar();
    return res.json({ ok: true });
  } catch (err) { return error500(res, 'PATCH /catalogo/sectores/:id', err); }
});

// Si el sector ya tiene incidencias se DESACTIVA (el historial conserva el nombre);
// si nunca se usó, se borra de verdad.
router.delete('/sectores/:id', verifyToken, requireRol('directivo'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ ok: false, mensaje: 'ID inválido.' });
  try {
    const [[{ n }]] = await db.execute('SELECT COUNT(*) AS n FROM incidencias WHERE id_sector = ?', [id]);
    let resultado;
    if (Number(n) > 0) {
      const [r] = await db.execute('UPDATE sectores SET activo = 0 WHERE id_sector = ?', [id]);
      if (r.affectedRows === 0) return res.status(404).json({ ok: false, mensaje: 'Sector no encontrado.' });
      resultado = 'desactivado';
    } else {
      const [r] = await db.execute('DELETE FROM sectores WHERE id_sector = ?', [id]);
      if (r.affectedRows === 0) return res.status(404).json({ ok: false, mensaje: 'Sector no encontrado.' });
      resultado = 'eliminado';
    }
    avisar();
    return res.json({ ok: true, resultado });
  } catch (err) { return error500(res, 'DELETE /catalogo/sectores/:id', err); }
});

// ═════════════════════════ TIPOS DE INCIDENCIA ═══════════════════════════════
function validarTipo(b, { parcial }) {
  const out = {};
  if (!parcial || b.nombre !== undefined) {
    const nombre = limpiar(b.nombre);
    if (nombre.length < 2 || nombre.length > 60) return { error: 'El nombre debe tener entre 2 y 60 caracteres.' };
    out.nombre = nombre;
  }
  if (!parcial || b.gravedad !== undefined) {
    if (!GRAVEDADES.includes(b.gravedad)) return { error: `La gravedad debe ser: ${GRAVEDADES.join(', ')}.` };
    out.gravedad = b.gravedad;
  }
  if (!parcial || b.icono !== undefined) {
    if (!ICONOS.includes(b.icono)) return { error: 'Ícono inválido.' };
    out.icono = b.icono;
  }
  if (!parcial || b.color !== undefined) {
    if (!COLORES.includes(b.color)) return { error: 'Color inválido.' };
    out.color = b.color;
  }
  return { datos: out };
}

router.post('/tipos', verifyToken, requireRol('directivo'), async (req, res) => {
  const { datos, error } = validarTipo(req.body || {}, { parcial: false });
  if (error) return res.status(400).json({ ok: false, mensaje: error });
  try {
    const [dup] = await db.execute('SELECT codigo FROM tipos_incidencia WHERE LOWER(nombre) = LOWER(?) LIMIT 1', [datos.nombre]);
    if (dup.length) return res.status(409).json({ ok: false, mensaje: 'Ya existe un tipo de incidencia con ese nombre.' });

    // El código interno sale del nombre y nunca cambia (las incidencias guardadas lo usan).
    let codigo = slug(datos.nombre), k = 2;
    for (;;) {
      const [x] = await db.execute('SELECT 1 FROM tipos_incidencia WHERE codigo = ? LIMIT 1', [codigo]);
      if (!x.length) break;
      codigo = `${slug(datos.nombre).slice(0, 33)}_${k++}`;
    }
    // Los nuevos van antes de "Otro", que queda siempre último.
    const [[{ m }]] = await db.execute("SELECT COALESCE(MAX(orden), 0) AS m FROM tipos_incidencia WHERE codigo <> 'otro'");
    await db.execute(
      'INSERT INTO tipos_incidencia (codigo, nombre, gravedad, icono, color, orden, activo) VALUES (?,?,?,?,?,?,1)',
      [codigo, datos.nombre, datos.gravedad, datos.icono, datos.color, Number(m) + 1]);
    avisar();
    return res.status(201).json({ ok: true, codigo });
  } catch (err) { return error500(res, 'POST /catalogo/tipos', err); }
});

router.patch('/tipos/:codigo', verifyToken, requireRol('directivo'), async (req, res) => {
  const codigo = String(req.params.codigo);
  const b = req.body || {};
  const { datos, error } = validarTipo(b, { parcial: true });
  if (error) return res.status(400).json({ ok: false, mensaje: error });
  if (b.activo !== undefined) {
    if (codigo === 'otro' && !b.activo)
      return res.status(400).json({ ok: false, mensaje: 'El tipo "Otro" no se puede desactivar: sirve de comodín.' });
    datos.activo = b.activo ? 1 : 0;
  }
  const claves = Object.keys(datos);
  if (!claves.length) return res.status(400).json({ ok: false, mensaje: 'No hay nada para modificar.' });
  try {
    if (datos.nombre) {
      const [dup] = await db.execute(
        'SELECT codigo FROM tipos_incidencia WHERE LOWER(nombre) = LOWER(?) AND codigo <> ? LIMIT 1', [datos.nombre, codigo]);
      if (dup.length) return res.status(409).json({ ok: false, mensaje: 'Ya existe un tipo de incidencia con ese nombre.' });
    }
    const [r] = await db.execute(
      `UPDATE tipos_incidencia SET ${claves.map(c => `${c} = ?`).join(', ')} WHERE codigo = ?`,
      [...claves.map(c => datos[c]), codigo]);
    if (r.affectedRows === 0) return res.status(404).json({ ok: false, mensaje: 'Tipo no encontrado.' });
    avisar();
    return res.json({ ok: true });
  } catch (err) { return error500(res, 'PATCH /catalogo/tipos/:codigo', err); }
});

router.delete('/tipos/:codigo', verifyToken, requireRol('directivo'), async (req, res) => {
  const codigo = String(req.params.codigo);
  if (codigo === 'otro')
    return res.status(400).json({ ok: false, mensaje: 'El tipo "Otro" no se puede eliminar: sirve de comodín.' });
  try {
    const [[{ n }]] = await db.execute('SELECT COUNT(*) AS n FROM incidencias WHERE tipo_incidencia = ?', [codigo]);
    let resultado;
    if (Number(n) > 0) {
      const [r] = await db.execute('UPDATE tipos_incidencia SET activo = 0 WHERE codigo = ?', [codigo]);
      if (r.affectedRows === 0) return res.status(404).json({ ok: false, mensaje: 'Tipo no encontrado.' });
      resultado = 'desactivado';
    } else {
      const [r] = await db.execute('DELETE FROM tipos_incidencia WHERE codigo = ?', [codigo]);
      if (r.affectedRows === 0) return res.status(404).json({ ok: false, mensaje: 'Tipo no encontrado.' });
      resultado = 'eliminado';
    }
    avisar();
    return res.json({ ok: true, resultado });
  } catch (err) { return error500(res, 'DELETE /catalogo/tipos/:codigo', err); }
});

module.exports = router;
