// Cultural Service Implementation

import { CulturalService } from './interfaces';
import { 
  RegionalInfo, 
  Festival, 
  EtiquetteRule, 
  BargainingTip, 
  Location, 
  SearchResult 
} from '../types';
import { logger } from './logging';

export class CulturalServiceImpl implements CulturalService {
  private culturalData: Map<string, RegionalInfo> = new Map();
  private festivals: Map<string, Festival> = new Map();
  private etiquetteRules: Map<string, EtiquetteRule[]> = new Map();
  private bargainingTips: Map<string, BargainingTip[]> = new Map();

  constructor() {
    this.initializeCulturalData();
  }

  async getRegionalInfo(region: string): Promise<RegionalInfo> {
    logger.debug('Getting regional info', { region });

    try {
      const normalizedRegion = region.toLowerCase().trim();
      const info = this.culturalData.get(normalizedRegion);
      
      if (!info) {
        // Return basic info for unknown regions
        return {
          region: region,
          languages: ['Hindi', 'English'],
          customs: [],
          festivals: [],
          etiquette: [],
          transportation: {
            publicTransport: ['Bus', 'Auto-rickshaw'],
            tips: ['Negotiate fare beforehand', 'Keep small change ready'],
            costs: [{ min: 10, max: 100, currency: 'INR' }]
          }
        };
      }
      
      logger.info('Regional info retrieved', { region, customsCount: info.customs.length });
      return info;
      
    } catch (error) {
      logger.error('Error getting regional info', error instanceof Error ? error : new Error(String(error)), { region });
      throw new Error(`Failed to get regional info: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getFestivalInfo(festival: string): Promise<Festival> {
    logger.debug('Getting festival info', { festival });

    try {
      const normalizedFestival = festival.toLowerCase().trim();
      const info = this.festivals.get(normalizedFestival);
      
      if (!info) {
        throw new Error(`Festival '${festival}' not found`);
      }
      
      logger.info('Festival info retrieved', { festival, regions: info.regions.length });
      return info;
      
    } catch (error) {
      logger.error('Error getting festival info', error instanceof Error ? error : new Error(String(error)), { festival });
      throw error;
    }
  }

  async getEtiquetteGuide(context: string): Promise<EtiquetteRule[]> {
    logger.debug('Getting etiquette guide', { context });

    try {
      const normalizedContext = context.toLowerCase().trim();
      const rules = this.etiquetteRules.get(normalizedContext) || [];
      
      logger.info('Etiquette guide retrieved', { context, rulesCount: rules.length });
      return rules;
      
    } catch (error) {
      logger.error('Error getting etiquette guide', error instanceof Error ? error : new Error(String(error)), { context });
      throw new Error(`Failed to get etiquette guide: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getBargainingTips(location: Location): Promise<BargainingTip[]> {
    logger.debug('Getting bargaining tips', { location: location.city });

    try {
      const city = location.city.toLowerCase().trim();
      const state = location.state.toLowerCase().trim();
      
      // Try to get city-specific tips first, then state-specific, then general
      const tips = this.bargainingTips.get(city) || 
                   this.bargainingTips.get(state) || 
                   this.bargainingTips.get('general') || [];
      
      logger.info('Bargaining tips retrieved', { location: location.city, tipsCount: tips.length });
      return tips;
      
    } catch (error) {
      logger.error('Error getting bargaining tips', error instanceof Error ? error : new Error(String(error)), { location });
      throw new Error(`Failed to get bargaining tips: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async searchCulturalContent(query: string, region?: string): Promise<SearchResult[]> {
    logger.debug('Searching cultural content', { query, region });

    try {
      const results: SearchResult[] = [];
      const normalizedQuery = query.toLowerCase().trim();
      
      // Search in regional info
      for (const [regionName, info] of this.culturalData.entries()) {
        if (region && regionName !== region.toLowerCase()) continue;
        
        if (regionName.includes(normalizedQuery) || 
            info.region.toLowerCase().includes(normalizedQuery)) {
          results.push({
            id: `region-${regionName}`,
            type: 'cultural',
            title: `${info.region} Regional Information`,
            description: `Cultural information about ${info.region}`,
            relevanceScore: this.calculateRelevance(normalizedQuery, regionName),
            metadata: { type: 'region', region: info.region }
          });
        }
        
        // Search in customs
        info.customs.forEach((custom, index) => {
          if (custom.name.toLowerCase().includes(normalizedQuery) ||
              custom.description.toLowerCase().includes(normalizedQuery)) {
            results.push({
              id: `custom-${regionName}-${index}`,
              type: 'cultural',
              title: custom.name,
              description: custom.description,
              relevanceScore: this.calculateRelevance(normalizedQuery, custom.name),
              metadata: { type: 'custom', region: info.region, custom }
            });
          }
        });
      }
      
      // Search in festivals
      for (const [festivalName, festival] of this.festivals.entries()) {
        if (festivalName.includes(normalizedQuery) ||
            festival.name.toLowerCase().includes(normalizedQuery) ||
            festival.significance.toLowerCase().includes(normalizedQuery)) {
          results.push({
            id: `festival-${festivalName}`,
            type: 'cultural',
            title: festival.name,
            description: festival.significance,
            relevanceScore: this.calculateRelevance(normalizedQuery, festivalName),
            metadata: { type: 'festival', festival }
          });
        }
      }
      
      // Sort by relevance score
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      logger.info('Cultural content search completed', { query, resultsCount: results.length });
      return results.slice(0, 20); // Return top 20 results
      
    } catch (error) {
      logger.error('Error searching cultural content', error instanceof Error ? error : new Error(String(error)), { query, region });
      throw new Error(`Search failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async addCulturalContent(content: any): Promise<void> {
    logger.debug('Adding cultural content', { type: content.type });

    try {
      // This would typically save to a database
      // For now, we'll just log the addition
      logger.info('Cultural content added successfully', { type: content.type, title: content.title });
      
    } catch (error) {
      logger.error('Error adding cultural content', error instanceof Error ? error : new Error(String(error)), { content });
      throw error;
    }
  }

  // Private helper methods

  private calculateRelevance(query: string, text: string): number {
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    
    let score = 0;
    
    // Exact match gets highest score
    if (textLower === queryLower) {
      score += 100;
    }
    // Starts with query gets high score
    else if (textLower.startsWith(queryLower)) {
      score += 80;
    }
    // Contains query gets medium score
    else if (textLower.includes(queryLower)) {
      score += 60;
    }
    // Word boundary matches get bonus
    const words = textLower.split(/\s+/);
    if (words.some(word => word === queryLower)) {
      score += 40;
    }
    
    return score;
  }

  private initializeCulturalData(): void {
    // Initialize with sample cultural data
    
    // Delhi/NCR
    this.culturalData.set('delhi', {
      region: 'Delhi',
      languages: ['Hindi', 'English', 'Punjabi', 'Urdu'],
      customs: [
        {
          name: 'Namaste Greeting',
          description: 'Traditional greeting with palms pressed together',
          significance: 'Shows respect and acknowledges the divine in others',
          dosDonts: [
            'Do: Press palms together at chest level',
            'Do: Bow head slightly',
            'Don\'t: Use only one hand',
            'Don\'t: Forget to smile'
          ]
        },
        {
          name: 'Removing Shoes',
          description: 'Remove shoes before entering homes and religious places',
          significance: 'Maintains cleanliness and shows respect',
          dosDonts: [
            'Do: Remove shoes at the entrance',
            'Do: Place shoes neatly',
            'Don\'t: Wear shoes inside homes',
            'Don\'t: Step on the threshold with shoes'
          ]
        }
      ],
      festivals: [
        {
          name: 'Diwali',
          date: 'October/November (varies)',
          significance: 'Festival of lights celebrating victory of light over darkness',
          celebrations: ['Light diyas and candles', 'Fireworks', 'Sweet distribution', 'Family gatherings'],
          regions: ['Delhi', 'All India'],
          dosDonts: [
            'Do: Wish people Happy Diwali',
            'Do: Accept sweets graciously',
            'Don\'t: Refuse offered sweets',
            'Don\'t: Be too loud during celebrations'
          ]
        }
      ],
      etiquette: [
        {
          context: 'dining',
          rules: [
            'Wash hands before and after eating',
            'Use right hand for eating',
            'Don\'t waste food',
            'Wait for elders to start eating'
          ],
          importance: 'high'
        }
      ],
      transportation: {
        publicTransport: ['Delhi Metro', 'DTC Bus', 'Auto-rickshaw', 'Uber/Ola'],
        tips: [
          'Metro is fastest for long distances',
          'Keep metro card/token ready',
          'Negotiate auto fare or use meter',
          'Avoid rush hours (8-10 AM, 6-8 PM)'
        ],
        costs: [
          { min: 10, max: 60, currency: 'INR' }, // Metro
          { min: 5, max: 25, currency: 'INR' },  // Bus
          { min: 30, max: 200, currency: 'INR' } // Auto
        ]
      }
    });

    // Mumbai
    this.culturalData.set('mumbai', {
      region: 'Mumbai',
      languages: ['Hindi', 'Marathi', 'English', 'Gujarati'],
      customs: [
        {
          name: 'Local Train Etiquette',
          description: 'Specific behavior expected in Mumbai local trains',
          significance: 'Ensures smooth travel for millions of commuters',
          dosDonts: [
            'Do: Let people exit first',
            'Do: Offer seats to elderly and women',
            'Don\'t: Block the doors',
            'Don\'t: Put feet on seats'
          ]
        }
      ],
      festivals: [
        {
          name: 'Ganesh Chaturthi',
          date: 'August/September (varies)',
          significance: 'Celebration of Lord Ganesha, remover of obstacles',
          celebrations: ['Ganesh idol installation', 'Community celebrations', 'Processions', 'Modak preparation'],
          regions: ['Mumbai', 'Maharashtra'],
          dosDonts: [
            'Do: Participate respectfully in processions',
            'Do: Try modak (traditional sweet)',
            'Don\'t: Disturb religious ceremonies',
            'Don\'t: Litter during processions'
          ]
        }
      ],
      etiquette: [
        {
          context: 'local trains',
          rules: [
            'Stand on the left side of escalators',
            'Let passengers exit before boarding',
            'Keep backpack in front during rush hour',
            'Offer seats to those who need them more'
          ],
          importance: 'high'
        }
      ],
      transportation: {
        publicTransport: ['Local Trains', 'BEST Bus', 'Auto-rickshaw', 'Taxi', 'Metro'],
        tips: [
          'Local trains are lifeline of Mumbai',
          'Buy monthly pass for regular travel',
          'Avoid peak hours if possible',
          'Keep exact change for buses'
        ],
        costs: [
          { min: 5, max: 25, currency: 'INR' },  // Local train
          { min: 8, max: 50, currency: 'INR' },  // Bus
          { min: 25, max: 150, currency: 'INR' } // Auto/Taxi
        ]
      }
    });

    // Initialize festivals
    this.festivals.set('diwali', {
      name: 'Diwali',
      date: 'October/November (varies by lunar calendar)',
      significance: 'Festival of lights celebrating the victory of light over darkness and good over evil',
      celebrations: [
        'Lighting oil lamps (diyas) and candles',
        'Decorating homes with rangoli',
        'Exchanging sweets and gifts',
        'Fireworks and crackers',
        'Lakshmi Puja (worship of goddess of wealth)'
      ],
      regions: ['All India', 'Nepal', 'Sri Lanka', 'Malaysia', 'Singapore'],
      dosDonts: [
        'Do: Wish everyone Happy Diwali',
        'Do: Accept sweets and gifts graciously',
        'Do: Dress in new or good clothes',
        'Do: Light lamps in the evening',
        'Don\'t: Refuse offered sweets',
        'Don\'t: Burst crackers near hospitals or schools',
        'Don\'t: Waste food during celebrations'
      ]
    });

    this.festivals.set('holi', {
      name: 'Holi',
      date: 'March (varies by lunar calendar)',
      significance: 'Festival of colors celebrating spring, love, and the triumph of good over evil',
      celebrations: [
        'Playing with colored powders (gulal)',
        'Water balloons and water guns',
        'Traditional sweets like gujiya',
        'Folk songs and dances',
        'Holika Dahan (bonfire) on the eve'
      ],
      regions: ['North India', 'Central India', 'Nepal'],
      dosDonts: [
        'Do: Wear old clothes that can get dirty',
        'Do: Apply oil to hair and skin for protection',
        'Do: Play with natural colors if possible',
        'Do: Respect those who don\'t want to play',
        'Don\'t: Force colors on unwilling people',
        'Don\'t: Use harmful chemical colors',
        'Don\'t: Waste water excessively'
      ]
    });

    // Initialize etiquette rules
    this.etiquetteRules.set('dining', [
      {
        context: 'Traditional Indian Dining',
        rules: [
          'Wash hands before and after eating',
          'Use right hand for eating (left is considered unclean)',
          'Don\'t waste food - take only what you can finish',
          'Wait for elders or hosts to start eating',
          'Don\'t touch serving spoons with your plate',
          'Compliment the food to show appreciation'
        ],
        importance: 'high'
      },
      {
        context: 'Restaurant Dining',
        rules: [
          'Wait to be seated in upscale restaurants',
          'Tipping 10% is customary but not mandatory',
          'Don\'t call waiters by snapping fingers',
          'Share food - Indian dining is often communal'
        ],
        importance: 'medium'
      }
    ]);

    this.etiquetteRules.set('religious', [
      {
        context: 'Temple Visits',
        rules: [
          'Remove shoes before entering',
          'Cover your head if required',
          'Don\'t point feet towards deities',
          'Maintain silence or speak softly',
          'Don\'t take photos without permission',
          'Dress modestly - cover shoulders and legs'
        ],
        importance: 'high'
      }
    ]);

    // Initialize bargaining tips
    this.bargainingTips.set('delhi', [
      {
        context: 'Street Markets (Chandni Chowk, Karol Bagh)',
        tips: [
          'Start at 30-40% of quoted price',
          'Walk away if price doesn\'t come down',
          'Buy multiple items for better deals',
          'Compare prices at 2-3 shops',
          'Be polite but firm'
        ],
        expectedDiscount: '40-60% off initial price',
        culturalNotes: [
          'Bargaining is expected and part of the culture',
          'Shopkeepers often quote 2-3x the actual price',
          'Best deals in the evening when shops want to close sales'
        ]
      }
    ]);

    this.bargainingTips.set('mumbai', [
      {
        context: 'Street Markets (Colaba Causeway, Linking Road)',
        tips: [
          'Start at 50% of quoted price',
          'Bundle purchases for better rates',
          'Check quality before bargaining',
          'Use local language phrases for better prices',
          'Shop during weekdays for less crowd and better deals'
        ],
        expectedDiscount: '30-50% off initial price',
        culturalNotes: [
          'Mumbai shopkeepers are generally more fixed on prices',
          'Tourist areas have higher initial quotes',
          'Local markets offer better bargaining opportunities'
        ]
      }
    ]);

    this.bargainingTips.set('general', [
      {
        context: 'Auto-rickshaw',
        tips: [
          'Insist on using the meter',
          'Know approximate fare beforehand',
          'Negotiate before getting in',
          'Keep exact change ready',
          'Use ride-hailing apps for transparent pricing'
        ],
        expectedDiscount: '10-20% off quoted price',
        culturalNotes: [
          'Meters are mandatory but often "not working"',
          'Night charges are 25% extra after 10 PM',
          'Refuse if driver demands too much extra'
        ]
      }
    ]);

    logger.info('Cultural data initialized', { 
      regions: this.culturalData.size,
      festivals: this.festivals.size,
      etiquetteContexts: this.etiquetteRules.size,
      bargainingContexts: this.bargainingTips.size
    });
  }
}