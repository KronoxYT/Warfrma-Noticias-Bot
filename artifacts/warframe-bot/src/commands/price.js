/**
 * commands/price.js
 * Slash command: /price <item>
 * Shows the cheapest sell order for an item on Warframe Market.
 */

import { SlashCommandBuilder } from "discord.js";
import { fetchItemOrders } from "../services/warframeMarketService.js";
import { formatItemName, toReadableName } from "../utils/formatItemName.js";
import { priceEmbed, errorEmbed } from "../utils/embedBuilder.js";

export const data = new SlashCommandBuilder()
  .setName("price")
  .setDescription("Check the lowest price for an item on Warframe Market.")
  .addStringOption((option) =>
    option
      .setName("item")
      .setDescription('Item name (e.g. "Ash Prime Set", "Amprex")')
      .setRequired(true)
  );

/**
 * Executes the /price command.
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  await interaction.deferReply();

  const rawItem = interaction.options.getString("item");
  const itemSlug = formatItemName(rawItem);
  const readableName = toReadableName(itemSlug);

  try {
    console.log(`[CMD] /price ${rawItem} executed by ${interaction.user.tag}`);

    const { cheapest, totalSellers } = await fetchItemOrders(itemSlug);
    const embed = priceEmbed(readableName, cheapest, totalSellers);

    await interaction.editReply({ embeds: [embed] });
    console.log(`[CMD] /price ${rawItem} -> ${cheapest.platinum}p (${totalSellers} sellers)`);
  } catch (error) {
    console.error(`[CMD] /price failed for "${rawItem}":`, error.message);
    await interaction.editReply({
      embeds: [errorEmbed(error.message || `Could not fetch price for **${readableName}**.`)],
    });
  }
}
