// src/utils/push.js
const db                       = require('../config/db');
const { getMessaging }         = require('firebase-admin/messaging');
const { firebaseApp, firebaseListo } = require('../config/firebase');

const CANAL_SIMULACROS = 'simulacros';

/**
 * Manda una notificación push a todos los usuarios activos con un
 * fcm_token guardado. Se usa "fire and forget": si falla, no debe
 * romper el flujo principal (iniciar/finalizar un simulacro).
 */
async function enviarPushATodos({ titulo, cuerpo, data = {} }) {
  if (!firebaseListo) {
    console.warn('[Push] Firebase no está configurado, se omite el envío.');
    return;
  }

  const conn = await db.getConnection();
  let tokens = [];
  try {
    const [rows] = await conn.execute(
      `SELECT fcm_token FROM usuarios
       WHERE activo = 1 AND fcm_token IS NOT NULL AND fcm_token <> ''`
    );
    tokens = rows.map(r => r.fcm_token);
  } finally {
    conn.release();
  }

  console.log(`[Push] Dispositivos registrados: ${tokens.length}`);
  if (tokens.length === 0) {
    console.log('[Push] No hay dispositivos registrados, no se envía nada.');
    return;
  }

  const mensaje = {
    tokens,
    notification: { title: titulo, body: cuerpo },
    data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    android: {
      priority: 'high',
      notification: {
        channelId:     CANAL_SIMULACROS,
        // Vibra fuerte y distinto a una notificación común: pausa corta,
        // dos vibraciones largas. Tiempos en milisegundos.
        vibrateTimingsMillis: [0, 500, 250, 500],
        sound: 'default',
        priority: 'max',
        visibility: 'public',
      },
    },
  };

  try {
    const respuesta = await getMessaging(firebaseApp).sendEachForMulticast(mensaje);
    console.log(`[Push] Enviado: ${respuesta.successCount} ok, ${respuesta.failureCount} fallidos.`);
    // Si algo falla, mostrar el motivo real (antes solo se veía la cantidad).
    respuesta.responses.forEach((r, i) => {
      if (!r.success) console.warn(`[Push] Falló el token ...${String(tokens[i]).slice(-8)}: ${r.error?.code} - ${r.error?.message}`);
    });

    // Limpiar tokens inválidos/expirados (usuario desinstaló la app, etc.)
    const tokensInvalidos = [];
    respuesta.responses.forEach((r, i) => {
      if (!r.success && ['messaging/registration-token-not-registered', 'messaging/invalid-argument'].includes(r.error?.code)) {
        tokensInvalidos.push(tokens[i]);
      }
    });
    if (tokensInvalidos.length > 0) {
      const conn2 = await db.getConnection();
      try {
        await conn2.query(
          `UPDATE usuarios SET fcm_token = NULL WHERE fcm_token IN (?)`,
          [tokensInvalidos]
        );
      } finally {
        conn2.release();
      }
    }
  } catch (err) {
    console.error('[Push] Error enviando notificación:', err.message);
  }
}

module.exports = { enviarPushATodos, CANAL_SIMULACROS };