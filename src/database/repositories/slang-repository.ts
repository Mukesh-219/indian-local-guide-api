// Repository for slang terms with domain-specific operations

import { DatabaseService } from '../../services/interfaces';
import { SlangTerm } from '../../types';
import { 
  ModelTransformer, 
  DatabaseUtils,
  SlangTermRow,
  SlangTranslationRow,
  UsageExampleRow 
} from '../models';
import { logger } from '../../services/logging';

export class SlangRepository {
  constructor(private db: DatabaseService) {}

  async create(slangTerm: Omit<SlangTerm, 'id' | 'createdAt' | 'updatedAt'>): Promise<SlangTerm> {
    const id = DatabaseUtils.generateId();
    const now = new Date();
    
    const fullSlangTerm: SlangTerm = {
      id,
      createdAt: now,
      updatedAt: now,
      ...slangTerm,
    };

    return this.db.transaction(async (db) => {
      // Insert main slang term
      const slangTermRow = ModelTransformer.slangTermToRow(fullSlangTerm);
      await db.create<SlangTermRow>('slang_terms', slangTermRow);

      // Insert translations
      for (const translation of slangTerm.translations) {
        const translationRow = {
          id: DatabaseUtils.generateId(),
          slang_term_id: id,
          text: translation.text,
          target_language: translation.targetLanguage,
          context: translation.context,
          confidence: translation.confidence,
          created_at: now.toISOString(),
        };
        await db.create<SlangTranslationRow>('slang_translations', translationRow);
      }

      // Insert usage examples
      for (const example of slangTerm.usageExamples) {
        const exampleRow = {
          id: DatabaseUtils.generateId(),
          slang_term_id: id,
          example,
          created_at: now.toISOString(),
        };
        await db.create<UsageExampleRow>('usage_examples', exampleRow);
      }

      return fullSlangTerm;
    });
  }

  async findById(id: string): Promise<SlangTerm | null> {
    const row = await this.db.findById<SlangTermRow>('slang_terms', id);
    if (!row) {
      return null;
    }

    const translations = await this.db.findMany<SlangTranslationRow>('slang_translations', {
      slang_term_id: id,
    });

    const examples = await this.db.findMany<UsageExampleRow>('usage_examples', {
      slang_term_id: id,
    });

    return ModelTransformer.slangTermFromRow(row, translations, examples);
  }

  async findByTerm(term: string, language?: string): Promise<SlangTerm[]> {
    const conditions: Record<string, any> = { term };
    if (language) {
      conditions.language = language;
    }

    const rows = await this.db.findMany<SlangTermRow>('slang_terms', conditions);
    
    const results: SlangTerm[] = [];
    for (const row of rows) {
      const slangTerm = await this.findById(row.id);
      if (slangTerm) {
        results.push(slangTerm);
      }
    }

    return results;
  }

  async searchTerms(query: string, limit: number = 20): Promise<SlangTerm[]> {
    const sanitizedQuery = DatabaseUtils.sanitizeLikeQuery(query);
    const rows = await this.db.query<SlangTermRow>(
      `SELECT * FROM slang_terms 
       WHERE term LIKE ? OR region LIKE ?
       ORDER BY popularity DESC, term ASC
       LIMIT ?`,
      [`%${sanitizedQuery}%`, `%${sanitizedQuery}%`, limit]
    );

    const results: SlangTerm[] = [];
    for (const row of rows) {
      const slangTerm = await this.findById(row.id);
      if (slangTerm) {
        results.push(slangTerm);
      }
    }

    return results;
  }

  async findByRegion(region: string, limit: number = 50): Promise<SlangTerm[]> {
    const rows = await this.db.query<SlangTermRow>(
      `SELECT * FROM slang_terms 
       WHERE region = ?
       ORDER BY popularity DESC, term ASC
       LIMIT ?`,
      [region, limit]
    );

    const results: SlangTerm[] = [];
    for (const row of rows) {
      const slangTerm = await this.findById(row.id);
      if (slangTerm) {
        results.push(slangTerm);
      }
    }

    return results;
  }

  async findPopular(limit: number = 20): Promise<SlangTerm[]> {
    const rows = await this.db.query<SlangTermRow>(
      `SELECT * FROM slang_terms 
       ORDER BY popularity DESC, term ASC
       LIMIT ?`,
      [limit]
    );

    const results: SlangTerm[] = [];
    for (const row of rows) {
      const slangTerm = await this.findById(row.id);
      if (slangTerm) {
        results.push(slangTerm);
      }
    }

    return results;
  }

