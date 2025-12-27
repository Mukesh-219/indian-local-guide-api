// SQLite database service implementation

import { Database } from 'sqlite3';
import path from 'path';
import { promises as fs } from 'fs';
import { DatabaseService } from '../services/interfaces';
import { appConfig } from '../config';
import { logger } from '../services/logging';
import { MigrationManager } from './migrations';
import { DatabaseUtils } from './models';
import { Location } from '../types';

export class SQLiteService implements DatabaseService {
  private db: Database | null = null;
  private migrationManager: MigrationManager | null = null;
  private isConnected = false;

  constructor() {
    // Ensure data directory exists
    this.ensureDataDirectory();
  }

  private async ensureDataDirectory(): Promise<void> {
    const dataDir = path.dirname(appConfig.database.database);
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
      logger.info(`Created data directory: ${dataDir}`);
    }
  }

  async connect(): Promise<void> {
    if (this.isConnected && this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.db = new Database(appConfig.database.database, (err) => {
        if (err) {
          logger.error('Failed to connect to SQLite database', err);
          reject(err);
          return;
        }

        logger.info(`Connected to SQLite database: ${appConfig.database.database}`);
        this.isConnected = true;

        // Enable foreign keys
        this.db!.run('PRAGMA foreign_keys = ON', (pragmaErr) => {
          if (pragmaErr) {
            logger.error('Failed to enable foreign keys', pragmaErr);
            reject(pragmaErr);
            return;
          }

          // Initialize migration manager and run migrations
          this.migrationManager = new MigrationManager(this.db!);
          this.migrationManager.migrate()
            .then(() => {
              logger.info('Database migrations completed');
              resolve();
            })
            .catch((migrationErr) => {
              logger.error('Database migration failed', migrationErr);
              reject(migrationErr);
            });
        });
      });
    });
  }

  async disconnect(): Promise<void> {
    if (!this.db || !this.isConnected) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.db!.close((err) => {
        if (err) {
          logger.error('Failed to close database connection', err);
          reject(err);
        } else {
          logger.info('Database connection closed');
          this.isConnected = false;
          this.db = null;
          resolve();
        }
      });
    });
  }

  private ensureConnected(): void {
    if (!this.db || !this.isConnected) {
      throw new Error('Database not connected. Call connect() first.');
    }
  }

  // Generic CRUD operations
  async create<T>(table: string, data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    this.ensureConnected();

    // Add timestamps and ID
    const id = DatabaseUtils.generateId();
    const now = new Date().toISOString();
    const fullData = {
      id,
      created_at: now,
      updated_at: now,
      ...data
    };

    const columns = Object.keys(fullData);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(fullData);

    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

    return new Promise((resolve, reject) => {
      const db = this.db!;
      db.run(sql, values, function(err) {
        if (err) {
          logger.error(`Failed to create record in ${table}`, err, { data });
          reject(err);
          return;
        }

        // Return the full data that was inserted
        resolve(fullData as T);
      });
    });
  }

  async findById<T>(table: string, id: string): Promise<T | null> {
    this.ensureConnected();

    const sql = `SELECT * FROM ${table} WHERE id = ?`;

    return new Promise((resolve, reject) => {
      this.db!.get(sql, [id], (err, row) => {
        if (err) {
          logger.error(`Failed to find record by ID in ${table}`, err, { id });
          reject(err);
          return;
        }

        resolve(row as T || null);
      });
    });
  }

  async findMany<T>(table: string, conditions?: Record<string, any>): Promise<T[]> {
    this.ensureConnected();

    let sql = `SELECT * FROM ${table}`;
    const values: any[] = [];

    if (conditions && Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions)
        .map(key => `${key} = ?`)
        .join(' AND ');
      sql += ` WHERE ${whereClause}`;
      values.push(...Object.values(conditions));
    }

    return new Promise((resolve, reject) => {
      this.db!.all(sql, values, (err, rows) => {
        if (err) {
          logger.error(`Failed to find records in ${table}`, err, { conditions });
          reject(err);
          return;
        }

        resolve(rows as T[]);
      });
    });
  }

  async update<T>(table: string, id: string, updates: Partial<T>): Promise<T> {
    this.ensureConnected();

    // Add updated timestamp
    const updatesWithTimestamp = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const columns = Object.keys(updatesWithTimestamp as Record<string, any>);
    const setClause = columns.map(col => `${col} = ?`).join(', ');
    const values = [...Object.values(updatesWithTimestamp as Record<string, any>), id];

    const sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;

    return new Promise((resolve, reject) => {
      const db = this.db!;
      db.run(sql, values, function(err) {
        if (err) {
          logger.error(`Failed to update record in ${table}`, err, { id, updates });
          reject(err);
          return;
        }

        if (this.changes === 0) {
          reject(new Error(`No record found with id ${id} in ${table}`));
          return;
        }

        // Fetch and return the updated record
        const selectSql = `SELECT * FROM ${table} WHERE id = ?`;
        db.get(selectSql, [id], (selectErr, row) => {
          if (selectErr) {
            logger.error(`Failed to fetch updated record from ${table}`, selectErr, { id });
            reject(selectErr);
            return;
          }

          if (!row) {
            reject(new Error(`Updated record not found in ${table} with id ${id}`));
            return;
          }

          resolve(row as T);
        });
      });
    });
  }

  async delete(table: string, id: string): Promise<void> {
    this.ensureConnected();

    const sql = `DELETE FROM ${table} WHERE id = ?`;

    return new Promise((resolve, reject) => {
      this.db!.run(sql, [id], function(err) {
        if (err) {
          logger.error(`Failed to delete record from ${table}`, err, { id });
          reject(err);
          return;
        }

        if (this.changes === 0) {
          reject(new Error(`No record found with id ${id} in ${table}`));
          return;
        }

        logger.debug(`Deleted record from ${table}`, { id });
        resolve();
      });
    });
  }

  // Specialized queries
  async findByLocation<T>(table: string, location: Location, radius: number): Promise<T[]> {
    this.ensureConnected();

    // Use Haversine formula to find records within radius
    const sql = `
      SELECT *, 
        (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * 
        cos(radians(longitude) - radians(?)) + sin(radians(?)) * 
        sin(radians(latitude)))) AS distance
      FROM ${table}
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        AND (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * 
        cos(radians(longitude) - radians(?)) + sin(radians(?)) * 
        sin(radians(latitude)))) <= ?
      ORDER BY distance
    `;

    const values = [
      location.latitude, location.longitude, location.latitude,
      location.latitude, location.longitude, location.latitude,
      radius
    ];

    return new Promise((resolve, reject) => {
      this.db!.all(sql, values, (err, rows) => {
        if (err) {
          logger.error(`Failed to find records by location in ${table}`, err, { location, radius });
          reject(err);
          return;
        }

        resolve(rows as T[]);
      });
    });
  }

  async searchText<T>(table: string, query: string, fields: string[]): Promise<T[]> {
    this.ensureConnected();

    const searchConditions = fields.map(field => `${field} LIKE ?`).join(' OR ');
    const sql = `SELECT * FROM ${table} WHERE ${searchConditions}`;
    const values = fields.map(() => `%${query}%`);

    return new Promise((resolve, reject) => {
      this.db!.all(sql, values, (err, rows) => {
        if (err) {
          logger.error(`Failed to search text in ${table}`, err, { query, fields });
          reject(err);
          return;
        }

        resolve(rows as T[]);
      });
    });
  }

  // Transaction support
  async transaction<T>(callback: (db: DatabaseService) => Promise<T>): Promise<T> {
    this.ensureConnected();

    return new Promise((resolve, reject) => {
      this.db!.serialize(() => {
        this.db!.run('BEGIN TRANSACTION', (beginErr) => {
          if (beginErr) {
            logger.error('Failed to begin transaction', beginErr);
            reject(beginErr);
            return;
          }

          callback(this)
            .then((result) => {
              this.db!.run('COMMIT', (commitErr) => {
                if (commitErr) {
                  logger.error('Failed to commit transaction', commitErr);
                  this.db!.run('ROLLBACK');
                  reject(commitErr);
                  return;
                }

                resolve(result);
              });
            })
            .catch((callbackErr) => {
              logger.error('Transaction callback failed', callbackErr);
              this.db!.run('ROLLBACK', (rollbackErr) => {
                if (rollbackErr) {
                  logger.error('Failed to rollback transaction', rollbackErr);
                }
                reject(callbackErr);
              });
            });
        });
      });
    });
  }

  // Raw query execution for complex queries
  async query<T>(sql: string, params: any[] = []): Promise<T[]> {
    this.ensureConnected();

    return new Promise((resolve, reject) => {
      this.db!.all(sql, params, (err, rows) => {
        if (err) {
          logger.error('Raw query failed', err, { sql, params });
          reject(err);
          return;
        }

        resolve(rows as T[]);
      });
    });
  }

  async queryOne<T>(sql: string, params: any[] = []): Promise<T | null> {
    this.ensureConnected();

    return new Promise((resolve, reject) => {
      this.db!.get(sql, params, (err, row) => {
        if (err) {
          logger.error('Raw query (single) failed', err, { sql, params });
          reject(err);
          return;
        }

        resolve(row as T || null);
      });
    });
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.queryOne('SELECT 1 as test');
      return true;
    } catch (error) {
      logger.error('Database health check failed', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }
}

// Export singleton instance
export const database = new SQLiteService();