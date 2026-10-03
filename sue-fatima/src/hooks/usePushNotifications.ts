import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { REFRESH_EVENT } from '@/hooks/useSimulacroActivo';
import { agregarAviso, FINAL_EVENT } from '@/hooks/useAvisos';

export function usePushNotifications() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!usuario) return;
    if (!Capacitor.isNativePlatform()) return; // en el navegador (web) no hay push nativo

    async function iniciar() {
      // Canal de Android propio para simulacros, con vibración e importancia máxima
      // (así se puede diferenciar de otras notificaciones más adelante).
      await PushNotifications.createChannel({
        id:          'simulacros',
        name:        'Simulacros y emergencias',
        description: 'Alertas de inicio de simulacro o emergencia',
        importance:  5, // MAX
        visibility:  1,
        vibration:   true,
      });

      const permisoActual = await PushNotifications.checkPermissions();
      let estado = permisoActual.receive;
      if (estado === 'prompt' || estado === 'prompt-with-rationale') {
        const solicitado = await PushNotifications.requestPermissions();
        estado = solicitado.receive;
      }
      if (estado !== 'granted') {
        console.warn('Permiso de notificaciones no concedido.');
        return;
      }

      await PushNotifications.register();
    }

    const listeners = [
      PushNotifications.addListener('registration', async ({ value: token }) => {
        try {
          await api.post('/api/usuarios/device-token', { token });
        } catch (err) {
          console.error('No se pudo registrar el dispositivo para notificaciones:', err);
        }
      }),
      PushNotifications.addListener('registrationError', err => {
        console.error('Error de registro de notificaciones push:', err);
      }),
      // Push recibido con la app abierta: refrescar el estado del simulacro ya.
      PushNotifications.addListener('pushNotificationReceived', () => {
        window.dispatchEvent(new Event(REFRESH_EVENT));
      }),
      PushNotifications.addListener('pushNotificationActionPerformed', (accion) => {
        window.dispatchEvent(new Event(REFRESH_EVENT));
        // Tocó el aviso de "simulacro finalizado": mostrar el resumen de evacuación
        const data = accion.notification?.data as Record<string, string> | undefined;
        if (data?.tipo === 'SIMULACRO_FINALIZADO' && data.id_simulacro) {
          const id = Number(data.id_simulacro);
          agregarAviso({ id: `fin-${id}`, tipo: 'fin', id_simulacro: id, titulo: 'Evacuación exitosa', texto: 'El simulacro terminó. Tocá para ver el resumen.' });
          window.dispatchEvent(new CustomEvent(FINAL_EVENT, { detail: { id_simulacro: id } }));
        }
        // El usuario tocó la notificación -> llevarlo a Estado en vivo
        navigate('/');
      }),
    ];

    void iniciar();

    return () => {
      listeners.forEach(l => { void l.then(sub => sub.remove()); });
    };
  }, [usuario, navigate]);
}
