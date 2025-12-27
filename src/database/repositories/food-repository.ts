// Repository for food items and vendors with location-based operations

import { DatabaseService } from '../../services/interfaces';
import { FoodItem, FoodVendor, Location, SafetyRating, FoodRecommendation } from '../../types';
import { 
  ModelTransformer, 
  DatabaseUtils,
  FoodItemRow,
  FoodVendorRow,
  SafetyRatingRow 
} from '../models';
import { logger } from '../../services/logging';

export class FoodRepository {
  constructor(private db: DatabaseService) {}

  // Food Item operations
  async createFoodItem(foodItem: Omit<FoodItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<FoodItem> {
    const id = DatabaseUtils.generateId();
    const now = new Date();
    
    const fullFoodItem: FoodItem = {
      id,
      createdAt: now,
      updatedAt: now,
      ...foodItem,
    };

    return this.db.transaction(async (db) => {
      // Insert main food item
      const foodItemRow = ModelTransformer.foodItemToRow(fullFoodItem);
      await db.create<FoodItemRow>('food_items', foodItemRow);

      // Insert ingredients
      for (const ingredient of foodItem.ingredients) {
        await db.create('food_ingredients', {
          id: DatabaseUtils.generateId(),
          food_item_id: id,
          ingredient,
        });
      }

      // Insert allergens
      for (const allergen of foodItem.dietaryInfo.allergens) {
        await db.create('food_allergens', {
          id: DatabaseUtils.generateId(),
          food_item_id: id,
          allergen,
        });
      }

      return fullFoodItem;
    });
  }

  async findFoodItemById(id: string): Promise<FoodItem | null> {
    const row = await this.db.findById<FoodItemRow>('food_items', id);
    if (!row) {
      return null;
    }

    const ingredients = await this.db.query<{ ingredient: string }>(
      'SELECT ingredient FROM food_ingredients WHERE food_item_id = ?',
      [id]
    );

    const allergens = await this.db.query<{ allergen: string }>(
      'SELECT allergen FROM food_allergens WHERE food_item_id = ?',
      [id]
    );

    return ModelTransformer.foodItemFromRow(
      row,
      ingredients.map(i => i.ingredient),
      allergens.map(a => a.allergen)
    );
  }

  async searchFoodItems(query: string, filters?: {
    category?: string;
    region?: string;
    isVegetarian?: boolean;
    isVegan?: boolean;
    spiceLevel?: string;
  }): Promise<FoodItem[]> {
    let sql = `
      SELECT DISTINCT fi.* FROM food_items fi
      WHERE (fi.name LIKE ? OR fi.description LIKE ? OR fi.category LIKE ?)
    `;
    const params: any[] = [`%${query}%`, `%${query}%`, `%${query}%`];

    if (filters) {
      if (filters.category) {
        sql += ' AND fi.category = ?';
        params.push(filters.category);
      }
      if (filters.region) {
        sql += ' AND fi.region = ?';
        params.push(filters.region);
      }
      if (filters.isVegetarian !== undefined) {
        sql += ' AND fi.is_vegetarian = ?';
        params.push(filters.isVegetarian ? 1 : 0);
      }
      if (filters.isVegan !== undefined) {
        sql += ' AND fi.is_vegan = ?';
        params.push(filters.isVegan ? 1 : 0);
      }
      if (filters.spiceLevel) {
        sql += ' AND fi.spice_level = ?';
        params.push(filters.spiceLevel);
      }
    }

    sql += ' ORDER BY fi.name ASC LIMIT 50';

    const rows = await this.db.query<FoodItemRow>(sql, params);
    
    const results: FoodItem[] = [];
    for (const row of rows) {
      const foodItem = await this.findFoodItemById(row.id);
      if (foodItem) {
        results.push(foodItem);
      }
    }

    return results;
  }

  // Food Vendor operations
  async createFoodVendor(vendor: Omit<FoodVendor, 'id' | 'createdAt' | 'updatedAt'>): Promise<FoodVendor> {
    const id = DatabaseUtils.generateId();
    const now = new Date();

    const vendorRow = {
      id,
      name: vendor.name,
      latitude: vendor.location.latitude,
      longitude: vendor.location.longitude,
      city: vendor.location.city,
      state: vendor.location.state,
      country: vendor.location.country,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    return this.db.transaction(async (db) => {
      // Insert vendor
      await db.create<FoodVendorRow>('food_vendors', vendorRow);

      // Insert vendor-food relationships
      for (const foodItemId of vendor.foodItems) {
        await db.create('vendor_food_items', {
          vendor_id: id,
          food_item_id: foodItemId,
          price_min: vendor.priceRange.min,
          price_max: vendor.priceRange.max,
          currency: vendor.priceRange.currency,
        });
      }

      // Insert safety rating
      const safetyRatingRow = ModelTransformer.safetyRatingToRow(vendor.safetyRating, id);
      await db.create<SafetyRatingRow>('safety_ratings', safetyRatingRow);

      // Insert hygiene notes
      for (const note of vendor.hygieneNotes) {
        await db.create('hygiene_notes', {
          id: DatabaseUtils.generateId(),
          vendor_id: id,
          note,
          created_at: now.toISOString(),
        });
      }

      // Insert operating hours
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      days.forEach((day, index) => {
        const dayHours = vendor.operatingHours[day as keyof typeof vendor.operatingHours];
        if (dayHours && dayHours.length > 0) {
          dayHours.forEach(async (timeSlot) => {
            await db.create('operating_hours', {
              id: DatabaseUtils.generateId(),
              vendor_id: id,
              day_of_week: index,
              open_time: timeSlot.open,
              close_time: timeSlot.close,
            });
          });
        }
      });

      const fullVendor: FoodVendor = {
        id,
        name: vendor.name,
        location: vendor.location,
        foodItems: vendor.foodItems,
        safetyRating: vendor.safetyRating,
        priceRange: vendor.priceRange,
        operatingHours: vendor.operatingHours,
        hygieneNotes: vendor.hygieneNotes,
        createdAt: now,
        updatedAt: now,
      };

      return fullVendor;
    });
  }

  async findVendorById(id: string): Promise<FoodVendor | null> {
    const row = await this.db.findById<FoodVendorRow>('food_vendors', id);
    if (!row) {
      return null;
    }

    // Get food items
    const foodItems = await this.db.query<{ food_item_id: string }>(
      'SELECT food_item_id FROM vendor_food_items WHERE vendor_id = ?',
      [id]
    );

    // Get safety rating
    const safetyRatingRow = await this.db.queryOne<SafetyRatingRow>(
      'SELECT * FROM safety_ratings WHERE vendor_id = ?',
      [id]
    );

    // Get hygiene notes
    const hygieneNotes = await this.db.query<{ note: string }>(
      'SELECT note FROM hygiene_notes WHERE vendor_id = ?',
      [id]
    );

    // Get operating hours (simplified - just return empty for now)
    const operatingHours = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    };

    // Get price range from vendor_food_items (take first one as representative)
    const priceInfo = await this.db.queryOne<{ price_min: number; price_max: number; currency: string }>(
      'SELECT price_min, price_max, currency FROM vendor_food_items WHERE vendor_id = ? LIMIT 1',
      [id]
    );

    const vendor: FoodVendor = {
      id: row.id,
      name: row.name,
      location: ModelTransformer.locationFromVendorRow(row),
      foodItems: foodItems.map(f => f.food_item_id),
      safetyRating: safetyRatingRow ? ModelTransformer.safetyRatingFromRow(safetyRatingRow) : {
        overall: 3,
        hygiene: 3,
        freshness: 3,
        popularity: 3,
        lastUpdated: new Date(),
        reviewCount: 0,
      },
      priceRange: priceInfo ? {
        min: priceInfo.price_min,
        max: priceInfo.price_max,
        currency: priceInfo.currency,
      } : { min: 0, max: 100, currency: 'INR' },
      operatingHours,
      hygieneNotes: hygieneNotes.map(h => h.note),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };

    return vendor;
  }

  async findVendorsByLocation(location: Location, radiusKm: number): Promise<FoodVendor[]> {
    const rows = await this.db.findByLocation<FoodVendorRow>('food_vendors', location, radiusKm);
    
    const results: FoodVendor[] = [];
    for (const row of rows) {
      const vendor = await this.findVendorById(row.id);
      if (vendor) {
        results.push(vendor);
      }
    }

    return results;
  }

  async getFoodRecommendations(
    location: Location, 
    radiusKm: number = 5,
    filters?: {
      isVegetarian?: boolean;
      isVegan?: boolean;
      spiceLevel?: string;
      maxPrice?: number;
      minRating?: number;
    }
  ): Promise<FoodRecommendation[]> {
    let sql = `
      SELECT DISTINCT 
        fv.*,
        fi.name as food_name,
        fi.description as food_description,
        fi.is_vegetarian,
        fi.is_vegan,
        fi.spice_level,
        sr.overall_rating,
        sr.hygiene_rating,
        sr.freshness_rating,
        sr.popularity_rating,
        sr.review_count,
        sr.last_updated,
        vfi.price_min,
        vfi.price_max,
        vfi.currency,
        (6371 * acos(cos(radians(?)) * cos(radians(fv.latitude)) * 
         cos(radians(fv.longitude) - radians(?)) + sin(radians(?)) * 
         sin(radians(fv.latitude)))) AS distance
      FROM food_vendors fv
      JOIN vendor_food_items vfi ON fv.id = vfi.vendor_id
      JOIN food_items fi ON vfi.food_item_id = fi.id
      LEFT JOIN safety_ratings sr ON fv.id = sr.vendor_id
      WHERE fv.latitude IS NOT NULL AND fv.longitude IS NOT NULL
    `;

    const params: any[] = [location.latitude, location.longitude, location.latitude];

    if (filters) {
      if (filters.isVegetarian !== undefined) {
        sql += ' AND fi.is_vegetarian = ?';
        params.push(filters.isVegetarian ? 1 : 0);
      }
      if (filters.isVegan !== undefined) {
        sql += ' AND fi.is_vegan = ?';
        params.push(filters.isVegan ? 1 : 0);
      }
      if (filters.spiceLevel) {
        sql += ' AND fi.spice_level = ?';
        params.push(filters.spiceLevel);
      }
      if (filters.maxPrice) {
        sql += ' AND vfi.price_max <= ?';
        params.push(filters.maxPrice);
      }
      if (filters.minRating) {
        sql += ' AND sr.overall_rating >= ?';
        params.push(filters.minRating);
      }
    }

    sql += ` 
      HAVING distance <= ?
      ORDER BY sr.overall_rating DESC, distance ASC
      LIMIT 20
    `;
    params.push(radiusKm);

    const rows = await this.db.query<any>(sql, params);

    const recommendations: FoodRecommendation[] = rows.map(row => ({
      name: row.food_name,
      description: row.food_description,
      location: {
        latitude: row.latitude,
        longitude: row.longitude,
        city: row.city,
        state: row.state,
        country: row.country,
      },
      safetyRating: {
        overall: row.overall_rating || 3,
        hygiene: row.hygiene_rating || 3,
        freshness: row.freshness_rating || 3,
        popularity: row.popularity_rating || 3,
        lastUpdated: new Date(row.last_updated || Date.now()),
        reviewCount: row.review_count || 0,
      },
      priceRange: {
        min: row.price_min,
        max: row.price_max,
        currency: row.currency,
      },
      dietaryInfo: {
        isVegetarian: Boolean(row.is_vegetarian),
        isVegan: Boolean(row.is_vegan),
        isGlutenFree: false, // Would need to be determined from ingredients
        allergens: [], // Would need to be fetched separately
      },
      bestTime: 'Evening (6-9 PM)', // Default - could be calculated from operating hours
      hygieneNotes: [], // Would need to be fetched separately
      distance: row.distance,
    }));

    return recommendations;
  }

  async updateSafetyRating(vendorId: string, rating: SafetyRating): Promise<void> {
    const existing = await this.db.queryOne<SafetyRatingRow>(
      'SELECT * FROM safety_ratings WHERE vendor_id = ?',
      [vendorId]
    );

    const ratingRow = ModelTransformer.safetyRatingToRow(rating, vendorId);

    if (existing) {
      await this.db.update('safety_ratings', existing.id, ratingRow);
    } else {
      await this.db.create<SafetyRatingRow>('safety_ratings', ratingRow);
    }

    logger.info('Safety rating updated', { vendorId, rating: rating.overall });
  }

  async getFoodStatistics(): Promise<{
    totalFoodItems: number;
    totalVendors: number;
    itemsByCategory: Record<string, number>;
    itemsByRegion: Record<string, number>;
    averageSafetyRating: number;
  }> {
    const [foodItemsResult, vendorsResult, categoryResults, regionResults, avgRatingResult] = await Promise.all([
      this.db.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM food_items'),
      this.db.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM food_vendors'),
      this.db.query<{ category: string; count: number }>('SELECT category, COUNT(*) as count FROM food_items GROUP BY category'),
      this.db.query<{ region: string; count: number }>('SELECT region, COUNT(*) as count FROM food_items GROUP BY region'),
      this.db.queryOne<{ avg_rating: number }>('SELECT AVG(overall_rating) as avg_rating FROM safety_ratings'),
    ]);

    const itemsByCategory: Record<string, number> = {};
    categoryResults.forEach(row => {
      itemsByCategory[row.category] = row.count;
    });

    const itemsByRegion: Record<string, number> = {};
    regionResults.forEach(row => {
      itemsByRegion[row.region] = row.count;
    });

    return {
      totalFoodItems: foodItemsResult?.count || 0,
      totalVendors: vendorsResult?.count || 0,
      itemsByCategory,
      itemsByRegion,
      averageSafetyRating: avgRatingResult?.avg_rating || 0,
    };
  }
}