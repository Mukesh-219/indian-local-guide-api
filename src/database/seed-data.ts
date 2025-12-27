// Sample data for the Indian Local Guide database

import { SlangTerm, FoodItem, FoodVendor } from '../types';

export const sampleSlangTerms: Omit<SlangTerm, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    term: 'jugaad',
    language: 'hindi',
    region: 'delhi',
    translations: [
      {
        text: 'innovative solution',
        targetLanguage: 'english',
        context: 'casual',
        confidence: 0.9
      },
      {
        text: 'makeshift fix',
        targetLanguage: 'english',
        context: 'casual',
        confidence: 0.8
      }
    ],
    context: 'casual',
    popularity: 95,
    usageExamples: [
      'This is a jugaad solution to fix the problem',
      'He always finds a jugaad for everything'
    ]
  },
  {
    term: 'timepass',
    language: 'hindi',
    region: 'mumbai',
    translations: [
      {
        text: 'killing time',
        targetLanguage: 'english',
        context: 'casual',
        confidence: 0.9
      },
      {
        text: 'leisure activity',
        targetLanguage: 'english',
        context: 'formal',
        confidence: 0.7
      },
      {
        text: 'pastime',
        targetLanguage: 'english',
        context: 'casual',
        confidence: 0.8
      }
    ],
    context: 'casual',
    popularity: 85,
    usageExamples: [
      'Just doing timepass at the mall',
      'This movie is good timepass'
    ]
  },
  {
    term: 'fundoo',
    language: 'hindi',
    region: 'delhi',
    translations: [
      {
        text: 'awesome',
        targetLanguage: 'english',
        context: 'slang',
        confidence: 0.9
      },
      {
        text: 'cool',
        targetLanguage: 'english',
        context: 'casual',
        confidence: 0.8
      }
    ],
    context: 'slang',
    popularity: 75,
    usageExamples: [
      'That movie was fundoo!',
      'Your new bike is fundoo'
    ]
  },
  {
    term: 'bindaas',
    language: 'hindi',
    region: 'mumbai',
    translations: [
      {
        text: 'awesome',
        targetLanguage: 'english',
        context: 'slang',
        confidence: 0.9
      },
      {
        text: 'carefree',
        targetLanguage: 'english',
        context: 'casual',
        confidence: 0.8
      },
      {
        text: 'fearless',
        targetLanguage: 'english',
        context: 'formal',
        confidence: 0.7
      }
    ],
    context: 'slang',
    popularity: 80,
    usageExamples: [
      'He is bindaas about everything',
      'Live bindaas, don\'t worry'
    ]
  },
  {
    term: 'bakchodi',
    language: 'hindi',
    region: 'delhi',
    translations: [
      {
        text: 'nonsense talk',
        targetLanguage: 'english',
        context: 'slang',
        confidence: 0.9
      },
      {
        text: 'fooling around',
        targetLanguage: 'english',
        context: 'casual',
        confidence: 0.8
      }
    ],
    context: 'slang',
    popularity: 70,
    usageExamples: [
      'Stop this bakchodi and be serious',
      'Don\'t listen to his bakchodi'
    ]
  },
  {
    term: 'bas yaar',
    language: 'hindi',
    region: 'delhi',
    translations: [
      {
        text: 'enough man',
        targetLanguage: 'english',
        context: 'casual',
        confidence: 0.9
      },
      {
        text: 'that\'s it buddy',
        targetLanguage: 'english',
        context: 'casual',
        confidence: 0.8
      }
    ],
    context: 'casual',
    popularity: 90,
    usageExamples: [
      'Bas yaar, I can\'t eat anymore',
      'Bas yaar, let\'s go home now'
    ]
  },
  {
    term: 'acha',
    language: 'hindi',
    region: 'mumbai',
    translations: [
      {
        text: 'okay',
        targetLanguage: 'english',
        context: 'casual',
        confidence: 0.9
      },
      {
        text: 'I see',
        targetLanguage: 'english',
        context: 'casual',
        confidence: 0.8
      },
      {
        text: 'understood',
        targetLanguage: 'english',
        context: 'formal',
        confidence: 0.7
      }
    ],
    context: 'casual',
    popularity: 100,
    usageExamples: [
      'Acha, I understand now',
      'Acha acha, tell me more'
    ]
  },
  {
    term: 'chalta hai',
    language: 'hindi',
    region: 'delhi',
    translations: [
      {
        text: 'it\'s okay',
        targetLanguage: 'english',
        context: 'casual',
        confidence: 0.9
      },
      {
        text: 'that works',
        targetLanguage: 'english',
        context: 'casual',
        confidence: 0.8
      },
      {
        text: 'acceptable',
        targetLanguage: 'english',
        context: 'formal',
        confidence: 0.7
      }
    ],
    context: 'casual',
    popularity: 85,
    usageExamples: [
      'This quality is chalta hai',
      'Chalta hai, we can manage'
    ]
  }
];

