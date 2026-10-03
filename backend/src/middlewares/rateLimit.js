// src/middlewares/rateLimit.js
// Limitador de intentos en memoria (sin dependencias). Sirve para frenar adivinación de
// contraseñas y de PIN (solo hay 10.000 PINs de 4 dígitos).
//
//   limitarFallos({ ventanaMs, max, clave })
//     - cuenta solo los intentos FALLIDOS (respuesta 401/403/400 de la ruta)
//     - al llegar a `max` dentro de la ventana responde 429 hasta que pase el tiempo
//     - un intento exitoso borra el contador

function limitarFallos({ ventanaMs, max, clave }) {
  const registro = new Map(); // clave -> { n, desde }

  setInterval(() => {
    const ahora = Date.now();
    for (const [k, v] of registro) if (ahora - v.desde > ventanaMs) registro.delete(k);
  }, 60000).unref?.();

  return (req, res, next) => {
    const k = clave(req);
    const ahora = Date.now();
    let r = registro.get(k);
    if (r && ahora - r.desde > ventanaMs) { registro.delete(k); r = undefined; }

    if (r && r.n >= max) {
      const seg = Math.ceil((r.desde + ventanaMs - ahora) / 1000);
      res.set('Retry-After', String(seg));
      return res.status(429).json({
        ok: false,
        mensaje: `Demasiados intentos. Esperá ${Math.ceil(seg / 60)} min y probá de nuevo.`,
      });
    }

    res.on('finish', () => {
      if (res.statusCode === 401 || res.statusCode === 403) {
        const actual = registro.get(k);
        if (!actual || ahora - actual.desde > ventanaMs) registro.set(k, { n: 1, desde: Date.now() });
        else actual.n += 1;
      } else if (res.statusCode < 400) {
        registro.delete(k);
      }
    });
    next();
  };
}

const ip = (req) => req.ip || req.socket?.remoteAddress || 'ip';

// Login: 8 fallos cada 15 min por (IP + email) y 30 por IP sola (para no bloquear a todo el
// colegio, que sale por la misma IP, por culpa de una persona).
const limiteLoginCuenta = limitarFallos({
  ventanaMs: 15 * 60 * 1000, max: 8,
  clave: (req) => `${ip(req)}|${String(req.body?.email || '').toLowerCase()}`,
});
const limiteLoginIp = limitarFallos({
  ventanaMs: 15 * 60 * 1000, max: 30, clave: (req) => ip(req),
});

// PIN: 5 fallos cada 5 min por usuario (va después de verifyToken).
const limitePin = limitarFallos({
  ventanaMs: 5 * 60 * 1000, max: 5, clave: (req) => `pin|${req.usuario?.id_usuario}`,
});

module.exports = { limiteLoginCuenta, limiteLoginIp, limitePin };
