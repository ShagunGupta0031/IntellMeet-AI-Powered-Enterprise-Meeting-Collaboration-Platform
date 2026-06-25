require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

const app = require('./app');
const connectDB = require('./config/db');
const registerSocketHandlers = require('./sockets/meetingSocket');

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();

  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      credentials: true,
    },
  });

  registerSocketHandlers(io);

  server.listen(PORT, () => {
    console.log(`[Server] IntelliMeet backend running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });

  process.on('unhandledRejection', (err) => {
    console.error('[Fatal] Unhandled rejection:', err);
    server.close(() => process.exit(1));
  });
}

start();
