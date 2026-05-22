const { getMongoDb } = require('../config/database');

const activeUsers = new Map();

const handleJoinDocument = async (io, socket, data) => {
  try {
    const { documentId, userId } = data;
    const db = getMongoDb();

    const document = await db.collection('documents').findOne({ _id: documentId });
    if (!document) {
      socket.emit('error', { message: 'Document not found' });
      return;
    }

    const isOwner = document.createdBy === userId;
    const isShared = document.sharedWith?.includes(userId);

    if (!isOwner && !isShared) {
      socket.emit('error', { message: 'Access denied' });
      return;
    }

    socket.join(`doc:${documentId}`);

    if (!activeUsers.has(documentId)) {
      activeUsers.set(documentId, new Set());
    }
    activeUsers.get(documentId).add(userId);

    io.to(`doc:${documentId}`).emit('user-joined', {
      userId,
      document: {
        id: document._id,
        title: document.title,
        content: document.content,
        version: document.version
      }
    });

    socket.emit('active-users', {
      users: Array.from(activeUsers.get(documentId))
    });
  } catch (error) {
    console.error('Error joining document:', error);
    socket.emit('error', { message: 'Failed to join document' });
  }
};

const handleEditDocument = async (io, socket, data) => {
  try {
    const { documentId, change, userId } = data;
    const db = getMongoDb();

    const document = await db.collection('documents').findOne({ _id: documentId });
    if (!document) return;

    const updatedContent = applyChange(document.content, change);

    await db.collection('documents').updateOne(
      { _id: documentId },
      {
        $set: {
          content: updatedContent,
          lastModified: new Date(),
          lastModifiedBy: userId,
          version: document.version + 1
        }
      }
    );

    io.to(`doc:${documentId}`).emit('document-updated', {
      change,
      userId,
      version: document.version + 1,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error updating document:', error);
    socket.emit('error', { message: 'Failed to update document' });
  }
};

const handleCursorMove = (io, socket, data) => {
  const { documentId, userId, position } = data;
  io.to(`doc:${documentId}`).emit('cursor-moved', {
    userId,
    position,
    timestamp: new Date()
  });
};

const handleChatMessage = async (io, socket, data) => {
  try {
    const { documentId, userId, message } = data;
    const db = getMongoDb();

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
      users.forEach(userId => {
        users.delete(userId);
        io.to(`doc:${documentId}`).emit('user-left', { userId });
      });
    }
  }
};

const applyChange = (content, change) => {
  if (change.type === 'insert') {
    return content.slice(0, change.position) + change.value + content.slice(change.position);
  } else if (change.type === 'delete') {
    return content.slice(0, change.position) + content.slice(change.position + change.length);
  }
  return content;
};

module.exports = {
  handleJoinDocument,
  handleEditDocument,
  handleCursorMove,
  handleChatMessage,
  handleDisconnect
};
