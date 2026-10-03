// Arranque con PM2 (opción para Linux; en Windows se recomienda NSSM, ver GUIA_INSTALACION_COLEGIO.md)
//   npm i -g pm2 && pm2 start ecosystem.config.js && pm2 save && pm2 startup
module.exports = {
  apps: [{
    name: 'sue-backend',
    script: 'src/app.js',
    cwd: __dirname,
    env: { NODE_ENV: 'production' },
    autorestart: true,
    restart_delay: 3000,        // si se cae, espera 3 s y vuelve a levantar
    max_restarts: 1000,
    max_memory_restart: '400M', // reinicio de seguridad ante fugas de memoria
  }],
};
