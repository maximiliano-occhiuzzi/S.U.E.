// src/middlewares/auth.js
const jwt = require('jsonwebtoken');
const db  = require('../config/db');

// Cache corto del estado real del usuario en la base. Así un usuario dado de baja, o al que le
// cambiaron el rol, pierde el acceso en segundos y no recién cuando vence su token (15 min),
// sin pegarle a la base en cada pedido (el celular consulta cada pocos segundos).
const CACHE_MS = 5000;
const cache = new Map(); // id_usuario -> { activo, rol, nombre, hasta }

async function estadoUsuario(id) {
  const hit = cache.get(id);
  if (hit && hit.hasta > Date.now()) return hit;
  const [rows] = await db.execute(
    'SELECT activo, rol, nombre FROM usuarios WHERE id_usuario = ? LIMIT 1', [id]
  );
  const u = rows[0]
    ? { activo: rows[0].activo === 1 || rows[0].activo === true, rol: rows[0].rol, nombre: rows[0].nombre }
    : { activo: false, rol: null, nombre: null };
  cache.set(id, { ...u, hasta: Date.now() + CACHE_MS });
  return u;
}

/** Olvida el estado en cache de un usuario (llamar al editarlo / darlo de baja). */
function olvidarUsuario(id) {
  cache.delete(Number(id));
}

/**
 * Exige un JWT válido de un usuario que SIGA existiendo y activo.
 * Si es válido, agrega req.usuario = { id_usuario, nombre, rol } (el rol sale de la base).
 */
async function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token      = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      ok:      false,
      mensaje: 'Acceso denegado. Token no proporcionado.',
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch (err) {
    // 401 (no 403): el frontend renueva la sesión sola ante un 401. Con 403 nunca lo hacía y,
    // a los 15 min de abrir la app, todos los pedidos fallaban y la pantalla quedaba congelada.
    return res.status(401).json({
      ok:      false,
      mensaje: 'Token inválido o expirado. Volvé a iniciar sesión.',
      expirado: err.name === 'TokenExpiredError',
    });
  }

  try {
    const u = await estadoUsuario(decoded.id_usuario);
    if (!u.activo) {
      return res.status(401).json({
        ok: false, mensaje: 'Tu cuenta está desactivada o ya no existe.', desactivado: true,
      });
    }
    req.usuario = { id_usuario: decoded.id_usuario, nombre: u.nombre, rol: u.rol };
    next();
  } catch (err) {
    console.error('[auth] No se pudo validar al usuario:', err.message);
    // Ante la duda NO se deja pasar.
    return res.status(503).json({ ok: false, mensaje: 'No se pudo validar la sesión. Reintentá.' });
  }
}

/**
 * Verifica que el usuario tenga uno de los roles requeridos.
 * Uso: router.post('/iniciar', verifyToken, requireRol('directivo', 'coordinador'), handler)
 */
function requireRol(...roles) {
  return (req, res, next) => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      return res.status(403).json({
        ok:      false,
        mensaje: `Acceso denegado. Se requiere uno de estos roles: ${roles.join(', ')}.`,
      });
    }
    next();
  };
}

module.exports = { verifyToken, requireRol, olvidarUsuario };
