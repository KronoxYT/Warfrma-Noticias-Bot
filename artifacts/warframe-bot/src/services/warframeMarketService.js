/**
 * warframeMarketService.js
 * Fetches item order data from the Warframe Market API.
 * Documentation: https://warframe.market
 */

import axios from "axios";

const MARKET_BASE_URL = "https://api.warframe.market/v1/items";

/**
 * Fetches sell orders for a given item from Warframe Market.
 * Filters for online sellers only, sorted by lowest price.
 *
 * @param {string} itemSlug - URL-safe item name (e.g. "ash_prime_set")
 * @returns {Promise<{ cheapest: Object, allSellers: Array, totalSellers: number }>}
 */
export async function fetchItemOrders(itemSlug) {
  const url = `${MARKET_BASE_URL}/${itemSlug}/orders`;

  try {
    const response = await axios.get(url, {
      timeout: 8000,
      headers: {
        "Platform": "pc",
        "Language": "en",
      },
    });

    const orders = response.data?.payload?.orders;
    if (!orders || orders.length === 0) {
      throw new Error(`No orders found for item: ${itemSlug}`);
    }

    // Filter for SELL orders only from online or ingame users
    const sellOrders = orders.filter(
      (order) =>
        order.order_type === "sell" &&
        (order.user.status === "ingame" || order.user.status === "online")
    );

    if (sellOrders.length === 0) {
      throw new Error(
        `No online sellers found for **${itemSlug}**. Try again later.`
      );
    }

    // Sort by lowest platinum price
    sellOrders.sort((a, b) => a.platinum - b.platinum);

    return {
      cheapest: sellOrders[0],
      allSellers: sellOrders,
      totalSellers: sellOrders.length,
    };
  } catch (error) {
    // Re-throw with a cleaner message if it's an Axios error
    if (error.response?.status === 404) {
      throw new Error(
        `Item **${itemSlug}** not found on Warframe Market. Check the spelling and try again.`
      );
    }
    console.error("[MarketService] Error fetching orders:", error.message);
    throw error;
  }
}
