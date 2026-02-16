"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext({
    socket: null,
    isConnected: false,
});

export const useSocket = () => {
    return useContext(SocketContext);
};

export function SocketProvider({ children }) {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef(null);
    const initializingRef = useRef(false);

    useEffect(() => {
        // Singleton pattern: prevent double initialization in React StrictMode
        if (socketRef.current || initializingRef.current) {
            console.log("[Socket] Already initialized, skipping");
            return;
        }

        initializingRef.current = true;
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

        console.log("[Socket] Initializing connection to:", socketUrl);

        const socketInstance = io(socketUrl, {
            path: "/socket.io",
            transports: ["websocket", "polling"], // Fallback to polling if websocket fails
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 10000,
            withCredentials: true, // Important for CORS with credentials
        });

        // Connection event handlers
        socketInstance.on("connect", () => {
            console.log("[Socket] ✅ Connected:", socketInstance.id);
            setIsConnected(true);
        });

        socketInstance.on("disconnect", (reason) => {
            console.log("[Socket] ❌ Disconnected:", reason);
            setIsConnected(false);

            // Auto-reconnect on certain disconnect reasons
            if (reason === "io server disconnect") {
                console.log("[Socket] Server disconnected client, reconnecting...");
                socketInstance.connect();
            }
        });

        socketInstance.on("reconnect", (attemptNumber) => {
            console.log(`[Socket] 🔄 Reconnected after ${attemptNumber} attempts`);
            setIsConnected(true);
        });

        socketInstance.on("reconnect_attempt", (attemptNumber) => {
            console.log(`[Socket] 🔄 Reconnection attempt #${attemptNumber}`);
        });

        socketInstance.on("reconnect_error", (error) => {
            console.error("[Socket] 🔴 Reconnection error:", error.message);
        });

        socketInstance.on("reconnect_failed", () => {
            console.error("[Socket] 🔴 Reconnection failed after max attempts");
        });

        socketInstance.on("connect_error", (error) => {
            console.error("[Socket] 🔴 Connection Error:", error.message);
            setIsConnected(false);
        });

        socketInstance.on("error", (error) => {
            console.error("[Socket] 🔴 Socket Error:", error);
        });

        socketRef.current = socketInstance;
        setSocket(socketInstance);
        initializingRef.current = false;

        return () => {
            console.log("[Socket] Cleaning up connection");
            if (socketRef.current) {
                socketRef.current.removeAllListeners();
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
}
