import api from './api';

export const getNotificaciones = async () => {
  const response = await api.get('/notificaciones');
  return response.data;
};

export const marcarComoLeida = async (id) => {
  const response = await api.put(`/notificaciones/${id}/leer`);
  return response.data;
};
