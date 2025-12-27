// Repository exports and factory functions

import { DatabaseService } from '../../services/interfaces';
import { SlangRepository } from './slang-repository';
import { FoodRepository } from './food-repository';
import { UserRepository } from './user-repository';

export { SlangRepository } from './slang-repository';
export { FoodRepository } from './food-repository';
export { UserRepository } from './user-repository';

// Repository factory class for dependency injection
export class RepositoryFactory {
  constructor(private db: DatabaseService) {}

  createSlangRepository(): SlangRepository {
    return new SlangRepository(this.db);
  }

  createFoodRepository(): FoodRepository {
    return new FoodRepository(this.db);
  }

  createUserRepository(): UserRepository {
    return new UserRepository(this.db);
  }

  // Create all repositories at once
  createAll() {
    return {
      slang: this.createSlangRepository(),
      food: this.createFoodRepository(),
      user: this.createUserRepository(),
    };
  }
}