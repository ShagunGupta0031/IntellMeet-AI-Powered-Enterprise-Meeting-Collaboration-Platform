const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Meeting = require('../models/Meeting');
const Message = require('../models/Message');
const TranscriptEntry = require('../models/TranscriptEntry');

// In-memory presence map: roomCode -> Map(socketId -> { userId, name, initials })
// For a multi-server deployment, replace this with a Redis-backed adapter.
const rooms = new Map();

function getRoom(roomCode) {
  if (!rooms.has(roomCode)) rooms.set(roomCode, new Map());
  return rooms.get(roomCode);
}

function registerSocketHandlers(io) {
  // Authenticate the socket using the same JWT issued by /api/auth/login
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication token missing'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('User not found'));

      socket.user = { id: user._id.toString(), name: user.name, initials: user.initials };
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.user.name} (${socket.id})`);

    let currentRoom = null;

    // ---- Join / leave meeting room ----
    socket.on('join-room', async ({ roomCode }) => {
      try {
        const meeting = await Meeting.findOne({ roomCode });
        if (!meeting) return socket.emit('error-message', { message: 'Meeting not found' });

        currentRoom = roomCode;
        socket.join(roomCode);

        const presence = getRoom(roomCode);
        presence.set(socket.id, socket.user);

        // Tell everyone else someone joined, and send the new joiner the current roster
        socket.to(roomCode).emit('user-joined', socket.user);
        socket.emit('room-roster', Array.from(presence.values()));

        if (!meeting.participants.some((p) => p.toString() === socket.user.id)) {
          meeting.participants.push(socket.user.id);
          await meeting.save();
        }
      } catch (err) {
        socket.emit('error-message', { message: 'Failed to join room' });
      }
    });

    socket.on('leave-room', () => leaveCurrentRoom());

    function leaveCurrentRoom() {
      if (!currentRoom) return;
      const presence = getRoom(currentRoom);
      presence.delete(socket.id);
      socket.to(currentRoom).emit('user-left', socket.user);
      socket.leave(currentRoom);
      currentRoom = null;
    }

    // ---- WebRTC signaling (mesh-style peer-to-peer) ----
    // Client flow: on 'user-joined', existing peers create an offer and emit 'webrtc-offer'
    // targeted at the new peer's socket id; the new peer answers; ICE candidates relayed both ways.
    socket.on('webrtc-offer', ({ to, offer }) => {
      io.to(to).emit('webrtc-offer', { from: socket.id, fromUser: socket.user, offer });
    });

    socket.on('webrtc-answer', ({ to, answer }) => {
      io.to(to).emit('webrtc-answer', { from: socket.id, answer });
    });

    socket.on('webrtc-ice-candidate', ({ to, candidate }) => {
      io.to(to).emit('webrtc-ice-candidate', { from: socket.id, candidate });
    });

    // ---- Media state (mic/cam/screen-share toggles) ----
    socket.on('media-state-change', ({ kind, enabled }) => {
      if (!currentRoom) return;
      socket.to(currentRoom).emit('media-state-change', { userId: socket.user.id, kind, enabled });
    });

    // ---- Chat ----
    socket.on('chat-message', async ({ meetingId, text }) => {
      if (!currentRoom || !text?.trim()) return;
      try {
        const message = await Message.create({ meeting: meetingId, sender: socket.user.id, text: text.trim() });
        const payload = {
          _id: message._id,
          text: message.text,
          sender: socket.user,
          createdAt: message.createdAt,
        };
        io.to(currentRoom).emit('chat-message', payload);
      } catch (err) {
        socket.emit('error-message', { message: 'Failed to send chat message' });
      }
    });

    // ---- Live transcript push (from client-side speech recognition) ----
    socket.on('transcript-line', async ({ meetingId, text, wpm }) => {
      if (!currentRoom || !text?.trim()) return;
      try {
        const entry = await TranscriptEntry.create({
          meeting: meetingId,
          speaker: socket.user.id,
          text: text.trim(),
          wpm,
        });
        io.to(currentRoom).emit('transcript-line', {
          speaker: socket.user,
          text: entry.text,
          wpm: entry.wpm,
          timestamp: entry.timestamp,
        });
      } catch (err) {
        socket.emit('error-message', { message: 'Failed to save transcript line' });
      }
    });

    // ---- Reactions, raise hand, task updates (lightweight broadcast events) ----
    socket.on('reaction', ({ emoji }) => {
      if (!currentRoom) return;
      socket.to(currentRoom).emit('reaction', { userId: socket.user.id, emoji });
    });

    socket.on('raise-hand', ({ raised }) => {
      if (!currentRoom) return;
      socket.to(currentRoom).emit('raise-hand', { userId: socket.user.id, raised });
    });

    socket.on('task-updated', (task) => {
      if (!currentRoom) return;
      socket.to(currentRoom).emit('task-updated', task);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.user.name} (${socket.id})`);
      leaveCurrentRoom();
    });
  });
}

module.exports = registerSocketHandlers;
