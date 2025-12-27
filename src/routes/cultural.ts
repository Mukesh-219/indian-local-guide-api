// Cultural Information API routes

import { Router, Request, Response } from 'express';
import { CulturalServiceImpl } from '../services/cultural-service';
import { logger } from '../services/logging';
import { validateInput } from '../validation/schemas';
import { 
  LocationSchema,
  SearchQuerySchema 
} from '../validation/schemas';

const router = Router();

// Initialize services
let culturalService: CulturalServiceImpl;

// Initialize cultural service
const initializeCulturalService = async (): Promise<CulturalServiceImpl> => {
  if (!culturalService) {
    culturalService = new CulturalServiceImpl();
  }
  return culturalService;
};

// GET /api/culture/region/:region
router.get('/region/:region', async (req: Request, res: Response): Promise<void> => {
  try {
    const { region } = req.params;
    
    if (!region || region.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid region',
        message: 'Region parameter is required',
      });
      return;
    }
    
    logger.info('Regional info requested', { region });
    
    const service = await initializeCulturalService();
    const regionalInfo = await service.getRegionalInfo(region);
    
    res.json({
      success: true,
      data: {
        region,
        info: regionalInfo,
      },
    });
    
  } catch (error) {
    logger.error('Get regional info failed', error instanceof Error ? error : new Error(String(error)), { 
      region: req.params.region 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get regional info',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/culture/festival/:festival
router.get('/festival/:festival', async (req: Request, res: Response): Promise<void> => {
  try {
    const { festival } = req.params;
    
    if (!festival || festival.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid festival',
        message: 'Festival parameter is required',
      });
      return;
    }
    
    logger.info('Festival info requested', { festival });
    
    const service = await initializeCulturalService();
    const festivalInfo = await service.getFestivalInfo(festival);
    
    res.json({
      success: true,
      data: {
        festival,
        info: festivalInfo,
      },
    });
    
  } catch (error) {
    logger.error('Get festival info failed', error instanceof Error ? error : new Error(String(error)), { 
      festival: req.params.festival 
    });
    
    const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: 'Failed to get festival info',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/culture/etiquette/:context
router.get('/etiquette/:context', async (req: Request, res: Response): Promise<void> => {
  try {
    const { context } = req.params;
    
    if (!context || context.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid context',
        message: 'Context parameter is required',
      });
      return;
    }
    
    logger.info('Etiquette guide requested', { context });
    
    const service = await initializeCulturalService();
    const etiquetteRules = await service.getEtiquetteGuide(context);
    
    res.json({
      success: true,
      data: {
        context,
        rules: etiquetteRules,
        count: etiquetteRules.length,
      },
    });
    
  } catch (error) {
    logger.error('Get etiquette guide failed', error instanceof Error ? error : new Error(String(error)), { 
      context: req.params.context 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get etiquette guide',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/culture/bargaining
router.get('/bargaining', async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lng, city, state, country } = req.query;
    
    // Validate location parameters
    if (!lat || !lng || !city || !state || !country) {
      res.status(400).json({
        success: false,
        error: 'Missing location parameters',
        message: 'lat, lng, city, state, and country query parameters are required',
      });
      return;
    }
    
    const location = validateInput(LocationSchema, {
      latitude: parseFloat(lat as string),
      longitude: parseFloat(lng as string),
      city: city as string,
      state: state as string,
      country: country as string,
    });
    
    logger.info('Bargaining tips requested', { location: location.city });
    
    const service = await initializeCulturalService();
    const bargainingTips = await service.getBargainingTips(location);
    
    res.json({
      success: true,
      data: {
        location,
        tips: bargainingTips,
        count: bargainingTips.length,
      },
    });
    
  } catch (error) {
    logger.error('Get bargaining tips failed', error instanceof Error ? error : new Error(String(error)), { 
      query: req.query 
    });
    
    res.status(400).json({
      success: false,
      error: 'Failed to get bargaining tips',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/culture/search
router.get('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.q as string;
    const region = req.query.region as string;
    
    if (!query || query.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid query',
        message: 'Query parameter "q" is required',
      });
      return;
    }
    
    const { query: validatedQuery } = validateInput(SearchQuerySchema, { query });
    
    logger.info('Cultural content search requested', { query: validatedQuery, region });
    
    const service = await initializeCulturalService();
    const results = await service.searchCulturalContent(validatedQuery, region);
    
    res.json({
      success: true,
      data: {
        query: validatedQuery,
        region,
        results,
        count: results.length,
      },
    });
    
  } catch (error) {
    logger.error('Cultural content search failed', error instanceof Error ? error : new Error(String(error)), { 
      query: req.query.q,
      region: req.query.region 
    });
    
    res.status(400).json({
      success: false,
      error: 'Cultural search failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/culture/demo (Demo endpoint with sample data)
router.get('/demo', async (req: Request, res: Response) => {
  try {
    const demoCulturalInfo = [
      {
        type: 'greeting',
        title: 'Namaste - Traditional Indian Greeting',
        description: 'Press palms together at chest level and bow head slightly',
        region: 'All India',
        significance: 'Shows respect and acknowledges the divine in others',
        dosDonts: [
          'Do: Press palms together at chest level',
          'Do: Bow head slightly',
          'Don\'t: Use only one hand',
          'Don\'t: Forget to smile'
        ]
      },
      {
        type: 'festival',
        title: 'Diwali - Festival of Lights',
        description: 'Celebration of victory of light over darkness',
        region: 'All India',
        significance: 'Marks the return of Lord Rama to Ayodhya',
        celebrations: [
          'Light diyas and candles',
          'Fireworks and crackers',
          'Exchange sweets and gifts',
          'Lakshmi Puja (worship of goddess of wealth)'
        ]
      },
      {
        type: 'etiquette',
        title: 'Dining Etiquette',
        description: 'Traditional rules for eating in Indian culture',
        region: 'All India',
        rules: [
          'Wash hands before and after eating',
          'Use right hand for eating',
          'Don\'t waste food',
          'Wait for elders to start eating'
        ]
      },
      {
        type: 'bargaining',
        title: 'Market Bargaining Tips',
        description: 'How to negotiate prices in Indian markets',
        region: 'Delhi',
        tips: [
          'Start at 30-40% of quoted price',
          'Walk away if price doesn\'t come down',
          'Buy multiple items for better deals',
          'Compare prices at 2-3 shops'
        ]
      }
    ];
    
    res.json({
      success: true,
      message: 'Demo cultural information - Indian customs and traditions',
      data: {
        culturalInfo: demoCulturalInfo,
        count: demoCulturalInfo.length,
      },
      note: 'These are sample cultural insights. Use the specific endpoints to get detailed information.',
    });
    
  } catch (error) {
    logger.error('Cultural demo endpoint failed', error instanceof Error ? error : new Error(String(error)));
    
    res.status(500).json({
      success: false,
      error: 'Demo failed',
      message: 'Unable to load demo data',
    });
  }
});

export default router;