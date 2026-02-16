const { Server } = require('socket.io');
let io;

function initSocket(server) {
  if (!io) {
    const CLIENT_URL = process.env.CLIENT_URL || '*';
    
    io = new Server(server, {
      cors: {
        origin: CLIENT_URL,
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ["websocket", "polling"],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Track active rooms per socket for cleanup
    const socketRooms = new Map();

    io.on("connection", (socket) => {
      console.log(`[Socket.IO] ✅ User Connected: ${socket.id}`);
      socketRooms.set(socket.id, new Set());

      socket.on("disconnect", (reason) => {
        console.log(`[Socket.IO] ❌ User Disconnected: ${socket.id} (Reason: ${reason})`);
        socketRooms.delete(socket.id);
      });

      socket.on("connect_error", (err) => {
        console.error(`[Socket.IO] 🔴 Connection Error for ${socket.id}:`, err.message);
      });

      socket.on("error", (err) => {
        console.error(`[Socket.IO] 🔴 Socket Error for ${socket.id}:`, err.message);
      });

      // Join Room
      socket.on("join_room", (roomId) => {
        const roomStr = String(roomId);
        socket.join(roomStr);
        const rooms = socketRooms.get(socket.id);
        if (rooms) rooms.add(roomStr);
        console.log(`[Socket.IO] 🚪 User ${socket.id} joined room: ${roomStr}`);
        socket.to(roomStr).emit("user_joined_room", { socketId: socket.id, roomId: roomStr });
      });

      // Leave Room
      socket.on("leave_room", (roomId) => {
        const roomStr = String(roomId);
        socket.leave(roomStr);
        const rooms = socketRooms.get(socket.id);
        if (rooms) rooms.delete(roomStr);
        console.log(`[Socket.IO] 🚪 User ${socket.id} left room: ${roomStr}`);
        socket.to(roomStr).emit("user_left_room", { socketId: socket.id, roomId: roomStr });
      });

      // Typing Indicators
      socket.on("group:typing", (chatId) => {
        const roomStr = String(chatId);
        console.log(`[Socket.IO] ⌨️  Typing event in room ${roomStr} from ${socket.id}`);
        socket.to(roomStr).emit("group:typing", { chatId: roomStr, userId: socket.id });
      });

      socket.on("group:stop_typing", (chatId) => {
        const roomStr = String(chatId);
        console.log(`[Socket.IO] ⌨️  Stop typing event in room ${roomStr} from ${socket.id}`);
        socket.to(roomStr).emit("group:stop_typing", { chatId: roomStr, userId: socket.id });
      });

      // Send Message
      socket.on("send_message", (data) => {
        const chatRoom = String(data.chatId);
        console.log(`[Socket.IO] 💬 Broadcasting message to room ${chatRoom}`);
        io.to(chatRoom).emit("receive_message", data);
      });
    });

    console.log('[Socket.IO] Server initialized');
  }
  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
}

module.exports = { initSocket, getIO };
