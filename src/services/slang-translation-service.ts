// Slang Translation Service Implementation

import { SlangTranslationService } from './interfaces';
import { 
  SlangTerm, 
  TranslationResult, 
  RegionalVariation, 
  Translation 
} from '../types';
import { SlangRepository } from '../database/repositories/slang-repository';
import { logger } from './logging';

export class SlangTranslationServiceImpl implements SlangTranslationService {
  constructor(private slangRepository: SlangRepository) {}

  async translateToEnglish(text: string, region?: string): Promise<TranslationResult> {
    logger.debug('Translating to English', { text, region });

    try {
      // Handle empty input
      if (!text || text.trim().length === 0) {
        return {
          originalText: text,
          translatedText: text,
          confidence: 0.0,
          context: 'casual' as const,
          sourceLanguage: 'hindi',
          targetLanguage: 'english',
          region: region || 'unknown',
          alternatives: [],
          usageExamples: [],
          isUnknown: true
        };
      }

      // Clean and normalize input text
      const normalizedText = this.normalizeText(text);
      
      // Find exact matches first
      const exactMatches = await this.slangRepository.findByTerm(normalizedText, 'hindi');
      
      if (exactMatches.length > 0) {
        const bestMatch = this.selectBestMatch(exactMatches, region);
        const englishTranslations = bestMatch.translations.filter(t => t.targetLanguage === 'english');
        
        if (englishTranslations.length > 0) {
          const translation = this.selectBestTranslation(englishTranslations, 'casual');
          
          return {
            originalText: text,
            translatedText: translation.text,
            confidence: translation.confidence,
            context: translation.context as 'casual' | 'formal' | 'slang',
            sourceLanguage: 'hindi',
            targetLanguage: 'english',
            region: bestMatch.region,
            alternatives: englishTranslations.slice(1, 4).map(t => ({
              text: t.text,
              confidence: t.confidence,
              context: t.context as 'casual' | 'formal' | 'slang'
            })),
            usageExamples: bestMatch.usageExamples.slice(0, 2)
          };
        }
      }

      // Try fuzzy matching if no exact match
      const fuzzyMatches = await this.findFuzzyMatches(normalizedText);
      
      if (fuzzyMatches.length > 0) {
        const bestMatch = this.selectBestMatch(fuzzyMatches, region);
        const englishTranslations = bestMatch.translations.filter(t => t.targetLanguage === 'english');
        
        if (englishTranslations.length > 0) {
          const translation = this.selectBestTranslation(englishTranslations, 'casual');
          
          return {
            originalText: text,
            translatedText: translation.text,
            confidence: Math.max(0.3, translation.confidence - 0.2), // Reduce confidence for fuzzy matches
            context: translation.context as 'casual' | 'formal' | 'slang',
            sourceLanguage: 'hindi',
            targetLanguage: 'english',
            region: bestMatch.region,
            alternatives: englishTranslations.slice(1, 4).map(t => ({
              text: t.text,
              confidence: Math.max(0.3, t.confidence - 0.2),
              context: t.context as 'casual' | 'formal' | 'slang'
            })),
            usageExamples: bestMatch.usageExamples.slice(0, 2),
            isFuzzyMatch: true
          };
        }
      }

      // No translation found
      return {
        originalText: text,
        translatedText: text, // Return original if no translation found
        confidence: 0.0,
        context: 'casual' as const,
        sourceLanguage: 'hindi',
        targetLanguage: 'english',
        region: region || 'unknown',
        alternatives: [],
        usageExamples: [],
        isUnknown: true
      };

    } catch (error) {
      logger.error('Error translating to English', error instanceof Error ? error : new Error(String(error)), { text, region });
      throw new Error(`Translation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async translateToHindi(text: string, targetRegion?: string): Promise<TranslationResult> {
    logger.debug('Translating to Hindi', { text, targetRegion });

    try {
      // Clean and normalize input text
      const normalizedText = this.normalizeText(text);
      
      // Search for slang terms that have this English translation
      const searchResults = await this.slangRepository.searchTerms(normalizedText);
      
      // Filter results that have English translations matching our input
      const matchingTerms = searchResults.filter(term => 
        term.translations.some(t => 
          t.targetLanguage === 'english' && 
          this.normalizeText(t.text).includes(normalizedText)
        )
      );

      if (matchingTerms.length > 0) {
        const bestMatch = this.selectBestMatch(matchingTerms, targetRegion);
        
        return {
          originalText: text,
          translatedText: bestMatch.term,
          confidence: 0.8, // High confidence for reverse translation
          context: bestMatch.context,
          sourceLanguage: 'english',
          targetLanguage: 'hindi',
          region: bestMatch.region,
          alternatives: matchingTerms.slice(1, 4).map(term => ({
            text: term.term,
            confidence: 0.7,
            context: term.context
          })),
          usageExamples: bestMatch.usageExamples.slice(0, 2)
        };
      }

      // Try broader search
      const broadResults = await this.slangRepository.searchTerms(text);
      const relevantTerms = broadResults.filter(term =>
        term.translations.some(t => t.targetLanguage === 'english')
      );

      if (relevantTerms.length > 0) {
        const bestMatch = this.selectBestMatch(relevantTerms, targetRegion);
        
        return {
          originalText: text,
          translatedText: bestMatch.term,
          confidence: 0.5, // Lower confidence for broad matches
          context: bestMatch.context,
          sourceLanguage: 'english',
          targetLanguage: 'hindi',
          region: bestMatch.region,
          alternatives: relevantTerms.slice(1, 4).map(term => ({
            text: term.term,
            confidence: 0.4,
            context: term.context
          })),
          usageExamples: bestMatch.usageExamples.slice(0, 2),
          isFuzzyMatch: true
        };
      }

      // No translation found
      return {
        originalText: text,
        translatedText: text, // Return original if no translation found
        confidence: 0.0,
        context: 'casual' as const,
        sourceLanguage: 'english',
        targetLanguage: 'hindi',
        region: targetRegion || 'unknown',
        alternatives: [],
        usageExamples: [],
        isUnknown: true
      };

    } catch (error) {
      logger.error('Error translating to Hindi', error instanceof Error ? error : new Error(String(error)), { text, targetRegion });
      throw new Error(`Translation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getRegionalVariations(term: string): Promise<RegionalVariation[]> {
    logger.debug('Getting regional variations', { term });

    try {
      const normalizedTerm = this.normalizeText(term);
      
      // Find all terms that match or are similar
      const allMatches = await this.slangRepository.findByTerm(normalizedTerm);
      const fuzzyMatches = await this.findFuzzyMatches(normalizedTerm);
      
      // Combine and deduplicate
      const allTerms = [...allMatches, ...fuzzyMatches];
      const uniqueTerms = this.deduplicateTerms(allTerms);
      
      // Group by region
      const regionMap = new Map<string, SlangTerm[]>();
      
      uniqueTerms.forEach(slangTerm => {
        if (!regionMap.has(slangTerm.region)) {
          regionMap.set(slangTerm.region, []);
        }
        const regionTerms = regionMap.get(slangTerm.region);
        if (regionTerms) {
          regionTerms.push(slangTerm);
        }
      });

      // Convert to RegionalVariation format
      const variations: RegionalVariation[] = [];
      
      regionMap.forEach((terms, region) => {
        const mostPopular = terms.reduce((prev, current) => 
          current.popularity > prev.popularity ? current : prev
        );

        const englishTranslations = mostPopular.translations.filter(t => t.targetLanguage === 'english');
        const primaryTranslation = englishTranslations.length > 0 ? englishTranslations[0] : null;

        variations.push({
          region,
          term: mostPopular.term,
          translation: primaryTranslation?.text || '',
          confidence: primaryTranslation?.confidence || 0.5,
          context: mostPopular.context,
          popularity: mostPopular.popularity,
          usageExamples: mostPopular.usageExamples.slice(0, 2),
          alternativeTerms: terms.slice(1).map(t => t.term)
        });
      });

      // Sort by popularity
      variations.sort((a, b) => b.popularity - a.popularity);

      return variations;

    } catch (error) {
      logger.error('Error getting regional variations', error instanceof Error ? error : new Error(String(error)), { term });
      throw new Error(`Failed to get regional variations: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async searchSimilarTerms(query: string): Promise<SlangTerm[]> {
    logger.debug('Searching similar terms', { query });

    try {
      const normalizedQuery = this.normalizeText(query);
      
      // Get search results from repository
      const searchResults = await this.slangRepository.searchTerms(normalizedQuery, 20);
      
      // Get fuzzy matches
      const fuzzyMatches = await this.findFuzzyMatches(normalizedQuery);
      
      // Combine and deduplicate
      const allResults = [...searchResults, ...fuzzyMatches];
      const uniqueResults = this.deduplicateTerms(allResults);
      
      // Sort by relevance (combination of popularity and text similarity)
      uniqueResults.sort((a, b) => {
        const aRelevance = this.calculateRelevance(a.term, normalizedQuery, a.popularity);
        const bRelevance = this.calculateRelevance(b.term, normalizedQuery, b.popularity);
        return bRelevance - aRelevance;
      });

      return uniqueResults.slice(0, 10); // Return top 10 results

    } catch (error) {
      logger.error('Error searching similar terms', error instanceof Error ? error : new Error(String(error)), { query });
      throw new Error(`Search failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async addSlangTerm(term: SlangTerm): Promise<void> {
    logger.debug('Adding slang term', { term: term.term, region: term.region });

    try {
      // Validate the term
      this.validateSlangTerm(term);
      
      // Check for duplicates
      const existing = await this.slangRepository.findByTerm(term.term, term.language);
      const duplicate = existing.find(t => t.region === term.region);
      
      if (duplicate) {
        throw new Error(`Slang term "${term.term}" already exists for region "${term.region}"`);
      }

      // Add the term
      await this.slangRepository.create(term);
      
      logger.info('Slang term added successfully', { term: term.term, region: term.region });

    } catch (error) {
      logger.error('Error adding slang term', error instanceof Error ? error : new Error(String(error)), { term: term.term });
      throw error;
    }
  }

  async updateSlangTerm(id: string, updates: Partial<SlangTerm>): Promise<void> {
    logger.debug('Updating slang term', { id, updates });

    try {
      // Validate updates
      if (updates.term || updates.language || updates.region) {
        // Check for conflicts if key fields are being updated
        const existing = await this.slangRepository.findById(id);
        if (!existing) {
          throw new Error(`Slang term with id "${id}" not found`);
        }

        const newTerm = updates.term || existing.term;
        const newLanguage = updates.language || existing.language;
        const newRegion = updates.region || existing.region;

        const conflicts = await this.slangRepository.findByTerm(newTerm, newLanguage);
        const conflict = conflicts.find(t => t.region === newRegion && t.id !== id);
        
        if (conflict) {
          throw new Error(`Slang term "${newTerm}" already exists for region "${newRegion}"`);
        }
      }

      // Update the term
      await this.slangRepository.update(id, updates);
      
      logger.info('Slang term updated successfully', { id });

    } catch (error) {
      logger.error('Error updating slang term', error instanceof Error ? error : new Error(String(error)), { id });
      throw error;
    }
  }

  // Private helper methods

  private normalizeText(text: string): string {
    return text.toLowerCase().trim().replace(/[^\w\s]/g, '');
  }

  private selectBestMatch(terms: SlangTerm[], preferredRegion?: string): SlangTerm {
    if (terms.length === 0) {
      throw new Error('No terms provided for selection');
    }

    // If preferred region is specified, try to find a match
    if (preferredRegion) {
      const regionMatch = terms.find(t => t.region.toLowerCase() === preferredRegion.toLowerCase());
      if (regionMatch) {
        return regionMatch;
      }
    }

    // Otherwise, return the most popular term
    return terms.reduce((prev, current) => 
      current.popularity > prev.popularity ? current : prev
    );
  }

  private selectBestTranslation(translations: Translation[], preferredContext?: string): Translation {
    if (translations.length === 0) {
      throw new Error('No translations provided for selection');
    }

    // If preferred context is specified, try to find a match
    if (preferredContext) {
      const contextMatch = translations.find(t => t.context === preferredContext);
      if (contextMatch) {
        return contextMatch;
      }
    }

    // Otherwise, return the highest confidence translation
    return translations.reduce((prev, current) => 
      current.confidence > prev.confidence ? current : prev
    );
  }

  private async findFuzzyMatches(term: string): Promise<SlangTerm[]> {
    // Simple fuzzy matching - in production, you might use a more sophisticated algorithm
    const variations = [
      term,
      term.slice(0, -1), // Remove last character
      term + 'a', // Add common suffix
      term + 'i',
      term.replace(/a/g, 'aa'), // Double vowels
      term.replace(/i/g, 'ee'),
    ];

    const allMatches: SlangTerm[] = [];
    
    for (const variation of variations) {
      if (variation !== term && variation.length > 2) {
        const matches = await this.slangRepository.findSimilarTerms(variation);
        allMatches.push(...matches);
      }
    }

    return this.deduplicateTerms(allMatches);
  }

  private deduplicateTerms(terms: SlangTerm[]): SlangTerm[] {
    const seen = new Set<string>();
    return terms.filter(term => {
      const key = `${term.term}-${term.region}-${term.language}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private calculateRelevance(term: string, query: string, popularity: number): number {
    // Simple relevance calculation
    const termLower = term.toLowerCase();
    const queryLower = query.toLowerCase();
    
    let score = 0;
    
    // Exact match gets highest score
    if (termLower === queryLower) {
      score += 100;
    }
    // Starts with query gets high score
    else if (termLower.startsWith(queryLower)) {
      score += 80;
    }
    // Contains query gets medium score
    else if (termLower.includes(queryLower)) {
      score += 60;
    }
    // Similar length gets some score
    else if (Math.abs(termLower.length - queryLower.length) <= 2) {
      score += 30;
    }

    // Add popularity bonus (normalized to 0-20 range)
    score += Math.min(20, popularity / 5);

    return score;
  }

  private validateSlangTerm(term: SlangTerm): void {
    if (!term.term || term.term.trim().length === 0) {
      throw new Error('Slang term cannot be empty');
    }

    if (!term.language || !['hindi', 'english'].includes(term.language)) {
      throw new Error('Language must be either "hindi" or "english"');
    }

    if (!term.region || term.region.trim().length === 0) {
      throw new Error('Region cannot be empty');
    }

    if (!term.context || !['casual', 'formal', 'slang'].includes(term.context)) {
      throw new Error('Context must be one of: casual, formal, slang');
    }

    if (term.popularity < 0 || term.popularity > 100) {
      throw new Error('Popularity must be between 0 and 100');
    }

    if (!term.translations || term.translations.length === 0) {
      throw new Error('At least one translation is required');
    }

    // Validate translations
    term.translations.forEach((translation, index) => {
      if (!translation.text || translation.text.trim().length === 0) {
        throw new Error(`Translation ${index + 1} text cannot be empty`);
      }

      if (!translation.targetLanguage || !['hindi', 'english'].includes(translation.targetLanguage)) {
        throw new Error(`Translation ${index + 1} target language must be either "hindi" or "english"`);
      }

      if (translation.confidence < 0 || translation.confidence > 1) {
        throw new Error(`Translation ${index + 1} confidence must be between 0 and 1`);
      }
    });
  }
}