// Sample food items
export const sampleFoodItems: Omit<FoodItem, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Vada Pav',
    description: 'Mumbai\'s iconic street food - spiced potato fritter in a bun with chutneys',
    category: 'street food',
    region: 'mumbai',
    ingredients: ['potato', 'gram flour', 'bread', 'green chutney', 'tamarind chutney'],
    dietaryInfo: {
      isVegetarian: true,
      isVegan: false,
      isGlutenFree: false,
      allergens: ['gluten']
    },
    preparationTime: '15 minutes',
    spiceLevel: 'medium'
  },
  {
    name: 'Chole Bhature',
    description: 'Spicy chickpea curry served with deep-fried bread',
    category: 'north indian',
    region: 'delhi',
    ingredients: ['chickpeas', 'onions', 'tomatoes', 'flour', 'spices'],
    dietaryInfo: {
      isVegetarian: true,
      isVegan: false,
      isGlutenFree: false,
      allergens: ['gluten', 'dairy']
    },
    preparationTime: '45 minutes',
    spiceLevel: 'hot'
  },
  {
    name: 'Dosa',
    description: 'Crispy South Indian crepe made from fermented rice and lentil batter',
    category: 'south indian',
    region: 'bangalore',
    ingredients: ['rice', 'urad dal', 'fenugreek seeds', 'coconut chutney', 'sambar'],
    dietaryInfo: {
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
      allergens: []
    },
    preparationTime: '20 minutes',
    spiceLevel: 'mild'
  },
  {
    name: 'Pav Bhaji',
    description: 'Spiced vegetable mash served with buttered bread rolls',
    category: 'street food',
    region: 'mumbai',
    ingredients: ['mixed vegetables', 'pav bread', 'butter', 'onions', 'spices'],
    dietaryInfo: {
      isVegetarian: true,
      isVegan: false,
      isGlutenFree: false,
      allergens: ['gluten', 'dairy']
    },
    preparationTime: '30 minutes',
    spiceLevel: 'medium'
  },
  {
    name: 'Biryani',
    description: 'Fragrant rice dish with meat or vegetables and aromatic spices',
    category: 'main course',
    region: 'hyderabad',
    ingredients: ['basmati rice', 'chicken/mutton', 'yogurt', 'saffron', 'spices'],
    dietaryInfo: {
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: true,
      allergens: ['dairy']
    },
    preparationTime: '90 minutes',
    spiceLevel: 'hot'
  }
];

