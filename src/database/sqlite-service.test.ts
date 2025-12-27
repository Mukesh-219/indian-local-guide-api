// Tests for SQLite database service

import { SQLiteService } from './sqlite-service';
import { testUtils } from '../test-setup';
import { promises as fs } from 'fs';
import path from 'path';

// Mock the config to use test database
jest.mock('../config', () => ({
  appConfig: {
    database: {
      database: './test-data/test.db'
    }
  }
}));

describe('SQLiteService', () => {
  let dbService: SQLiteService;
  const testDbPath = './test-data/test.db';

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
    
    // Create a fresh database service for each test
    dbService = new SQLiteService();
    await dbService.connect();
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

  describe('Connection Management', () => {
    test('should connect to database successfully', async () => {
      expect(dbService).toBeDefined();
      
      // Test health check
      const isHealthy = await dbService.healthCheck();
      expect(isHealthy).toBe(true);
    });

    test('should handle multiple connection attempts gracefully', async () => {
      // Should not throw error on multiple connects
      await dbService.connect();
      await dbService.connect();
      
      const isHealthy = await dbService.healthCheck();
      expect(isHealthy).toBe(true);
    });

    test('should disconnect properly', async () => {
      await dbService.disconnect();
      
      // Health check should fail after disconnect
      const isHealthy = await dbService.healthCheck();
      expect(isHealthy).toBe(false);
    });
  });

  describe('CRUD Operations', () => {
    test('should create and retrieve records', async () => {
      const testData = {
        name: 'Test Vendor',
        latitude: 19.0760,
        longitude: 72.8777,
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
      };

      // Create record
      const created = await dbService.create('food_vendors', testData);
      expect(created).toBeDefined();
      expect((created as any).name).toBe('Test Vendor');
      expect((created as any).city).toBe('Mumbai');

      // Retrieve by ID
      const retrieved = await dbService.findById('food_vendors', (created as any).id);
      expect(retrieved).toBeDefined();
      expect((retrieved as any).name).toBe('Test Vendor');
    });

    test('should update records', async () => {
      const testData = {
        name: 'Original Name',
        latitude: 19.0760,
        longitude: 72.8777,
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
      };

      // Create record
      const created = await dbService.create('food_vendors', testData);
      const id = (created as any).id;

      // Update record
      const updates = { name: 'Updated Name', city: 'Delhi' };
      const updated = await dbService.update('food_vendors', id, updates);
      
      expect((updated as any).name).toBe('Updated Name');
      expect((updated as any).city).toBe('Delhi');
      expect((updated as any).state).toBe('Maharashtra'); // Should remain unchanged
    });

    test('should delete records', async () => {
      const testData = {
        name: 'To Delete',
        latitude: 19.0760,
        longitude: 72.8777,
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
      };

      // Create record
      const created = await dbService.create('food_vendors', testData);
      const id = (created as any).id;

      // Verify it exists
      const beforeDelete = await dbService.findById('food_vendors', id);
      expect(beforeDelete).toBeDefined();

      // Delete record
      await dbService.delete('food_vendors', id);

      // Verify it's gone
      const afterDelete = await dbService.findById('food_vendors', id);
      expect(afterDelete).toBeNull();
    });

    test('should find multiple records with conditions', async () => {
      // Create multiple test records
      const vendors = [
        {
          name: 'Mumbai Vendor 1',
          latitude: 19.0760,
          longitude: 72.8777,
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
        },
        {
          name: 'Mumbai Vendor 2',
          latitude: 19.0860,
          longitude: 72.8877,
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
        },
        {
          name: 'Delhi Vendor',
          latitude: 28.6139,
          longitude: 77.2090,
          city: 'Delhi',
          state: 'Delhi',
          country: 'India',
        },
      ];

      // Create all vendors
      for (const vendor of vendors) {
        await dbService.create('food_vendors', vendor);
      }

      // Find Mumbai vendors
      const mumbaiVendors = await dbService.findMany('food_vendors', { city: 'Mumbai' });
      expect(mumbaiVendors).toHaveLength(2);
      expect(mumbaiVendors.every((v: any) => v.city === 'Mumbai')).toBe(true);

      // Find all vendors
      const allVendors = await dbService.findMany('food_vendors');
      expect(allVendors.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Location-based Queries', () => {
    test('should find records by location within radius', async () => {
      // Create vendors at different locations
      const vendors = [
        {
          name: 'Close Vendor',
          latitude: 19.0760, // Mumbai
          longitude: 72.8777,
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
        },
        {
          name: 'Nearby Vendor',
          latitude: 19.0860, // Close to Mumbai
          longitude: 72.8877,
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
        },
        {
          name: 'Far Vendor',
          latitude: 28.6139, // Delhi - far from Mumbai
          longitude: 77.2090,
          city: 'Delhi',
          state: 'Delhi',
          country: 'India',
        },
      ];

      // Create all vendors
      for (const vendor of vendors) {
        await dbService.create('food_vendors', vendor);
      }

      // Search near Mumbai with 50km radius
      const mumbaiLocation = {
        latitude: 19.0760,
        longitude: 72.8777,
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
      };

      const nearbyVendors = await dbService.findByLocation('food_vendors', mumbaiLocation, 50);
      
      // Should find the two Mumbai vendors but not Delhi
      expect(nearbyVendors.length).toBe(2);
      expect(nearbyVendors.every((v: any) => v.city === 'Mumbai')).toBe(true);
    });
  });

  describe('Text Search', () => {
    test('should search text across multiple fields', async () => {
      // Create test vendors
      const vendors = [
        {
          name: 'Delicious Food Stall',
          latitude: 19.0760,
          longitude: 72.8777,
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
        },
        {
          name: 'Street Food Corner',
          latitude: 19.0860,
          longitude: 72.8877,
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
        },
        {
          name: 'Chai Wala',
          latitude: 28.6139,
          longitude: 77.2090,
          city: 'Delhi',
          state: 'Delhi',
          country: 'India',
        },
      ];

      // Create all vendors
      for (const vendor of vendors) {
        await dbService.create('food_vendors', vendor);
      }

      // Search for "food"
      const foodVendors = await dbService.searchText('food_vendors', 'food', ['name']);
      expect(foodVendors.length).toBe(2);
      expect(foodVendors.every((v: any) => v.name.toLowerCase().includes('food'))).toBe(true);

      // Search for "Mumbai"
      const mumbaiVendors = await dbService.searchText('food_vendors', 'Mumbai', ['city']);
      expect(mumbaiVendors.length).toBe(2);
      expect(mumbaiVendors.every((v: any) => v.city === 'Mumbai')).toBe(true);
    });
  });

  describe('Transaction Support', () => {
    test('should handle successful transactions', async () => {
      const result = await dbService.transaction(async (db) => {
        // Create two vendors in a transaction
        const vendor1 = await db.create('food_vendors', {
          name: 'Vendor 1',
          latitude: 19.0760,
          longitude: 72.8777,
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
        });

        const vendor2 = await db.create('food_vendors', {
          name: 'Vendor 2',
          latitude: 19.0860,
          longitude: 72.8877,
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
        });

        return { vendor1, vendor2 };
      });

      expect(result.vendor1).toBeDefined();
      expect(result.vendor2).toBeDefined();

      // Verify both vendors were created
      const allVendors = await dbService.findMany('food_vendors');
      expect(allVendors.length).toBe(2);
    });

    test('should rollback failed transactions', async () => {
      try {
        await dbService.transaction(async (db) => {
          // Create a vendor
          await db.create('food_vendors', {
            name: 'Vendor 1',
            latitude: 19.0760,
            longitude: 72.8777,
            city: 'Mumbai',
            state: 'Maharashtra',
            country: 'India',
          });

          // Throw an error to trigger rollback
          throw new Error('Transaction failed');
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }

      // Verify no vendors were created due to rollback
      const allVendors = await dbService.findMany('food_vendors');
      expect(allVendors.length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid table names', async () => {
      await expect(
        dbService.create('invalid_table', { name: 'test' })
      ).rejects.toThrow();
    });

    test('should handle non-existent record updates', async () => {
      await expect(
        dbService.update('food_vendors', 'non-existent-id', { name: 'updated' })
      ).rejects.toThrow();
    });

    test('should handle non-existent record deletions', async () => {
      await expect(
        dbService.delete('food_vendors', 'non-existent-id')
      ).rejects.toThrow();
    });

    test('should return null for non-existent record retrieval', async () => {
      const result = await dbService.findById('food_vendors', 'non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('Raw Query Support', () => {
    test('should execute raw queries', async () => {
      // Create a test vendor first
      await dbService.create('food_vendors', {
        name: 'Test Vendor',
        latitude: 19.0760,
        longitude: 72.8777,
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
      });

      // Execute raw query
      const results = await dbService.query('SELECT COUNT(*) as count FROM food_vendors');
      expect(results).toHaveLength(1);
      expect((results[0] as any).count).toBe(1);
    });

    test('should execute single-result raw queries', async () => {
      // Create a test vendor first
      const created = await dbService.create('food_vendors', {
        name: 'Test Vendor',
        latitude: 19.0760,
        longitude: 72.8777,
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
      });

      // Execute single-result query
      const result = await dbService.queryOne(
        'SELECT name FROM food_vendors WHERE id = ?',
        [(created as any).id]
      );
      
      expect(result).toBeDefined();
      expect((result as any).name).toBe('Test Vendor');
    });
  });
});