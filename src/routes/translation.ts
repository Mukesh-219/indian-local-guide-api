// Translation API routes

import { Router, Request, Response } from 'express';
import { SlangTranslationServiceImpl } from '../services/slang-translation-service';
import { SlangRepository } from '../database/repositories/slang-repository';
import { getDatabase } from '../database';
import { logger } from '../services/logging';
import { validateInput } from '../validation/schemas';
import { 
  TranslateToEnglishSchema, 
  TranslateToHindiSchema, 
  SearchTermsSchema,
  AddSlangTermSchema 
} from '../validation/schemas';

const router = Router();

// Initialize services
let translationService: SlangTranslationServiceImpl;

// Initialize translation service with database
const initializeTranslationService = async () => {
  if (!translationService) {
    const dbService = getDatabase();
    const slangRepository = new SlangRepository(dbService);
    translationService = new SlangTranslationServiceImpl(slangRepository);
  }
  return translationService;
};

// POST /api/translate/to-english
router.post('/to-english', async (req: Request, res: Response) => {
  try {
    const { text, region } = validateInput(TranslateToEnglishSchema, req.body);
    
    logger.info('Translation to English requested', { text, region });
    
    const service = await initializeTranslationService();
    const result = await service.translateToEnglish(text, region);
    
    res.json({
      success: true,
      data: result,
    });
    
  } catch (error) {
    logger.error('Translation to English failed', error instanceof Error ? error : new Error(String(error)), { 
      body: req.body 
    });
    
    res.status(400).json({
      success: false,
      error: 'Translation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/translate/to-hindi
router.post('/to-hindi', async (req: Request, res: Response) => {
  try {
    const { text, targetRegion } = validateInput(TranslateToHindiSchema, req.body);
    
    logger.info('Translation to Hindi requested', { text, targetRegion });
    
    const service = await initializeTranslationService();
    const result = await service.translateToHindi(text, targetRegion);
    
    res.json({
      success: true,
      data: result,
    });
    
  } catch (error) {
    logger.error('Translation to Hindi failed', error instanceof Error ? error : new Error(String(error)), { 
      body: req.body 
    });
    
    res.status(400).json({
      success: false,
      error: 'Translation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/translate/variations/:term
router.get('/variations/:term', async (req: Request, res: Response): Promise<void> => {
  try {
    const { term } = req.params;
    
    if (!term || term.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid term',
        message: 'Term parameter is required',
      });
      return;
    }
    
    logger.info('Regional variations requested', { term });
    
    const service = await initializeTranslationService();
    const variations = await service.getRegionalVariations(term);
    
    res.json({
      success: true,
      data: {
        term,
        variations,
      },
    });
    
  } catch (error) {
    logger.error('Get regional variations failed', error instanceof Error ? error : new Error(String(error)), { 
      term: req.params.term 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get variations',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/translate/search
router.get('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.q as string;
    
    if (!query || query.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid query',
        message: 'Query parameter "q" is required',
      });
      return;
    }
    
    const { query: validatedQuery } = validateInput(SearchTermsSchema, { query });
    
    logger.info('Search terms requested', { query: validatedQuery });
    
    const service = await initializeTranslationService();
    const results = await service.searchSimilarTerms(validatedQuery);
    
    res.json({
      success: true,
      data: {
        query: validatedQuery,
        results,
      },
    });
    
  } catch (error) {
    logger.error('Search terms failed', error instanceof Error ? error : new Error(String(error)), { 
      query: req.query.q 
    });
    
    res.status(400).json({
      success: false,
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/translate/terms (Add new slang term)
router.post('/terms', async (req: Request, res: Response) => {
  try {
    const termData = validateInput(AddSlangTermSchema, req.body);
    
    logger.info('Add slang term requested', { term: termData.term, region: termData.region });
    
    const service = await initializeTranslationService();
    
    // Create full SlangTerm object with required fields
    const slangTerm = {
      id: '', // Will be generated by repository
      ...termData,
      popularity: termData.popularity ?? 50, // Ensure popularity is defined
      usageExamples: termData.usageExamples ?? [], // Ensure usageExamples is defined
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await service.addSlangTerm(slangTerm);
    
    res.status(201).json({
      success: true,
      message: 'Slang term added successfully',
      data: {
        term: termData.term,
        region: termData.region,
      },
    });
    
  } catch (error) {
    logger.error('Add slang term failed', error instanceof Error ? error : new Error(String(error)), { 
      body: req.body 
    });
    
    const statusCode = error instanceof Error && error.message.includes('already exists') ? 409 : 400;
    
    res.status(statusCode).json({
      success: false,
      error: 'Failed to add term',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/translate/demo (Demo endpoint with sample data)
router.get('/demo', async (req: Request, res: Response) => {
  try {
    const demoTranslations = [
      {
        hindi: 'jugaad',
        english: 'innovative solution',
        region: 'delhi',
        context: 'casual',
        example: 'This is a jugaad solution to fix the problem'
      },
      {
        hindi: 'timepass',
        english: 'killing time',
        region: 'mumbai',
        context: 'casual',
        example: 'Just doing timepass at the mall'
      },
      {
        hindi: 'fundoo',
        english: 'awesome',
        region: 'delhi',
        context: 'slang',
        example: 'That movie was fundoo!'
      },
      {
        hindi: 'bakchodi',
        english: 'nonsense talk',
        region: 'mumbai',
        context: 'slang',
        example: 'Stop this bakchodi and be serious'
      }
    ];
    
    res.json({
      success: true,
      message: 'Demo translations - Popular Hindi slang terms',
      data: demoTranslations,
      note: 'These are sample translations. Use the translation endpoints to get dynamic results.',
    });
    
  } catch (error) {
    logger.error('Demo endpoint failed', error instanceof Error ? error : new Error(String(error)));
    
    res.status(500).json({
      success: false,
      error: 'Demo failed',
      message: 'Unable to load demo data',
    });
  }
});

export default router;