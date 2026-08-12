const jwt = require('jsonwebtoken');

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

module.exports = { verifyToken };