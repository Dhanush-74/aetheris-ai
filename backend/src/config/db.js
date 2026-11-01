const mongoose = require('mongoose');
const config = require('./env');
const logger = require('../utils/logger');

let isMongoConnected = false;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000
    });
    isMongoConnected = true;
    logger.info(`MongoDB Connected successfully: ${conn.connection.host}`);
    return true;
  } catch (error) {
    isMongoConnected = false;
    logger.warn(`MongoDB connection not available: ${error.message}`);
    logger.info(`Aetheris AI is running with the built-in resilient persistent JSON store.`);
    logger.info(`To connect to MongoDB Atlas, set MONGODB_URI=mongodb+srv://... in backend/.env`);
    return false;
  }
};

const getStatus = () => isMongoConnected;

module.exports = {
  connectDB,
  getStatus
};
