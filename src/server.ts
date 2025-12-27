// Main server entry point for the Indian Local Guide application

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { appConfig } from './config';
import { logger, requestLogger } from './services/logging';
import { validateInput } from './validation/schemas';
import { initializeDatabase, closeDatabase, checkDatabaseHealth } from './database';
import { seedDatabase } from './database/seed-data';
import translationRoutes from './routes/translation';
import foodRoutes from './routes/food';
import culturalRoutes from './routes/cultural';

const app = express();

// Request logging middleware
app.use(requestLogger);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: appConfig.rateLimit.windowMs,
  max: appConfig.rateLimit.max,
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors(appConfig.cors));

// Body parsing middleware with size limits
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf.toString());
    } catch (e) {
      logger.warn('Invalid JSON received', { 
        ip: (req as any).ip || req.socket.remoteAddress, 
        userAgent: (req as any).get ? (req as any).get('User-Agent') : req.headers['user-agent'],
        error: e instanceof Error ? e.message : 'Unknown error'
      });
      throw new Error('Invalid JSON');
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint with database status
app.get('/health', async (req, res) => {
  const dbHealthy = await checkDatabaseHealth();
  
  const healthData = {
    status: dbHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    environment: appConfig.environment,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0',
    database: {
      status: dbHealthy ? 'connected' : 'disconnected',
      type: appConfig.database.type,
    },
  };
  
  logger.debug('Health check requested', { ip: (req as any).ip || req.socket.remoteAddress });
  
  const statusCode = dbHealthy ? 200 : 503;
  res.status(statusCode).json(healthData);
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Indian Local Guide API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      translation: {
        toEnglish: 'POST /api/translate/to-english',
        toHindi: 'POST /api/translate/to-hindi',
        variations: 'GET /api/translate/variations/:term',
        search: 'GET /api/translate/search',
      },
      food: {
        recommendations: 'GET /api/food/recommendations',
        category: 'GET /api/food/category/:category',
        hubs: 'GET /api/food/hubs/:city',
        safety: 'GET /api/food/safety/:vendorId',
      },
      culture: {
        region: 'GET /api/culture/region/:region',
        festival: 'GET /api/culture/festival/:festival',
        etiquette: 'GET /api/culture/etiquette/:context',
        bargaining: 'GET /api/culture/bargaining',
      },
      user: {
        preferences: 'GET/POST /api/user/preferences',
        favorites: 'GET/POST /api/user/favorites',
        history: 'GET /api/user/history',
      },
      search: {
        all: 'GET /api/search',
        suggestions: 'GET /api/search/suggestions',
      },
    },
  });
});

// API routes
app.use('/api/translate', translationRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/culture', culturalRoutes);

// Database status endpoint
app.get('/api/status/database', async (req, res) => {
  try {
    const isHealthy = await checkDatabaseHealth();
    res.json({
      success: true,
      database: {
        status: isHealthy ? 'healthy' : 'unhealthy',
        type: appConfig.database.type,
        path: appConfig.database.database,
      },
    });
  } catch (error) {
    logger.error('Database status check failed', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({
      success: false,
      error: 'Database status check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Input validation middleware
export const validateRequestBody = (schema: any) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      req.body = validateInput(schema, req.body);
      next();
    } catch (error) {
      logger.warn('Request validation failed', {
        path: req.path,
        method: req.method,
        error: error instanceof Error ? error.message : 'Unknown validation error',
        body: req.body,
      });
      
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: error instanceof Error ? error.message : 'Invalid request data',
      });
    }
  };
};

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', err, {
    path: req.path,
    method: req.method,
    ip: (req as any).ip || req.socket.remoteAddress,
    userAgent: (req as any).get ? (req as any).get('User-Agent') : req.headers['user-agent'],
  });

  // Don't expose internal errors in production
  const message = appConfig.environment === 'development' 
    ? err.message 
    : 'Internal server error';

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message,
    ...(appConfig.environment === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn('Route not found', {
    path: req.path,
    method: req.method,
    ip: (req as any).ip || req.socket.remoteAddress,
  });

  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database connection
    logger.info('Initializing database...');
    await initializeDatabase();
    logger.info('Database initialized successfully');

    // Seed database with sample data
    if (appConfig.environment === 'development') {
      logger.info('Seeding database with sample data...');
      const seedResult = await seedDatabase();
      logger.info('Database seeding completed', seedResult);
    }

    // Start server
    const server = app.listen(appConfig.port, () => {
      logger.info('🚀 Indian Local Guide server started', {
        port: appConfig.port,
        environment: appConfig.environment,
        nodeVersion: process.version,
      });
      
      if (appConfig.environment === 'development') {
        console.log(`📍 Health check: http://localhost:${appConfig.port}/health`);
        console.log(`🔗 API info: http://localhost:${appConfig.port}/api`);
        console.log(`💾 Database status: http://localhost:${appConfig.port}/api/status/database`);
      }
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          await closeDatabase();
          logger.info('Database connection closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during database shutdown', error instanceof Error ? error : new Error(String(error)));
          process.exit(1);
        }
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      logger.error('Uncaught exception', error);
      await closeDatabase();
      process.exit(1);
    });

    process.on('unhandledRejection', async (reason, promise) => {
      logger.error('Unhandled rejection', new Error(String(reason)), { promise });
      await closeDatabase();
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server', error instanceof Error ? error : new Error(String(error)));
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer();
}

export default app;