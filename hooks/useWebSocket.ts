"use client";

import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

interface UseWebSocketOptions {
  onOrderUpdate?: (data: { type: "created" | "updated" | "deleted"; order: any }) => void;
  onOfferUpdate?: (data: { type: "created" | "updated" | "deleted"; offer: any }) => void;
  enabled?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { onOrderUpdate, onOfferUpdate, enabled = true } = options;
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const isMountedRef = useRef(true);
  
  // Store callbacks in refs to prevent effect re-runs when they change
  const onOrderUpdateRef = useRef(onOrderUpdate);
  const onOfferUpdateRef = useRef(onOfferUpdate);
  
  // Update refs when callbacks change
  useEffect(() => {
    onOrderUpdateRef.current = onOrderUpdate;
    onOfferUpdateRef.current = onOfferUpdate;
  }, [onOrderUpdate, onOfferUpdate]);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Always return a cleanup function, even if we don't initialize
    let socket: Socket | null = null;
    
    if (!enabled) {
      return () => {
        isMountedRef.current = false;
      };
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.log("No access token, skipping WebSocket connection");
      return () => {
        isMountedRef.current = false;
      };
    }

    // Dynamically import socket.io-client to reduce initial bundle size
    const initSocket = async () => {
      try {
        const { io } = await import("socket.io-client");
        
        if (!isMountedRef.current) return;

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
        // Socket.IO client automatically handles protocol conversion (http -> ws, https -> wss)
        // Use the full backend URL and explicitly set the path to match the server configuration
        const wsUrl = backendUrl.replace(/\/$/, ""); // Remove trailing slash if present

        // Connect to WebSocket server
        socket = io(wsUrl, {
          path: "/socket.io/", // Explicitly set path to match backend configuration
          auth: {
            token: token,
          },
          transports: ["websocket", "polling"], // Try websocket first, fallback to polling
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: Infinity, // Keep trying to reconnect
          timeout: 20000, // Connection timeout
          // Suppress the initial websocket failure warning (it's expected - Socket.IO falls back to polling)
          upgrade: true,
          rememberUpgrade: false,
          forceNew: false, // Reuse existing connection if available
        });

        if (!isMountedRef.current) {
          socket.disconnect();
          return;
        }

        socketRef.current = socket;

        // TypeScript guard: socket is guaranteed to be non-null here
        if (!socket) return;

        socket.on("connect", () => {
          // Use socketRef.current to ensure we have the latest socket instance
          const currentSocket = socketRef.current;
          if (!currentSocket || !isMountedRef.current) return;
          
          const transport = currentSocket.io.engine.transport.name;
          const socketId = currentSocket.id;
          console.log(`✅ WebSocket connected to: ${wsUrl}`);
          console.log(`   Transport: ${transport}, Socket ID: ${socketId}`);
          
          if (isMountedRef.current) {
            setIsConnected(true);
          }
          
          // Subscribe to events
          currentSocket.emit("subscribe:orders");
          currentSocket.emit("subscribe:offers");
          console.log("📡 Subscribed to orders and offers events");
        });

        socket.on("disconnect", (reason) => {
          console.log("WebSocket disconnected:", reason);
          if (isMountedRef.current) {
            setIsConnected(false);
          }
        });

        socket.on("connect_error", (error: any) => {
          // Log connection errors for debugging
          console.error("WebSocket connection error:", {
            message: error.message,
            type: error.type,
            description: error.description,
            context: error.context,
            url: wsUrl,
          });
          
          // Check for specific error types
          if (error.message?.includes("xhr poll error") || error.message?.includes("websocket error")) {
            console.warn("⚠️ WebSocket transport failed, Socket.IO will retry with polling");
          } else if (error.message?.includes("timeout")) {
            console.error("❌ WebSocket connection timeout - check server availability and network");
          } else if (error.message?.includes("CORS")) {
            console.error("❌ CORS error - check server CORS configuration");
          }
          
          if (isMountedRef.current) {
            setIsConnected(false);
          }
        });

        // Listen for transport upgrades (websocket -> polling or vice versa)
        socket.io.engine.on("upgrade", () => {
          const currentSocket = socketRef.current;
          if (!currentSocket) return;
          console.log("🔄 WebSocket transport upgraded to:", currentSocket.io.engine.transport.name);
        });

        // Listen for order updates - use ref to get latest callback
        socket.on("order:update", (data) => {
          if (!isMountedRef.current) return;
          console.log("📦 Order update received:", data);
          if (onOrderUpdateRef.current) {
            onOrderUpdateRef.current(data);
          }
        });

        // Listen for offer updates - use ref to get latest callback
        socket.on("offer:update", (data) => {
          if (!isMountedRef.current) return;
          console.log("🛍️ Offer update received:", data);
          console.log("📦 Offer type:", data.type, "Offer ID:", data.offer?.id);
          if (onOfferUpdateRef.current) {
            try {
              onOfferUpdateRef.current(data);
              console.log("✅ Offer update handler executed successfully");
            } catch (error) {
              console.error("❌ Error in offer update handler:", error);
            }
          }
        });
      } catch (error) {
        console.error("Failed to initialize WebSocket:", error);
      }
    };

    initSocket();

    return () => {
      isMountedRef.current = false;
      if (socket) {
        socket.off("order:update");
        socket.off("offer:update");
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, [enabled]);

  return {
    socket: socketRef.current,
    isConnected,
  };
}

