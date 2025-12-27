// Database models with validation and type safety

import { 
  SlangTerm, 
  FoodItem, 
  FoodVendor, 
  RegionalInfo, 
  User, 
  Festival,
  Custom,
  EtiquetteRule,
  BargainingTip,
  SafetyRating,
  Favorite,
  RecommendationHistory,
  Location,
  DietaryInfo,
  PriceRange,
  OperatingHours,
  TimeSlot,
  UserPreferences,
  Translation,
} from '../types';

import { 
  SlangTermSchema,
  FoodItemSchema,
  SafetyRatingSchema,
  UserPreferencesSchema,
  LocationSchema,
  validateInput,
  validateInputSafe,
} from '../validation/schemas';

// Database row interfaces (snake_case to match SQL)
export interface SlangTermRow {
  id: string;
  term: string;
  language: 'hindi' | 'english' | 'regional';
  region: string;
  context: 'formal' | 'casual' | 'slang';
  popularity: number;
  created_at: string;
  updated_at: string;
}

export interface SlangTranslationRow {
  id: string;
  slang_term_id: string;
  text: string;
  target_language: string;
  context: string;
  confidence: number;
  created_at: string;
}

export interface UsageExampleRow {
  id: string;
  slang_term_id: string;
  example: string;
  created_at: string;
}

export interface FoodItemRow {
  id: string;
  name: string;
  description: string;
  category: string;
  region: string;
  preparation_time: string | null;
  spice_level: 'mild' | 'medium' | 'hot' | 'very-hot';
  is_vegetarian: number; // SQLite boolean as integer
  is_vegan: number;
  is_gluten_free: number;
  created_at: string;
  updated_at: string;
}

export interface FoodVendorRow {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  country: string;
  created_at: string;
  updated_at: string;
}

export interface SafetyRatingRow {
  id: string;
  vendor_id: string;
  overall_rating: number;
  hygiene_rating: number;
  freshness_rating: number;
  popularity_rating: number;
  review_count: number;
  last_updated: string;
}

export interface UserRow {
  id: string;
  language_preference: string;
  spice_preference: 'mild' | 'medium' | 'hot' | 'very-hot';
  budget_min: number | null;
  budget_max: number | null;
  budget_currency: string;
  created_at: string;
  updated_at: string;
}

// Model transformation functions
export class ModelTransformer {
  // Convert database row to domain model
  static slangTermFromRow(
    row: SlangTermRow, 
    translations: SlangTranslationRow[] = [], 
    examples: UsageExampleRow[] = []
  ): SlangTerm {
    const slangTerm: SlangTerm = {
      id: row.id,
      term: row.term,
      language: row.language,
      region: row.region,
      translations: translations.map(t => ({
        text: t.text,
        targetLanguage: t.target_language,
        context: t.context,
        confidence: t.confidence,
      })),
      context: row.context,
      popularity: row.popularity,
      usageExamples: examples.map(e => e.example),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };

    // Validate the constructed object
    return validateInput(SlangTermSchema, slangTerm);
  }

  // Convert domain model to database row
  static slangTermToRow(slangTerm: SlangTerm): SlangTermRow {
    return {
      id: slangTerm.id,
      term: slangTerm.term,
      language: slangTerm.language,
      region: slangTerm.region,
      context: slangTerm.context,
      popularity: slangTerm.popularity,
      created_at: slangTerm.createdAt.toISOString(),
      updated_at: slangTerm.updatedAt.toISOString(),
    };
  }

  static foodItemFromRow(
    row: FoodItemRow,
    ingredients: string[] = [],
    allergens: string[] = []
  ): FoodItem {
    const foodItem: FoodItem = {
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      region: row.region,
      ingredients,
      dietaryInfo: {
        isVegetarian: Boolean(row.is_vegetarian),
        isVegan: Boolean(row.is_vegan),
        isGlutenFree: Boolean(row.is_gluten_free),
        allergens,
      },
      preparationTime: row.preparation_time || '',
      spiceLevel: row.spice_level,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };

    return validateInput(FoodItemSchema, foodItem);
  }

  static foodItemToRow(foodItem: FoodItem): FoodItemRow {
    return {
      id: foodItem.id,
      name: foodItem.name,
      description: foodItem.description,
      category: foodItem.category,
      region: foodItem.region,
      preparation_time: foodItem.preparationTime || null,
      spice_level: foodItem.spiceLevel,
      is_vegetarian: foodItem.dietaryInfo.isVegetarian ? 1 : 0,
      is_vegan: foodItem.dietaryInfo.isVegan ? 1 : 0,
      is_gluten_free: foodItem.dietaryInfo.isGlutenFree ? 1 : 0,
      created_at: foodItem.createdAt.toISOString(),
      updated_at: foodItem.updatedAt.toISOString(),
    };
  }

