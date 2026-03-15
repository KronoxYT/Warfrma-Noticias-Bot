/**
 * index.js — Warfrma Noticias Bot Entry Point
 *
 * Starts everything in one process:
 *   1. Express server  — serves the web dashboard + REST API
 *   2. WebSocket server — real-time events to the dashboard (shares HTTP port)
 *   3. Discord client  — connects to the Discord Gateway
 *   4. Cron job        — checks price alerts every 10 minutes
 *
 * Environment variables:
 *   DISCORD_TOKEN  — Bot token
 *   CLIENT_ID      — Application/Client ID
 *   GUILD_ID       — Your Discord server ID
 *   PORT           — HTTP port (auto-set by Replit, defaults to 3000)
 */

import "dotenv/config";
import http from "http";
import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { Client, GatewayIntentBits, Collection, Events } from "discord.js";
import { readdirSync } from "fs";
import cron from "node-cron";

import { initWsServer, broadcast } from "./websocket/websocket.js";
import { createRoutes } from "./api/routes.js";
import { fetchItemOrders } from "./services/warframeMarketService.js";
import { loadAlerts, saveAlerts } from "./commands/alerts.js";
import { alertTriggerEmbed } from "./utils/embedBuilder.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Validate Required Environment Variables ───────────────────────────────

const token   = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId  = process.env.GUILD_ID;
const port     = process.env.PORT || 3000;

if (!token || !clientId || !guildId) {
  console.error("[BOOT] Missing env vars: DISCORD_TOKEN, CLIENT_ID, GUILD_ID. Exiting.");
  process.exit(1);
}

// ─── Discord Client ────────────────────────────────────────────────────────

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});
client.commands = new Collection();

// Track the moment the bot became ready so we can compute uptime
let botStartTime = null;

// ─── Express App ───────────────────────────────────────────────────────────

const app = express();
app.use(express.json());

// Serve the static web dashboard from src/web/
app.use(express.static(join(__dirname, "web")));

// Root route → dashboard
app.get("/", (_req, res) => {
  res.sendFile(join(__dirname, "web", "dashboard.html"));
});

// Health check (also keeps Replit alive)
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    bot: client.user?.tag ?? "connecting...",
    uptime: Math.floor(process.uptime()) + "s",
    timestamp: new Date().toISOString(),
  });
});

// Mount REST API routes (pass client + botStartTime getter)
app.use(createRoutes(client, (() => botStartTime)));

// ─── HTTP + WebSocket Server ───────────────────────────────────────────────
// Using http.createServer so the WebSocket server can share the same port.

const server = http.createServer(app);
initWsServer(server);

server.listen(port, () => {
  console.log(`[HTTP] Server listening on port ${port}`);
  console.log(`[HTTP] Dashboard available at http://localhost:${port}`);
});

// ─── Command Loader ────────────────────────────────────────────────────────

async function loadCommands() {
  const commandsPath = join(__dirname, "commands");
  const files = readdirSync(commandsPath).filter((f) => f.endsWith(".js"));

  for (const file of files) {
    const command = await import(join(commandsPath, file));
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
      console.log(`[COMMANDS] Loaded: /${command.data.name}`);
    } else {
      console.warn(`[COMMANDS] Skipped ${file} — missing data or execute.`);
    }
  }
}

// ─── Discord Events ────────────────────────────────────────────────────────

client.once(Events.ClientReady, (readyClient) => {
  botStartTime = Date.now();
  console.log(`[BOT] Logged in as: ${readyClient.user.tag}`);
  console.log(`[BOT] Commands loaded: ${client.commands.size}`);
  readyClient.user.setActivity("Warframe | /news /price /build /alerts");

  // Notify dashboard clients that the bot is online
  broadcast("bot_started", {
    name: readyClient.user.tag,
    avatar: readyClient.user.displayAvatarURL({ size: 128 }),
    guildCount: readyClient.guilds.cache.size,
    startedAt: new Date().toISOString(),
  });

  // Send a status pulse every 30 seconds so the dashboard stays fresh
  setInterval(() => {
    let totalUsers = 0;
    client.guilds.cache.forEach((g) => { totalUsers += g.memberCount ?? 0; });

    broadcast("status_update", {
      online: true,
      name: readyClient.user.tag,
      guildCount: readyClient.guilds.cache.size,
      userCount: totalUsers,
      uptimeMs: Date.now() - botStartTime,
    });
  }, 30_000);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`[ERROR] /${interaction.commandName}:`, error);
    const msg = { content: "An unexpected error occurred.", ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg).catch(() => {});
    } else {
      await interaction.reply(msg).catch(() => {});
    }
  }
});

// ─── Price Alert Cron (every 10 minutes) ──────────────────────────────────

cron.schedule("*/10 * * * *", async () => {
  const alerts = loadAlerts();
  if (alerts.length === 0) return;

  console.log(`[CRON] Checking ${alerts.length} alert(s)...`);
  const toRemove = [];

  for (const alert of alerts) {
    try {
      const { cheapest } = await fetchItemOrders(alert.itemSlug);

      if (cheapest.platinum <= alert.targetPrice) {
        console.log(`[ALERT] Triggered: ${alert.readableName} at ${cheapest.platinum}p`);

        // Broadcast to dashboard
        broadcast("alert_triggered", {
          item: alert.readableName,
          currentPrice: cheapest.platinum,
          targetPrice: alert.targetPrice,
          seller: cheapest.user.ingame_name,
          user: alert.username,
        });

        // Try DM first, fallback to channel
        try {
          const user = await client.users.fetch(alert.userId);
          await user.send({ embeds: [alertTriggerEmbed(alert.readableName, cheapest.platinum, alert.targetPrice, cheapest)] });
        } catch {
          try {
            const channel = await client.channels.fetch(alert.channelId);
            await channel.send({
              content: `<@${alert.userId}>`,
              embeds: [alertTriggerEmbed(alert.readableName, cheapest.platinum, alert.targetPrice, cheapest)],
            });
          } catch (e) {
            console.error(`[ALERT] Could not notify ${alert.username}:`, e.message);
          }
        }

        toRemove.push(alert);
      }
    } catch (e) {
      console.error(`[CRON] Error for ${alert.readableName}:`, e.message);
    }
  }

  if (toRemove.length > 0) {
    saveAlerts(alerts.filter((a) => !toRemove.includes(a)));
    console.log(`[CRON] Removed ${toRemove.length} triggered alert(s).`);
  }
});

// ─── Start ─────────────────────────────────────────────────────────────────

async function start() {
  await loadCommands();
  await client.login(token);
}

start().catch((err) => {
  console.error("[BOOT] Fatal startup error:", err);
  process.exit(1);
});
