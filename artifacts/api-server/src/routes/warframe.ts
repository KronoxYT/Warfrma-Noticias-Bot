/**
 * routes/warframe.ts
 * Warframe data endpoints for the dashboard.
 *
 * GET /api/status      — Bot status from shared status file (written by warframe-bot)
 * GET /api/news        — Latest Warframe news (proxied from warframestat.us)
 * GET /api/builds      — Builds database from warframe-bot's builds.json
 * GET /api/price/:item — Cheapest sell orders from Warframe Market
 */

import { Router, type IRouter } from "express";
import axios from "axios";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router: IRouter = Router();

// __dirname = artifacts/api-server/src/routes
// Navigating 4 levels up reaches the workspace root,
// then into the warframe-bot database directory.
const __filename     = fileURLToPath(import.meta.url);
const __dirname      = path.dirname(__filename);
const WORKSPACE_ROOT = path.resolve(__dirname, "../../../..");
const STATUS_FILE    = path.join(WORKSPACE_ROOT, "artifacts/warframe-bot/src/database/status.json");
const BUILDS_FILE    = path.join(WORKSPACE_ROOT, "artifacts/warframe-bot/src/database/builds.json");

// ── GET /api/status ──────────────────────────────────────────────────────────
// Reads the bot status from the shared file written by the warframe-bot process.
router.get("/status", (_req, res) => {
  try {
    if (!existsSync(STATUS_FILE)) {
      return res.json({
        online: false,
        name: "Not connected",
        avatar: null,
        guildCount: 0,
        userCount: 0,
        uptimeMs: 0,
        uptimeFormatted: "Offline",
        connectedAt: null,
      });
    }
    const raw    = readFileSync(STATUS_FILE, "utf-8");
    const status = JSON.parse(raw);
    // Re-compute uptime from the stored connectedAt so it's always fresh
    const uptimeMs = status.connectedAt
      ? Date.now() - new Date(status.connectedAt).getTime()
      : 0;
    res.json({ ...status, uptimeMs, uptimeFormatted: formatUptime(uptimeMs) });
  } catch {
    res.status(500).json({ error: "Could not read bot status." });
  }
});

// ── GET /api/news ────────────────────────────────────────────────────────────
router.get("/news", async (_req, res) => {
  try {
    const response = await axios.get("https://api.warframestat.us/pc/news", {
      timeout: 8000,
      headers: { "Accept-Language": "en" },
    });
    const articles: unknown[] = Array.isArray(response.data) ? response.data : [];
    articles.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json(articles.slice(0, 10));
  } catch (err: any) {
    res.status(502).json({ error: "Failed to fetch Warframe news." });
  }
});

// ── GET /api/builds ──────────────────────────────────────────────────────────
router.get("/builds", (_req, res) => {
  try {
    const raw    = readFileSync(BUILDS_FILE, "utf-8");
    const builds = JSON.parse(raw) as Record<string, any>;
    const arr    = Object.entries(builds).map(([id, build]) => ({
      id,
      displayName: toReadable(id),
      ...build,
    }));
    res.json(arr);
  } catch {
    res.status(500).json({ error: "Failed to load builds." });
  }
});

// ── GET /api/price/:item ─────────────────────────────────────────────────────
router.get("/price/:item", async (req, res) => {
  const slug = toSlug(req.params.item);
  try {
    const url      = `https://api.warframe.market/v1/items/${slug}/orders`;
    const response = await axios.get(url, {
      timeout: 8000,
      headers: { Platform: "pc", Language: "en" },
    });

    const orders: any[] = response.data?.payload?.orders ?? [];
    const sellers = orders
      .filter((o) => o.order_type === "sell" && ["ingame", "online"].includes(o.user.status))
      .sort((a, b) => a.platinum - b.platinum);

    if (sellers.length === 0) {
      return res.status(404).json({ error: `No online sellers found for **${slug}**.` });
    }

    const cheapest = sellers[0];
    res.json({
      item: toReadable(slug),
      slug,
      totalSellers: sellers.length,
      cheapest: {
        platinum:   cheapest.platinum,
        quantity:   cheapest.quantity,
        seller:     cheapest.user.ingame_name,
        status:     cheapest.user.status,
        reputation: cheapest.user.reputation ?? 0,
      },
      topSellers: sellers.slice(0, 5).map((o) => ({
        platinum:   o.platinum,
        quantity:   o.quantity,
        seller:     o.user.ingame_name,
        status:     o.user.status,
        reputation: o.user.reputation ?? 0,
      })),
    });
  } catch (err: any) {
    if (err.response?.status === 404) {
      return res.status(404).json({ error: `Item "${slug}" not found on Warframe Market.` });
    }
    res.status(502).json({ error: err.message });
  }
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toSlug(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, "_");
}

function toReadable(slug: string) {
  return slug.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

function formatUptime(ms: number) {
  if (!ms) return "Offline";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return [d && `${d}d`, h && `${h}h`, `${m}m`].filter(Boolean).join(" ");
}

export default router;
