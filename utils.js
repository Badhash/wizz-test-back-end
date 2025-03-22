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


/**
 * Split an array into chunks
 * @param array
 * @param chunkSize
 * @returns {[]}
 */
const arrayChunk = (array, chunkSize) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

module.exports = {
  isValidGameName,
  isValidPlatform,
  sanitizeGameName,
  arrayChunk
};
