"use client";

import { useEffect, useRef, useState } from "react";
// import { io, Socket } from "socket.io-client";

interface UseWebSocketOptions {
  onOrderUpdate?: (data: { type: "created" | "updated" | "deleted"; order: any }) => void;
  onOfferUpdate?: (data: { type: "created" | "updated" | "deleted"; offer: any }) => void;
  enabled?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { onOrderUpdate, onOfferUpdate, enabled = true } = options;
  const socketRef = useRef<any | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // WebSocket temporarily disabled for testing
    return;
    
    if (!enabled) return;

    // WebSocket code temporarily disabled
    /*
    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.log("No access token, skipping WebSocket connection");
      return;
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
    // Extract hostname and port from backend URL
    const url = new URL(backendUrl);
    const wsProtocol = url.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${wsProtocol}://${url.host}`;

    // Connect to WebSocket server
    const socket = io(wsUrl, {
      auth: {
        token: token,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      
      // Subscribe to events
      socket.emit("subscribe:orders");
      socket.emit("subscribe:offers");
    });

    socket.on("disconnect", () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      setIsConnected(false);
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
        onOfferUpdate(data);
      });
    }

    return () => {
      if (onOrderUpdate) {
        socket.off("order:update", onOrderUpdate);
      }
      if (onOfferUpdate) {
        socket.off("offer:update", onOfferUpdate);
      }
      socket.disconnect();
      socketRef.current = null;
    };
    */
  }, [enabled, onOrderUpdate, onOfferUpdate]);

  return {
    socket: socketRef.current,
    isConnected,
  };
}

