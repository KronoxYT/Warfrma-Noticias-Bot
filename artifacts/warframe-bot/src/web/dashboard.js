/**
 * dashboard.js — Shared frontend script
 *
 * Loaded on every page. Handles:
 *  - Navigation active link highlighting
 *  - WebSocket connection & event dispatching
 *  - Bot status indicator in the navbar
 *  - Shared utility functions (time formatting, etc.)
 */

// ─── Navigation ─────────────────────────────────────────────────────────────

(function highlightActiveNav() {
  const path = location.pathname.replace(/\/$/, "") || "/";
  document.querySelectorAll(".nav-links a").forEach((a) => {
    const href = a.getAttribute("href").replace(/\/$/, "") || "/";
    if (path === href || (href !== "/" && path.startsWith(href))) {
      a.classList.add("active");
    }
  });
})();

// ─── WebSocket ───────────────────────────────────────────────────────────────

const wsProtocol = location.protocol === "https:" ? "wss:" : "ws:";
let ws = null;
let wsReconnectTimer = null;

/** Custom event bus: dispatch("bot_started", data) from anywhere */
const wsBus = new EventTarget();

function connectWs() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

  ws = new WebSocket(`${wsProtocol}//${location.host}`);
  setWsDot("connecting");

  ws.addEventListener("open", () => {
    console.log("[WS] Connected");
    setWsDot("connected");
    document.getElementById("ws-label").textContent = "Live";
  });

  ws.addEventListener("message", (e) => {
    try {
      const msg = JSON.parse(e.data);
      // Dispatch to page-specific listeners
      wsBus.dispatchEvent(new CustomEvent(msg.event, { detail: msg }));
      // Global handling
      handleGlobalWsEvent(msg);
    } catch {
      /* ignore malformed messages */
    }
  });

  ws.addEventListener("close", () => {
    console.log("[WS] Disconnected — reconnecting in 5s");
    setWsDot("error");
    document.getElementById("ws-label").textContent = "Reconnecting…";
    wsReconnectTimer = setTimeout(connectWs, 5000);
  });

  ws.addEventListener("error", () => {
    setWsDot("error");
  });
}

function setWsDot(state) {
  const dot = document.getElementById("ws-dot");
  if (!dot) return;
  dot.className = "ws-dot";
  if (state === "connected") dot.classList.add("connected");
  if (state === "error")     dot.classList.add("error");
}

/** Handle events that affect global UI elements (e.g. the navbar status dot) */
function handleGlobalWsEvent(msg) {
  const navDot = document.querySelector(".navbar .dot");

  if (msg.event === "bot_started" || msg.event === "status_update") {
    if (navDot) navDot.classList.remove("offline");
  }

  if (msg.event === "status_update" && !msg.data?.online) {
    if (navDot) navDot.classList.add("offline");
  }
}

/** Subscribe to a WebSocket event from a page */
function onWsEvent(event, callback) {
  wsBus.addEventListener(event, (e) => callback(e.detail));
}

// ─── Utilities ───────────────────────────────────────────────────────────────

/** Format a timestamp as a relative "time ago" string */
function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/** Format milliseconds to "2d 3h 15m" */
function formatUptime(ms) {
  if (!ms) return "—";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return [d && `${d}d`, h && `${h}h`, `${m}m`].filter(Boolean).join(" ");
}

/** Convert "ash_prime" to "Ash Prime" */
function toReadable(slug) {
  return slug.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

/** Normalise item name for the API */
function toSlug(name) {
  return name.trim().toLowerCase().replace(/\s+/g, "_");
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  connectWs();
});
