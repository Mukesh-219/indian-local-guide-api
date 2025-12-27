// Basic test to verify setup is working
import { Location } from './types';
import { testUtils } from './test-setup';

describe('Project Setup', () => {
  test('should have working test environment', () => {
    expect(true).toBe(true);
  });

  test('should import types correctly', () => {
    // Test that we can create a location object matching the interface
    const location: Location = {
      latitude: 28.6139,
      longitude: 77.2090,
      city: 'Delhi',
      state: 'Delhi',
      country: 'India',
    };
    expect(location).toBeDefined();
    expect(location.city).toBe('Delhi');
  });

  test('should have test utilities available', () => {
    expect(testUtils).toBeDefined();
    expect(testUtils.createMockLocation).toBeDefined();
    
    const mockLocation = testUtils.createMockLocation();
    expect(mockLocation).toBeValidLocation();
  });
});