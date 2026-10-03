// src/routes/perfil.js
// Foto de perfil del usuario logueado. Se guarda en la base (columna usuarios.foto), así se
// respalda junto con todo lo demás y no depende de carpetas del servidor.
// La app la redimensiona a ~320 px antes de subirla (pesa unos 20-40 KB); acá se valida igual.
const express = require('express');
const db = require('../config/db');
const { verifyToken } = require('../middlewares/auth');

const router = express.Router();
const MAX_BYTES = 300 * 1024;

// Solo JPEG: es lo que genera la app y evita subir cosas raras (SVG con scripts, etc.).
const esJpeg = (b) => Buffer.isBuffer(b) && b.length > 4 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;

router.get('/foto', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT foto FROM usuarios WHERE id_usuario = ? LIMIT 1', [req.usuario.id_usuario]);
    const foto = rows[0]?.foto;
    if (!foto || !foto.length) return res.status(204).end();
    res.set({ 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' });
    res.send(foto);
  } catch (err) {
    console.error('[perfil] GET foto:', err.message);
    res.status(500).json({ ok: false, mensaje: 'No se pudo leer la foto.' });
  }
});

router.put('/foto',
  verifyToken,
  express.raw({ type: 'image/jpeg', limit: MAX_BYTES }),
  async (req, res) => {
    if (!esJpeg(req.body)) {
      return res.status(400).json({ ok: false, mensaje: 'La imagen no es válida.' });
    }
    try {
      await db.execute('UPDATE usuarios SET foto = ? WHERE id_usuario = ?', [req.body, req.usuario.id_usuario]);
      res.json({ ok: true });
    } catch (err) {
      console.error('[perfil] PUT foto:', err.message);
      res.status(500).json({ ok: false, mensaje: 'No se pudo guardar la foto.' });
    }
  });

router.delete('/foto', verifyToken, async (req, res) => {
  try {
    await db.execute('UPDATE usuarios SET foto = NULL WHERE id_usuario = ?', [req.usuario.id_usuario]);
    res.json({ ok: true });
  } catch (err) {
    console.error('[perfil] DELETE foto:', err.message);
    res.status(500).json({ ok: false, mensaje: 'No se pudo quitar la foto.' });
  }
});

// Error de tamaño / tipo del body parser → respuesta JSON limpia.
router.use((err, _req, res, next) => {
  if (err?.type === 'entity.too.large') return res.status(413).json({ ok: false, mensaje: 'La imagen es demasiado pesada.' });
  next(err);
});

module.exports = router;
