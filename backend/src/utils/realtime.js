// src/utils/realtime.js
// Canal en tiempo real (Server-Sent Events) para que todos los dispositivos
// vean al instante lo que hace otro usuario, sin esperar al próximo polling.
//
//  - emitir(evento, datos)  -> avisa a todos los clientes conectados.
//  - presencia()            -> cuántos docentes/directivos hay conectados ahora.
//
// Es en memoria: sirve para un solo proceso Node (el caso de este proyecto).
// Si algún día se corre en varios procesos/servidores habría que pasar esto
// a Redis pub/sub o similar.

const HEARTBEAT_MS = 15000;

// cliente = { res, id_usuario, rol, nombre }
const clientes = new Set();

function presencia() {
  const docentes   = new Set();
  const directivos = new Set();
  for (const c of clientes) {
    if (c.rol === 'docente')   docentes.add(c.id_usuario);
    if (c.rol === 'directivo') directivos.add(c.id_usuario);
  }
  // Se cuenta por usuario distinto: el mismo docente con celular y PC cuenta 1.
  return { docentes: docentes.size, directivos: directivos.size };
}

// Docentes conectados (uno por persona, aunque tenga celular y PC abiertos), con desde cuándo.
function listaDocentes() {
  const porId = new Map();
  for (const c of clientes) {
    if (c.rol !== 'docente') continue;
    const previo = porId.get(c.id_usuario);
    if (!previo || c.desde < previo.desde) {
      porId.set(c.id_usuario, { id_usuario: c.id_usuario, nombre: c.nombre, desde: c.desde });
    }
  }
  return [...porId.values()].sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es'));
}

// Cada cliente recibe el conteo; solo los DIRECTIVOS reciben además quiénes son los docentes
// conectados (los docentes no ven los datos de sus colegas).
function emitirPresencia() {
  const base  = presencia();
  const lista = listaDocentes();
  for (const c of [...clientes]) {
    const datos = c.rol === 'directivo' ? { ...base, docentes_lista: lista } : base;
    escribir(c, `event: presencia\ndata: ${JSON.stringify(datos)}\n\n`);
  }
}

function escribir(cliente, texto) {
  try {
    cliente.res.write(texto);
    return true;
  } catch {
    quitar(cliente.res);
    return false;
  }
}

function emitir(evento, datos = {}) {
  const texto = `event: ${evento}\ndata: ${JSON.stringify(datos)}\n\n`;
  for (const c of [...clientes]) escribir(c, texto);
}

function agregar(usuario, res) {
  const cliente = {
    res,
    id_usuario: usuario.id_usuario,
    rol:        usuario.rol,
    nombre:     usuario.nombre,
    desde:      new Date().toISOString(),
  };
  clientes.add(cliente);
  // Todos (incluido el que recién entra) reciben el conteo actualizado.
  emitirPresencia();
  return cliente;
}

function quitar(res) {
  let quito = false;
  for (const c of clientes) {
    if (c.res === res) { clientes.delete(c); quito = true; }
  }
  if (quito) emitirPresencia();
}

// Latido: mantiene viva la conexión a través de proxies/WebViews y permite
// detectar conexiones muertas (la escritura falla y se las descarta).
const timer = setInterval(() => {
  for (const c of [...clientes]) escribir(c, ': ping\n\n');
}, HEARTBEAT_MS);
timer.unref?.();

module.exports = { agregar, quitar, emitir, presencia };
