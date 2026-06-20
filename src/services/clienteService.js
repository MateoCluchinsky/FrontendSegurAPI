import api from './api';

export const getClientesPaginados = async (filtro = '', page = 0, size = 10) => {
  const response = await api.get('/clientes', {
    params: { nombre: filtro, page, size }
  });
  return response.data;
};

export const getLocalidades = async () => {
  const response = await api.get('/localidades');
  return response.data;
};

export const searchClientes = async (query) => {
  const response = await api.get('/clientes/search', {
    params: { q: query }
  });
  return response.data;
};

export const createCliente = async (clienteData) => {
  const response = await api.post('/clientes', clienteData);
  return response.data;
};

export const updateCliente = async (id, clienteData) => {
  const response = await api.put(`/clientes/${id}`, clienteData);
  return response.data;
};

export const deleteCliente = async (id) => {
  const response = await api.delete(`/clientes/${id}`);
  return response.data;
};

export const uploadFotoCliente = async (id, file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post(`/clientes/${id}/foto`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
