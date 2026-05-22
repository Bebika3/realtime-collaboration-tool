import { create } from 'zustand';
import io from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

const useCollaborationStore = create((set, get) => ({
  socket: null,
  documentId: null,
  content: '',
  version: 0,
  activeUsers: [],
  chatMessages: [],
  isConnected: false,

  initSocket: (token) => {
    const socket = io(SOCKET_URL, { auth: { token } });

    socket.on('connect', () => set({ isConnected: true }));
    socket.on('disconnect', () => set({ isConnected: false }));

    socket.on('document-updated', (data) => {
      const { content } = get();
      set({ content: applyChange(content, data.change), version: data.version });
    });

    socket.on('user-joined', (data) => {
      set({ content: data.document.content, version: data.document.version });
    });

    socket.on('active-users', (data) => set({ activeUsers: data.users }));
    socket.on('user-left', (data) => set((state) => ({ activeUsers: state.activeUsers.filter(u => u !== data.userId) })));

    socket.on('chat-message-received', (data) => {
      set((state) => ({ chatMessages: [...state.chatMessages, data] }));
    });

    set({ socket });
  },

  joinDocument: (documentId, userId) => {
    const { socket } = get();
    if (socket) {
      socket.emit('join-document', { documentId, userId });
      set({ documentId });
    }
  },

  editDocument: (change, userId) => {
    const { socket, documentId } = get();
    if (socket) {
      socket.emit('edit-document', { documentId, change, userId });
    }
  },

  sendChatMessage: (userId, message) => {
    const { socket, documentId } = get();
    if (socket) {
      socket.emit('chat-message', { documentId, userId, message });
    }
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  }
}));

const applyChange = (content, change) => {
  if (change.type === 'insert') {
    return content.slice(0, change.position) + change.value + content.slice(change.position);
  } else if (change.type === 'delete') {
    return content.slice(0, change.position) + content.slice(change.position + change.length);
  }
  return content;
};

export default useCollaborationStore;
