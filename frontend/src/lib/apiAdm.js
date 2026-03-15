import axios from 'axios';

const apiAdm = axios.create({ baseURL: '/api' });

// Her istekte admin token'ını header'a ekle
apiAdm.interceptors.request.use((config) => {
  const token = localStorage.getItem('stoksay-adm-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiAdm.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('stoksay-adm-token');
    }
    return Promise.reject(err);
  }
);

export default apiAdm;
