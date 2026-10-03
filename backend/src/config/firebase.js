// src/config/firebase.js
const { initializeApp, cert } = require('firebase-admin/app');
const path = require('path');

// La ruta al JSON de la cuenta de servicio se define en el .env:
//   FIREBASE_SERVICE_ACCOUNT=./src/config/firebase-service-account.json
// Ese archivo NUNCA se sube a git (ver .gitignore).
const credencialPath = process.env.FIREBASE_SERVICE_ACCOUNT
  ? path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT)
  : null;

let firebaseApp = null;
let firebaseListo = false;

if (credencialPath) {
  try {
    const serviceAccount = require(credencialPath);
    firebaseApp = initializeApp({ credential: cert(serviceAccount) });
    firebaseListo = true;
    console.log('[Firebase] Admin SDK inicializado correctamente.');
  } catch (err) {
    console.error('[Firebase] No se pudo inicializar (revisá FIREBASE_SERVICE_ACCOUNT en .env):', err.message);
  }
} else {
  console.warn('[Firebase] FIREBASE_SERVICE_ACCOUNT no está definido en .env — las notificaciones push están desactivadas.');
}

module.exports = { firebaseApp, firebaseListo };