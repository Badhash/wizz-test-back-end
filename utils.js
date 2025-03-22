const ALLOWED_PLATFORMS = ['ios', 'android', ''];

/**
 * Check if the game name is valid
 * @param {string} name
 * @returns {boolean}
 */
const isValidGameName = (name) => name && typeof name === 'string';

/**
 * Check if the platform is valid
 * @param {string} platform
 * @returns {boolean}
 */
const isValidPlatform = (platform) => platform && typeof platform === 'string' && ALLOWED_PLATFORMS.includes(platform);

/**
 * Sanitize the game name
 * @param {string} name
 * @returns {string}
 */
const sanitizeGameName = (name) => name.trim().replace(/[%_\\]/g, (char) => `\\${char}`);

module.exports = {
  isValidGameName,
  isValidPlatform,
  sanitizeGameName,
};
