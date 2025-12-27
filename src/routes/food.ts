// Food Recommendation API routes

import { Router, Request, Response } from 'express';
import { FoodRecommendationServiceImpl } from '../services/food-recommendation-service';
import { FoodRepository } from '../database/repositories/food-repository';
import { getDatabase } from '../database';
import { logger } from '../services/logging';
import { validateInput } from '../validation/schemas';
import { 
  LocationSchema,
  FoodRecommendationRequestSchema,
  SearchQuerySchema 
} from '../validation/schemas';

const router = Router();

// Initialize services
let foodService: FoodRecommendationServiceImpl;

// Initialize food service with database
const initializeFoodService = async () => {
  if (!foodService) {
    const dbService = getDatabase();
    const foodRepository = new FoodRepository(dbService);
    foodService = new FoodRecommendationServiceImpl(foodRepository);
  }
  return foodService;
};

// POST /api/food/recommendations
router.post('/recommendations', async (req: Request, res: Response) => {
  try {
    const { location, preferences } = validateInput(FoodRecommendationRequestSchema, req.body);
    
    logger.info('Food recommendations requested', { 
      location: location.city, 
      preferences: preferences?.dietaryRestrictions 
    });
    
    const service = await initializeFoodService();
    
    // Convert preferences to the expected format
    const foodPreferences = {
      dietaryRestrictions: preferences?.dietaryRestrictions || [],
      spiceLevel: preferences?.spiceLevel || 'medium',
      priceRange: preferences?.priceRange || { min: 0, max: 1000, currency: 'INR' },
      radius: preferences?.radius || 5,
    };
    
    const recommendations = await service.getRecommendations(location, foodPreferences);
    
    res.json({
      success: true,
      data: {
        location,
        preferences: foodPreferences,
        recommendations,
        count: recommendations.length,
      },
    });
    
  } catch (error) {
    logger.error('Food recommendations failed', error instanceof Error ? error : new Error(String(error)), { 
      body: req.body 
    });
    
    res.status(400).json({
      success: false,
      error: 'Failed to get recommendations',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/food/category/:category
router.get('/category/:category', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.params;
    const { lat, lng, city, state, country } = req.query;
    
    if (!category || category.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid category',
        message: 'Category parameter is required',
      });
      return;
    }
    
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
    
    logger.info('Food by category requested', { category, location: location.city });
    
    const service = await initializeFoodService();
    const recommendations = await service.getFoodByCategory(category, location);
    
    res.json({
      success: true,
      data: {
        category,
        location,
        recommendations,
        count: recommendations.length,
      },
    });
    
  } catch (error) {
    logger.error('Get food by category failed', error instanceof Error ? error : new Error(String(error)), { 
      category: req.params.category,
      query: req.query 
    });
    
    res.status(400).json({
      success: false,
      error: 'Failed to get food by category',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/food/hubs/:city
router.get('/hubs/:city', async (req: Request, res: Response): Promise<void> => {
  try {
    const { city } = req.params;
    
    if (!city || city.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid city',
        message: 'City parameter is required',
      });
      return;
    }
    
    logger.info('Popular food hubs requested', { city });
    
    const service = await initializeFoodService();
    const hubs = await service.getPopularHubs(city);
    
    res.json({
      success: true,
      data: {
        city,
        hubs,
        count: hubs.length,
      },
    });
    
  } catch (error) {
    logger.error('Get popular hubs failed', error instanceof Error ? error : new Error(String(error)), { 
      city: req.params.city 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get popular hubs',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/food/safety/:vendorId
router.get('/safety/:vendorId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { vendorId } = req.params;
    
    if (!vendorId || vendorId.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid vendor ID',
        message: 'Vendor ID parameter is required',
      });
      return;
    }
    
    logger.info('Safety rating requested', { vendorId });
    
    const service = await initializeFoodService();
    const safetyRating = await service.rateSafety(vendorId);
    
    res.json({
      success: true,
      data: {
        vendorId,
        safetyRating,
      },
    });
    
  } catch (error) {
    logger.error('Get safety rating failed', error instanceof Error ? error : new Error(String(error)), { 
      vendorId: req.params.vendorId 
    });
    
    const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: 'Failed to get safety rating',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/food/search
router.get('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.q as string;
    const { lat, lng, city, state, country } = req.query;
    
    if (!query || query.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid query',
        message: 'Query parameter "q" is required',
      });
      return;
    }
    
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
    
    const { query: validatedQuery } = validateInput(SearchQuerySchema, { query });
    
    logger.info('Food search requested', { query: validatedQuery, location: location.city });
    
    const service = await initializeFoodService();
    const results = await service.searchFood(validatedQuery, location);
    
    res.json({
      success: true,
      data: {
        query: validatedQuery,
        location,
        results,
        count: results.length,
      },
    });
    
  } catch (error) {
    logger.error('Food search failed', error instanceof Error ? error : new Error(String(error)), { 
      query: req.query.q,
      location: req.query 
    });
    
    res.status(400).json({
      success: false,
      error: 'Food search failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/food/demo (Demo endpoint with sample data)
router.get('/demo', async (req: Request, res: Response) => {
  try {
    const demoRecommendations = [
      {
        name: 'Vada Pav',
        description: 'Mumbai\'s iconic street food - spiced potato fritter in a bun',
        location: {
          latitude: 19.0760,
          longitude: 72.8777,
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India'
        },
        safetyRating: {
          overall: 4.2,
          hygiene: 4.0,
          freshness: 4.5,
          popularity: 4.8,
          lastUpdated: new Date(),
          reviewCount: 156
        },
        priceRange: { min: 15, max: 25, currency: 'INR' },
        dietaryInfo: {
          isVegetarian: true,
          isVegan: false,
          isGlutenFree: false,
          allergens: ['gluten']
        },
        bestTime: 'Evening (5-8 PM)',
        hygieneNotes: ['Fresh oil used daily', 'Served hot'],
        distance: 0.5
      },
      {
        name: 'Chole Bhature',
        description: 'Spicy chickpea curry with deep-fried bread',
        location: {
          latitude: 28.6139,
          longitude: 77.2090,
          city: 'Delhi',
          state: 'Delhi',
          country: 'India'
        },
        safetyRating: {
          overall: 4.0,
          hygiene: 3.8,
          freshness: 4.2,
          popularity: 4.5,
          lastUpdated: new Date(),
          reviewCount: 89
        },
        priceRange: { min: 80, max: 150, currency: 'INR' },
        dietaryInfo: {
          isVegetarian: true,
          isVegan: false,
          isGlutenFree: false,
          allergens: ['gluten', 'dairy']
        },
        bestTime: 'Lunch (12-3 PM)',
        hygieneNotes: ['Made fresh daily', 'Clean preparation area'],
        distance: 1.2
      }
    ];
    
    res.json({
      success: true,
      message: 'Demo food recommendations - Popular Indian street food',
      data: {
        recommendations: demoRecommendations,
        count: demoRecommendations.length,
      },
      note: 'These are sample recommendations. Use the recommendations endpoint with location data to get dynamic results.',
    });
    
  } catch (error) {
    logger.error('Food demo endpoint failed', error instanceof Error ? error : new Error(String(error)));
    
    res.status(500).json({
      success: false,
      error: 'Demo failed',
      message: 'Unable to load demo data',
    });
  }
});

export default router;