// Sample food vendors
export const sampleFoodVendors: Omit<FoodVendor, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Ashok Vada Pav',
    location: {
      latitude: 19.0176,
      longitude: 72.8562,
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India'
    },
    foodItems: [], // Will be populated with actual IDs during seeding
    safetyRating: {
      overall: 4.2,
      hygiene: 4.0,
      freshness: 4.5,
      popularity: 4.8,
      lastUpdated: new Date(),
      reviewCount: 156
    },
    priceRange: { min: 15, max: 25, currency: 'INR' },
    operatingHours: {
      monday: [{ open: '08:00', close: '22:00' }],
      tuesday: [{ open: '08:00', close: '22:00' }],
      wednesday: [{ open: '08:00', close: '22:00' }],
      thursday: [{ open: '08:00', close: '22:00' }],
      friday: [{ open: '08:00', close: '22:00' }],
      saturday: [{ open: '08:00', close: '23:00' }],
      sunday: [{ open: '08:00', close: '23:00' }]
    },
    hygieneNotes: ['Fresh oil used daily', 'Served hot', 'Clean preparation area']
  },
  {
    name: 'Sita Ram Diwan Chand',
    location: {
      latitude: 28.6562,
      longitude: 77.2410,
      city: 'Delhi',
      state: 'Delhi',
      country: 'India'
    },
    foodItems: [], // Will be populated with actual IDs during seeding
    safetyRating: {
      overall: 4.5,
      hygiene: 4.2,
      freshness: 4.8,
      popularity: 4.7,
      lastUpdated: new Date(),
      reviewCount: 203
    },
    priceRange: { min: 80, max: 150, currency: 'INR' },
    operatingHours: {
      monday: [{ open: '07:00', close: '15:00' }],
      tuesday: [{ open: '07:00', close: '15:00' }],
      wednesday: [{ open: '07:00', close: '15:00' }],
      thursday: [{ open: '07:00', close: '15:00' }],
      friday: [{ open: '07:00', close: '15:00' }],
      saturday: [{ open: '07:00', close: '15:00' }],
      sunday: []
    },
    hygieneNotes: ['Made fresh daily', 'Traditional recipes', 'Clean kitchen']
  },
  {
    name: 'CTR (Central Tiffin Room)',
    location: {
      latitude: 12.9716,
      longitude: 77.5946,
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India'
    },
    foodItems: [], // Will be populated with actual IDs during seeding
    safetyRating: {
      overall: 4.3,
      hygiene: 4.1,
      freshness: 4.6,
      popularity: 4.4,
      lastUpdated: new Date(),
      reviewCount: 89
    },
    priceRange: { min: 40, max: 80, currency: 'INR' },
    operatingHours: {
      monday: [{ open: '06:30', close: '11:00' }, { open: '15:30', close: '20:30' }],
      tuesday: [{ open: '06:30', close: '11:00' }, { open: '15:30', close: '20:30' }],
      wednesday: [{ open: '06:30', close: '11:00' }, { open: '15:30', close: '20:30' }],
      thursday: [{ open: '06:30', close: '11:00' }, { open: '15:30', close: '20:30' }],
      friday: [{ open: '06:30', close: '11:00' }, { open: '15:30', close: '20:30' }],
      saturday: [{ open: '06:30', close: '11:00' }, { open: '15:30', close: '20:30' }],
      sunday: [{ open: '06:30', close: '11:00' }, { open: '15:30', close: '20:30' }]
    },
    hygieneNotes: ['Traditional South Indian preparation', 'Fresh coconut chutney', 'Authentic taste']
  }
];

