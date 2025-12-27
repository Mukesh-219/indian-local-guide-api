// Test setup configuration for Jest and fast-check

import * as fc from 'fast-check';

// Configure fast-check for property-based testing
beforeAll(() => {
  // Set global configuration for fast-check
  const config: any = {
    numRuns: 100, // Minimum 100 iterations per property test as specified
    verbose: process.env.NODE_ENV === 'test',
  };
  
  if (process.env.FC_SEED) {
    config.seed = parseInt(process.env.FC_SEED, 10);
  }
  
  fc.configureGlobal(config);
});

// Global test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidLocation(): R;
      toBeValidSlangTerm(): R;
      toBeValidFoodRecommendation(): R;
    }
  }
}

// Custom Jest matchers for domain-specific validation
expect.extend({
  toBeValidLocation(received) {
    const isValid = 
      received &&
      typeof received.latitude === 'number' &&
      typeof received.longitude === 'number' &&
      received.latitude >= -90 && received.latitude <= 90 &&
      received.longitude >= -180 && received.longitude <= 180 &&
      typeof received.city === 'string' &&
      typeof received.state === 'string' &&
      typeof received.country === 'string';

    return {
      message: () => `expected ${JSON.stringify(received)} to be a valid location`,
      pass: isValid,
    };
  },

  toBeValidSlangTerm(received) {
    const isValid = 
      received &&
      typeof received.id === 'string' &&
      typeof received.term === 'string' &&
      ['hindi', 'english', 'regional'].includes(received.language) &&
      typeof received.region === 'string' &&
      Array.isArray(received.translations) &&
      ['formal', 'casual', 'slang'].includes(received.context) &&
      typeof received.popularity === 'number' &&
      Array.isArray(received.usageExamples);

    return {
      message: () => `expected ${JSON.stringify(received)} to be a valid slang term`,
      pass: isValid,
    };
  },

  toBeValidFoodRecommendation(received) {
    const isValid = 
      received &&
      typeof received.name === 'string' &&
      typeof received.description === 'string' &&
      received.location &&
      received.safetyRating &&
      received.priceRange &&
      received.dietaryInfo &&
      typeof received.bestTime === 'string' &&
      Array.isArray(received.hygieneNotes);

    return {
      message: () => `expected ${JSON.stringify(received)} to be a valid food recommendation`,
      pass: isValid,
    };
  },
});

// Test data generators for fast-check
export const arbitraries = {
  location: (): fc.Arbitrary<any> => fc.record({
    latitude: fc.float({ min: -90, max: 90 }),
    longitude: fc.float({ min: -180, max: 180 }),
    city: fc.string({ minLength: 1, maxLength: 50 }),
    state: fc.string({ minLength: 1, maxLength: 50 }),
    country: fc.constant('India'),
  }),

  slangTerm: (): fc.Arbitrary<any> => fc.record({
    id: fc.uuid(),
    term: fc.string({ minLength: 1, maxLength: 100 }),
    language: fc.constantFrom('hindi', 'english', 'regional'),
    region: fc.constantFrom('mumbai', 'delhi', 'bangalore', 'chennai', 'kolkata'),
    translations: fc.array(fc.record({
      text: fc.string({ minLength: 1, maxLength: 200 }),
      targetLanguage: fc.string({ minLength: 1, maxLength: 20 }),
      context: fc.string({ minLength: 1, maxLength: 50 }),
      confidence: fc.float({ min: 0, max: 1 }),
    })),
    context: fc.constantFrom('formal', 'casual', 'slang'),
    popularity: fc.integer({ min: 0, max: 100 }),
    usageExamples: fc.array(fc.string({ minLength: 1, maxLength: 200 })),
    createdAt: fc.date(),
    updatedAt: fc.date(),
  }),

  foodRecommendation: (): fc.Arbitrary<any> => fc.record({
    name: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.string({ minLength: 1, maxLength: 500 }),
    location: arbitraries.location(),
    safetyRating: fc.record({
      overall: fc.integer({ min: 1, max: 5 }),
      hygiene: fc.integer({ min: 1, max: 5 }),
      freshness: fc.integer({ min: 1, max: 5 }),
      popularity: fc.integer({ min: 1, max: 5 }),
      lastUpdated: fc.date(),
      reviewCount: fc.integer({ min: 0, max: 1000 }),
    }),
    priceRange: fc.record({
      min: fc.integer({ min: 10, max: 500 }),
      max: fc.integer({ min: 50, max: 1000 }),
      currency: fc.constant('INR'),
    }),
    dietaryInfo: fc.record({
      isVegetarian: fc.boolean(),
      isVegan: fc.boolean(),
      isGlutenFree: fc.boolean(),
      allergens: fc.array(fc.string({ minLength: 1, maxLength: 50 })),
    }),
    bestTime: fc.string({ minLength: 1, maxLength: 100 }),
    hygieneNotes: fc.array(fc.string({ minLength: 1, maxLength: 200 })),
  }),

  userPreferences: (): fc.Arbitrary<any> => fc.record({
    dietaryRestrictions: fc.array(fc.constantFrom('vegetarian', 'vegan', 'gluten-free', 'dairy-free')),
    spicePreference: fc.constantFrom('mild', 'medium', 'hot', 'very-hot'),
    preferredRegions: fc.array(fc.constantFrom('north', 'south', 'east', 'west')),
    languagePreference: fc.constantFrom('english', 'hindi', 'regional'),
    budgetRange: fc.record({
      min: fc.integer({ min: 50, max: 500 }),
      max: fc.integer({ min: 200, max: 2000 }),
      currency: fc.constant('INR'),
    }),
  }),
};

// Test utilities
export const testUtils = {
  createMockLocation: (overrides: any = {}) => ({
    latitude: 28.6139,
    longitude: 77.2090,
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    ...overrides,
  }),

  createMockSlangTerm: (overrides: any = {}) => ({
    id: '550e8400-e29b-41d4-a716-446655440000',
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
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  createMockFoodRecommendation: (overrides: any = {}) => ({
    name: 'Vada Pav',
    description: 'Mumbai street food staple',
    location: testUtils.createMockLocation({ city: 'Mumbai' }),
    safetyRating: {
      overall: 4,
      hygiene: 4,
      freshness: 4,
      popularity: 5,
      lastUpdated: new Date(),
      reviewCount: 150,
    },
    priceRange: {
      min: 15,
      max: 25,
      currency: 'INR',
    },
    dietaryInfo: {
      isVegetarian: true,
      isVegan: false,
      isGlutenFree: false,
      allergens: ['gluten'],
    },
    bestTime: 'Evening (5-8 PM)',
    hygieneNotes: ['Choose busy stalls', 'Avoid during monsoon'],
    ...overrides,
  }),
};