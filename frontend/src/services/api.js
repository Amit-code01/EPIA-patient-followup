import axios from 'axios';
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' });
export const getError = error => error.response?.data?.error || 'Could not reach the service. Check that the backend is running.';
