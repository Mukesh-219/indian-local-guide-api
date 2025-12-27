// Core data model interfaces for the Indian Local Guide system

export interface Location {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  country: string;
}

export interface SlangTerm {
  id: string;
  term: string;
  language: 'hindi' | 'english' | 'regional';
  region: string;
  translations: Translation[];
  context: 'formal' | 'casual' | 'slang';
  popularity: number;
  usageExamples: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Translation {
  text: string;
  targetLanguage: string;
  context: string;
  confidence: number;
}

export interface RegionalVariation {
  region: string;
  term: string;
  translation: string;
  confidence: number;
  context: 'formal' | 'casual' | 'slang';
  popularity: number;
  usageExamples: string[];
  alternativeTerms: string[];
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  confidence: number;
  context: 'formal' | 'casual' | 'slang';
  sourceLanguage: string;
  targetLanguage: string;
  region: string;
  alternatives: Array<{
    text: string;
    confidence: number;
    context: string;
  }>;
  usageExamples: string[];
  regionalVariations?: RegionalVariation[];
  isFuzzyMatch?: boolean;
  isUnknown?: boolean;
}

export interface FoodItem {
  id: string;
  name: string;
  description: string;
  category: string;
  region: string;
  ingredients: string[];
  dietaryInfo: DietaryInfo;
  preparationTime: string;
  spiceLevel: 'mild' | 'medium' | 'hot' | 'very-hot';
  createdAt: Date;
  updatedAt: Date;
}

export interface DietaryInfo {
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  allergens: string[];
}

export interface FoodVendor {
  id: string;
  name: string;
  location: Location;
  foodItems: string[];
  safetyRating: SafetyRating;
  priceRange: PriceRange;
  operatingHours: OperatingHours;
  hygieneNotes: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SafetyRating {
  overall: number; // 1-5 scale
  hygiene: number;
  freshness: number;
  popularity: number;
  lastUpdated: Date;
  reviewCount: number;
}

export interface PriceRange {
  min: number;
  max: number;
  currency: string;
}

export interface OperatingHours {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

export interface TimeSlot {
  open: string; // HH:MM format
  close: string; // HH:MM format
}

export interface FoodRecommendation {
  name: string;
  description: string;
  location: Location;
  safetyRating: SafetyRating;
  priceRange: PriceRange;
  dietaryInfo: DietaryInfo;
  bestTime: string;
  hygieneNotes: string[];
  distance?: number; // in kilometers
}

export interface FoodHub {
  name: string;
  location: Location;
  description: string;
  popularItems: string[];
  bestTimeToVisit: string;
  safetyTips: string[];
}

export interface RegionalInfo {
  region: string;
  languages: string[];
  customs: Custom[];
  festivals: Festival[];
  etiquette: EtiquetteRule[];
  transportation: TransportationInfo;
}

export interface Custom {
  name: string;
  description: string;
  significance: string;
  dosDonts: string[];
}

export interface Festival {
  name: string;
  date: string;
  significance: string;
  celebrations: string[];
  regions: string[];
  dosDonts: string[];
}

export interface EtiquetteRule {
  context: string;
  rules: string[];
  importance: 'high' | 'medium' | 'low';
}

export interface TransportationInfo {
  publicTransport: string[];
  tips: string[];
  costs: PriceRange[];
}

export interface BargainingTip {
  context: string;
  tips: string[];
  expectedDiscount: string;
  culturalNotes: string[];
}

export interface UserPreferences {
  dietaryRestrictions: string[];
  spicePreference: 'mild' | 'medium' | 'hot' | 'very-hot';
  preferredRegions: string[];
  languagePreference: string;
  budgetRange: PriceRange;
}

export interface User {
  id: string;
  preferences: UserPreferences;
  favorites: Favorite[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Favorite {
  id: string;
  type: 'slang' | 'food' | 'cultural';
  itemId: string;
  dateAdded: Date;
  notes?: string;
}

export interface FavoriteItem {
  id: string;
  type: 'slang' | 'food' | 'cultural';
  title: string;
  description: string;
  metadata: Record<string, unknown>;
}

export interface RecommendationHistory {
  id: string;
  userId: string;
  type: 'slang' | 'food' | 'cultural';
  query: string;
  results: unknown[];
  timestamp: Date;
  userRating?: number;
}

export interface FoodPreferences {
  dietaryRestrictions: string[];
  spiceLevel: 'mild' | 'medium' | 'hot' | 'very-hot';
  priceRange: PriceRange;
  radius: number; // search radius in kilometers
}

export interface SearchQuery {
  query: string;
  type?: 'slang' | 'food' | 'cultural' | 'all';
  region?: string;
  filters?: Record<string, unknown>;
}

export interface SearchResult {
  id: string;
  type: 'slang' | 'food' | 'cultural';
  title: string;
  description: string;
  relevanceScore: number;
  metadata: Record<string, unknown>;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Error types
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}