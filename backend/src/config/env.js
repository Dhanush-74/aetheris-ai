const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aetheris_ai',
  JWT_SECRET: process.env.JWT_SECRET || 'aetheris_super_secret_jwt_key_2026_987654321',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  MAX_HISTORY_MESSAGES: parseInt(process.env.MAX_HISTORY_MESSAGES || '20', 10),
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
  RATE_LIMIT_MAX: 100
};

module.exports = config;
