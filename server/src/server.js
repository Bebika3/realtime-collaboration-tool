const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const { connectDatabase } = require('./config/database');
const { connectRedis } = require('./config/redis');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const documentRoutes = require('./routes/document');
const { authenticateToken } = require('./middleware/auth');
const collaborationHandler = require('./handlers/collaboration');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/documents', authenticateToken, documentRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join-document', (data) => {
    collaborationHandler.handleJoinDocument(io, socket, data);
  });

  socket.on('edit-document', (data) => {
    collaborationHandler.handleEditDocument(io, socket, data);
  });

  socket.on('cursor-move', (data) => {
    collaborationHandler.handleCursorMove(io, socket, data);
  });

  socket.on('chat-message', (data) => {
    collaborationHandler.handleChatMessage(io, socket, data);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    collaborationHandler.handleDisconnect(io, socket);
  });
});

async function startServer() {
  try {
    await connectDatabase();
    console.log('✓ Database connected');

    await connectRedis();
    console.log('✓ Redis connected');

    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = { app, server, io };
