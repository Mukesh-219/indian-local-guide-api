// Service interface definitions for the Indian Local Guide system

import {
  SlangTerm,
  TranslationResult,
  RegionalVariation,
  FoodRecommendation,
  FoodHub,
  Location,
  FoodPreferences,
  SafetyRating,
  RegionalInfo,
  Festival,
  EtiquetteRule,
  BargainingTip,
  UserPreferences,
  Favorite,
  FavoriteItem,
  RecommendationHistory,
  SearchQuery,
  SearchResult,
} from '../types';

export interface SlangTranslationService {
  translateToEnglish(text: string, region?: string): Promise<TranslationResult>;
  translateToHindi(text: string, targetRegion?: string): Promise<TranslationResult>;
  getRegionalVariations(term: string): Promise<RegionalVariation[]>;
  searchSimilarTerms(query: string): Promise<SlangTerm[]>;
  addSlangTerm(term: SlangTerm): Promise<void>;
  updateSlangTerm(id: string, updates: Partial<SlangTerm>): Promise<void>;
}

export interface FoodRecommendationService {
  getRecommendations(location: Location, preferences: FoodPreferences): Promise<FoodRecommendation[]>;
  getFoodByCategory(category: string, location: Location): Promise<FoodRecommendation[]>;
  getPopularHubs(city: string): Promise<FoodHub[]>;
  rateSafety(vendorId: string): Promise<SafetyRating>;
  searchFood(query: string, location: Location): Promise<FoodRecommendation[]>;
  addFoodVendor(vendor: any): Promise<void>;
  updateSafetyRating(vendorId: string, rating: SafetyRating): Promise<void>;
}

export interface CulturalService {
  getRegionalInfo(region: string): Promise<RegionalInfo>;
  getFestivalInfo(festival: string): Promise<Festival>;
  getEtiquetteGuide(context: string): Promise<EtiquetteRule[]>;
  getBargainingTips(location: Location): Promise<BargainingTip[]>;
  searchCulturalContent(query: string, region?: string): Promise<SearchResult[]>;
  addCulturalContent(content: any): Promise<void>;
}

export interface UserService {
  savePreferences(userId: string, preferences: UserPreferences): Promise<void>;
  getPreferences(userId: string): Promise<UserPreferences | null>;
  getFavorites(userId: string): Promise<Favorite[]>;
  addFavorite(userId: string, item: FavoriteItem): Promise<void>;
  removeFavorite(userId: string, favoriteId: string): Promise<void>;
  getRecommendationHistory(userId: string): Promise<RecommendationHistory[]>;
  addToHistory(userId: string, entry: Omit<RecommendationHistory, 'id' | 'userId'>): Promise<void>;
  rateRecommendation(userId: string, historyId: string, rating: number): Promise<void>;
}

export interface SearchService {
  search(query: SearchQuery): Promise<SearchResult[]>;
  searchSlang(query: string, region?: string): Promise<SlangTerm[]>;
  searchFood(query: string, location?: Location): Promise<FoodRecommendation[]>;
  searchCultural(query: string, region?: string): Promise<SearchResult[]>;
  getSuggestions(partialQuery: string, type?: string): Promise<string[]>;
}

export interface GeolocationService {
  detectLocation(ipAddress?: string): Promise<Location | null>;
  getCityInfo(cityName: string): Promise<Location | null>;
  calculateDistance(from: Location, to: Location): number;
  findNearbyLocations(center: Location, radius: number): Promise<Location[]>;
  validateLocation(location: Location): boolean;
}

export interface DatabaseService {
  // Generic CRUD operations
  create<T>(table: string, data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  findById<T>(table: string, id: string): Promise<T | null>;
  findMany<T>(table: string, conditions?: Record<string, any>): Promise<T[]>;
  update<T>(table: string, id: string, updates: Partial<T>): Promise<T>;
  delete(table: string, id: string): Promise<void>;
  
  // Specialized queries
  findByLocation<T>(table: string, location: Location, radius: number): Promise<T[]>;
  searchText<T>(table: string, query: string, fields: string[]): Promise<T[]>;
  
  // Raw query support
  query<T>(sql: string, params?: any[]): Promise<T[]>;
  queryOne<T>(sql: string, params?: any[]): Promise<T | null>;
  
  // Transaction support
  transaction<T>(callback: (db: DatabaseService) => Promise<T>): Promise<T>;
}

export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  exists(key: string): Promise<boolean>;
}

export interface ValidationService {
  validateSlangTerm(term: Partial<SlangTerm>): { isValid: boolean; errors: string[] };
  validateFoodItem(item: any): { isValid: boolean; errors: string[] };
  validateLocation(location: Partial<Location>): { isValid: boolean; errors: string[] };
  validateUserPreferences(preferences: Partial<UserPreferences>): { isValid: boolean; errors: string[] };
  sanitizeInput(input: string): string;
}

export interface LoggingService {
  info(message: string, metadata?: Record<string, any>): void;
  warn(message: string, metadata?: Record<string, any>): void;
  error(message: string, error?: Error, metadata?: Record<string, any>): void;
  debug(message: string, metadata?: Record<string, any>): void;
}

// Configuration interfaces
export interface DatabaseConfig {
  type: 'sqlite' | 'postgres' | 'mysql';
  host?: string;
  port?: number;
  database: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  poolSize?: number;
}

export interface AppConfig {
  port: number;
  environment: 'development' | 'production' | 'test';
  database: DatabaseConfig;
  cors: {
    origin: string[];
    credentials: boolean;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
  cache: {
    ttl: number;
    maxSize: number;
  };
}