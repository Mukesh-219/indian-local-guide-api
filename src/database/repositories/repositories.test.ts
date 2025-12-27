// Integration tests for repositories

import { SQLiteService } from '../sqlite-service';
import { RepositoryFactory } from './index';
import { testUtils } from '../../test-setup';
import { promises as fs } from 'fs';

// Mock the config to use test database
jest.mock('../../config', () => ({
  appConfig: {
    database: {
      database: './test-data/repositories-test.db'
    }
  }
}));

describe('Repository Integration Tests', () => {
  let dbService: SQLiteService;
  let repositories: ReturnType<RepositoryFactory['createAll']>;
  const testDbPath = './test-data/repositories-test.db';

  beforeAll(async () => {
    // Ensure test data directory exists
    await fs.mkdir('./test-data', { recursive: true });
  });

  beforeEach(async () => {
    // Clean up any existing test database first
    try {
      await fs.unlink(testDbPath);
    } catch (error) {
      // Ignore if file doesn't exist
    }
    
    // Create fresh database and repositories for each test
    dbService = new SQLiteService();
    await dbService.connect();
    
    const factory = new RepositoryFactory(dbService);
    repositories = factory.createAll();
  });

  afterEach(async () => {
    if (dbService) {
      await dbService.disconnect();
    }
    
    // Clean up test database
    try {
      await fs.unlink(testDbPath);
    } catch (error) {
      // Ignore if file doesn't exist
    }
  });

  afterAll(async () => {
    // Clean up test directory
    try {
      await fs.rmdir('./test-data');
    } catch (error) {
      // Ignore if directory doesn't exist
    }
  });

  describe('SlangRepository', () => {
    test('should create and retrieve slang terms', async () => {
      const slangData = {
        term: 'jugaad',
        language: 'hindi' as const,
        region: 'delhi',
        translations: [{
          text: 'innovative solution',
          targetLanguage: 'english',
          context: 'casual',
          confidence: 0.9,
        }],
        context: 'casual' as const,
        popularity: 85,
        usageExamples: ['This is a jugaad solution'],
      };

      // Create slang term
      const created = await repositories.slang.create(slangData);
      expect(created.id).toBeDefined();
      expect(created.term).toBe('jugaad');
      expect(created.translations).toHaveLength(1);

      // Retrieve by ID
      const retrieved = await repositories.slang.findById(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.term).toBe('jugaad');
      expect(retrieved?.translations[0]?.text).toBe('innovative solution');
    });

    test('should search slang terms', async () => {
      // Create multiple slang terms
      const terms = [
        {
          term: 'jugaad',
          language: 'hindi' as const,
          region: 'delhi',
          translations: [{ text: 'innovative solution', targetLanguage: 'english', context: 'casual', confidence: 0.9 }],
          context: 'casual' as const,
          popularity: 85,
          usageExamples: ['This is jugaad'],
        },
        {
          term: 'timepass',
          language: 'hindi' as const,
          region: 'mumbai',
          translations: [{ text: 'killing time', targetLanguage: 'english', context: 'casual', confidence: 0.8 }],
          context: 'casual' as const,
          popularity: 70,
          usageExamples: ['Just timepass'],
        },
      ];

      for (const term of terms) {
        await repositories.slang.create(term);
      }

      // Search for terms
      const searchResults = await repositories.slang.searchTerms('jug');
      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults.some(r => r.term === 'jugaad')).toBe(true);

      // Find by region
      const delhiTerms = await repositories.slang.findByRegion('delhi');
      expect(delhiTerms.length).toBe(1);
      expect(delhiTerms[0]?.term).toBe('jugaad');
    });

    test('should get slang statistics', async () => {
      // Create test data
      await repositories.slang.create({
        term: 'test1',
        language: 'hindi',
        region: 'delhi',
        translations: [],
        context: 'casual',
        popularity: 50,
        usageExamples: [],
      });

      await repositories.slang.create({
        term: 'test2',
        language: 'english',
        region: 'mumbai',
        translations: [],
        context: 'formal',
        popularity: 75,
        usageExamples: [],
      });

      const stats = await repositories.slang.getStatistics();
      expect(stats.totalTerms).toBe(2);
      expect(stats.termsByLanguage.hindi).toBe(1);
      expect(stats.termsByLanguage.english).toBe(1);
      expect(stats.termsByRegion.delhi).toBe(1);
      expect(stats.termsByRegion.mumbai).toBe(1);
    });
  });

  describe('FoodRepository', () => {
    test('should create and retrieve food items', async () => {
      const foodData = {
        name: 'Vada Pav',
        description: 'Mumbai street food',
        category: 'snacks',
        region: 'mumbai',
        ingredients: ['potato', 'bread', 'chutney'],
        dietaryInfo: {
          isVegetarian: true,
          isVegan: false,
          isGlutenFree: false,
          allergens: ['gluten'],
        },
        preparationTime: '10 minutes',
        spiceLevel: 'medium' as const,
      };

      // Create food item
      const created = await repositories.food.createFoodItem(foodData);
      expect(created.id).toBeDefined();
      expect(created.name).toBe('Vada Pav');

      // Retrieve by ID
      const retrieved = await repositories.food.findFoodItemById(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Vada Pav');
      expect(retrieved?.ingredients).toContain('potato');
      expect(retrieved?.dietaryInfo.allergens).toContain('gluten');
    });

    test('should search food items with filters', async () => {
      // Create test food items
      const foods = [
        {
          name: 'Vada Pav',
          description: 'Mumbai snack',
          category: 'snacks',
          region: 'mumbai',
          ingredients: ['potato'],
          dietaryInfo: { isVegetarian: true, isVegan: false, isGlutenFree: false, allergens: [] },
          preparationTime: '10 min',
          spiceLevel: 'medium' as const,
        },
        {
          name: 'Dosa',
          description: 'South Indian crepe',
          category: 'breakfast',
          region: 'south',
          ingredients: ['rice', 'lentils'],
          dietaryInfo: { isVegetarian: true, isVegan: true, isGlutenFree: true, allergens: [] },
          preparationTime: '20 min',
          spiceLevel: 'mild' as const,
        },
      ];

      for (const food of foods) {
        await repositories.food.createFoodItem(food);
      }

      // Search with filters
      const vegetarianFood = await repositories.food.searchFoodItems('', { isVegetarian: true });
      expect(vegetarianFood.length).toBe(2);

      const veganFood = await repositories.food.searchFoodItems('', { isVegan: true });
      expect(veganFood.length).toBe(1);
      expect(veganFood[0]?.name).toBe('Dosa');

      const snacks = await repositories.food.searchFoodItems('', { category: 'snacks' });
      expect(snacks.length).toBe(1);
      expect(snacks[0]?.name).toBe('Vada Pav');
    });

    test('should create food vendors and find by location', async () => {
      // First create a food item
      const foodItem = await repositories.food.createFoodItem({
        name: 'Test Food',
        description: 'Test description',
        category: 'test',
        region: 'test',
        ingredients: ['test'],
        dietaryInfo: { isVegetarian: true, isVegan: false, isGlutenFree: false, allergens: [] },
        preparationTime: '5 min',
        spiceLevel: 'mild',
      });

      const vendorData = {
        name: 'Test Vendor',
        location: testUtils.createMockLocation({ city: 'Mumbai' }),
        foodItems: [foodItem.id],
        safetyRating: {
          overall: 4,
          hygiene: 4,
          freshness: 4,
          popularity: 4,
          lastUpdated: new Date(),
          reviewCount: 10,
        },
        priceRange: { min: 20, max: 50, currency: 'INR' },
        operatingHours: {
          monday: [{ open: '09:00', close: '21:00' }],
          tuesday: [{ open: '09:00', close: '21:00' }],
          wednesday: [{ open: '09:00', close: '21:00' }],
          thursday: [{ open: '09:00', close: '21:00' }],
          friday: [{ open: '09:00', close: '21:00' }],
          saturday: [{ open: '09:00', close: '21:00' }],
          sunday: [],
        },
        hygieneNotes: ['Clean preparation area', 'Fresh ingredients'],
      };

      // Create vendor
      const created = await repositories.food.createFoodVendor(vendorData);
      expect(created.id).toBeDefined();
      expect(created.name).toBe('Test Vendor');

      // Find by location
      const nearbyVendors = await repositories.food.findVendorsByLocation(
        testUtils.createMockLocation({ city: 'Mumbai' }),
        10 // 10km radius
      );
      expect(nearbyVendors.length).toBe(1);
      expect(nearbyVendors[0]?.name).toBe('Test Vendor');
    });
  });

  describe('UserRepository', () => {
    test('should create and retrieve users', async () => {
      const userData = {
        preferences: {
          dietaryRestrictions: ['vegetarian'],
          spicePreference: 'medium' as const,
          preferredRegions: ['mumbai', 'delhi'],
          languagePreference: 'english',
          budgetRange: { min: 50, max: 500, currency: 'INR' },
        },
        favorites: [],
      };

      // Create user
      const created = await repositories.user.create(userData);
      expect(created.id).toBeDefined();
      expect(created.preferences.dietaryRestrictions).toContain('vegetarian');

      // Retrieve by ID
      const retrieved = await repositories.user.findById(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.preferences.spicePreference).toBe('medium');
      expect(retrieved?.preferences.preferredRegions).toContain('mumbai');
    });

    test('should manage user favorites', async () => {
      // Create user
      const user = await repositories.user.create({
        preferences: {
          dietaryRestrictions: [],
          spicePreference: 'medium',
          preferredRegions: [],
          languagePreference: 'english',
          budgetRange: { min: 0, max: 1000, currency: 'INR' },
        },
        favorites: [],
      });

      // Add favorite
      await repositories.user.addFavorite(user.id, {
        type: 'slang',
        itemId: 'test-slang-id',
        notes: 'Interesting term',
      });

      // Get favorites
      const favorites = await repositories.user.getFavorites(user.id);
      expect(favorites.length).toBe(1);
      expect(favorites[0]?.type).toBe('slang');
      expect(favorites[0]?.itemId).toBe('test-slang-id');
      expect(favorites[0]?.notes).toBe('Interesting term');

      // Remove favorite
      await repositories.user.removeFavorite(user.id, favorites[0]!.id);
      
      const remainingFavorites = await repositories.user.getFavorites(user.id);
      expect(remainingFavorites.length).toBe(0);
    });

    test('should manage recommendation history', async () => {
      // Create user
      const user = await repositories.user.create({
        preferences: {
          dietaryRestrictions: [],
          spicePreference: 'medium',
          preferredRegions: [],
          languagePreference: 'english',
          budgetRange: { min: 0, max: 1000, currency: 'INR' },
        },
        favorites: [],
      });

      // Add to history
      await repositories.user.addToHistory(user.id, {
        type: 'slang',
        query: 'jugaad',
        results: [{ term: 'jugaad', translation: 'innovative solution' }],
        timestamp: new Date(),
      });

      // Get history
      const history = await repositories.user.getRecommendationHistory(user.id);
      expect(history.length).toBe(1);
      expect(history[0]?.type).toBe('slang');
      expect(history[0]?.query).toBe('jugaad');

      // Rate recommendation
      await repositories.user.rateRecommendation(user.id, history[0]!.id, 5);
      
      const updatedHistory = await repositories.user.getRecommendationHistory(user.id);
      expect(updatedHistory[0]?.userRating).toBe(5);
    });

    test('should get user statistics', async () => {
      // Create user with some data
      const user = await repositories.user.create({
        preferences: {
          dietaryRestrictions: ['vegetarian'],
          spicePreference: 'medium',
          preferredRegions: ['mumbai'],
          languagePreference: 'english',
          budgetRange: { min: 50, max: 500, currency: 'INR' },
        },
        favorites: [],
      });

      // Add some favorites and history
      await repositories.user.addFavorite(user.id, {
        type: 'slang',
        itemId: 'test-1',
      });

      await repositories.user.addFavorite(user.id, {
        type: 'food',
        itemId: 'test-2',
      });

      await repositories.user.addToHistory(user.id, {
        type: 'slang',
        query: 'test',
        results: [],
        timestamp: new Date(),
      });

      // Get statistics
      const stats = await repositories.user.getUserStatistics(user.id);
      expect(stats.totalFavorites).toBe(2);
      expect(stats.favoritesByType.slang).toBe(1);
      expect(stats.favoritesByType.food).toBe(1);
      expect(stats.totalQueries).toBe(1);
      expect(stats.queriesByType.slang).toBe(1);
    });
  });

  describe('Cross-Repository Integration', () => {
    test('should work together for complete workflow', async () => {
      // Create a user
      const user = await repositories.user.create({
        preferences: {
          dietaryRestrictions: ['vegetarian'],
          spicePreference: 'medium',
          preferredRegions: ['mumbai'],
          languagePreference: 'english',
          budgetRange: { min: 50, max: 500, currency: 'INR' },
        },
        favorites: [],
      });

      // Create a slang term
      const slangTerm = await repositories.slang.create({
        term: 'jugaad',
        language: 'hindi',
        region: 'mumbai',
        translations: [{ text: 'innovative solution', targetLanguage: 'english', context: 'casual', confidence: 0.9 }],
        context: 'casual',
        popularity: 85,
        usageExamples: ['This is jugaad'],
      });

      // Create a food item
      const foodItem = await repositories.food.createFoodItem({
        name: 'Vada Pav',
        description: 'Mumbai street food',
        category: 'snacks',
        region: 'mumbai',
        ingredients: ['potato', 'bread'],
        dietaryInfo: { isVegetarian: true, isVegan: false, isGlutenFree: false, allergens: [] },
        preparationTime: '10 min',
        spiceLevel: 'medium',
      });

      // User favorites the slang term
      await repositories.user.addFavorite(user.id, {
        type: 'slang',
        itemId: slangTerm.id,
        notes: 'Useful Mumbai term',
      });

      // User searches for food (add to history)
      await repositories.user.addToHistory(user.id, {
        type: 'food',
        query: 'vada pav',
        results: [{ id: foodItem.id, name: foodItem.name }],
        timestamp: new Date(),
      });

      // Verify the complete workflow
      const userWithData = await repositories.user.findById(user.id);
      expect(userWithData?.favorites.length).toBe(1);
      expect(userWithData?.favorites[0]?.type).toBe('slang');

      const history = await repositories.user.getRecommendationHistory(user.id);
      expect(history.length).toBe(1);
      expect(history[0]?.type).toBe('food');

      const retrievedSlang = await repositories.slang.findById(slangTerm.id);
      expect(retrievedSlang?.term).toBe('jugaad');

      const retrievedFood = await repositories.food.findFoodItemById(foodItem.id);
      expect(retrievedFood?.name).toBe('Vada Pav');
    });
  });
});