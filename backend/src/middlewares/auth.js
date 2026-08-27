// src/middlewares/auth.js
const jwt = require('jsonwebtoken');

/**
 * Verifica que el request tenga un JWT válido.
 * Si es válido, agrega req.usuario = { id_usuario, nombre, rol }
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token      = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      ok:      false,
      mensaje: 'Acceso denegado. Token no proporcionado.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario   = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      ok:      false,
      mensaje: 'Token inválido o expirado. Volvé a iniciar sesión.',
    });
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

module.exports = { verifyToken, requireRol };