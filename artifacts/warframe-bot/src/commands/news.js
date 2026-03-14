/**
 * commands/news.js
 * Slash command: /news
 * Fetches and displays the latest Warframe news article.
 */

import { SlashCommandBuilder } from "discord.js";
import { fetchNewestArticle } from "../services/warframeNewsService.js";
import { newsEmbed, errorEmbed } from "../utils/embedBuilder.js";

export const data = new SlashCommandBuilder()
  .setName("news")
  .setDescription("Get the latest Warframe news from the official feed.");

/**
 * Executes the /news command.
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  // Defer reply so the bot has time to fetch data (up to 15 minutes)
  await interaction.deferReply();

  try {
    console.log(`[CMD] /news executed by ${interaction.user.tag}`);
    const article = await fetchNewestArticle();

    const embed = newsEmbed(article);
    await interaction.editReply({ embeds: [embed] });

    console.log(`[CMD] /news returned article: "${article.message}"`);
  } catch (error) {
    console.error("[CMD] /news failed:", error.message);
    await interaction.editReply({
      embeds: [errorEmbed("Could not fetch Warframe news. Please try again later.")],
    });
  }
}
