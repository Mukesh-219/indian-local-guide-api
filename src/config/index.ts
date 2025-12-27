// Application configuration management

import { config } from 'dotenv';
import { AppConfig, DatabaseConfig } from '../services/interfaces';
import { EnvironmentSchema } from '../validation/schemas';

// Load environment variables
config();

// Validate environment variables
const env = EnvironmentSchema.parse({
  PORT: process.env.PORT || '3000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_PATH: process.env.DATABASE_PATH || './data/indian-local-guide.db',
  DB_POOL_SIZE: process.env.DB_POOL_SIZE || '10',
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || '900000',
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX || '100',
  CACHE_TTL: process.env.CACHE_TTL || '3600',
  CACHE_MAX_SIZE: process.env.CACHE_MAX_SIZE || '1000',
});

const databaseConfig: DatabaseConfig = {
  type: 'sqlite',
  database: env.DATABASE_PATH,
  poolSize: env.DB_POOL_SIZE || 10,
};

export const appConfig: AppConfig = {
  port: env.PORT,
  environment: env.NODE_ENV,
  database: databaseConfig,
  cors: {
    origin: env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS || 900000, // 15 minutes
    max: env.RATE_LIMIT_MAX || 100, // limit each IP to 100 requests per windowMs
  },
  cache: {
    ttl: env.CACHE_TTL || 3600, // 1 hour
    maxSize: env.CACHE_MAX_SIZE || 1000,
  },
};

export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';