// src/services/clock.ts
// Reloj de referencia = hora del SERVIDOR.
//
// El cronómetro del simulacro resta "ahora" a la hora de inicio que guardó el
// servidor. Si "ahora" sale del reloj del celular/PC y ese reloj va unos
// segundos atrasado, la resta da negativo (se mostraba 00:00:00 hasta que el
// reloj del dispositivo alcanzaba al del servidor) o adelantado (arrancaba
// salteando segundos). Para que todos los dispositivos muestren lo mismo, se
// mide la diferencia con el servidor y se corrige.

let offsetMs = 0;          // hora del servidor - hora del dispositivo
let mejorRtt = Infinity;   // latencia de la mejor muestra tomada
let ultimaMuestra = 0;

/**
 * Registra una muestra: el servidor dijo `servidorIso` en algún momento entre
 * `t0` (se envió el pedido) y `t1` (llegó la respuesta), según el reloj local.
 */
export function sincronizarReloj(servidorIso: string, t0: number, t1: number) {
  const servidor = Date.parse(servidorIso);
  const rtt = t1 - t0;
  if (!Number.isFinite(servidor) || rtt < 0 || rtt > 3000) return; // muestra inútil

  // La mejor estimación es la de menor latencia (menos incertidumbre), pero se
  // renueva cada minuto para seguir la deriva del reloj.
  const ahora = Date.now();
  if (rtt <= mejorRtt || ahora - ultimaMuestra > 60_000) {
    // Se asume que la respuesta tardó rtt/2 en llegar.
    offsetMs = servidor + rtt / 2 - t1;
    mejorRtt = rtt;
    ultimaMuestra = ahora;
  }
}

/** Hora actual según el servidor (ms desde epoch). */
export const ahoraServidor = () => Date.now() + offsetMs;

/** Solo para pruebas. */
export const _resetReloj = () => { offsetMs = 0; mejorRtt = Infinity; ultimaMuestra = 0; };
