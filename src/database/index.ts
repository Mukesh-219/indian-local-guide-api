// Database service initialization and management

import { SQLiteService } from './sqlite-service';
import { logger } from '../services/logging';
import { appConfig } from '../config';

// Singleton database instance
let databaseInstance: SQLiteService | null = null;

export async function initializeDatabase(): Promise<SQLiteService> {
  if (databaseInstance) {
    return databaseInstance;
  }

  try {
    logger.info('Initializing database connection');
    
    databaseInstance = new SQLiteService();
    await databaseInstance.connect();
    
    logger.info('Database initialized successfully', {
      type: appConfig.database.type,
      database: appConfig.database.database,
    });
    
    return databaseInstance;
  } catch (error) {
    logger.error('Failed to initialize database', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  if (databaseInstance) {
    try {
      await databaseInstance.disconnect();
      databaseInstance = null;
      logger.info('Database connection closed');
    } catch (error) {
      logger.error('Error closing database connection', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
}

export function getDatabase(): SQLiteService {
  if (!databaseInstance) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return databaseInstance;
}

// Health check for database
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    if (!databaseInstance) {
      return false;
    }
    return await databaseInstance.healthCheck();
  } catch (error) {
    logger.error('Database health check failed', error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}

// Graceful shutdown handler
export async function gracefulDatabaseShutdown(): Promise<void> {
  logger.info('Initiating graceful database shutdown');
  await closeDatabase();
}