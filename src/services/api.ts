import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:7070',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


export const loginUser = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  };