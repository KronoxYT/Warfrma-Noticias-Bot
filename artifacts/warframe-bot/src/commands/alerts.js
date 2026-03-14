/**
 * commands/alerts.js
 * Slash command: /alerts <item> <price>
 * Subscribes the user to a price drop alert for an item on Warframe Market.
 * Alerts are checked every 10 minutes via cron (see index.js).
 */

import { SlashCommandBuilder } from "discord.js";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { formatItemName, toReadableName } from "../utils/formatItemName.js";
import { alertConfirmEmbed, errorEmbed } from "../utils/embedBuilder.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ALERTS_PATH = join(__dirname, "../database/alerts.json");

export const data = new SlashCommandBuilder()
  .setName("alerts")
  .setDescription("Set a price alert — get notified when an item drops below your target price.")
  .addStringOption((option) =>
    option
      .setName("item")
      .setDescription('Item name (e.g. "Laetum", "Ash Prime Set")')
      .setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName("price")
      .setDescription("Platinum price threshold (you'll be notified when below this)")
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(99999)
  );

/**
 * Reads the current alerts database.
 * @returns {Array} Array of alert objects
 */
export function loadAlerts() {
  try {
    const raw = readFileSync(ALERTS_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Saves the alerts array back to the database file.
 * @param {Array} alerts
 */
export function saveAlerts(alerts) {
  writeFileSync(ALERTS_PATH, JSON.stringify(alerts, null, 2), "utf-8");
}

/**
 * Executes the /alerts command.
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true }); // Only visible to the user who set it

  const rawItem = interaction.options.getString("item");
  const targetPrice = interaction.options.getInteger("price");
  const itemSlug = formatItemName(rawItem);
  const readableName = toReadableName(itemSlug);

  try {
    console.log(
      `[CMD] /alerts ${rawItem} ${targetPrice}p set by ${interaction.user.tag} (${interaction.user.id})`
    );

    const alerts = loadAlerts();

    // Prevent duplicate alerts for the same user + item
    const existing = alerts.find(
      (a) => a.userId === interaction.user.id && a.itemSlug === itemSlug
    );

    if (existing) {
      // Update the existing alert instead of adding a duplicate
      existing.targetPrice = targetPrice;
      existing.channelId = interaction.channelId;
      saveAlerts(alerts);

      return await interaction.editReply({
        embeds: [alertConfirmEmbed(readableName, targetPrice)],
        content: "⚠️ You already had an alert for this item — it has been updated.",
      });
    }

    // Add the new alert
    alerts.push({
      userId: interaction.user.id,
      username: interaction.user.tag,
      channelId: interaction.channelId,
      itemSlug,
      readableName,
      targetPrice,
      createdAt: new Date().toISOString(),
    });

    saveAlerts(alerts);

    await interaction.editReply({
      embeds: [alertConfirmEmbed(readableName, targetPrice)],
    });

    console.log(`[ALERT] Alert saved: ${readableName} < ${targetPrice}p for ${interaction.user.tag}`);
  } catch (error) {
    console.error(`[CMD] /alerts failed:`, error.message);
    await interaction.editReply({
      embeds: [errorEmbed("Failed to save your alert. Please try again.")],
    });
  }
}
