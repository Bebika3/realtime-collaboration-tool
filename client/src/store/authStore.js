import { create } from 'zustand';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const useAuthStore = create((set) => ({
  token: localStorage.getItem('token'),
  user: null,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      localStorage.setItem('token', response.data.token);
      set({ token: response.data.token, user: response.data.user, loading: false });
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Login failed';
      set({ error: errorMsg, loading: false });
      throw error;
    }
  },

  register: async (email, password, name) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/auth/register`, { email, password, name });
      localStorage.setItem('token', response.data.token);
      set({ token: response.data.token, user: response.data.user, loading: false });
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Registration failed';
      set({ error: errorMsg, loading: false });
      throw error;
    }
  },

  checkToken: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ token: null, user: null });
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/auth/verify`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ token, user: response.data.user });
    } catch (error) {
      localStorage.removeItem('token');
      set({ token: null, user: null });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null });
  }
}));

export default useAuthStore;
