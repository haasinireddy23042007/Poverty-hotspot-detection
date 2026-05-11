import axios from 'axios';

// Connect to the local Flask backend running on your machine
// Replace 192.168.29.181 with your machine's exact IP address if it changes
const BASE_URL = 'http://172.25.20.102:3001/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 8000, // Increased timeout
});

// Add interceptors for debugging
api.interceptors.response.use(
  response => response,
  error => {
    console.log('API Error:', {
      message: error.message,
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
    });
    return Promise.reject(error);
  }
);

export const getDistricts = async () => {
  const { data } = await api.get('/districts');
  return data;
};

export const getHotspots = async () => {
  const { data } = await api.get('/hotspots');
  return data;
};

export const getDistrict = async (name) => {
  const { data } = await api.get(`/district/${name}`);
  return data;
};

export const getStats = async () => {
  const { data } = await api.get('/stats');
  return data;
};

export const retrainModel = async () => {
  const { data } = await api.post('/retrain');
  return data;
};

export const sendAlert = async (email, subject, html) => {
  const { data } = await api.post('/alert', { email, subject, html });
  return data;
};
