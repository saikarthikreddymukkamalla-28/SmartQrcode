import api from './api.js';

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  const { session } = response.data;
  if (session && session.access_token) {
    localStorage.setItem('qube_token', session.access_token);
    localStorage.setItem('qube_user', JSON.stringify(session.user));
  }
  return response.data;
};

export const register = async (email, password, name) => {
  const response = await api.post('/auth/register', { email, password, name });
  const { session } = response.data;
  if (session && session.access_token) {
    localStorage.setItem('qube_token', session.access_token);
    localStorage.setItem('qube_user', JSON.stringify(session.user));
  }
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('qube_token');
  localStorage.removeItem('qube_user');
};

export const getProfile = async () => {
  const response = await api.get('/profile');
  if (response.data?.user) {
    localStorage.setItem('qube_user', JSON.stringify(response.data.user));
  }
  return response.data;
};

export const updateProfile = async (formData) => {
  // formData will contain name, password, avatar file
  const response = await api.put('/profile', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  if (response.data?.user) {
    localStorage.setItem('qube_user', JSON.stringify(response.data.user));
  }
  return response.data;
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('qube_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
};