export async function seedDatabase(): Promise<{
  slangTerms: { added: number; skipped: number; total: number };
  foodItems: { added: number; total: number };
  foodVendors: { added: number; total: number };
}> {
  const { SlangRepository } = await import('./repositories/slang-repository');
  const { FoodRepository } = await import('./repositories/food-repository');
  const { getDatabase } = await import('./index');
  const { logger } = await import('../services/logging');
  
  try {
    const dbService = getDatabase();
    const slangRepository = new SlangRepository(dbService);
    const foodRepository = new FoodRepository(dbService);
    
    logger.info('Starting database seeding...');
    
    let slangAddedCount = 0;
    let slangSkippedCount = 0;
    let foodItemsAddedCount = 0;
    let foodVendorsAddedCount = 0;
    
    // Seed slang terms
    for (const termData of sampleSlangTerms) {
      try {
        // Check if term already exists
        const existing = await slangRepository.findByTerm(termData.term, termData.language);
        const duplicate = existing.find(t => t.region === termData.region);
        
        if (duplicate) {
          logger.debug('Skipping existing slang term', { term: termData.term, region: termData.region });
          slangSkippedCount++;
          continue;
        }
        
        // Add the term
        const fullTerm = {
          id: '', // Will be generated
          ...termData,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        await slangRepository.create(fullTerm);
        slangAddedCount++;
        
        logger.debug('Added slang term', { term: termData.term, region: termData.region });
        
      } catch (error) {
        logger.warn('Failed to add slang term during seeding', { 
          term: termData.term, 
          error: error instanceof Error ? error.message : String(error) 
        });
        slangSkippedCount++;
      }
    }
    
    // Seed food items
    const foodItemIds: string[] = [];
    for (const foodData of sampleFoodItems) {
      try {
        // Check if food item already exists
        const existing = await foodRepository.searchFoodItems(foodData.name, { region: foodData.region });
        if (existing.length > 0) {
          logger.debug('Skipping existing food item', { name: foodData.name, region: foodData.region });
          const existingItem = existing[0];
          if (existingItem) {
            foodItemIds.push(existingItem.id); // Use existing ID
          }
          continue;
        }
        
        const foodItem = await foodRepository.createFoodItem(foodData);
        foodItemIds.push(foodItem.id);
        foodItemsAddedCount++;
        
        logger.debug('Added food item', { name: foodData.name, region: foodData.region });
        
      } catch (error) {
        logger.warn('Failed to add food item during seeding', { 
          name: foodData.name, 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }
    
    // Seed food vendors with food item associations
    for (let i = 0; i < sampleFoodVendors.length; i++) {
      const vendorData = sampleFoodVendors[i];
      if (!vendorData) continue;
      
      try {
        // Assign food items to vendors based on their specialties
        let assignedFoodItems: string[] = [];
        
        if (vendorData.name.includes('Vada Pav')) {
          // Assign Vada Pav and Pav Bhaji
          const vadaPavId = foodItemIds[0]; // Vada Pav
          const pavBhajiId = foodItemIds[3]; // Pav Bhaji
          assignedFoodItems = [vadaPavId, pavBhajiId].filter((id): id is string => Boolean(id));
        } else if (vendorData.name.includes('Diwan Chand')) {
          // Assign Chole Bhature
          const choleBhatureId = foodItemIds[1]; // Chole Bhature
          assignedFoodItems = [choleBhatureId].filter((id): id is string => Boolean(id));
        } else if (vendorData.name.includes('CTR')) {
          // Assign Dosa
          const dosaId = foodItemIds[2]; // Dosa
          assignedFoodItems = [dosaId].filter((id): id is string => Boolean(id));
        }
        
        const vendorWithFoodItems: Omit<FoodVendor, 'id' | 'createdAt' | 'updatedAt'> = {
          ...vendorData,
          foodItems: assignedFoodItems
        };
        
        await foodRepository.createFoodVendor(vendorWithFoodItems);
        foodVendorsAddedCount++;
        
        logger.debug('Added food vendor', { name: vendorData.name, city: vendorData.location.city });
        
      } catch (error) {
        logger.warn('Failed to add food vendor during seeding', { 
          name: vendorData.name, 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }
    
    logger.info('Database seeding completed', { 
      slangTerms: { added: slangAddedCount, skipped: slangSkippedCount },
      foodItems: { added: foodItemsAddedCount },
      foodVendors: { added: foodVendorsAddedCount },
      total: sampleSlangTerms.length + sampleFoodItems.length + sampleFoodVendors.length
    });
    
    return { 
      slangTerms: { added: slangAddedCount, skipped: slangSkippedCount, total: sampleSlangTerms.length },
      foodItems: { added: foodItemsAddedCount, total: sampleFoodItems.length },
      foodVendors: { added: foodVendorsAddedCount, total: sampleFoodVendors.length }
    };
    
  } catch (error) {
    logger.error('Database seeding failed', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}