/**
 * embedBuilder.js
 * Helper functions to create consistent, clean Discord embeds for the bot.
 * All commands should use these helpers for a unified visual style.
 */

import { EmbedBuilder } from "discord.js";

// Brand colors for the bot
export const Colors = {
  primary: 0x5865f2,   // Discord blurple - for general responses
  success: 0x57f287,   // Green - for price/good news
  warning: 0xfee75c,   // Yellow - for alerts
  error: 0xed4245,     // Red - for errors
  news: 0x00b0f4,      // Light blue - for news
  build: 0xeb459e,     // Pink/magenta - for builds
};

// Bot footer text shown on every embed
const FOOTER_TEXT = "Warfrma Noticias • Warframe Community Bot";
const FOOTER_ICON = "https://i.imgur.com/7GjkSaH.png"; // Warframe logo placeholder

/**
 * Creates a base embed with common styling applied.
 * @param {string} color - Hex color integer from Colors
 * @returns {EmbedBuilder}
 */
export function baseEmbed(color = Colors.primary) {
  return new EmbedBuilder()
    .setColor(color)
    .setTimestamp()
    .setFooter({ text: FOOTER_TEXT });
}

/**
 * Creates a news embed for Warframe news articles.
 * @param {Object} article - News article data from Warframe API
 * @returns {EmbedBuilder}
 */
export function newsEmbed(article) {
  return new EmbedBuilder()
    .setColor(Colors.news)
    .setTitle(article.message || "Warframe News")
    .setURL(article.link || null)
    .setDescription(article.imageLink ? null : "Click the title to read more.")
    .setImage(article.imageLink || null)
    .addFields(
      { name: "Published", value: `<t:${Math.floor(new Date(article.date).getTime() / 1000)}:R>`, inline: true }
    )
    .setTimestamp()
    .setFooter({ text: FOOTER_TEXT });
}

/**
 * Creates a price embed showing Warframe Market data.
 * @param {string} itemName - Readable item name
 * @param {Object} cheapest - The cheapest seller order
 * @param {number} totalSellers - Total number of active sellers
 * @returns {EmbedBuilder}
 */
export function priceEmbed(itemName, cheapest, totalSellers) {
  return new EmbedBuilder()
    .setColor(Colors.success)
    .setTitle(`📦 ${itemName} — Price Check`)
    .setDescription(`Found **${totalSellers}** active seller(s) on Warframe Market.`)
    .addFields(
      { name: "👤 Cheapest Seller", value: cheapest.user.ingame_name, inline: true },
      { name: "💰 Price", value: `${cheapest.platinum} Platinum`, inline: true },
      { name: "📦 Quantity", value: `${cheapest.quantity}`, inline: true },
      { name: "🔄 Reputation", value: `${cheapest.user.reputation ?? 0}`, inline: true },
      { name: "🟢 Status", value: cheapest.user.status ?? "offline", inline: true }
    )
    .setTimestamp()
    .setFooter({ text: `${FOOTER_TEXT} • Data from warframe.market` });
}

/**
 * Creates a build embed showing a build from the local database.
 * @param {string} itemName - Readable item name
 * @param {Object} build - Build data object from builds.json
 * @returns {EmbedBuilder}
 */
export function buildEmbed(itemName, build) {
  const modList = build.mods.map((mod, i) => `\`${i + 1}.\` ${mod}`).join("\n");

  return new EmbedBuilder()
    .setColor(Colors.build)
    .setTitle(`🔧 ${itemName} — ${build.type === "warframe" ? "Warframe" : "Weapon"} Build`)
    .setDescription(build.description)
    .addFields(
      { name: "📋 Mods", value: modList, inline: false },
      { name: "⚗️ Forma Required", value: `${build.forma ?? "?"}`, inline: true },
      { name: "📊 Difficulty", value: build.difficulty ?? "Unknown", inline: true }
    )
    .setTimestamp()
    .setFooter({ text: `${FOOTER_TEXT} • Community build guide` });
}

/**
 * Creates an alert confirmation embed.
 * @param {string} itemName - Readable item name
 * @param {number} targetPrice - User's price threshold in platinum
 * @returns {EmbedBuilder}
 */
export function alertConfirmEmbed(itemName, targetPrice) {
  return new EmbedBuilder()
    .setColor(Colors.warning)
    .setTitle("🔔 Price Alert Set!")
    .setDescription(`You'll be notified when **${itemName}** drops below **${targetPrice} platinum**.`)
    .addFields(
      { name: "📦 Item", value: itemName, inline: true },
      { name: "💰 Target Price", value: `${targetPrice} plat`, inline: true },
      { name: "🔄 Check Interval", value: "Every 10 minutes", inline: true }
    )
    .setTimestamp()
    .setFooter({ text: FOOTER_TEXT });
}

/**
 * Creates an alert trigger embed sent when the price condition is met.
 * @param {string} itemName - Readable item name
 * @param {number} currentPrice - Current lowest price found
 * @param {number} targetPrice - The threshold that was set
 * @param {Object} seller - Seller info object
 * @returns {EmbedBuilder}
 */
export function alertTriggerEmbed(itemName, currentPrice, targetPrice, seller) {
  return new EmbedBuilder()
    .setColor(Colors.success)
    .setTitle("🚨 Price Alert Triggered!")
    .setDescription(`**${itemName}** is now below your target price!`)
    .addFields(
      { name: "💰 Current Price", value: `${currentPrice} platinum`, inline: true },
      { name: "🎯 Your Target", value: `${targetPrice} platinum`, inline: true },
      { name: "👤 Seller", value: seller.user.ingame_name, inline: true }
    )
    .setTimestamp()
    .setFooter({ text: `${FOOTER_TEXT} • Check warframe.market` });
}

/**
 * Creates a generic error embed.
 * @param {string} message - Error message to display
 * @returns {EmbedBuilder}
 */
export function errorEmbed(message) {
  return new EmbedBuilder()
    .setColor(Colors.error)
    .setTitle("❌ Something went wrong")
    .setDescription(message)
    .setTimestamp()
    .setFooter({ text: FOOTER_TEXT });
}
