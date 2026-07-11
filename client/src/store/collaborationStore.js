import { create } from 'zustand';
import io from 'socket.io-client';
import * as Y from 'yjs';

// Browser doesn't have Buffer; convert Uint8Array<->base64 with btoa/atob.
const uint8ToBase64 = (uint8) => {
  let s = '';
  uint8.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s);
};

const base64ToUint8 = (base64) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};


const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

const useCollaborationStore = create((set, get) => {
  // Keep Yjs docs per documentId for bootstrap.
  const ydocs = new Map();

  return {
    socket: null,
    documentId: null,
    content: '',
    version: 0,
    activeUsers: [],
    chatMessages: [],
    isConnected: false,

    getYjsDoc: (docId) => ydocs.get(docId),

  initSocket: (token) => {
    const socket = io(SOCKET_URL, { auth: { token } });

    // Use a dedicated Y.Doc per connected document.
    // Create docs lazily in joinDocument.

    socket.on('connect', () => set({ isConnected: true }));

      socket.on('disconnect', () => set({ isConnected: false }));

      // Back-compat events (not used by the new CRDT editor)
      socket.on('document-updated', (data) => {
        set({ content: data.content, version: data.version });
      });

      socket.on('user-joined', (data) => {
        set({ content: data.document.content, version: data.document.version, chatMessages: [] });
      });

      socket.on('chat-history', (data) => {
        set({ chatMessages: data.messages || [] });
      });

      socket.on('active-users', (data) => set({ activeUsers: data.users }));
      socket.on('user-left', (data) => set((state) => ({ activeUsers: state.activeUsers.filter((u) => u !== data.userId) })));

      socket.on('chat-message-received', (data) => {
        set((state) => ({ chatMessages: [...state.chatMessages, data] }));
      });

      // CRDT events
      socket.on('yjs-document-state', (data) => {
        const { documentId, update } = data;
        let ydoc = ydocs.get(documentId);
        if (!ydoc) {
          ydoc = new Y.Doc();
          ydocs.set(documentId, ydoc);
        }

        Y.applyUpdate(ydoc, base64ToUint8(update));

        const ytext = ydoc.getText('content');

        set({ content: ytext.toString() });
      });

      socket.on('yjs-update', (data) => {
        const { documentId, update } = data;
        const ydoc = ydocs.get(documentId);
        if (!ydoc) return;

        Y.applyUpdate(ydoc, base64ToUint8(update));

        const ytext = ydoc.getText('content');
        set({ content: ytext.toString() });
      });

      set({ socket });
    },

    joinDocument: (documentId, userId) => {
      const { socket } = get();
      if (!socket) return;

      // Create a local Yjs doc for this document id for event handling.
      if (!ydocs.has(documentId)) ydocs.set(documentId, new Y.Doc());

      // userId is kept for server handler backward compatibility but server must ignore it.
      socket.emit('join-document', { documentId, userId });
      set({ documentId });
    },

    applyRemoteUpdate: (documentId, update) => {
      // Optional helper for components.
      let ydoc = ydocs.get(documentId);
      if (!ydoc) {
        ydoc = new Y.Doc();
        ydocs.set(documentId, ydoc);
      }
      Y.applyUpdate(ydoc, update);
      const ytext = ydoc.getText('content');
      set({ content: ytext.toString() });
    },

    sendLocalUpdate: (documentId, update) => {
      const { socket } = get();
      if (!socket) return;

      // update is Uint8Array; send as base64
      const base64 = uint8ToBase64(update);
      socket.emit('yjs-update', { documentId, update: base64 });
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
    },

    // Kept for backwards compatibility; the Editor no longer uses this.
    editDocumentContent: () => {},
  };
});

export default useCollaborationStore;

