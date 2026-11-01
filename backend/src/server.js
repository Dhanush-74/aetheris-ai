const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const config = require('./config/env');
const { connectDB, getStatus } = require('./config/db');
const logger = require('./utils/logger');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

// CORS configuration — allow all origins (Render, Cloudflare, localhost)
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Gzip Compression (skip SSE stream so tokens are instant)
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers.accept && req.headers.accept.includes('text/event-stream')) {
        return false;
      }
      return compression.filter(req, res);
    }
  })
);

// Logging & Parsing
if (config.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    mongoConnected: getStatus(),
    geminiConfigured: !!config.GEMINI_API_KEY,
    geminiModel: config.GEMINI_MODEL
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/user', userRoutes);

// Production Static Serving for Frontend SPA
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.resolve(frontendDist, 'index.html'));
  });
}

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
  await connectDB();

  const server = app.listen(config.PORT, () => {
    logger.info(`✨ Aetheris AI Backend is running on http://localhost:${config.PORT}`);
    logger.info(`📡 Client URL configured as: ${config.CLIENT_URL}`);
    logger.info(`🤖 Active Gemini Model: ${config.GEMINI_MODEL}`);
  });

  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Promise Rejection:', err.message);
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      logger.info('Process terminated.');
    });
  });
};

startServer();

module.exports = app;
