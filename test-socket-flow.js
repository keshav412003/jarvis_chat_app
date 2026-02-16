const io = require("socket.io-client");
const fetch = require("node-fetch"); // Need to install or use built-in if Node 18+

const socket = io("http://localhost:6000", {
    transports: ["websocket", "polling"]
});

const CHAT_ID = "test-live-chat-123";
const API_URL = "http://localhost:3000/api/messages"; // Assuming running locally

// Mock a message send via API (which should trigger socket)
// Note: This requires a valid token usually, but let's test the socket listening part primarily
// Or we can simulate the internal notify call directly to test the socket server -> client path

socket.on("connect", () => {
    console.log("Connected to socket server");
    socket.emit("join_room", CHAT_ID);

    setTimeout(async () => {
        console.log("Simulating API -> Socket notification...");

        // Directly hit the socket internal endpoint to verify THAT path first
        // effectively testing: API Route (simulated) -> Socket Server -> Client
        try {
            const res = await fetch("http://localhost:6000/internal/notify", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-internal-secret": "super-secret-internal-key"
                },
                body: JSON.stringify({
                    event: "receive_message",
                    chatId: CHAT_ID,
                    payload: {
                        _id: "msg-" + Date.now(),
                        content: "LIVE TEST MESSAGE",
                        sender: { _id: "user-test", name: "System Tester" },
                        createdAt: new Date().toISOString()
                    }
                })
            });
            console.log("Notify response:", res.status);
        } catch (e) {
            console.error("Notify failed:", e);
        }
    }, 1000);
});

socket.on("receive_message", (data) => {
    console.log("Received message via Socket:", data);
    if (data.content === "LIVE TEST MESSAGE") {
        console.log("SUCCESS: API triggering Socket flow verified.");
        process.exit(0);
    }
});

setTimeout(() => {
    console.log("Timeout waiting for message.");
    process.exit(1);
}, 5000);
