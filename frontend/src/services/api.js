import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
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

export { 
  dropService, 
  reservationService, 
  purchaseService 
};

export default api;
