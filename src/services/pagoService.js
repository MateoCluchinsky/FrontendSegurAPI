import api from './api';

export const obtenerLinkPagoPremium = async () => {
  const response = await api.post('/pagos/premium');
  return response.data; // Retorna directamente la URL (String)
};
