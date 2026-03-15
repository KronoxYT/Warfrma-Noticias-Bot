/**
 * websocket/websocket.js
 * WebSocket server for the Warfrma Noticias dashboard.
 *
 * Attaches to the existing HTTP server (same port as Express) so no
 * extra port is needed. Clients connect via ws:// or wss:// on the same host.
 *
 * Events broadcast to all clients:
 *   bot_started      — fired when the Discord bot is ready
 *   status_update    — periodic bot status (every 30s)
 *   alert_triggered  — fired when a price alert fires
 *   news_updated     — fired on startup and when news is refreshed
 */

import { WebSocketServer, WebSocket } from "ws";

/** @type {WebSocketServer | null} */
let wss = null;

/**
 * Initialises the WebSocket server attached to an existing HTTP server.
 * Must be called after the HTTP server is created but before it starts listening.
 *
 * @param {import("http").Server} httpServer - The Node.js HTTP server instance
 */
export function initWsServer(httpServer) {
  wss = new WebSocketServer({ server: httpServer });

  wss.on("connection", (socket, req) => {
    const ip = req.socket.remoteAddress ?? "unknown";
    console.log(`[WS] Client connected from ${ip} (total: ${wss.clients.size})`);

    // Send a welcome event so the client knows it's connected
    sendToClient(socket, "connected", { message: "Connected to Warfrma Noticias dashboard" });

    socket.on("close", () => {
      console.log(`[WS] Client disconnected (remaining: ${wss.clients.size})`);
    });

    socket.on("error", (err) => {
      console.error("[WS] Socket error:", err.message);
    });
  });

  wss.on("error", (err) => {
    console.error("[WS] Server error:", err.message);
  });

  console.log("[WS] WebSocket server ready (sharing HTTP port)");
}

/**
 * Sends a typed event to a single WebSocket client.
 *
 * @param {WebSocket} socket
 * @param {string} event   - Event name (e.g. "bot_started")
 * @param {Object} payload - Data to attach
 */
function sendToClient(socket, event, payload = {}) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ event, data: payload, ts: Date.now() }));
  }
}

/**
 * Broadcasts a typed event to ALL connected WebSocket clients.
 *
 * @param {string} event   - Event name
 * @param {Object} payload - Data to broadcast
 */
export function broadcast(event, payload = {}) {
  if (!wss) return;

  const message = JSON.stringify({ event, data: payload, ts: Date.now() });
  let sent = 0;

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
      sent++;
    }
  });

  if (sent > 0) {
    console.log(`[WS] Broadcast "${event}" to ${sent} client(s)`);
  }
}

/**
 * Returns the number of currently connected WebSocket clients.
 * @returns {number}
 */
export function getConnectedClients() {
  return wss?.clients.size ?? 0;
}
