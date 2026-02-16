const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// Allow usage of environment variables if needed
const PORT = process.env.SOCKET_PORT || 4000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

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

// Health Check Endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", message: "Socket server is running" });
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

        // Track room
        const rooms = socketRooms.get(socket.id);
        if (rooms) rooms.add(roomStr);

        console.log(`[Socket.IO] 🚪 User ${socket.id} joined room: ${roomStr}`);

        // Optional: Notify others in room
        socket.to(roomStr).emit("user_joined_room", { socketId: socket.id, roomId: roomStr });
    });

    // Leave Room
    socket.on("leave_room", (roomId) => {
        const roomStr = String(roomId);
        socket.leave(roomStr);

        // Track room
        const rooms = socketRooms.get(socket.id);
        if (rooms) rooms.delete(roomStr);

        console.log(`[Socket.IO] 🚪 User ${socket.id} left room: ${roomStr}`);

        // Optional: Notify others in room
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

    // Send Message (for testing/legacy, prefer internal notify)
    socket.on("send_message", (data) => {
        const chatRoom = String(data.chatId);
        console.log(`[Socket.IO] 💬 Broadcasting message to room ${chatRoom}`);
        io.to(chatRoom).emit("receive_message", data);
    });
});

// Internal System Notification Endpoint (Secured)
app.use(express.json()); // Enable JSON body parsing

const INTERNAL_SECRET = process.env.SOCKET_INTERNAL_KEY || "super-secret-internal-key";

app.post("/internal/notify", (req, res) => {
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

    // Handle array of rooms (for user_<id> broadcast)
    const rooms = Array.isArray(chatId) ? chatId : [chatId];

    rooms.forEach(room => {
        const roomStr = String(room);
        console.log(`[Socket.IO]    → Emitting "${event}" to room: ${roomStr}`);
        io.to(roomStr).emit(event, payload);
    });

    // Special handling for group deletion
    if (event === 'group:deleted') {
        rooms.forEach(room => {
            io.in(String(room)).socketsLeave(String(room));
        });
        console.log(`[Socket.IO] 🗑️  Force-left rooms for deleted group`);
    }

    return res.json({ success: true, roomsNotified: rooms.length });
});

server.listen(PORT, () => {
    console.log(`\n🚀 Socket.IO Server running on port ${PORT}`);
    console.log(`🌐 CORS Origin allowed: ${CLIENT_URL}`);
    console.log(`🔒 Internal secret configured\n`);
});
