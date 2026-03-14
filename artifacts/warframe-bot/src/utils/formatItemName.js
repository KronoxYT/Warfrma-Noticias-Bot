/**
 * formatItemName.js
 * Utility to normalize item names for Warframe Market API calls.
 * Converts spaces to underscores and lowercases everything.
 */

/**
 * Converts a human-readable item name into the API-friendly format.
 * Example: "Ash Prime" -> "ash_prime"
 * @param {string} name - Raw item name from user input
 * @returns {string} - URL-safe item name
 */
export function formatItemName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");   // replace spaces (including multiple) with underscores
}

/**
 * Converts an API item name back to a readable title.
 * Example: "ash_prime" -> "Ash Prime"
 * @param {string} name - API item name
 * @returns {string} - Human-readable title
 */
export function toReadableName(name) {
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
