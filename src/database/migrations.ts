// Database migration system for schema management

import { promises as fs } from 'fs';
import path from 'path';
import { Database } from 'sqlite3';
import { logger } from '../services/logging';

export interface Migration {
  version: number;
  name: string;
  up: string;
  down?: string;
}

export class MigrationManager {
  private db: Database;
  private migrationsPath: string;

  constructor(db: Database, migrationsPath: string = path.join(__dirname, 'migrations')) {
    this.db = db;
    this.migrationsPath = migrationsPath;
  }

  // Initialize migrations table
  async initializeMigrationsTable(): Promise<void> {
    return new Promise((resolve, reject) => {
      const sql = `
        CREATE TABLE IF NOT EXISTS migrations (
          version INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      this.db.run(sql, (err) => {
        if (err) {
          logger.error('Failed to create migrations table', err);
          reject(err);
        } else {
          logger.info('Migrations table initialized');
          resolve();
        }
      });
    });
  }

  // Get current migration version
  async getCurrentVersion(): Promise<number> {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT MAX(version) as version FROM migrations';
      
      this.db.get(sql, (err, row: any) => {
        if (err) {
          logger.error('Failed to get current migration version', err);
          reject(err);
        } else {
          const version = row?.version || 0;
          resolve(version);
        }
      });
    });
  }

  // Run a single migration
  async runMigration(migration: Migration): Promise<void> {
    return new Promise((resolve, reject) => {
      logger.info(`Running migration ${migration.version}: ${migration.name}`);
      
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');
        
        // Execute migration SQL
        this.db.exec(migration.up, (err) => {
          if (err) {
            logger.error(`Migration ${migration.version} failed`, err);
            this.db.run('ROLLBACK');
            reject(err);
            return;
          }
          
          // Record migration in migrations table
          const insertSql = 'INSERT INTO migrations (version, name) VALUES (?, ?)';
          this.db.run(insertSql, [migration.version, migration.name], (insertErr) => {
            if (insertErr) {
              logger.error(`Failed to record migration ${migration.version}`, insertErr);
              this.db.run('ROLLBACK');
              reject(insertErr);
              return;
            }
            
            this.db.run('COMMIT');
            logger.info(`Migration ${migration.version} completed successfully`);
            resolve();
          });
        });
      });
    });
  }

  // Run all pending migrations
  async migrate(): Promise<void> {
    try {
      await this.initializeMigrationsTable();
      const currentVersion = await this.getCurrentVersion();
      const migrations = await this.loadMigrations();
      
      const pendingMigrations = migrations.filter(m => m.version > currentVersion);
      
      if (pendingMigrations.length === 0) {
        logger.info('No pending migrations');
        return;
      }
      
      logger.info(`Running ${pendingMigrations.length} pending migrations`);
      
      for (const migration of pendingMigrations) {
        await this.runMigration(migration);
      }
      
      logger.info('All migrations completed successfully');
    } catch (error) {
      logger.error('Migration failed', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  // Load migrations from files or return built-in migrations
  private async loadMigrations(): Promise<Migration[]> {
    // For now, return built-in migrations
    // In the future, this could load from migration files
    return this.getBuiltInMigrations();
  }

  // Built-in migrations for initial schema
  private getBuiltInMigrations(): Migration[] {
    return [
      {
        version: 1,
        name: 'initial_schema',
        up: `
          -- Enable foreign key constraints
          PRAGMA foreign_keys = ON;

          -- Slang terms table
          CREATE TABLE IF NOT EXISTS slang_terms (
              id TEXT PRIMARY KEY,
              term TEXT NOT NULL,
              language TEXT NOT NULL CHECK (language IN ('hindi', 'english', 'regional')),
              region TEXT NOT NULL,
              context TEXT NOT NULL CHECK (context IN ('formal', 'casual', 'slang')),
              popularity INTEGER NOT NULL DEFAULT 0 CHECK (popularity >= 0 AND popularity <= 100),
              created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          );

          -- Slang translations table
          CREATE TABLE IF NOT EXISTS slang_translations (
              id TEXT PRIMARY KEY,
              slang_term_id TEXT NOT NULL,
              text TEXT NOT NULL,
              target_language TEXT NOT NULL,
              context TEXT NOT NULL,
              confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
              created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (slang_term_id) REFERENCES slang_terms(id) ON DELETE CASCADE
          );

          -- Usage examples table
          CREATE TABLE IF NOT EXISTS usage_examples (
              id TEXT PRIMARY KEY,
              slang_term_id TEXT NOT NULL,
              example TEXT NOT NULL,
              created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (slang_term_id) REFERENCES slang_terms(id) ON DELETE CASCADE
          );

          -- Food items table
          CREATE TABLE IF NOT EXISTS food_items (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              description TEXT NOT NULL,
              category TEXT NOT NULL,
              region TEXT NOT NULL,
              preparation_time TEXT,
              spice_level TEXT NOT NULL CHECK (spice_level IN ('mild', 'medium', 'hot', 'very-hot')),
              is_vegetarian BOOLEAN NOT NULL DEFAULT 0,
              is_vegan BOOLEAN NOT NULL DEFAULT 0,
              is_gluten_free BOOLEAN NOT NULL DEFAULT 0,
              created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          );

          -- Food vendors table
          CREATE TABLE IF NOT EXISTS food_vendors (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              latitude REAL NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
              longitude REAL NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
              city TEXT NOT NULL,
              state TEXT NOT NULL,
              country TEXT NOT NULL DEFAULT 'India',
              created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          );

          -- Users table
          CREATE TABLE IF NOT EXISTS users (
              id TEXT PRIMARY KEY,
              language_preference TEXT NOT NULL DEFAULT 'english',
              spice_preference TEXT NOT NULL DEFAULT 'medium' CHECK (spice_preference IN ('mild', 'medium', 'hot', 'very-hot')),
              budget_min INTEGER CHECK (budget_min >= 0),
              budget_max INTEGER CHECK (budget_max >= budget_min),
              budget_currency TEXT DEFAULT 'INR',
              created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `,
      },
      {
        version: 2,
        name: 'add_indexes',
        up: `
          -- Create indexes for better performance
          CREATE INDEX IF NOT EXISTS idx_slang_terms_term ON slang_terms(term);
          CREATE INDEX IF NOT EXISTS idx_slang_terms_language ON slang_terms(language);
          CREATE INDEX IF NOT EXISTS idx_slang_terms_region ON slang_terms(region);
          CREATE INDEX IF NOT EXISTS idx_slang_terms_popularity ON slang_terms(popularity DESC);

          CREATE INDEX IF NOT EXISTS idx_slang_translations_term_id ON slang_translations(slang_term_id);
          CREATE INDEX IF NOT EXISTS idx_slang_translations_target_lang ON slang_translations(target_language);

          CREATE INDEX IF NOT EXISTS idx_food_items_name ON food_items(name);
          CREATE INDEX IF NOT EXISTS idx_food_items_category ON food_items(category);
          CREATE INDEX IF NOT EXISTS idx_food_items_region ON food_items(region);
          CREATE INDEX IF NOT EXISTS idx_food_items_dietary ON food_items(is_vegetarian, is_vegan, is_gluten_free);

          CREATE INDEX IF NOT EXISTS idx_food_vendors_location ON food_vendors(latitude, longitude);
          CREATE INDEX IF NOT EXISTS idx_food_vendors_city ON food_vendors(city);
        `,
      },
      {
        version: 3,
        name: 'add_safety_and_preferences',
        up: `
          -- Safety ratings table
          CREATE TABLE IF NOT EXISTS safety_ratings (
              id TEXT PRIMARY KEY,
              vendor_id TEXT NOT NULL,
              overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
              hygiene_rating INTEGER NOT NULL CHECK (hygiene_rating >= 1 AND hygiene_rating <= 5),
              freshness_rating INTEGER NOT NULL CHECK (freshness_rating >= 1 AND freshness_rating <= 5),
              popularity_rating INTEGER NOT NULL CHECK (popularity_rating >= 1 AND popularity_rating <= 5),
              review_count INTEGER NOT NULL DEFAULT 0 CHECK (review_count >= 0),
              last_updated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (vendor_id) REFERENCES food_vendors(id) ON DELETE CASCADE
          );

          -- User favorites table
          CREATE TABLE IF NOT EXISTS user_favorites (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL,
              item_type TEXT NOT NULL CHECK (item_type IN ('slang', 'food', 'cultural')),
              item_id TEXT NOT NULL,
              notes TEXT,
              date_added DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          );

          -- User dietary restrictions table
          CREATE TABLE IF NOT EXISTS user_dietary_restrictions (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL,
              restriction TEXT NOT NULL,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          );

          -- User preferred regions table
          CREATE TABLE IF NOT EXISTS user_preferred_regions (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL,
              region TEXT NOT NULL,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          );

          -- Add indexes
          CREATE INDEX IF NOT EXISTS idx_safety_ratings_vendor ON safety_ratings(vendor_id);
          CREATE INDEX IF NOT EXISTS idx_safety_ratings_overall ON safety_ratings(overall_rating DESC);
          CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);
          CREATE INDEX IF NOT EXISTS idx_user_favorites_type ON user_favorites(item_type);
        `,
      },
    ];
  }

  // Rollback to a specific version (if down migrations are provided)
  async rollbackTo(targetVersion: number): Promise<void> {
    const currentVersion = await this.getCurrentVersion();
    
    if (targetVersion >= currentVersion) {
      logger.info(`Already at or below version ${targetVersion}`);
      return;
    }

    logger.warn(`Rolling back from version ${currentVersion} to ${targetVersion}`);
    logger.warn('Rollback functionality not fully implemented - this would require down migrations');
    
    // For now, just log the warning
    // In a full implementation, this would run down migrations in reverse order
  }
}