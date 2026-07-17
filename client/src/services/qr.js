import api from './api.js';

export const getQRs = async () => {
  const response = await api.get('/qrs');
  return response.data;
};

export const createQR = async (formData) => {
  const response = await api.post('/qrs', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateQR = async (id, formData) => {
  const response = await api.put(`/qrs/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteQR = async (id) => {
  const response = await api.delete(`/qrs/${id}`);
  return response.data;
};

export const getQRAnalytics = async (id) => {
  const response = await api.get(`/analytics/${id}`);
  return response.data;
};

export const getDashboardSummary = async () => {
  const response = await api.get('/analytics/summary');
  return response.data;
};
