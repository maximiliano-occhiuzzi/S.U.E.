// src/routes/auth.js
const express    = require('express');
const router     = express.Router();
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const db         = require('../config/db');
const { verifyToken } = require('../middlewares/auth');

const REFRESH_COOKIE_NAME       = 'refresh_token';
const REFRESH_SECRET            = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
const REFRESH_EXPIRES_IN        = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const cookieOptions = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge:   REFRESH_COOKIE_MAX_AGE_MS,
  path:     '/api/auth',
};

function firmarAccessToken(usuario) {
  return jwt.sign(
    { id_usuario: usuario.id_usuario, nombre: usuario.nombre, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
}

function firmarRefreshToken(usuario) {
  return jwt.sign(
    { id_usuario: usuario.id_usuario },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
}

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ ok: false, mensaje: 'Email y contraseña son obligatorios.' });
  }

  try {
    const [rows] = await db.execute(
      'SELECT * FROM usuarios WHERE email = ? AND activo = 1 LIMIT 1',
      [email]
    );

    if (rows.length === 0)
      return res.status(401).json({ ok: false, mensaje: 'Credenciales incorrectas.' });

    const usuario        = rows[0];
    const passwordValido = await bcrypt.compare(password, usuario.password_hash);

    if (!passwordValido)
      return res.status(401).json({ ok: false, mensaje: 'Credenciales incorrectas.' });

    const token        = firmarAccessToken(usuario);
    const refreshToken = firmarRefreshToken(usuario);

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, cookieOptions);

    return res.status(200).json({
      ok:         true,
      token,
      nombre:     usuario.nombre,
      rol:        usuario.rol,
      tiene_pin:  usuario.pin_hash !== null, // el frontend sabe si debe pedir PIN
    });

  } catch (err) {
    console.error('[POST /login]', err.message);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
});

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

  if (!refreshToken)
    return res.status(401).json({ ok: false, mensaje: 'No hay sesión activa.' });

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);

    const [rows] = await db.execute(
      'SELECT * FROM usuarios WHERE id_usuario = ? AND activo = 1 LIMIT 1',
      [payload.id_usuario]
    );

    if (rows.length === 0) {
      res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
      return res.status(401).json({ ok: false, mensaje: 'Usuario no encontrado o inactivo.' });
    }

    const usuario           = rows[0];
    const token             = firmarAccessToken(usuario);
    const nuevoRefreshToken = firmarRefreshToken(usuario);

    res.cookie(REFRESH_COOKIE_NAME, nuevoRefreshToken, cookieOptions);

    return res.status(200).json({
      ok:        true,
      token,
      nombre:    usuario.nombre,
      rol:       usuario.rol,
      tiene_pin: usuario.pin_hash !== null,
    });

  } catch (err) {
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
    return res.status(401).json({ ok: false, mensaje: 'Sesión inválida o expirada.' });
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', (_req, res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
  return res.status(200).json({ ok: true, mensaje: 'Sesión cerrada.' });
});

// ─── POST /api/auth/set-pin ───────────────────────────────────────────────────
// Requiere JWT válido. Permite configurar o cambiar el PIN de 4 dígitos.
router.post('/set-pin', verifyToken, async (req, res) => {
  const { pin } = req.body;

  if (!pin || !/^\d{4}$/.test(String(pin))) {
    return res.status(400).json({
      ok:      false,
      mensaje: 'El PIN debe ser exactamente 4 dígitos numéricos.',
    });
  }

  try {
    const pinHash = await bcrypt.hash(String(pin), 10);

    await db.execute(
      'UPDATE usuarios SET pin_hash = ? WHERE id_usuario = ?',
      [pinHash, req.usuario.id_usuario]
    );

    return res.status(200).json({ ok: true, mensaje: 'PIN configurado correctamente.' });

  } catch (err) {
    console.error('[POST /set-pin]', err.message);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
});

// ─── POST /api/auth/verify-pin ────────────────────────────────────────────────
// Requiere JWT válido. Verifica el PIN ingresado por el usuario.
// El frontend llama a este endpoint cada vez que el usuario desbloquea la app.
router.post('/verify-pin', verifyToken, async (req, res) => {
  const { pin } = req.body;

  if (!pin || !/^\d{4}$/.test(String(pin))) {
    return res.status(400).json({
      ok:      false,
      mensaje: 'El PIN debe ser exactamente 4 dígitos numéricos.',
    });
  }

  try {
    const [rows] = await db.execute(
      'SELECT pin_hash FROM usuarios WHERE id_usuario = ? LIMIT 1',
      [req.usuario.id_usuario]
    );

    if (rows.length === 0 || !rows[0].pin_hash) {
      return res.status(400).json({
        ok:      false,
        mensaje: 'No tenés un PIN configurado. Configuralo primero.',
      });
    }

    const valido = await bcrypt.compare(String(pin), rows[0].pin_hash);

    if (!valido) {
      return res.status(401).json({ ok: false, mensaje: 'PIN incorrecto.' });
    }

    return res.status(200).json({ ok: true, mensaje: 'PIN verificado correctamente.' });

  } catch (err) {
    console.error('[POST /verify-pin]', err.message);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
});

module.exports = router;