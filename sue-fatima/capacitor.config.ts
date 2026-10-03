import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.suefatima.app', // ID corregido para que lo acepte Play Store
  appName: 'sue-fatima',
  webDir: 'dist',              // Carpeta de compilación de Vite
  server: {
    hostname: 'suefatima.local', // Dominio ficticio para saltear CORS
    androidScheme: 'http'        // http, no https: el backend es http sin TLS,
                                  // si acá dice https el WebView bloquea los
                                  // pedidos al backend por "contenido mixto".
  }
};

export default config;
