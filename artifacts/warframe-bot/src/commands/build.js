/**
 * commands/build.js
 * Slash command: /build <warframe_or_weapon>
 * Returns a build from the local builds.json database.
 */

import { SlashCommandBuilder } from "discord.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { formatItemName, toReadableName } from "../utils/formatItemName.js";
import { buildEmbed, errorEmbed } from "../utils/embedBuilder.js";

// Resolve path to builds.json relative to this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BUILDS_PATH = join(__dirname, "../database/builds.json");

export const data = new SlashCommandBuilder()
  .setName("build")
  .setDescription("Get a community build for a Warframe or weapon.")
  .addStringOption((option) =>
    option
      .setName("name")
      .setDescription('Warframe or weapon name (e.g. "Mesa", "Kuva Bramma")')
      .setRequired(true)
  );

/**
 * Reads and returns the builds database.
 * @returns {Object} Parsed builds.json content
 */
function loadBuilds() {
  const raw = readFileSync(BUILDS_PATH, "utf-8");
  return JSON.parse(raw);
}

/**
 * Executes the /build command.
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  await interaction.deferReply();

  const rawName = interaction.options.getString("name");
  const buildKey = formatItemName(rawName);
  const readableName = toReadableName(buildKey);

  try {
    console.log(`[CMD] /build ${rawName} executed by ${interaction.user.tag}`);

    const builds = loadBuilds();

    if (!builds[buildKey]) {
      // List available builds so the user knows what to ask for
      const available = Object.keys(builds)
        .map((k) => `\`${toReadableName(k)}\``)
        .join(", ");

      return await interaction.editReply({
        embeds: [
          errorEmbed(
            `No build found for **${readableName}**.\n\n**Available builds:**\n${available}`
          ),
        ],
      });
    }

    const build = builds[buildKey];
    const embed = buildEmbed(readableName, build);

    await interaction.editReply({ embeds: [embed] });
    console.log(`[CMD] /build returned build for: ${buildKey}`);
  } catch (error) {
    console.error(`[CMD] /build failed for "${rawName}":`, error.message);
    await interaction.editReply({
      embeds: [errorEmbed("Failed to load build data. Please try again.")],
    });
  }
}
