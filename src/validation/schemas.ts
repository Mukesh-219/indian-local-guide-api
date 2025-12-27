// Runtime validation schemas using Zod

import { z } from 'zod';

// Location validation
export const LocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  country: z.string().min(1).max(100),
});

// Slang term validation
export const SlangTermSchema = z.object({
  id: z.string().uuid(),
  term: z.string().min(1).max(200),
  language: z.enum(['hindi', 'english', 'regional']),
  region: z.string().min(1).max(50),
  translations: z.array(z.object({
    text: z.string().min(1).max(500),
    targetLanguage: z.string().min(1).max(50),
    context: z.string().min(1).max(100),
    confidence: z.number().min(0).max(1),
  })),
  context: z.enum(['formal', 'casual', 'slang']),
  popularity: z.number().min(0).max(100),
  usageExamples: z.array(z.string().min(1).max(500)),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Food item validation
export const FoodItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  category: z.string().min(1).max(100),
  region: z.string().min(1).max(100),
  ingredients: z.array(z.string().min(1).max(100)),
  dietaryInfo: z.object({
    isVegetarian: z.boolean(),
    isVegan: z.boolean(),
    isGlutenFree: z.boolean(),
    allergens: z.array(z.string().min(1).max(50)),
  }),
  preparationTime: z.string().min(1).max(100),
  spiceLevel: z.enum(['mild', 'medium', 'hot', 'very-hot']),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Safety rating validation
export const SafetyRatingSchema = z.object({
  overall: z.number().min(1).max(5),
  hygiene: z.number().min(1).max(5),
  freshness: z.number().min(1).max(5),
  popularity: z.number().min(1).max(5),
  lastUpdated: z.date(),
  reviewCount: z.number().min(0),
});

// Price range validation
export const PriceRangeSchema = z.object({
  min: z.number().min(0),
  max: z.number().min(0),
  currency: z.string().length(3), // ISO currency code
}).refine(data => data.max >= data.min, {
  message: "Max price must be greater than or equal to min price",
});

// User preferences validation
export const UserPreferencesSchema = z.object({
  dietaryRestrictions: z.array(z.string().min(1).max(50)),
  spicePreference: z.enum(['mild', 'medium', 'hot', 'very-hot']),
  preferredRegions: z.array(z.string().min(1).max(50)),
  languagePreference: z.string().min(1).max(20),
  budgetRange: PriceRangeSchema,
});

// Food recommendation validation
export const FoodRecommendationSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  location: LocationSchema,
  safetyRating: SafetyRatingSchema,
  priceRange: PriceRangeSchema,
  dietaryInfo: z.object({
    isVegetarian: z.boolean(),
    isVegan: z.boolean(),
    isGlutenFree: z.boolean(),
    allergens: z.array(z.string().min(1).max(50)),
  }),
  bestTime: z.string().min(1).max(200),
  hygieneNotes: z.array(z.string().min(1).max(500)),
  distance: z.number().min(0).optional(),
});

// Search query validation
export const SearchQuerySchema = z.object({
  query: z.string().min(1).max(500),
  type: z.enum(['slang', 'food', 'cultural', 'all']).optional(),
  region: z.string().min(1).max(100).optional(),
  filters: z.record(z.unknown()).optional(),
});

// API request validation schemas
export const TranslateRequestSchema = z.object({
  text: z.string().min(1).max(1000),
  targetLanguage: z.enum(['english', 'hindi', 'regional']),
  region: z.string().min(1).max(100).optional(),
});

// Translation API schemas
export const TranslateToEnglishSchema = z.object({
  text: z.string().min(1, 'Text cannot be empty').max(500, 'Text too long'),
  region: z.string().optional(),
});

export const TranslateToHindiSchema = z.object({
  text: z.string().min(1, 'Text cannot be empty').max(500, 'Text too long'),
  targetRegion: z.string().optional(),
});

export const SearchTermsSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty').max(100, 'Query too long'),
});

export const AddSlangTermSchema = z.object({
  term: z.string().min(1, 'Term cannot be empty').max(100, 'Term too long'),
  language: z.enum(['hindi', 'english', 'regional']),
  region: z.string().min(1, 'Region cannot be empty').max(50, 'Region too long'),
  translations: z.array(z.object({
    text: z.string().min(1, 'Translation text cannot be empty'),
    targetLanguage: z.string(),
    context: z.string(),
    confidence: z.number().min(0).max(1),
  })).min(1, 'At least one translation required'),
  context: z.enum(['formal', 'casual', 'slang']),
  popularity: z.number().min(0).max(100).default(50),
  usageExamples: z.array(z.string()).default([]),
});

export const FoodRecommendationRequestSchema = z.object({
  location: LocationSchema,
  preferences: z.object({
    dietaryRestrictions: z.array(z.string()).optional(),
    spiceLevel: z.enum(['mild', 'medium', 'hot', 'very-hot']).optional(),
    priceRange: PriceRangeSchema.optional(),
    radius: z.number().min(0.1).max(100).optional(), // km
  }).optional(),
});

// Cultural API schemas
export const CulturalSearchSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty').max(200, 'Query too long'),
  region: z.string().optional(),
});

export const BargainingLocationSchema = z.object({
  location: LocationSchema,
});

// Food search schemas
export const FoodSearchSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty').max(200, 'Query too long'),
  location: LocationSchema,
});

export const FoodCategorySchema = z.object({
  category: z.string().min(1, 'Category cannot be empty').max(100, 'Category too long'),
  location: LocationSchema,
});

// Environment validation
export const EnvironmentSchema = z.object({
  PORT: z.string().transform(Number).pipe(z.number().min(1000).max(65535)),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  DATABASE_PATH: z.string().min(1),
  DB_POOL_SIZE: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
  CORS_ORIGIN: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().min(1000)).optional(),
  RATE_LIMIT_MAX: z.string().transform(Number).pipe(z.number().min(1)).optional(),
  CACHE_TTL: z.string().transform(Number).pipe(z.number().min(1)).optional(),
  CACHE_MAX_SIZE: z.string().transform(Number).pipe(z.number().min(1)).optional(),
});

// Validation helper functions
export const validateInput = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Validation failed: ${messages.join(', ')}`);
    }
    throw error;
  }
};

export const validateInputSafe = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } => {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    const errors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
    return { success: false, errors };
  }
};

// Input sanitization
export const sanitizeString = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/[^\w\s\-.,!?()]/g, '') // Keep only safe characters
    .substring(0, 1000); // Limit length
};

export const sanitizeSearchQuery = (query: string): string => {
  return query
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Keep only alphanumeric, spaces, and hyphens
    .substring(0, 200); // Limit search query length
};