/**
 * warframeNewsService.js
 * Fetches the latest Warframe news from the Warframe Status API.
 * Documentation: https://docs.warframestat.us/
 */

import axios from "axios";

const NEWS_API_URL = "https://api.warframestat.us/pc/news";

/**
 * Fetches the latest Warframe news articles.
 * @returns {Promise<Array>} Array of news article objects sorted by date (newest first)
 */
export async function fetchLatestNews() {
  try {
    const response = await axios.get(NEWS_API_URL, {
      timeout: 8000, // 8-second timeout to avoid hanging
      headers: {
        "Accept-Language": "en",
      },
    });

    // The API returns an array of articles; sort newest first just in case
    const articles = response.data;
    if (!Array.isArray(articles) || articles.length === 0) {
      throw new Error("No news articles returned from API.");
    }

    return articles.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.error("[NewsService] Failed to fetch news:", error.message);
    throw error;
  }
}

/**
 * Returns only the single most recent article.
 * @returns {Promise<Object>} The newest article object
 */
export async function fetchNewestArticle() {
  const articles = await fetchLatestNews();
  return articles[0];
}
