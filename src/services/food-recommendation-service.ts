// Food Recommendation Service Implementation

import { FoodRecommendationService } from './interfaces';
import { 
  Location, 
  FoodPreferences, 
  FoodRecommendation, 
  FoodHub, 
  SafetyRating 
} from '../types';
import { FoodRepository } from '../database/repositories/food-repository';
import { logger } from './logging';

export class FoodRecommendationServiceImpl implements FoodRecommendationService {
  constructor(private foodRepository: FoodRepository) {}

  async getRecommendations(location: Location, preferences: FoodPreferences): Promise<FoodRecommendation[]> {
    logger.debug('Getting food recommendations', { location, preferences });

    try {
      // Use the repository's getFoodRecommendations method with filters
      const filters = {
        isVegetarian: preferences.dietaryRestrictions?.includes('vegetarian'),
        isVegan: preferences.dietaryRestrictions?.includes('vegan'),
        spiceLevel: preferences.spiceLevel,
        maxPrice: preferences.priceRange?.max,
        minRating: 3, // Default minimum rating
      };

      const recommendations = await this.foodRepository.getFoodRecommendations(
        location, 
        preferences.radius || 5, 
        filters
      );
      
      logger.info('Food recommendations generated', { 
        location: location.city, 
        count: recommendations.length,
        preferences: preferences.dietaryRestrictions 
      });
      
      return recommendations;
      
    } catch (error) {
      logger.error('Error getting food recommendations', error instanceof Error ? error : new Error(String(error)), { 
        location, 
        preferences 
      });
      throw new Error(`Failed to get recommendations: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getFoodByCategory(category: string, location: Location): Promise<FoodRecommendation[]> {
    logger.debug('Getting food by category', { category, location });

    try {
      const foodItems = await this.foodRepository.searchFoodItems('', { category });
      
      // Convert food items to recommendations with location-based sorting
      const recommendations: FoodRecommendation[] = [];
      
      for (const item of foodItems) {
        // Find vendors for this food item
        const vendors = await this.foodRepository.findVendorsByLocation(location, 10); // 10km radius
        
        for (const vendor of vendors) {
          if (vendor.foodItems.includes(item.id)) {
            const recommendation: FoodRecommendation = {
              name: item.name,
              description: item.description,
              location: vendor.location,
              safetyRating: vendor.safetyRating,
              priceRange: vendor.priceRange,
              dietaryInfo: item.dietaryInfo,
              bestTime: this.getBestTime(vendor.operatingHours),
              hygieneNotes: vendor.hygieneNotes,
              distance: this.calculateDistance(location, vendor.location)
            };
            recommendations.push(recommendation);
          }
        }
      }
      
      // Sort by safety rating and distance
      recommendations.sort((a, b) => {
        const safetyDiff = b.safetyRating.overall - a.safetyRating.overall;
        if (safetyDiff !== 0) return safetyDiff;
        return (a.distance || 0) - (b.distance || 0);
      });
      
      return recommendations.slice(0, 15);
      
    } catch (error) {
      logger.error('Error getting food by category', error instanceof Error ? error : new Error(String(error)), { 
        category, 
        location 
      });
      throw new Error(`Failed to get food by category: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getPopularHubs(city: string): Promise<FoodHub[]> {
    logger.debug('Getting popular food hubs', { city });

    try {
      // Get vendors in the city
      const cityLocation: Location = {
        latitude: 0, // Will be determined by city
        longitude: 0,
        city: city,
        state: '',
        country: 'India'
      };
      
      const vendors = await this.foodRepository.findVendorsByLocation(cityLocation, 50); // Large radius for city-wide search
      
      // Group vendors by area/location and create food hubs
      const hubsMap = new Map<string, FoodHub>();
      
      for (const vendor of vendors) {
        const areaKey = `${vendor.location.city}-${Math.floor(vendor.location.latitude * 100)}-${Math.floor(vendor.location.longitude * 100)}`;
        
        if (!hubsMap.has(areaKey)) {
          hubsMap.set(areaKey, {
            name: `${vendor.location.city} Food Hub`,
            location: vendor.location,
            description: `Popular food area in ${vendor.location.city}`,
            popularItems: [],
            bestTimeToVisit: this.getBestTime(vendor.operatingHours),
            safetyTips: [`Accessible by local transport in ${vendor.location.city}`]
          });
        }
        
        const hub = hubsMap.get(areaKey);
        if (!hub) continue;
        
        // Add vendor's food items to popular items
        for (const foodItemId of vendor.foodItems) {
          try {
            const foodItem = await this.foodRepository.findFoodItemById(foodItemId);
            if (foodItem && !hub.popularItems.includes(foodItem.name)) {
              hub.popularItems.push(foodItem.name);
            }
          } catch (error) {
            // Skip if food item not found
            continue;
          }
        }
      }
      
      const hubs = Array.from(hubsMap.values());
      
      // Sort by number of popular items (more is better)
      hubs.sort((a, b) => b.popularItems.length - a.popularItems.length);
      
      logger.info('Popular food hubs retrieved', { city, count: hubs.length });
      
      return hubs;
      
    } catch (error) {
      logger.error('Error getting popular hubs', error instanceof Error ? error : new Error(String(error)), { city });
      throw new Error(`Failed to get popular hubs: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async rateSafety(vendorId: string): Promise<SafetyRating> {
    logger.debug('Getting safety rating', { vendorId });

    try {
      const vendor = await this.foodRepository.findVendorById(vendorId);
      
      if (!vendor) {
        throw new Error(`Vendor with id ${vendorId} not found`);
      }
      
      return vendor.safetyRating;
      
    } catch (error) {
      logger.error('Error getting safety rating', error instanceof Error ? error : new Error(String(error)), { vendorId });
      throw error;
    }
  }

  async searchFood(query: string, location: Location): Promise<FoodRecommendation[]> {
    logger.debug('Searching food', { query, location });

    try {
      const foodItems = await this.foodRepository.searchFoodItems(query);
      
      // Convert food items to recommendations
      const recommendations: FoodRecommendation[] = [];
      
      for (const item of foodItems) {
        // Find vendors for this food item near the location
        const vendors = await this.foodRepository.findVendorsByLocation(location, 10); // 10km radius
        
        for (const vendor of vendors) {
          if (vendor.foodItems.includes(item.id)) {
            const recommendation: FoodRecommendation = {
              name: item.name,
              description: item.description,
              location: vendor.location,
              safetyRating: vendor.safetyRating,
              priceRange: vendor.priceRange,
              dietaryInfo: item.dietaryInfo,
              bestTime: this.getBestTime(vendor.operatingHours),
              hygieneNotes: vendor.hygieneNotes,
              distance: this.calculateDistance(location, vendor.location)
            };
            recommendations.push(recommendation);
          }
        }
      }
      
      // Sort by relevance (name match, then description match, then safety)
      recommendations.sort((a, b) => {
        const aNameMatch = a.name.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
        const bNameMatch = b.name.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
        
        if (aNameMatch !== bNameMatch) {
          return bNameMatch - aNameMatch; // Name matches first
        }
        
        return b.safetyRating.overall - a.safetyRating.overall; // Then by safety
      });
      
      return recommendations.slice(0, 15);
      
    } catch (error) {
      logger.error('Error searching food', error instanceof Error ? error : new Error(String(error)), { query, location });
      throw new Error(`Search failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async addFoodVendor(vendor: any): Promise<void> {
    logger.debug('Adding food vendor', { name: vendor.name, location: vendor.location?.city });

    try {
      await this.foodRepository.createFoodVendor(vendor);
      logger.info('Food vendor added successfully', { name: vendor.name });
      
    } catch (error) {
      logger.error('Error adding food vendor', error instanceof Error ? error : new Error(String(error)), { vendor });
      throw error;
    }
  }

  async updateSafetyRating(vendorId: string, rating: SafetyRating): Promise<void> {
    logger.debug('Updating safety rating', { vendorId, rating: rating.overall });

    try {
      await this.foodRepository.updateSafetyRating(vendorId, rating);
      logger.info('Safety rating updated successfully', { vendorId, rating: rating.overall });
      
    } catch (error) {
      logger.error('Error updating safety rating', error instanceof Error ? error : new Error(String(error)), { 
        vendorId, 
        rating 
      });
      throw error;
    }
  }

  // Private helper methods

  private calculateDistance(from: Location, to: Location): number {
    // Haversine formula for calculating distance between two points
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(to.latitude - from.latitude);
    const dLon = this.toRadians(to.longitude - from.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(from.latitude)) * Math.cos(this.toRadians(to.latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private getBestTime(operatingHours: any): string {
    // Simple logic to determine best time to visit
    const now = new Date();
    const currentDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()] as keyof typeof operatingHours;
    const todayHours = operatingHours[currentDay];
    
    if (!todayHours || todayHours.length === 0) {
      return 'Check operating hours';
    }
    
    // Return the first time slot for today
    const firstSlot = todayHours[0];
    return `${firstSlot.open} - ${firstSlot.close}`;
  }
}