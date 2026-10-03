// src/utils/migraciones.js
// Prepara la base al arrancar el servidor (es seguro correrlo muchas veces):
//  - crea la tabla de tipos de incidencia (antes eran 5 valores fijos en el código),
//  - convierte incidencias.tipo_incidencia de ENUM a texto para aceptar tipos nuevos.
// Así no hace falta correr ningún SQL a mano: alcanza con reiniciar el backend.
const db = require('../config/db');

const TIPOS_INICIALES = [
  // codigo,              nombre,             gravedad,      icono,     color,    orden
  ['incendio',          'Incendio',          'critica',     'flame',   'red',    1],
  ['humo',              'Humo',              'moderada',    'cloud',   'amber',  2],
  ['acceso_bloqueado',  'Acceso bloqueado',  'moderada',    'barrier', 'orange', 3],
  ['persona_lesionada', 'Lesionado',         'critica',     'person',  'blue',   4],
  ['otro',              'Otro',              'informativa', 'dots',    'green',  999],
];

async function ejecutar() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS tipos_incidencia (
        codigo     VARCHAR(40)  NOT NULL PRIMARY KEY,
        nombre     VARCHAR(60)  NOT NULL,
        gravedad   ENUM('critica','moderada','informativa') NOT NULL DEFAULT 'informativa',
        icono      VARCHAR(20)  NOT NULL DEFAULT 'dots',
        color      VARCHAR(20)  NOT NULL DEFAULT 'green',
        orden      INT          NOT NULL DEFAULT 0,
        activo     TINYINT(1)   NOT NULL DEFAULT 1,
        created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`);

    const [[{ n }]] = await db.execute('SELECT COUNT(*) AS n FROM tipos_incidencia');
    if (Number(n) === 0) {
      for (const t of TIPOS_INICIALES) {
        await db.execute(
          'INSERT INTO tipos_incidencia (codigo, nombre, gravedad, icono, color, orden) VALUES (?,?,?,?,?,?)', t);
      }
      console.log('[Migración] Tipos de incidencia iniciales creados.');
    }

    const [cols] = await db.execute(
      `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'incidencias' AND COLUMN_NAME = 'tipo_incidencia'`);
    if (cols[0] && /^enum/i.test(cols[0].COLUMN_TYPE)) {
      await db.execute(`ALTER TABLE incidencias MODIFY tipo_incidencia VARCHAR(40) NOT NULL DEFAULT 'otro'`);
      console.log('[Migración] incidencias.tipo_incidencia ahora acepta tipos nuevos.');
    }
    const [fotoCol] = await db.execute(
      `SELECT 1 FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'foto'`);
    if (!fotoCol.length) {
      await db.execute('ALTER TABLE usuarios ADD COLUMN foto MEDIUMBLOB NULL');
      console.log('[Migración] usuarios.foto creada (foto de perfil).');
    }
    console.log('[Migración] Base de datos lista.');
  } catch (err) {
    console.error('[Migración] ERROR (los tipos de incidencia nuevos no van a funcionar):', err.message);
  }
}

module.exports = { ejecutar, TIPOS_INICIALES };
