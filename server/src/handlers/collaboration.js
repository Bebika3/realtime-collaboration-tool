const { getMongoDb } = require('../config/database');
const Y = require('yjs');

const activeUsers = new Map();

const getAuthUserId = (socket) => {
  // socket.user is injected in server/src/server.js via JWT verification
  return socket.user?.id;
};

const isUserAllowedForDocument = (document, userId) => {
  const isOwner = document.createdBy === userId;
  const isShared = document.sharedWith?.includes(userId);
  return isOwner || isShared;
};

const getOrCreateYDocForDocument = async (db, document) => {
  // Server persistence strategy: store Yjs update state as base64 in `documents.yjsState`.
  // If absent, bootstrap from legacy `documents.content`.
  const ydoc = new Y.Doc();

  if (document.yjsState) {
    const updateBuf = Buffer.from(document.yjsState, 'base64');
    Y.applyUpdate(ydoc, updateBuf);
  } else {
    const ytext = ydoc.getText('content');
    const initial = document.content || '';
    if (initial.length > 0) {
      ydoc.transact(() => {
        ytext.insert(0, initial);
      });
    }
    // Persist initial state for next time.
    const state = Y.encodeStateAsUpdate(ydoc);
    const stateB64 = Buffer.from(state).toString('base64');
    await db.collection('documents').updateOne({ _id: document._id }, { $set: { yjsState: stateB64 } });
  }

  return ydoc;
};

const handleJoinDocument = async (io, socket, data) => {
  try {
    const { documentId } = data;
    const userId = getAuthUserId(socket);

    if (!userId) {
      socket.emit('error', { message: 'Access denied' });
      return;
    }

    const db = getMongoDb();
    const document = await db.collection('documents').findOne({ _id: documentId });

    if (!document) {
      socket.emit('error', { message: 'Document not found' });
      return;
    }

    if (!isUserAllowedForDocument(document, userId)) {
      socket.emit('error', { message: 'Access denied' });
      return;
    }

    socket.join(`doc:${documentId}`);

    if (!activeUsers.has(documentId)) {
      activeUsers.set(documentId, new Set());
    }
    activeUsers.get(documentId).add(userId);

    // Keep legacy user-joined event (for ActiveUsers + title/initial content)
    io.to(`doc:${documentId}`).emit('user-joined', {
      userId,
      document: {
        id: document._id,
        title: document.title,
        content: document.content || '',
        version: document.version
      }
    });

    // Send active users list to the joining socket
    socket.emit('active-users', {
      users: Array.from(activeUsers.get(documentId))
    });

    // Send chat history to the joining socket
    const messages = await db.collection('chat_messages')
      .find({ documentId })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();

    socket.emit('chat-history', {
      messages: messages.reverse()
    });

    // CRDT bootstrap: send full Yjs state to the joining socket
    const ydoc = await getOrCreateYDocForDocument(db, document);
    const state = Y.encodeStateAsUpdate(ydoc);
    socket.emit('yjs-document-state', {
      documentId,
      update: Buffer.from(state).toString('base64')
    });
  } catch (error) {
    console.error('Error joining document:', error);
    socket.emit('error', { message: 'Failed to join document' });
  }
};

const handleYjsUpdate = async (io, socket, data) => {
  try {
    const { documentId, update: updateBase64 } = data;
    const userId = getAuthUserId(socket);

    if (!userId || !documentId || !updateBase64) {

      socket.emit('error', { message: 'Access denied' });
      return;
    }

    const db = getMongoDb();
    const document = await db.collection('documents').findOne({ _id: documentId });
    if (!document) {
      socket.emit('error', { message: 'Document not found' });
      return;
    }

    if (!isUserAllowedForDocument(document, userId)) {
      socket.emit('error', { message: 'Access denied' });
      return;
    }

    const updateBuf = Buffer.from(updateBase64, 'base64');

    // Load current state, apply update, persist the new state.
    const ydoc = await getOrCreateYDocForDocument(db, document);
    Y.applyUpdate(ydoc, updateBuf);

    const newState = Y.encodeStateAsUpdate(ydoc);
    const newStateB64 = Buffer.from(newState).toString('base64');

    await db.collection('documents').updateOne(
      { _id: documentId },
      {
        $set: {
          yjsState: newStateB64,
          lastModified: new Date(),
          lastModifiedBy: userId,
          // Keep legacy content/version columns in sync for the UI/HTTP API.
          content: ydoc.getText('content').toString(),
          version: (document.version || 0) + 1
        }
      }
    );

    // Broadcast update to other clients in the same doc room.
    socket.to(`doc:${documentId}`).emit('yjs-update', {
      documentId,
      update: updateBase64
    });
  } catch (error) {
    console.error('Error handling yjs update:', error);
  }
};

// Kept for backwards compatibility; CRDT editor no longer uses this event.
const handleEditDocumentContent = async (io, socket, data) => {
  try {
    const { documentId, content, userId: fallbackUserId } = data;
    const userId = getAuthUserId(socket) || fallbackUserId;

    const db = getMongoDb();
    const document = await db.collection('documents').findOne({ _id: documentId });
    if (!document) {
      socket.emit('error', { message: 'Document not found' });
      return;
    }

    if (!isUserAllowedForDocument(document, userId)) {
      socket.emit('error', { message: 'Access denied' });
      return;
    }

    // Legacy overwrite behavior.
    const nextVersion = (document.version || 0) + 1;

    await db.collection('documents').updateOne(
      { _id: documentId },
      {
        $set: {
          content,
          lastModified: new Date(),
          lastModifiedBy: userId,
          version: nextVersion
        }
      }
    );

    io.to(`doc:${documentId}`).emit('document-updated', {
      content,
      userId,
      version: nextVersion,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error updating document:', error);
    socket.emit('error', { message: 'Failed to update document' });
  }
};

const handleCursorMove = (io, socket, data) => {
  const { documentId, position } = data;
  const userId = getAuthUserId(socket);
  io.to(`doc:${documentId}`).emit('cursor-moved', {
    userId,
    position,
    timestamp: new Date()
  });
};

const handleChatMessage = async (io, socket, data) => {
  try {
    const { documentId, message, userId: fallbackUserId } = data;
    const userId = getAuthUserId(socket) || fallbackUserId;

    const db = getMongoDb();

    const document = await db.collection('documents').findOne({ _id: documentId });
    if (!document) return;
    if (!isUserAllowedForDocument(document, userId)) return;

    await db.collection('chat_messages').insertOne({
      documentId,
      userId,
      message,
      timestamp: new Date()
    });

    io.to(`doc:${documentId}`).emit('chat-message-received', {
      userId,
      message,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error handling chat message:', error);
  }
};

const handleDisconnect = (io, socket) => {
  for (const [documentId, users] of activeUsers.entries()) {
    if (socket.rooms.has(`doc:${documentId}`)) {
      users.forEach((userId) => {
        users.delete(userId);
        io.to(`doc:${documentId}`).emit('user-left', { userId });
      });
    }
  }
};

module.exports = {
  handleJoinDocument,
  handleYjsUpdate,
  handleEditDocumentContent,
  handleCursorMove,
  handleChatMessage,
  handleDisconnect
};

