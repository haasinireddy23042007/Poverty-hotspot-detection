import axios from 'axios';

const BASE = '/api';

export const api = {
  getDistricts:  ()     => axios.get(`${BASE}/districts`).then(r => r.data),
  getHotspots:   ()     => axios.get(`${BASE}/hotspots`).then(r => r.data),
  getStats:      ()     => axios.get(`${BASE}/stats`).then(r => r.data),
  getDistrict:   (name) => axios.get(`${BASE}/district/${encodeURIComponent(name)}`).then(r => r.data),
  predict:       (data) => axios.post(`${BASE}/predict`, data).then(r => r.data),
  retrain:       ()     => axios.post(`${BASE}/retrain`).then(r => r.data),
  sendAlert:      (payload) => axios.post(`${BASE}/alert`, payload).then(r => r.data),
};
