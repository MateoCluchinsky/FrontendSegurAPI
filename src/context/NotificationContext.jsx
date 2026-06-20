import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { AuthContext } from './AuthContext';
import { getNotificaciones, marcarComoLeida } from '../services/notificacionService';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [stompClient, setStompClient] = useState(null);

  const fetchHistorial = useCallback(async () => {
    try {
      const data = await getNotificaciones();
      // Verificamos si devuelve paginado o array directo
      const content = data.content || data.data || data;
      setNotifications(Array.isArray(content) ? content : []);
    } catch (error) {
      console.error("Error al cargar historial de notificaciones:", error);
    }
  }, []);

  useEffect(() => {
    let client = null;

    if (isAuthenticated && user?.id) {
      // 1. Cargar historial
      fetchHistorial();

      // 2. Configurar STOMP Client
      const token = localStorage.getItem('token');
      const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';

      client = new Client({
        webSocketFactory: () => new SockJS(wsUrl),
        connectHeaders: {
          Authorization: `Bearer ${token}`
        },
        debug: (str) => {
          // console.log(str); // Descomentar para debug STOMP
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      client.onConnect = (frame) => {
        console.log('Conectado a WebSockets', frame);
        // Suscribirse al canal específico del usuario
        client.subscribe(`/topic/notificaciones/${user.id}`, (message) => {
          if (message.body) {
            try {
              const nuevaNotificacion = JSON.parse(message.body);
              setNotifications((prev) => [nuevaNotificacion, ...prev]);
            } catch(e) {
              console.error("Error parseando notificación:", e);
            }
          }
        });
      };

      client.onStompError = (frame) => {
        console.error('Error de STOMP:', frame.headers['message']);
        console.error('Detalles:', frame.body);
      };

      client.activate();
      setStompClient(client);

    } else {
      setNotifications([]);
    }

    return () => {
      if (client) {
        client.deactivate();
      }
    };
  }, [isAuthenticated, user?.id, fetchHistorial]);

  const unreadCount = notifications.filter(n => !n.leida).length;

  const markAsRead = async (id) => {
    // Optimistic UI update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
    try {
      await marcarComoLeida(id);
    } catch (error) {
      console.error("Error al marcar notificación como leída:", error);
      // Revert in case of error
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, leida: false } : n));
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
