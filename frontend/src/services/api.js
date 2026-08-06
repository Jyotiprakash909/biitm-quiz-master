import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://biitm-quiz-master.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add admin token if available
api.interceptors.request.use(
  (config) => {
    const adminData = localStorage.getItem('adminInfo');
    if (adminData) {
      try {
        const { token } = JSON.parse(adminData);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (e) {
        // ignore JSON parse error
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
