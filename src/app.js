const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('express-async-errors');

const config = require('./config');
const database = require('./config/database');
const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const routes = require('./routes');

class App {
  constructor() {
    this.app = express();
    this.port = config.app.port;
    
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  initializeMiddlewares() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));

    // CORS
    this.app.use(cors(config.cors));

    // Compression
    this.app.use(compression());

    // Request logging
    const morganFormat = config.app.env === 'production' ? 'combined' : 'dev';
    this.app.use(morgan(morganFormat, {
      stream: {
        write: (message) => logger.info(message.trim())
      }
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      message: {
        error: 'Too many requests from this IP, please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Static files
    this.app.use('/uploads', express.static('uploads'));

    // Request logging middleware
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.originalUrl}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined,
      });
      next();
    });
  }

  initializeRoutes() {
    // API routes
    this.app.use('/api', routes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.status(200).json({
        message: 'STMADB Portal Backend API',
        version: '1.0.0',
        status: 'Running',
        timestamp: new Date().toISOString(),
      });
    });
  }

  initializeErrorHandling() {
    // 404 handler
    this.app.use(notFound);

    // Global error handler
    this.app.use(errorHandler);
  }

  async start() {
    try {
      // Connect to database
      await database.connect();

      // Start server
      this.server = this.app.listen(this.port, () => {
        logger.info(`🚀 Server running on port ${this.port} in ${config.app.env} mode`);
        logger.info(`📱 API Documentation: http://localhost:${this.port}/api`);
        logger.info(`💡 Health Check: http://localhost:${this.port}/api/health`);
      });

      // Graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      
      // Stop accepting new requests
      this.server.close(async () => {
        logger.info('HTTP server closed');
        
        // Close database connection
        await database.disconnect();
        
        logger.info('Graceful shutdown completed');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forcing shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      shutdown('UNCAUGHT_EXCEPTION');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      shutdown('UNHANDLED_REJECTION');
    });
  }

  getApp() {
    return this.app;
  }
}

module.exports = App;
