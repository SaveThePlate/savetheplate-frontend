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

  useEffect(() => {
    if (!enabled) return;

    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.log("No access token, skipping WebSocket connection");
      return;
    }

    // Dynamically import socket.io-client to reduce initial bundle size
    let socket: Socket | null = null;
    let isMounted = true;

    const initSocket = async () => {
      try {
        const { io } = await import("socket.io-client");
        
        if (!isMounted) return;

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
        // Extract hostname and port from backend URL
        const url = new URL(backendUrl);
        const wsProtocol = url.protocol === "https:" ? "wss" : "ws";
        const wsUrl = `${wsProtocol}://${url.host}`;

        // Connect to WebSocket server
        socket = io(wsUrl, {
          auth: {
            token: token,
          },
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5,
          // Suppress the initial websocket failure warning (it's expected - Socket.IO falls back to polling)
          upgrade: true,
          rememberUpgrade: false,
        });

        if (!isMounted) {
          socket.disconnect();
          return;
        }

        socketRef.current = socket;

        // TypeScript guard: socket is guaranteed to be non-null here
        if (!socket) return;

        socket.on("connect", () => {
          // Use socketRef.current to ensure we have the latest socket instance
          const currentSocket = socketRef.current;
          if (!currentSocket) return;
          
          const transport = currentSocket.io.engine.transport.name;
          console.log(`✅ WebSocket connected to: ${wsUrl} (transport: ${transport})`);
          setIsConnected(true);
          
          // Subscribe to events
          currentSocket.emit("subscribe:orders");
          currentSocket.emit("subscribe:offers");
          console.log("📡 Subscribed to orders and offers events");
        });

        socket.on("disconnect", (reason) => {
          console.log("WebSocket disconnected:", reason);
          setIsConnected(false);
        });

        socket.on("connect_error", (error) => {
          // Only log if it's not the initial websocket upgrade failure (which is expected)
          if (error.message && !error.message.includes("websocket")) {
            console.error("WebSocket connection error:", error);
          }
          setIsConnected(false);
        });

        // Listen for transport upgrades (websocket -> polling or vice versa)
        socket.io.engine.on("upgrade", () => {
          const currentSocket = socketRef.current;
          if (!currentSocket) return;
          console.log("🔄 WebSocket transport upgraded to:", currentSocket.io.engine.transport.name);
        });

        // Listen for order updates
        if (onOrderUpdate) {
          socket.on("order:update", (data) => {
            console.log("📦 Order update received:", data);
            onOrderUpdate(data);
          });
        }

        // Listen for offer updates
        if (onOfferUpdate) {
          socket.on("offer:update", (data) => {
            console.log("🛍️ Offer update received:", data);
            console.log("📦 Offer type:", data.type, "Offer ID:", data.offer?.id);
            try {
              onOfferUpdate(data);
              console.log("✅ Offer update handler executed successfully");
            } catch (error) {
              console.error("❌ Error in offer update handler:", error);
            }
          });
        } else {
          console.warn("⚠️ onOfferUpdate handler not provided, offer updates will be ignored");
        }
      } catch (error) {
        console.error("Failed to initialize WebSocket:", error);
      }
    };

    initSocket();

    return () => {
      isMounted = false;
      if (socket) {
        if (onOrderUpdate) {
          socket.off("order:update");
        }
        if (onOfferUpdate) {
          socket.off("offer:update");
        }
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, [enabled, onOrderUpdate, onOfferUpdate]);

  return {
    socket: socketRef.current,
    isConnected,
  };
}

