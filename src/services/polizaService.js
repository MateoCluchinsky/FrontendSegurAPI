import api from './api';

export const getPolizas = async (params = {}) => {
  const response = await api.get('/polizas', { params });
  return response.data;
};

export const createPoliza = async (polizaData) => {
  const response = await api.post('/polizas', polizaData);
  return response.data;
};

export const updatePoliza = async (id, polizaData) => {
  const response = await api.put(`/polizas/${id}`, polizaData);
  return response.data;
};

export const deletePoliza = async (id) => {
  const response = await api.delete(`/polizas/${id}`);
  return response.data;
};

export const uploadArchivoPoliza = async (id, file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post(`/polizas/${id}/archivo`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getCompanias = async () => {
  const response = await api.get('/companias');
  return response.data;
};

export const getRamos = async () => {
  const response = await api.get('/ramos');
  return response.data;
};
