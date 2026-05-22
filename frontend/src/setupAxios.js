import axios from 'axios';
const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://ai-inventory-wx72.onrender.com';
axios.defaults.baseURL = baseURL || 'http://localhost:5000';
