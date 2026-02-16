const io = require("socket.io-client");

const socket = io("http://localhost:6000", {
    transports: ["websocket", "polling"]
});

const CHAT_ID = "test-room-123";

socket.on("connect", () => {
    console.log("Connected to socket server");
    socket.emit("join_room", CHAT_ID);

    setTimeout(() => {
        console.log("Sending message...");
        socket.emit("send_message", {
            chatId: CHAT_ID,
            content: "Hello from test script",
            _id: "test-msg-" + Date.now(),
            sender: { _id: "user-1", name: "Tester" }
        });
    }, 1000);
});

socket.on("receive_message", (data) => {
    console.log("Received message:", data);
    if (data.content === "Hello from test script") {
        console.log("SUCCESS: Round-trip verified.");
        process.exit(0);
    }
});

socket.on("connect_error", (err) => {
    console.error("Connection error:", err.message);
    process.exit(1);
});

setTimeout(() => {
    console.log("Timeout waiting for message.");
    process.exit(1);
}, 5000);
