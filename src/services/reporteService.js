import api from './api';

export const descargarExcelPolizas = async () => {
  const response = await api.get('/reportes/polizas/excel', {
    responseType: 'blob', // Necesario para descargar archivos binarios
  });
  return response.data;
};
