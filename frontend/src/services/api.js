import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : 'https://drop.atysan.xyz/api');
const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const dropService = {
  getDrops: () => api.get('/drops').then(res => res.data.data),
  createDrop: (data) => api.post('/drops', data).then(res => res.data.data),
};

const reservationService = {
  reserveItem: (userId, dropId) => 
    api.post('/reservations', { userId, dropId }).then(res => res.data.data),
};

const purchaseService = {
  completePurchase: (reservationId) => 
    api.post('/purchases', { reservationId }).then(res => res.data.data),
  getUserPurchases: (userId) =>
    api.get(`/purchases/user/${userId}`).then(res => res.data.data),
  getAllPurchases: () =>
    api.get('/purchases').then(res => res.data.data),
};

const authService = {
  login: (username, password) => 
    api.post('/auth/login', { username, password }).then(res => res.data),
  register: (userData) => 
    api.post('/auth/register', userData).then(res => res.data),
};

export { 
  dropService, 
  reservationService, 
  purchaseService,
  authService
};

export default api;
