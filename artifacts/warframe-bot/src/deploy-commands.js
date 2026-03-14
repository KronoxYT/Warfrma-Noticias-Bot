/**
 * deploy-commands.js
 * Registers all slash commands with Discord for your bot.
 *
 * Run this script once before starting the bot, or whenever you add/change commands:
 *   node src/deploy-commands.js
 *
 * Requires: DISCORD_TOKEN, CLIENT_ID, GUILD_ID in environment variables.
 */

import { REST, Routes } from "discord.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readdirSync } from "fs";

// Load environment variables
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId || !guildId) {
  console.error(
    "[DEPLOY] Missing required environment variables: DISCORD_TOKEN, CLIENT_ID, GUILD_ID"
  );
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Dynamically load all command definitions from the commands/ directory.
 */
async function loadCommands() {
  const commandsPath = join(__dirname, "commands");
  const commandFiles = readdirSync(commandsPath).filter((f) => f.endsWith(".js"));

  const commands = [];

  for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    const command = await import(filePath);

    if (command.data && command.execute) {
      commands.push(command.data.toJSON());
      console.log(`[DEPLOY] Loaded command: /${command.data.name}`);
    } else {
      console.warn(`[DEPLOY] Skipped ${file} — missing 'data' or 'execute' export.`);
    }
  }

  return commands;
}

/**
 * Register commands with Discord's API via REST.
 */
async function deploy() {
  const rest = new REST({ version: "10" }).setToken(token);

  try {
    const commands = await loadCommands();
    console.log(`[DEPLOY] Registering ${commands.length} command(s) to guild ${guildId}...`);

    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );

    console.log(`[DEPLOY] Successfully registered ${data.length} command(s).`);
  } catch (error) {
    console.error("[DEPLOY] Failed to register commands:", error);
    process.exit(1);
  }
}

deploy();
