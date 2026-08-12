const mqtt = require('mqtt');
require('dotenv/config');

const options = {
  clientId:           process.env.MQTT_CLIENT_ID,
  clean:              true,
  reconnectPeriod:    5000,
  connectTimeout:     10000,
  rejectUnauthorized: false,
  protocolVersion:    5,
};

if (process.env.MQTT_USERNAME) options.username = process.env.MQTT_USERNAME;
if (process.env.MQTT_PASSWORD) options.password = process.env.MQTT_PASSWORD;

const client = mqtt.connect(process.env.MQTT_BROKER_URL, options);

client.on('connect',   ()    => console.log('[MQTT] Conectado al broker EMQX.'));
client.on('error',     (err) => console.error('[MQTT] Error:', err.message));
client.on('reconnect', ()    => console.warn('[MQTT] Reconectando al broker...'));

module.exports = client;