import { create } from 'zustand';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const useDocumentStore = create((set) => {
  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  return {
    documents: [],
    currentDocument: null,
    loading: false,
    error: null,

    fetchDocuments: async () => {
      set({ loading: true, error: null });
      try {
        const response = await axios.get(`${API_URL}/users/documents`, { headers: getHeaders() });
        set({ documents: response.data, loading: false });
      } catch (error) {
        set({ error: error.message, loading: false });
      }
    },

    getDocument: async (id) => {
      set({ loading: true, error: null });
      try {
        const response = await axios.get(`${API_URL}/documents/${id}`, { headers: getHeaders() });
        set({ currentDocument: response.data, loading: false });
        return response.data;
      } catch (error) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    createDocument: async (title, content = '') => {
      set({ loading: true, error: null });
      try {
        const response = await axios.post(`${API_URL}/documents`, { title, content }, { headers: getHeaders() });
        set((state) => ({ documents: [...state.documents, response.data.document], loading: false }));
        return response.data.document;
      } catch (error) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    deleteDocument: async (id) => {
      try {
        await axios.delete(`${API_URL}/documents/${id}`, { headers: getHeaders() });
        set((state) => ({ documents: state.documents.filter(doc => doc._id !== id) }));
      } catch (error) {
        set({ error: error.message });
        throw error;
      }
    }
  };
});

export default useDocumentStore;
