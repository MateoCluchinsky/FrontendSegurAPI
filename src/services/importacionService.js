import api from './api';

export const analizarArchivoCartera = async (file, companiaId) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('companiaId', companiaId);

  const response = await api.post('/importacion/analizar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const ejecutarImportacionCartera = async (file, companiaId, config) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('companiaId', companiaId);
  formData.append('config', typeof config === 'string' ? config : JSON.stringify(config));

  const response = await api.post('/importacion/ejecutar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
