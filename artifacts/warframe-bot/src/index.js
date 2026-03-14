/**
 * index.js — Warfrma Noticias Bot Entry Point
 *
 * This is the main file that:
 *  1. Starts an Express keep-alive server (for Replit 24/7 hosting)
 *  2. Loads all slash commands dynamically from /commands
 *  3. Connects to Discord via Gateway
 *  4. Handles slash command interactions
 *  5. Runs a cron job every 10 minutes to check price alerts
 *
 * Required environment variables:
 *   DISCORD_TOKEN  — Bot token from Discord Developer Portal
 *   CLIENT_ID      — Application/Client ID
 *   GUILD_ID       — Your Discord server's ID
 *   PORT           — Port for the Express server (auto-set by Replit)
 */

import "dotenv/config";
import express from "express";
import { Client, GatewayIntentBits, Collection, Events } from "discord.js";
import { readdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import cron from "node-cron";
import { fetchItemOrders } from "./services/warframeMarketService.js";
import { loadAlerts, saveAlerts } from "./commands/alerts.js";
import { alertTriggerEmbed } from "./utils/embedBuilder.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Validate Required Environment Variables ───────────────────────────────

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const port = process.env.PORT || 3000;

if (!token || !clientId || !guildId) {
  console.error(
    "[BOOT] Missing required env vars: DISCORD_TOKEN, CLIENT_ID, GUILD_ID. Exiting."
  );
  process.exit(1);
}

// ─── Express Keep-Alive Server ─────────────────────────────────────────────
// Replit puts the project to sleep when there's no HTTP activity.
// This Express server keeps the app alive and lets you ping it.

const app = express();

app.get("/", (_req, res) => {
  res.send("Warfrma Noticias bot is running.");
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    bot: client.user?.tag ?? "connecting...",
    uptime: Math.floor(process.uptime()) + "s",
    timestamp: new Date().toISOString(),
  });
});

app.listen(port, () => {
  console.log(`[HTTP] Keep-alive server listening on port ${port}`);
});

// ─── Discord Client Setup ──────────────────────────────────────────────────

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, // Required for slash commands
  ],
});

// Use a Collection (Map) to store commands so we can look them up by name
client.commands = new Collection();

// ─── Dynamic Command Loader ────────────────────────────────────────────────
// Reads every .js file from /commands and registers it on the client.
// To add a new command, just drop a new file in /commands — no changes needed here.

async function loadCommands() {
  const commandsPath = join(__dirname, "commands");
  const commandFiles = readdirSync(commandsPath).filter((f) => f.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    const command = await import(filePath);

    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
      console.log(`[COMMANDS] Loaded: /${command.data.name}`);
    } else {
      console.warn(`[COMMANDS] Skipped ${file} — missing 'data' or 'execute'.`);
    }
  }
}

// ─── Ready Event ───────────────────────────────────────────────────────────

client.once(Events.ClientReady, (readyClient) => {
  console.log(`[BOT] Logged in as: ${readyClient.user.tag}`);
  console.log(`[BOT] Serving guild: ${guildId}`);
  console.log(`[BOT] Commands loaded: ${client.commands.size}`);

  // Set bot activity status
  readyClient.user.setActivity("Warframe | /news /price /build /alerts");
});

// ─── Interaction Handler ───────────────────────────────────────────────────

client.on(Events.InteractionCreate, async (interaction) => {
  // Only handle slash commands
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.warn(`[COMMANDS] Unknown command: /${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`[ERROR] Command /${interaction.commandName} threw:`, error);

    // Try to tell the user something went wrong
    const errorMsg = { content: "An unexpected error occurred. Please try again.", ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMsg).catch(() => {});
    } else {
      await interaction.reply(errorMsg).catch(() => {});
    }
  }
});

// ─── Price Alert Cron Job ──────────────────────────────────────────────────
// Runs every 10 minutes and checks all active price alerts.
// If a price drops below the user's target, a DM is sent and the alert is removed.

cron.schedule("*/10 * * * *", async () => {
  const alerts = loadAlerts();

  if (alerts.length === 0) return;

  console.log(`[CRON] Checking ${alerts.length} price alert(s)...`);

  const toRemove = [];

  for (const alert of alerts) {
    try {
      const { cheapest } = await fetchItemOrders(alert.itemSlug);

      if (cheapest.platinum <= alert.targetPrice) {
        console.log(
          `[ALERT] Triggered! ${alert.readableName} is ${cheapest.platinum}p (target: ${alert.targetPrice}p) for ${alert.username}`
        );

        // Try to DM the user
        try {
          const user = await client.users.fetch(alert.userId);
          const embed = alertTriggerEmbed(
            alert.readableName,
            cheapest.platinum,
            alert.targetPrice,
            cheapest
          );
          await user.send({ embeds: [embed] });
          console.log(`[ALERT] DM sent to ${alert.username}`);
        } catch (dmError) {
          // User has DMs disabled — try posting in the channel instead
          console.warn(`[ALERT] Could not DM ${alert.username}, trying channel...`);
          try {
            const channel = await client.channels.fetch(alert.channelId);
            const embed = alertTriggerEmbed(
              alert.readableName,
              cheapest.platinum,
              alert.targetPrice,
              cheapest
            );
            await channel.send({ content: `<@${alert.userId}>`, embeds: [embed] });
          } catch (channelError) {
            console.error(`[ALERT] Failed to notify ${alert.username}:`, channelError.message);
          }
        }

        // Mark alert for removal after triggering
        toRemove.push(alert);
      }
    } catch (error) {
      console.error(`[CRON] Error checking alert for ${alert.readableName}:`, error.message);
    }
  }

  // Remove triggered alerts from the database
  if (toRemove.length > 0) {
    const remaining = alerts.filter((a) => !toRemove.includes(a));
    saveAlerts(remaining);
    console.log(`[CRON] Removed ${toRemove.length} triggered alert(s).`);
  }
});

// ─── Start Bot ─────────────────────────────────────────────────────────────

async function start() {
  await loadCommands();
  await client.login(token);
}

start().catch((err) => {
  console.error("[BOOT] Fatal error during startup:", err);
  process.exit(1);
});
