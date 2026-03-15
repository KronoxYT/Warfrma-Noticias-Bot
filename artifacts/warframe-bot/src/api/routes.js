/**
 * api/routes.js
 * REST API routes for the Warfrma Noticias dashboard.
 *
 * Routes:
 *   GET /api/status      — Bot status (name, online, uptime, guilds, users)
 *   GET /api/news        — Latest Warframe news (proxied from warframestat.us)
 *   GET /api/builds      — All builds from the local JSON database
 *   GET /api/price/:item — Cheapest sell orders for an item on Warframe Market
 */

import { Router } from "express";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { fetchLatestNews } from "../services/warframeNewsService.js";
import { fetchItemOrders } from "../services/warframeMarketService.js";
import { formatItemName, toReadableName } from "../utils/formatItemName.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const BUILDS_PATH = join(__dirname, "../database/builds.json");

/**
 * @param {import("discord.js").Client} client
 * @param {() => number | null} getBotStartTime — getter so we always read the live value
 */
export function createRoutes(client, getBotStartTime) {
  const router = Router();

  // ── GET /api/status ──────────────────────────────────────────────────────
  router.get("/api/status", (_req, res) => {
    const online    = client.isReady();
    const startTime = getBotStartTime();
    const uptimeMs  = online && startTime ? Date.now() - startTime : 0;

    let totalUsers = 0;
    if (online) client.guilds.cache.forEach((g) => { totalUsers += g.memberCount ?? 0; });

    res.json({
      online,
      name:             client.user?.tag ?? "Not connected",
      avatar:           client.user?.displayAvatarURL({ size: 128 }) ?? null,
      guildCount:       client.guilds.cache.size,
      userCount:        totalUsers,
      uptimeMs,
      uptimeFormatted:  formatUptime(uptimeMs),
      connectedAt:      startTime ? new Date(startTime).toISOString() : null,
    });
  });

  // ── GET /api/news ────────────────────────────────────────────────────────
  router.get("/api/news", async (_req, res) => {
    try {
      const articles = await fetchLatestNews();
      res.json(articles.slice(0, 10));
    } catch (err) {
      console.error("[API] /api/news:", err.message);
      res.status(502).json({ error: "Failed to fetch Warframe news." });
    }
  });

  // ── GET /api/builds ──────────────────────────────────────────────────────
  router.get("/api/builds", (_req, res) => {
    try {
      const builds = JSON.parse(readFileSync(BUILDS_PATH, "utf-8"));
      const arr = Object.entries(builds).map(([id, build]) => ({
        id,
        displayName: toReadableName(id),
        ...build,
      }));
      res.json(arr);
    } catch (err) {
      console.error("[API] /api/builds:", err.message);
      res.status(500).json({ error: "Failed to load builds." });
    }
  });

  // ── GET /api/price/:item ─────────────────────────────────────────────────
  router.get("/api/price/:item", async (req, res) => {
    const slug = formatItemName(req.params.item);
    try {
      const { cheapest, allSellers, totalSellers } = await fetchItemOrders(slug);
      res.json({
        item:         toReadableName(slug),
        slug,
        totalSellers,
        cheapest: {
          platinum:   cheapest.platinum,
          quantity:   cheapest.quantity,
          seller:     cheapest.user.ingame_name,
          status:     cheapest.user.status,
          reputation: cheapest.user.reputation ?? 0,
        },
        topSellers: allSellers.slice(0, 5).map((o) => ({
          platinum:   o.platinum,
          quantity:   o.quantity,
          seller:     o.user.ingame_name,
          status:     o.user.status,
          reputation: o.user.reputation ?? 0,
        })),
      });
    } catch (err) {
      console.error(`[API] /api/price/${slug}:`, err.message);
      res.status(404).json({ error: err.message });
    }
  });

  return router;
}

// ─── Helper ───────────────────────────────────────────────────────────────

function formatUptime(ms) {
  if (!ms) return "Offline";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return [d && `${d}d`, h && `${h}h`, `${m}m`].filter(Boolean).join(" ");
}