  static locationFromVendorRow(row: FoodVendorRow): Location {
    const location: Location = {
      latitude: row.latitude,
      longitude: row.longitude,
      city: row.city,
      state: row.state,
      country: row.country,
    };

    return validateInput(LocationSchema, location);
  }

  static safetyRatingFromRow(row: SafetyRatingRow): SafetyRating {
    const rating: SafetyRating = {
      overall: row.overall_rating,
      hygiene: row.hygiene_rating,
      freshness: row.freshness_rating,
      popularity: row.popularity_rating,
      lastUpdated: new Date(row.last_updated),
      reviewCount: row.review_count,
    };

    return validateInput(SafetyRatingSchema, rating);
  }

  static safetyRatingToRow(rating: SafetyRating, vendorId: string): Omit<SafetyRatingRow, 'id'> {
    return {
      vendor_id: vendorId,
      overall_rating: rating.overall,
      hygiene_rating: rating.hygiene,
      freshness_rating: rating.freshness,
      popularity_rating: rating.popularity,
      review_count: rating.reviewCount,
      last_updated: rating.lastUpdated.toISOString(),
    };
  }

  static userFromRow(
    row: UserRow,
    dietaryRestrictions: string[] = [],
    preferredRegions: string[] = []
  ): User {
    const preferences: UserPreferences = {
      dietaryRestrictions,
      spicePreference: row.spice_preference,
      preferredRegions,
      languagePreference: row.language_preference,
      budgetRange: {
        min: row.budget_min || 0,
        max: row.budget_max || 1000,
        currency: row.budget_currency,
      },
    };

    const user: User = {
      id: row.id,
      preferences: validateInput(UserPreferencesSchema, preferences),
      favorites: [], // Will be loaded separately
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };

    return user;
  }

  static userToRow(user: User): UserRow {
    return {
      id: user.id,
      language_preference: user.preferences.languagePreference,
      spice_preference: user.preferences.spicePreference,
      budget_min: user.preferences.budgetRange.min,
      budget_max: user.preferences.budgetRange.max,
      budget_currency: user.preferences.budgetRange.currency,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString(),
    };
  }
}

// Validation helpers for database operations
export class ModelValidator {
  static validateSlangTerm(data: unknown): { isValid: boolean; errors: string[]; data?: SlangTerm } {
    const result = validateInputSafe(SlangTermSchema, data);
    if (result.success) {
      return { isValid: true, errors: [], data: result.data };
    } else {
      return { isValid: false, errors: result.errors };
    }
  }

  static validateFoodItem(data: unknown): { isValid: boolean; errors: string[]; data?: FoodItem } {
    const result = validateInputSafe(FoodItemSchema, data);
    if (result.success) {
      return { isValid: true, errors: [], data: result.data };
    } else {
      return { isValid: false, errors: result.errors };
    }
  }

  static validateLocation(data: unknown): { isValid: boolean; errors: string[]; data?: Location } {
    const result = validateInputSafe(LocationSchema, data);
    if (result.success) {
      return { isValid: true, errors: [], data: result.data };
    } else {
      return { isValid: false, errors: result.errors };
    }
  }

  static validateUserPreferences(data: unknown): { isValid: boolean; errors: string[]; data?: UserPreferences } {
    const result = validateInputSafe(UserPreferencesSchema, data);
    if (result.success) {
      return { isValid: true, errors: [], data: result.data };
    } else {
      return { isValid: false, errors: result.errors };
    }
  }

  static validateSafetyRating(data: unknown): { isValid: boolean; errors: string[]; data?: SafetyRating } {
    const result = validateInputSafe(SafetyRatingSchema, data);
    if (result.success) {
      return { isValid: true, errors: [], data: result.data };
    } else {
      return { isValid: false, errors: result.errors };
    }
  }
}

// Database utility functions
export class DatabaseUtils {
  // Generate UUID for new records
  static generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Convert SQLite boolean (0/1) to JavaScript boolean
  static sqliteBoolean(value: number): boolean {
    return Boolean(value);
  }

  // Convert JavaScript boolean to SQLite integer
  static booleanToSqlite(value: boolean): number {
    return value ? 1 : 0;
  }

  // Sanitize string for SQL LIKE queries
  static sanitizeLikeQuery(query: string): string {
    return query
      .replace(/[%_]/g, '\\$&') // Escape SQL LIKE wildcards
      .replace(/'/g, "''"); // Escape single quotes
  }

  // Calculate distance between two points using Haversine formula
  static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Validate coordinates
  static isValidCoordinate(lat: number, lon: number): boolean {
    return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
  }
}