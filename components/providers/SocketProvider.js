"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";

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
        
        // For now, disable Socket.io on production to fix deployment
        if (process.env.NODE_ENV === 'production') {
            console.log("[Socket] Socket.io disabled in production mode");
            initializingRef.current = false;
            return;
        }

        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

        console.log("[Socket] Initializing connection to:", socketUrl);

        // Dynamic import to avoid SSR issues
        import('socket.io-client').then(({ io }) => {
            const socketInstance = io(socketUrl, {
                path: "/socket.io",
                transports: ["websocket", "polling"],
                reconnection: true,
                reconnectionAttempts: 10,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 10000,
                withCredentials: true,
            });

            // Connection event handlers
            socketInstance.on("connect", () => {
                console.log("[Socket] ✅ Connected:", socketInstance.id);
                setIsConnected(true);
            });

            socketInstance.on("disconnect", (reason) => {
                console.log("[Socket] ❌ Disconnected:", reason);
                setIsConnected(false);

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
        }).catch(err => {
            console.error("[Socket] Failed to load socket.io-client:", err);
            initializingRef.current = false;
        });

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
