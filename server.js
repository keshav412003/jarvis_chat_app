const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 3000;
const hostname = '0.0.0.0';

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Socket.io setup
  const CLIENT_URL = process.env.CLIENT_URL || '*';
  
  const io = new Server(server, {
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

  // Internal System Notification Endpoint
  const express = require('express');
  const internalApp = express();
  internalApp.use(express.json());

  const INTERNAL_SECRET = process.env.SOCKET_INTERNAL_KEY || "super-secret-internal-key";

  internalApp.post("/internal/notify", (req, res) => {
    const secret = req.headers["x-internal-secret"];
    if (secret !== INTERNAL_SECRET) {
      console.log("[Socket.IO] 🔒 Blocking unauthorized internal request");
      return res.status(403).json({ error: "Forbidden" });
    }

    const { event, chatId, payload } = req.body;

    if (!event || !chatId) {
      console.log("[Socket.IO] ⚠️  Invalid internal notify request: missing event or chatId");
      return res.status(400).json({ error: "Missing event or chatId" });
    }

    console.log(`[Socket.IO] 📢 INTERNAL NOTIFY: Event="${event}" Room="${chatId}"`);

    const rooms = Array.isArray(chatId) ? chatId : [chatId];

    rooms.forEach(room => {
      const roomStr = String(room);
      console.log(`[Socket.IO]    → Emitting "${event}" to room: ${roomStr}`);
      io.to(roomStr).emit(event, payload);
    });

    if (event === 'group:deleted') {
      rooms.forEach(room => {
        io.in(String(room)).socketsLeave(String(room));
      });
      console.log(`[Socket.IO] 🗑️  Force-left rooms for deleted group`);
    }

    return res.json({ success: true, roomsNotified: rooms.length });
  });

  // Mount internal app
  server.on('request', (req, res, next) => {
    if (req.url.startsWith('/internal/')) {
      internalApp(req, res, next);
    } else {
      next();
    }
  });

  server.listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.io server integrated`);
    console.log(`> CORS Origin allowed: ${CLIENT_URL}`);
  });
});
