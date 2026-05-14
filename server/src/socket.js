const { persistMessage, getRoomMessages, deleteExpiredMessages } = require('./supabase');

const rooms = new Map();

function setupSocket(io) {
  setInterval(async () => {
    await deleteExpiredMessages();
    for (const [roomId, room] of rooms.entries()) {
      if (room.sockets.size === 0) {
        rooms.delete(roomId);
      }
    }
  }, 60 * 1000);

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    let currentRoomId = null;
    let currentUserId = null;

    socket.on('join_room', async ({ roomId, userId }) => {
      if (!roomId || !userId) return;
      currentRoomId = roomId;
      currentUserId = userId;

      socket.join(roomId);

      if (!rooms.has(roomId)) {
        rooms.set(roomId, { sockets: new Map() });
      }
      const room = rooms.get(roomId);
      room.sockets.set(socket.id, userId);

      const partnerCount = room.sockets.size - 1;
      const partnerOnline = partnerCount > 0;

      socket.emit('partner_status', { online: partnerOnline });

      socket.to(roomId).emit('partner_status', { online: true });

      const history = await getRoomMessages(roomId);
      if (history.length > 0) {
        socket.emit('message_history', history);
      }

      console.log(`User ${userId} joined room ${roomId}`);
    });

    socket.on('message', async (msg) => {
      if (!currentRoomId || !msg.id) return;

      if (msg.expiresAt <= Date.now()) return;

      socket.to(currentRoomId).emit('message', msg);

      await persistMessage(msg);

      const delay = msg.expiresAt - Date.now();
      if (delay > 0) {
        setTimeout(() => {
          io.to(currentRoomId).emit('message_expired', msg.id);
        }, delay);
      }
    });

    socket.on('call_offer', ({ offer, callType, roomId }) => {
      const room = roomId || currentRoomId;
      if (!room) return;
      socket.to(room).emit('call_offer', { offer, callType });
    });

    socket.on('call_answer', ({ answer, roomId }) => {
      const room = roomId || currentRoomId;
      if (!room) return;
      socket.to(room).emit('call_answer', { answer });
    });

    socket.on('ice_candidate', ({ candidate, roomId }) => {
      const room = roomId || currentRoomId;
      if (!room) return;
      socket.to(room).emit('ice_candidate', { candidate });
    });

    socket.on('call_end', ({ roomId }) => {
      const room = roomId || currentRoomId;
      if (!room) return;
      socket.to(room).emit('call_end');
    });

    socket.on('disconnect', () => {
      if (currentRoomId && rooms.has(currentRoomId)) {
        const room = rooms.get(currentRoomId);
        room.sockets.delete(socket.id);

        if (room.sockets.size > 0) {
          socket.to(currentRoomId).emit('partner_status', { online: false });
        }
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}

module.exports = { setupSocket };
