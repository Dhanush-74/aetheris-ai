const logger = require('../utils/logger');

const generateTitle = (firstMessage) => {
  if (!firstMessage || !firstMessage.trim()) {
    return 'New Conversation';
  }

  const cleanPrompt = firstMessage.trim();

  // Instant, snappy heuristic title generator (zero latency, zero API quota usage)
  const cleaned = cleanPrompt
    .replace(/^(what is|explain|how do I|how to|write a|can you|tell me about|help me with|simple|give|show me)\s+/i, '')
    .trim();

  const words = cleaned.split(/\s+/).slice(0, 5).join(' ');
  const capitalized = words.charAt(0).toUpperCase() + words.slice(1);
  return capitalized || 'New Conversation';
};

module.exports = {
  generateTitle
};
