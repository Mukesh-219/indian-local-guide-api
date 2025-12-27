// Repository for user data and preferences

import { DatabaseService } from '../../services/interfaces';
import { User, UserPreferences, Favorite, RecommendationHistory } from '../../types';
import { 
  ModelTransformer, 
  DatabaseUtils,
  UserRow 
} from '../models';
import { logger } from '../../services/logging';

export class UserRepository {
  constructor(private db: DatabaseService) {}

  async create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const id = DatabaseUtils.generateId();
    const now = new Date();
    
    const fullUser: User = {
      id,
      createdAt: now,
      updatedAt: now,
      ...user,
    };

    return this.db.transaction(async (db) => {
      // Insert main user record
      const userRow = ModelTransformer.userToRow(fullUser);
      await db.create<UserRow>('users', userRow);

      // Insert dietary restrictions
      for (const restriction of user.preferences.dietaryRestrictions) {
        await db.create('user_dietary_restrictions', {
          id: DatabaseUtils.generateId(),
          user_id: id,
          restriction,
        });
      }

      // Insert preferred regions
      for (const region of user.preferences.preferredRegions) {
        await db.create('user_preferred_regions', {
          id: DatabaseUtils.generateId(),
          user_id: id,
          region,
        });
      }

      // Insert favorites
      for (const favorite of user.favorites) {
        await db.create('user_favorites', {
          id: favorite.id,
          user_id: id,
          item_type: favorite.type,
          item_id: favorite.itemId,
          notes: favorite.notes || null,
          date_added: favorite.dateAdded.toISOString(),
        });
      }

      return fullUser;
    });
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.db.findById<UserRow>('users', id);
    if (!row) {
      return null;
    }

    // Get dietary restrictions
    const dietaryRestrictions = await this.db.query<{ restriction: string }>(
      'SELECT restriction FROM user_dietary_restrictions WHERE user_id = ?',
      [id]
    );

    // Get preferred regions
    const preferredRegions = await this.db.query<{ region: string }>(
      'SELECT region FROM user_preferred_regions WHERE user_id = ?',
      [id]
    );

    // Get favorites
    const favorites = await this.db.query<{
      id: string;
      item_type: string;
      item_id: string;
      notes: string | null;
      date_added: string;
    }>('SELECT * FROM user_favorites WHERE user_id = ?', [id]);

    const user = ModelTransformer.userFromRow(
      row,
      dietaryRestrictions.map(d => d.restriction),
      preferredRegions.map(r => r.region)
    );

    user.favorites = favorites.map(f => ({
      id: f.id,
      type: f.item_type as 'slang' | 'food' | 'cultural',
      itemId: f.item_id,
      dateAdded: new Date(f.date_added),
      ...(f.notes && { notes: f.notes }),
    }));

