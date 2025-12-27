// Tests for database models and validation

import { ModelTransformer, ModelValidator, DatabaseUtils } from './models';
import { testUtils } from '../test-setup';
import * as fc from 'fast-check';

describe('Database Models', () => {
  describe('ModelTransformer', () => {
    test('should transform slang term from row to domain model', () => {
      const row = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        term: 'jugaad',
        language: 'hindi' as const,
        region: 'delhi',
        context: 'casual' as const,
        popularity: 85,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      const translations = [{
        id: '550e8400-e29b-41d4-a716-446655440001',
        slang_term_id: '550e8400-e29b-41d4-a716-446655440000',
        text: 'innovative solution',
        target_language: 'english',
        context: 'casual',
        confidence: 0.9,
        created_at: '2024-01-01T00:00:00.000Z',
      }];

      const examples = [{
        id: '550e8400-e29b-41d4-a716-446655440002',
        slang_term_id: '550e8400-e29b-41d4-a716-446655440000',
        example: 'This is a jugaad solution',
        created_at: '2024-01-01T00:00:00.000Z',
      }];

      const slangTerm = ModelTransformer.slangTermFromRow(row, translations, examples);

      expect(slangTerm.id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(slangTerm.term).toBe('jugaad');
      expect(slangTerm.language).toBe('hindi');
      expect(slangTerm.translations).toHaveLength(1);
      expect(slangTerm.translations[0]?.text).toBe('innovative solution');
      expect(slangTerm.usageExamples).toHaveLength(1);
      expect(slangTerm.usageExamples[0]).toBe('This is a jugaad solution');
    });

    test('should transform domain model to database row', () => {
      const slangTerm = testUtils.createMockSlangTerm();
      const row = ModelTransformer.slangTermToRow(slangTerm);

      expect(row.id).toBe(slangTerm.id);
      expect(row.term).toBe(slangTerm.term);
      expect(row.language).toBe(slangTerm.language);
      expect(row.region).toBe(slangTerm.region);
      expect(row.context).toBe(slangTerm.context);
      expect(row.popularity).toBe(slangTerm.popularity);
    });

    test('should transform food item from row to domain model', () => {
      const row = {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'Vada Pav',
        description: 'Mumbai street food',
        category: 'snacks',
        region: 'mumbai',
        preparation_time: '10 minutes',
        spice_level: 'medium' as const,
        is_vegetarian: 1,
        is_vegan: 0,
        is_gluten_free: 0,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      const ingredients = ['potato', 'bread', 'chutney'];
      const allergens = ['gluten'];

      const foodItem = ModelTransformer.foodItemFromRow(row, ingredients, allergens);

      expect(foodItem.name).toBe('Vada Pav');
      expect(foodItem.dietaryInfo.isVegetarian).toBe(true);
      expect(foodItem.dietaryInfo.isVegan).toBe(false);
      expect(foodItem.ingredients).toEqual(ingredients);
      expect(foodItem.dietaryInfo.allergens).toEqual(allergens);
    });

    test('should transform location from vendor row', () => {
      const vendorRow = {
        id: 'vendor-1',
        name: 'Test Vendor',
        latitude: 19.0760,
        longitude: 72.8777,
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      const location = ModelTransformer.locationFromVendorRow(vendorRow);

      expect(location).toBeValidLocation();
      expect(location.city).toBe('Mumbai');
      expect(location.latitude).toBe(19.0760);
      expect(location.longitude).toBe(72.8777);
    });
  });

  describe('ModelValidator', () => {
    test('should validate valid slang term', () => {
      const validSlangTerm = testUtils.createMockSlangTerm();
      const result = ModelValidator.validateSlangTerm(validSlangTerm);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.data).toBeDefined();
    });

    test('should reject invalid slang term', () => {
      const invalidSlangTerm = {
        id: 'invalid',
        term: '', // Empty term should be invalid
        language: 'invalid-language',
      };

      const result = ModelValidator.validateSlangTerm(invalidSlangTerm);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.data).toBeUndefined();
    });

    test('should validate valid location', () => {
      const validLocation = testUtils.createMockLocation();
      const result = ModelValidator.validateLocation(validLocation);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.data).toBeDefined();
    });

    test('should reject invalid coordinates', () => {
      const invalidLocation = {
        latitude: 91, // Invalid latitude
        longitude: 181, // Invalid longitude
        city: 'Test',
        state: 'Test',
        country: 'Test',
      };

      const result = ModelValidator.validateLocation(invalidLocation);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('DatabaseUtils', () => {
    test('should generate valid UUIDs', () => {
      const id1 = DatabaseUtils.generateId();
      const id2 = DatabaseUtils.generateId();

      expect(id1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      expect(id2).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      expect(id1).not.toBe(id2);
    });

    test('should convert SQLite booleans correctly', () => {
      expect(DatabaseUtils.sqliteBoolean(1)).toBe(true);
      expect(DatabaseUtils.sqliteBoolean(0)).toBe(false);
    });

    test('should convert JavaScript booleans to SQLite integers', () => {
      expect(DatabaseUtils.booleanToSqlite(true)).toBe(1);
      expect(DatabaseUtils.booleanToSqlite(false)).toBe(0);
    });

    test('should sanitize LIKE queries', () => {
      const query = "test%_string'with'quotes";
      const sanitized = DatabaseUtils.sanitizeLikeQuery(query);

      expect(sanitized).toBe("test\\%\\_string''with''quotes");
    });

    test('should calculate distance between coordinates', () => {
      // Distance between Delhi and Mumbai (approximate)
      const delhi = { lat: 28.6139, lon: 77.2090 };
      const mumbai = { lat: 19.0760, lon: 72.8777 };

      const distance = DatabaseUtils.calculateDistance(
        delhi.lat, delhi.lon, mumbai.lat, mumbai.lon
      );

      // Should be approximately 1150-1200 km
      expect(distance).toBeGreaterThan(1100);
      expect(distance).toBeLessThan(1300);
    });

    test('should validate coordinates', () => {
      expect(DatabaseUtils.isValidCoordinate(28.6139, 77.2090)).toBe(true);
      expect(DatabaseUtils.isValidCoordinate(91, 77.2090)).toBe(false);
      expect(DatabaseUtils.isValidCoordinate(28.6139, 181)).toBe(false);
      expect(DatabaseUtils.isValidCoordinate(-91, 77.2090)).toBe(false);
      expect(DatabaseUtils.isValidCoordinate(28.6139, -181)).toBe(false);
    });
  });

  // Property-based tests
  describe('Property-based tests', () => {
    test('Property: Distance calculation is symmetric', () => {
      fc.assert(fc.property(
        fc.float({ min: -90, max: 90 }).filter(n => !isNaN(n)),
        fc.float({ min: -180, max: 180 }).filter(n => !isNaN(n)),
        fc.float({ min: -90, max: 90 }).filter(n => !isNaN(n)),
        fc.float({ min: -180, max: 180 }).filter(n => !isNaN(n)),
        (lat1, lon1, lat2, lon2) => {
          const distance1 = DatabaseUtils.calculateDistance(lat1, lon1, lat2, lon2);
          const distance2 = DatabaseUtils.calculateDistance(lat2, lon2, lat1, lon1);
          
          // Skip if either distance is NaN (edge case)
          if (isNaN(distance1) || isNaN(distance2)) {
            return true;
          }
          
          // Distance should be symmetric (within floating point precision)
          expect(Math.abs(distance1 - distance2)).toBeLessThan(0.001);
          return true;
        }
      ));
    });

    test('Property: Distance to same point is zero', () => {
      fc.assert(fc.property(
        fc.float({ min: -90, max: 90 }).filter(n => !isNaN(n)),
        fc.float({ min: -180, max: 180 }).filter(n => !isNaN(n)),
        (lat, lon) => {
          const distance = DatabaseUtils.calculateDistance(lat, lon, lat, lon);
          // Skip if distance is NaN
          if (isNaN(distance)) {
            return true;
          }
          expect(distance).toBeLessThan(0.001); // Should be essentially zero
          return true;
        }
      ));
    });

    test('Property: Generated IDs are always valid UUIDs', () => {
      fc.assert(fc.property(
        fc.integer({ min: 1, max: 100 }),
        (count) => {
          const ids = Array.from({ length: count }, () => DatabaseUtils.generateId());
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
          
          ids.forEach(id => {
            expect(id).toMatch(uuidRegex);
          });
          
          // All IDs should be unique
          const uniqueIds = new Set(ids);
          expect(uniqueIds.size).toBe(ids.length);
        }
      ));
    });
  });
});