  async update(id: string, updates: Partial<SlangTerm>): Promise<SlangTerm> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Slang term with id ${id} not found`);
    }

    const updatedTerm = {
      ...existing,
      ...updates,
      id: existing.id, // Ensure ID doesn't change
      createdAt: existing.createdAt, // Ensure createdAt doesn't change
      updatedAt: new Date(),
    };

    return this.db.transaction(async (db) => {
      // Update main record
      const slangTermRow = ModelTransformer.slangTermToRow(updatedTerm);
      await db.update('slang_terms', id, slangTermRow);

      // If translations were updated, replace them
      if (updates.translations) {
        // Delete existing translations
        await db.query('DELETE FROM slang_translations WHERE slang_term_id = ?', [id]);
        
        // Insert new translations
        for (const translation of updates.translations) {
          const translationRow = {
            id: DatabaseUtils.generateId(),
            slang_term_id: id,
            text: translation.text,
            target_language: translation.targetLanguage,
            context: translation.context,
            confidence: translation.confidence,
            created_at: updatedTerm.updatedAt.toISOString(),
          };
          await db.create<SlangTranslationRow>('slang_translations', translationRow);
        }
      }

      // If usage examples were updated, replace them
      if (updates.usageExamples) {
        // Delete existing examples
        await db.query('DELETE FROM usage_examples WHERE slang_term_id = ?', [id]);
        
        // Insert new examples
        for (const example of updates.usageExamples) {
          const exampleRow = {
            id: DatabaseUtils.generateId(),
            slang_term_id: id,
            example,
            created_at: updatedTerm.updatedAt.toISOString(),
          };
          await db.create<UsageExampleRow>('usage_examples', exampleRow);
        }
      }

      return updatedTerm;
    });
  }

  async delete(id: string): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Slang term with id ${id} not found`);
    }

    // Foreign key constraints will handle cascading deletes
    await this.db.delete('slang_terms', id);
    
    logger.info('Slang term deleted', { id, term: existing.term });
  }

  async findSimilarTerms(term: string): Promise<SlangTerm[]> {
    // Simple fuzzy matching using LIKE with wildcards
    // In a production system, you might want to use a more sophisticated algorithm
    const variations = [
      `%${term}%`,
      `${term}%`,
      `%${term}`,
    ];

    const results: SlangTerm[] = [];
    
    for (const variation of variations) {
      const rows = await this.db.query<SlangTermRow>(
        `SELECT * FROM slang_terms 
         WHERE term LIKE ? AND term != ?
         ORDER BY popularity DESC
         LIMIT 10`,
        [variation, term]
      );

      for (const row of rows) {
        const slangTerm = await this.findById(row.id);
        if (slangTerm && !results.find(r => r.id === slangTerm.id)) {
          results.push(slangTerm);
        }
      }
    }

    return results.slice(0, 10); // Limit to 10 results
  }

  async getStatistics(): Promise<{
    totalTerms: number;
    termsByLanguage: Record<string, number>;
    termsByRegion: Record<string, number>;
    averagePopularity: number;
  }> {
    const totalResult = await this.db.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM slang_terms'
    );

    const languageResults = await this.db.query<{ language: string; count: number }>(
      'SELECT language, COUNT(*) as count FROM slang_terms GROUP BY language'
    );

    const regionResults = await this.db.query<{ region: string; count: number }>(
      'SELECT region, COUNT(*) as count FROM slang_terms GROUP BY region'
    );

    const avgPopularityResult = await this.db.queryOne<{ avg_popularity: number }>(
      'SELECT AVG(popularity) as avg_popularity FROM slang_terms'
    );

    const termsByLanguage: Record<string, number> = {};
    languageResults.forEach(row => {
      termsByLanguage[row.language] = row.count;
    });

    const termsByRegion: Record<string, number> = {};
    regionResults.forEach(row => {
      termsByRegion[row.region] = row.count;
    });

    return {
      totalTerms: totalResult?.count || 0,
      termsByLanguage,
      termsByRegion,
      averagePopularity: avgPopularityResult?.avg_popularity || 0,
    };
  }
}