    return user;
  }

  async updatePreferences(userId: string, preferences: UserPreferences): Promise<User> {
    const existing = await this.findById(userId);
    if (!existing) {
      throw new Error(`User with id ${userId} not found`);
    }

    const updatedUser = {
      ...existing,
      preferences,
      updatedAt: new Date(),
    };

    return this.db.transaction(async (db) => {
      // Update main user record
      const userRow = ModelTransformer.userToRow(updatedUser);
      await db.update('users', userId, userRow);

      // Replace dietary restrictions
      await db.query('DELETE FROM user_dietary_restrictions WHERE user_id = ?', [userId]);
      for (const restriction of preferences.dietaryRestrictions) {
        await db.create('user_dietary_restrictions', {
          id: DatabaseUtils.generateId(),
          user_id: userId,
          restriction,
        });
      }

      // Replace preferred regions
      await db.query('DELETE FROM user_preferred_regions WHERE user_id = ?', [userId]);
      for (const region of preferences.preferredRegions) {
        await db.create('user_preferred_regions', {
          id: DatabaseUtils.generateId(),
          user_id: userId,
          region,
        });
      }

      return updatedUser;
    });
  }

  async addFavorite(userId: string, favorite: Omit<Favorite, 'id' | 'dateAdded'>): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }

    // Check if already favorited
    const existing = await this.db.queryOne<{ id: string }>(
      'SELECT id FROM user_favorites WHERE user_id = ? AND item_type = ? AND item_id = ?',
      [userId, favorite.type, favorite.itemId]
    );

    if (existing) {
      logger.warn('Item already favorited', { userId, itemType: favorite.type, itemId: favorite.itemId });
      return;
    }

    await this.db.create('user_favorites', {
      id: DatabaseUtils.generateId(),
      user_id: userId,
      item_type: favorite.type,
      item_id: favorite.itemId,
      notes: favorite.notes || null,
      date_added: new Date().toISOString(),
    });

    logger.info('Favorite added', { userId, itemType: favorite.type, itemId: favorite.itemId });
  }

  async removeFavorite(userId: string, favoriteId: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }

    const existing = await this.db.queryOne<{ id: string }>(
      'SELECT id FROM user_favorites WHERE id = ? AND user_id = ?',
      [favoriteId, userId]
    );

    if (!existing) {
      throw new Error(`Favorite with id ${favoriteId} not found for user ${userId}`);
    }

    await this.db.delete('user_favorites', favoriteId);
    logger.info('Favorite removed', { userId, favoriteId });
  }

  async getFavorites(userId: string, type?: 'slang' | 'food' | 'cultural'): Promise<Favorite[]> {
    let sql = 'SELECT * FROM user_favorites WHERE user_id = ?';
    const params: any[] = [userId];

    if (type) {
      sql += ' AND item_type = ?';
      params.push(type);
    }

    sql += ' ORDER BY date_added DESC';

    const rows = await this.db.query<{
      id: string;
      item_type: string;
      item_id: string;
      notes: string | null;
      date_added: string;
    }>(sql, params);

    return rows.map(row => ({
      id: row.id,
      type: row.item_type as 'slang' | 'food' | 'cultural',
      itemId: row.item_id,
      dateAdded: new Date(row.date_added),
      ...(row.notes && { notes: row.notes }),
    }));
  }

  async addToHistory(userId: string, entry: Omit<RecommendationHistory, 'id' | 'userId'>): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }

    await this.db.create('recommendation_history', {
      id: DatabaseUtils.generateId(),
      user_id: userId,
      type: entry.type,
      query: entry.query,
      results_json: JSON.stringify(entry.results),
      user_rating: entry.userRating || null,
      timestamp: entry.timestamp.toISOString(),
    });

    logger.debug('Added to recommendation history', { userId, type: entry.type, query: entry.query });
  }

  async getRecommendationHistory(
    userId: string, 
    type?: 'slang' | 'food' | 'cultural',
    limit: number = 50
  ): Promise<RecommendationHistory[]> {
    let sql = 'SELECT * FROM recommendation_history WHERE user_id = ?';
    const params: any[] = [userId];

    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }

    sql += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);

    const rows = await this.db.query<{
      id: string;
      user_id: string;
      type: string;
      query: string;
      results_json: string;
      user_rating: number | null;
      timestamp: string;
    }>(sql, params);

    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      type: row.type as 'slang' | 'food' | 'cultural',
      query: row.query,
      results: JSON.parse(row.results_json),
      timestamp: new Date(row.timestamp),
      ...(row.user_rating && { userRating: row.user_rating }),
    }));
  }

  async rateRecommendation(userId: string, historyId: string, rating: number): Promise<void> {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const existing = await this.db.queryOne<{ id: string; user_id: string }>(
      'SELECT id, user_id FROM recommendation_history WHERE id = ?',
      [historyId]
    );

    if (!existing) {
      throw new Error(`Recommendation history with id ${historyId} not found`);
    }

    if (existing.user_id !== userId) {
      throw new Error(`Recommendation history ${historyId} does not belong to user ${userId}`);
    }

    await this.db.update('recommendation_history', historyId, {
      user_rating: rating,
    });

    logger.info('Recommendation rated', { userId, historyId, rating });
  }

  async getUserStatistics(userId: string): Promise<{
    totalFavorites: number;
    favoritesByType: Record<string, number>;
    totalQueries: number;
    queriesByType: Record<string, number>;
    averageRating: number;
    joinDate: Date;
  }> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }

    const [favoritesResult, favoritesByTypeResults, queriesResult, queriesByTypeResults, avgRatingResult] = await Promise.all([
      this.db.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM user_favorites WHERE user_id = ?', [userId]),
      this.db.query<{ item_type: string; count: number }>('SELECT item_type, COUNT(*) as count FROM user_favorites WHERE user_id = ? GROUP BY item_type', [userId]),
      this.db.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM recommendation_history WHERE user_id = ?', [userId]),
      this.db.query<{ type: string; count: number }>('SELECT type, COUNT(*) as count FROM recommendation_history WHERE user_id = ? GROUP BY type', [userId]),
      this.db.queryOne<{ avg_rating: number }>('SELECT AVG(user_rating) as avg_rating FROM recommendation_history WHERE user_id = ? AND user_rating IS NOT NULL', [userId]),
    ]);

    const favoritesByType: Record<string, number> = {};
    favoritesByTypeResults.forEach(row => {
      favoritesByType[row.item_type] = row.count;
    });

    const queriesByType: Record<string, number> = {};
    queriesByTypeResults.forEach(row => {
      queriesByType[row.type] = row.count;
    });

    return {
      totalFavorites: favoritesResult?.count || 0,
      favoritesByType,
      totalQueries: queriesResult?.count || 0,
      queriesByType,
      averageRating: avgRatingResult?.avg_rating || 0,
      joinDate: user.createdAt,
    };
  }

  async delete(userId: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }

    // Foreign key constraints will handle cascading deletes
    await this.db.delete('users', userId);
    
    logger.info('User deleted', { userId });
  }
}