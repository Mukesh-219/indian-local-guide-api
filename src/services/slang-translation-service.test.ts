// Tests for SlangTranslationService

import { SlangTranslationServiceImpl } from './slang-translation-service';
import { SlangRepository } from '../database/repositories/slang-repository';
import { SlangTerm } from '../types';

// Mock the SlangRepository
jest.mock('../database/repositories/slang-repository');

describe('SlangTranslationService', () => {
  let service: SlangTranslationServiceImpl;
  let mockSlangRepository: jest.Mocked<SlangRepository>;

  beforeEach(() => {
    mockSlangRepository = new SlangRepository({} as any) as jest.Mocked<SlangRepository>;
    service = new SlangTranslationServiceImpl(mockSlangRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('translateToEnglish', () => {
    test('should translate known Hindi slang to English', async () => {
      const mockSlangTerm: SlangTerm = {
        id: 'test-id',
        term: 'jugaad',
        language: 'hindi',
        region: 'delhi',
        translations: [{
          text: 'innovative solution',
          targetLanguage: 'english',
          context: 'casual',
          confidence: 0.9
        }],
        context: 'casual',
        popularity: 85,
        usageExamples: ['This is a jugaad solution'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockSlangRepository.findByTerm.mockResolvedValue([mockSlangTerm]);

      const result = await service.translateToEnglish('jugaad', 'delhi');

      expect(result).toEqual({
        originalText: 'jugaad',
        translatedText: 'innovative solution',
        confidence: 0.9,
        context: 'casual',
        sourceLanguage: 'hindi',
        targetLanguage: 'english',
        region: 'delhi',
        alternatives: [],
        usageExamples: ['This is a jugaad solution']
      });

      expect(mockSlangRepository.findByTerm).toHaveBeenCalledWith('jugaad', 'hindi');
    });

    test('should handle multiple translations and select best match', async () => {
      const mockSlangTerm: SlangTerm = {
        id: 'test-id',
        term: 'timepass',
        language: 'hindi',
        region: 'mumbai',
        translations: [
          {
            text: 'killing time',
            targetLanguage: 'english',
            context: 'casual',
            confidence: 0.8
          },
          {
            text: 'leisure activity',
            targetLanguage: 'english',
            context: 'formal',
            confidence: 0.7
          },
          {
            text: 'pastime',
            targetLanguage: 'english',
            context: 'casual',
            confidence: 0.6
          }
        ],
        context: 'casual',
        popularity: 70,
        usageExamples: ['Just timepass', 'Doing timepass'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockSlangRepository.findByTerm.mockResolvedValue([mockSlangTerm]);

      const result = await service.translateToEnglish('timepass');

      expect(result.translatedText).toBe('killing time');
      expect(result.confidence).toBe(0.8);
      expect(result.alternatives).toHaveLength(2);
      expect(result.alternatives[0]?.text).toBe('leisure activity');
      expect(result.alternatives[1]?.text).toBe('pastime');
    });

    test('should prefer regional matches when region is specified', async () => {
      const delhiTerm: SlangTerm = {
        id: 'delhi-id',
        term: 'fundoo',
        language: 'hindi',
        region: 'delhi',
        translations: [{
          text: 'awesome',
          targetLanguage: 'english',
          context: 'casual',
          confidence: 0.8
        }],
        context: 'casual',
        popularity: 60,
        usageExamples: ['That is fundoo'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mumbaiTerm: SlangTerm = {
        id: 'mumbai-id',
        term: 'fundoo',
        language: 'hindi',
        region: 'mumbai',
        translations: [{
          text: 'cool',
          targetLanguage: 'english',
          context: 'casual',
          confidence: 0.9
        }],
        context: 'casual',
        popularity: 80,
        usageExamples: ['Very fundoo'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockSlangRepository.findByTerm.mockResolvedValue([mumbaiTerm, delhiTerm]);

      const result = await service.translateToEnglish('fundoo', 'delhi');

      expect(result.translatedText).toBe('awesome');
      expect(result.region).toBe('delhi');
    });

    test('should fall back to fuzzy matching when no exact match found', async () => {
      const mockSlangTerm: SlangTerm = {
        id: 'test-id',
        term: 'bakchod',
        language: 'hindi',
        region: 'mumbai',
        translations: [{
          text: 'nonsense talker',
          targetLanguage: 'english',
          context: 'casual',
          confidence: 0.7
        }],
        context: 'casual',
        popularity: 50,
        usageExamples: ['He is bakchod'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockSlangRepository.findByTerm.mockResolvedValue([]);
      mockSlangRepository.findSimilarTerms.mockResolvedValue([mockSlangTerm]);

      const result = await service.translateToEnglish('bakchodi');

      expect(result.translatedText).toBe('nonsense talker');
      expect(result.confidence).toBeLessThan(0.7); // Reduced confidence for fuzzy match
      expect(result.isFuzzyMatch).toBe(true);
    });

    test('should return unknown result when no translation found', async () => {
      mockSlangRepository.findByTerm.mockResolvedValue([]);
      mockSlangRepository.findSimilarTerms.mockResolvedValue([]);

      const result = await service.translateToEnglish('unknownterm');

      expect(result.originalText).toBe('unknownterm');
      expect(result.translatedText).toBe('unknownterm');
      expect(result.confidence).toBe(0.0);
      expect(result.isUnknown).toBe(true);
      expect(result.alternatives).toHaveLength(0);
    });

    test('should handle text normalization', async () => {
      const mockSlangTerm: SlangTerm = {
        id: 'test-id',
        term: 'jugaad',
        language: 'hindi',
        region: 'delhi',
        translations: [{
          text: 'innovative solution',
          targetLanguage: 'english',
          context: 'casual',
          confidence: 0.9
        }],
        context: 'casual',
        popularity: 85,
        usageExamples: ['This is jugaad'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockSlangRepository.findByTerm.mockResolvedValue([mockSlangTerm]);

      const result = await service.translateToEnglish('  JUGAAD!  ');

      expect(result.translatedText).toBe('innovative solution');
      expect(mockSlangRepository.findByTerm).toHaveBeenCalledWith('jugaad', 'hindi');
    });
  });

  describe('translateToHindi', () => {
    test('should translate English phrase to Hindi slang', async () => {
      const mockSlangTerm: SlangTerm = {
        id: 'test-id',
        term: 'jugaad',
        language: 'hindi',
        region: 'delhi',
        translations: [{
          text: 'innovative solution',
          targetLanguage: 'english',
          context: 'casual',
          confidence: 0.9
        }],
        context: 'casual',
        popularity: 85,
        usageExamples: ['This is jugaad'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockSlangRepository.searchTerms.mockResolvedValue([mockSlangTerm]);

      const result = await service.translateToHindi('innovative solution');

      expect(result.originalText).toBe('innovative solution');
      expect(result.translatedText).toBe('jugaad');
      expect(result.sourceLanguage).toBe('english');
      expect(result.targetLanguage).toBe('hindi');
      expect(result.region).toBe('delhi');
    });

    test('should prefer target region when specified', async () => {
      const delhiTerm: SlangTerm = {
        id: 'delhi-id',
        term: 'fundoo',
        language: 'hindi',
        region: 'delhi',
        translations: [{
          text: 'awesome',
          targetLanguage: 'english',
          context: 'casual',
          confidence: 0.8
        }],
        context: 'casual',
        popularity: 60,
        usageExamples: ['That is fundoo'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mumbaiTerm: SlangTerm = {
        id: 'mumbai-id',
        term: 'bindaas',
        language: 'hindi',
        region: 'mumbai',
        translations: [{
          text: 'awesome',
          targetLanguage: 'english',
          context: 'casual',
          confidence: 0.9
        }],
        context: 'casual',
        popularity: 80,
        usageExamples: ['Very bindaas'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockSlangRepository.searchTerms.mockResolvedValue([mumbaiTerm, delhiTerm]);

      const result = await service.translateToHindi('awesome', 'delhi');

      expect(result.translatedText).toBe('fundoo');
      expect(result.region).toBe('delhi');
    });

    test('should return unknown result when no reverse translation found', async () => {
      mockSlangRepository.searchTerms.mockResolvedValue([]);

      const result = await service.translateToHindi('unknown phrase');

      expect(result.originalText).toBe('unknown phrase');
      expect(result.translatedText).toBe('unknown phrase');
      expect(result.confidence).toBe(0.0);
      expect(result.isUnknown).toBe(true);
    });
  });

  describe('getRegionalVariations', () => {
    test('should return regional variations of a term', async () => {
      const delhiTerm: SlangTerm = {
        id: 'delhi-id',
        term: 'fundoo',
        language: 'hindi',
        region: 'delhi',
        translations: [{
          text: 'awesome',
          targetLanguage: 'english',
          context: 'casual',
          confidence: 0.8
        }],
        context: 'casual',
        popularity: 60,
        usageExamples: ['That is fundoo'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mumbaiTerm: SlangTerm = {
        id: 'mumbai-id',
        term: 'bindaas',
        language: 'hindi',
        region: 'mumbai',
        translations: [{
          text: 'awesome',
          targetLanguage: 'english',
          context: 'casual',
          confidence: 0.9
        }],
        context: 'casual',
        popularity: 80,
        usageExamples: ['Very bindaas'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockSlangRepository.findByTerm.mockResolvedValue([delhiTerm]);
      mockSlangRepository.findSimilarTerms.mockResolvedValue([mumbaiTerm]);

      const result = await service.getRegionalVariations('awesome');

      expect(result).toHaveLength(2);
      expect(result[0]?.region).toBe('mumbai'); // Higher popularity first
      expect(result[0]?.term).toBe('bindaas');
      expect(result[1]?.region).toBe('delhi');
      expect(result[1]?.term).toBe('fundoo');
    });

    test('should handle empty results gracefully', async () => {
      mockSlangRepository.findByTerm.mockResolvedValue([]);
      mockSlangRepository.findSimilarTerms.mockResolvedValue([]);

      const result = await service.getRegionalVariations('nonexistent');

      expect(result).toHaveLength(0);
    });
  });

  describe('searchSimilarTerms', () => {
    test('should return similar terms sorted by relevance', async () => {
      const exactMatch: SlangTerm = {
        id: 'exact-id',
        term: 'jugaad',
        language: 'hindi',
        region: 'delhi',
        translations: [{
          text: 'innovative solution',
          targetLanguage: 'english',
          context: 'casual',
          confidence: 0.9
        }],
        context: 'casual',
        popularity: 85,
        usageExamples: ['This is jugaad'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const similarMatch: SlangTerm = {
        id: 'similar-id',
        term: 'jugadu',
        language: 'hindi',
        region: 'punjab',
        translations: [{
          text: 'resourceful person',
          targetLanguage: 'english',
          context: 'casual',
          confidence: 0.8
        }],
        context: 'casual',
        popularity: 60,
        usageExamples: ['He is jugadu'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockSlangRepository.searchTerms.mockResolvedValue([similarMatch]);
      mockSlangRepository.findSimilarTerms.mockResolvedValue([exactMatch]);

      const result = await service.searchSimilarTerms('jugaad');

      expect(result).toHaveLength(2);
      expect(result[0]?.term).toBe('jugaad'); // Exact match should be first
      expect(result[1]?.term).toBe('jugadu');
    });

    test('should limit results to 10 terms', async () => {
      const manyTerms = Array.from({ length: 15 }, (_, i) => ({
        id: `term-${i}`,
        term: `term${i}`,
        language: 'hindi' as const,
        region: 'delhi',
        translations: [{
          text: `translation${i}`,
          targetLanguage: 'english' as const,
          context: 'casual' as const,
          confidence: 0.5
        }],
        context: 'casual' as const,
        popularity: i * 5,
        usageExamples: [`example${i}`],
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      mockSlangRepository.searchTerms.mockResolvedValue(manyTerms);
      mockSlangRepository.findSimilarTerms.mockResolvedValue([]);

      const result = await service.searchSimilarTerms('term');

      expect(result).toHaveLength(10);
    });
  });

  describe('addSlangTerm', () => {
    test('should add a valid slang term', async () => {
      const newTerm: SlangTerm = {
        id: 'new-id',
        term: 'newterm',
        language: 'hindi',
        region: 'bangalore',
        translations: [{
          text: 'new meaning',
          targetLanguage: 'english',
          context: 'casual',
          confidence: 0.8
        }],
        context: 'casual',
        popularity: 50,
        usageExamples: ['This is newterm'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockSlangRepository.findByTerm.mockResolvedValue([]);
      mockSlangRepository.create.mockResolvedValue(newTerm);

      await service.addSlangTerm(newTerm);

      expect(mockSlangRepository.create).toHaveBeenCalledWith(newTerm);
    });

    test('should reject duplicate terms for same region', async () => {
      const existingTerm: SlangTerm = {
        id: 'existing-id',
        term: 'existing',
        language: 'hindi',
        region: 'delhi',
        translations: [{
          text: 'existing meaning',
          targetLanguage: 'english',
          context: 'casual',
          confidence: 0.8
        }],
        context: 'casual',
        popularity: 50,
        usageExamples: ['This is existing'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const duplicateTerm: SlangTerm = {
        ...existingTerm,
        id: 'duplicate-id'
      };

      mockSlangRepository.findByTerm.mockResolvedValue([existingTerm]);

      await expect(service.addSlangTerm(duplicateTerm))
        .rejects.toThrow('Slang term "existing" already exists for region "delhi"');
    });

    test('should validate term properties', async () => {
      const invalidTerm = {
        id: 'invalid-id',
        term: '',
        language: 'hindi',
        region: 'delhi',
        translations: [],
        context: 'casual',
        popularity: 50,
        usageExamples: [],
        createdAt: new Date(),
        updatedAt: new Date()
      } as SlangTerm;

      await expect(service.addSlangTerm(invalidTerm))
        .rejects.toThrow('Slang term cannot be empty');
    });
  });

  describe('updateSlangTerm', () => {
    test('should update an existing slang term', async () => {
      const existingTerm: SlangTerm = {
        id: 'existing-id',
        term: 'existing',
        language: 'hindi',
        region: 'delhi',
        translations: [{
          text: 'old meaning',
          targetLanguage: 'english',
          context: 'casual',
          confidence: 0.8
        }],
        context: 'casual',
        popularity: 50,
        usageExamples: ['Old example'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const updates = {
        popularity: 75,
        usageExamples: ['New example', 'Another example']
      };

      mockSlangRepository.findById.mockResolvedValue(existingTerm);
      mockSlangRepository.update.mockResolvedValue({ ...existingTerm, ...updates });

      await service.updateSlangTerm('existing-id', updates);

      expect(mockSlangRepository.update).toHaveBeenCalledWith('existing-id', updates);
    });

    test('should check for conflicts when updating key fields', async () => {
      const existingTerm: SlangTerm = {
        id: 'existing-id',
        term: 'existing',
        language: 'hindi',
        region: 'delhi',
        translations: [{
          text: 'meaning',
          targetLanguage: 'english',
          context: 'casual',
          confidence: 0.8
        }],
        context: 'casual',
        popularity: 50,
        usageExamples: ['Example'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const conflictingTerm: SlangTerm = {
        id: 'conflict-id',
        term: 'newterm',
        language: 'hindi',
        region: 'delhi',
        translations: [{
          text: 'conflict meaning',
          targetLanguage: 'english',
          context: 'casual',
          confidence: 0.8
        }],
        context: 'casual',
        popularity: 60,
        usageExamples: ['Conflict example'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockSlangRepository.findById.mockResolvedValue(existingTerm);
      mockSlangRepository.findByTerm.mockResolvedValue([conflictingTerm]);

      await expect(service.updateSlangTerm('existing-id', { term: 'newterm' }))
        .rejects.toThrow('Slang term "newterm" already exists for region "delhi"');
    });
  });

  describe('error handling', () => {
    test('should handle repository errors gracefully', async () => {
      mockSlangRepository.findByTerm.mockRejectedValue(new Error('Database error'));

      await expect(service.translateToEnglish('test'))
        .rejects.toThrow('Translation failed: Database error');
    });

    test('should handle invalid input gracefully', async () => {
      await expect(service.translateToEnglish(''))
        .resolves.toMatchObject({
          originalText: '',
          translatedText: '',
          confidence: 0.0,
          isUnknown: true
        });
    });
  });
});