-- Database schema for Indian Local Guide
-- SQLite implementation with proper indexing and constraints

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Slang terms table
CREATE TABLE IF NOT EXISTS slang_terms (
    id TEXT PRIMARY KEY,
    term TEXT NOT NULL,
    language TEXT NOT NULL CHECK (language IN ('hindi', 'english', 'regional')),
    region TEXT NOT NULL,
    context TEXT NOT NULL CHECK (context IN ('formal', 'casual', 'slang')),
    popularity INTEGER NOT NULL DEFAULT 0 CHECK (popularity >= 0 AND popularity <= 100),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Slang translations table
CREATE TABLE IF NOT EXISTS slang_translations (
    id TEXT PRIMARY KEY,
    slang_term_id TEXT NOT NULL,
    text TEXT NOT NULL,
    target_language TEXT NOT NULL,
    context TEXT NOT NULL,
    confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (slang_term_id) REFERENCES slang_terms(id) ON DELETE CASCADE
);

-- Usage examples table
CREATE TABLE IF NOT EXISTS usage_examples (
    id TEXT PRIMARY KEY,
    slang_term_id TEXT NOT NULL,
    example TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (slang_term_id) REFERENCES slang_terms(id) ON DELETE CASCADE
);

-- Food items table
CREATE TABLE IF NOT EXISTS food_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    region TEXT NOT NULL,
    preparation_time TEXT,
    spice_level TEXT NOT NULL CHECK (spice_level IN ('mild', 'medium', 'hot', 'very-hot')),
    is_vegetarian BOOLEAN NOT NULL DEFAULT 0,
    is_vegan BOOLEAN NOT NULL DEFAULT 0,
    is_gluten_free BOOLEAN NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Food ingredients table
CREATE TABLE IF NOT EXISTS food_ingredients (
    id TEXT PRIMARY KEY,
    food_item_id TEXT NOT NULL,
    ingredient TEXT NOT NULL,
    FOREIGN KEY (food_item_id) REFERENCES food_items(id) ON DELETE CASCADE
);

-- Food allergens table
CREATE TABLE IF NOT EXISTS food_allergens (
    id TEXT PRIMARY KEY,
    food_item_id TEXT NOT NULL,
    allergen TEXT NOT NULL,
    FOREIGN KEY (food_item_id) REFERENCES food_items(id) ON DELETE CASCADE
);

-- Food vendors table
CREATE TABLE IF NOT EXISTS food_vendors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    latitude REAL NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
    longitude REAL NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'India',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Vendor food items junction table
CREATE TABLE IF NOT EXISTS vendor_food_items (
    vendor_id TEXT NOT NULL,
    food_item_id TEXT NOT NULL,
    price_min INTEGER NOT NULL CHECK (price_min >= 0),
    price_max INTEGER NOT NULL CHECK (price_max >= price_min),
    currency TEXT NOT NULL DEFAULT 'INR',
    PRIMARY KEY (vendor_id, food_item_id),
    FOREIGN KEY (vendor_id) REFERENCES food_vendors(id) ON DELETE CASCADE,
    FOREIGN KEY (food_item_id) REFERENCES food_items(id) ON DELETE CASCADE
);

-- Safety ratings table
CREATE TABLE IF NOT EXISTS safety_ratings (
    id TEXT PRIMARY KEY,
    vendor_id TEXT NOT NULL,
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    hygiene_rating INTEGER NOT NULL CHECK (hygiene_rating >= 1 AND hygiene_rating <= 5),
    freshness_rating INTEGER NOT NULL CHECK (freshness_rating >= 1 AND freshness_rating <= 5),
    popularity_rating INTEGER NOT NULL CHECK (popularity_rating >= 1 AND popularity_rating <= 5),
    review_count INTEGER NOT NULL DEFAULT 0 CHECK (review_count >= 0),
    last_updated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES food_vendors(id) ON DELETE CASCADE
);

-- Hygiene notes table
CREATE TABLE IF NOT EXISTS hygiene_notes (
    id TEXT PRIMARY KEY,
    vendor_id TEXT NOT NULL,
    note TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES food_vendors(id) ON DELETE CASCADE
);

-- Operating hours table
CREATE TABLE IF NOT EXISTS operating_hours (
    id TEXT PRIMARY KEY,
    vendor_id TEXT NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
    open_time TEXT NOT NULL, -- HH:MM format
    close_time TEXT NOT NULL, -- HH:MM format
    FOREIGN KEY (vendor_id) REFERENCES food_vendors(id) ON DELETE CASCADE
);

-- Regional information table
CREATE TABLE IF NOT EXISTS regional_info (
    id TEXT PRIMARY KEY,
    region TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Regional languages table
CREATE TABLE IF NOT EXISTS regional_languages (
    id TEXT PRIMARY KEY,
    region_id TEXT NOT NULL,
    language TEXT NOT NULL,
    FOREIGN KEY (region_id) REFERENCES regional_info(id) ON DELETE CASCADE
);

-- Festivals table
CREATE TABLE IF NOT EXISTS festivals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    date_pattern TEXT NOT NULL, -- e.g., "2024-10-31" or "lunar:kartik-amavasya"
    significance TEXT NOT NULL,
    description TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Festival regions table
CREATE TABLE IF NOT EXISTS festival_regions (
    festival_id TEXT NOT NULL,
    region TEXT NOT NULL,
    PRIMARY KEY (festival_id, region),
    FOREIGN KEY (festival_id) REFERENCES festivals(id) ON DELETE CASCADE
);

-- Festival celebrations table
CREATE TABLE IF NOT EXISTS festival_celebrations (
    id TEXT PRIMARY KEY,
    festival_id TEXT NOT NULL,
    celebration TEXT NOT NULL,
    FOREIGN KEY (festival_id) REFERENCES festivals(id) ON DELETE CASCADE
);

-- Festival dos and don'ts table
CREATE TABLE IF NOT EXISTS festival_dos_donts (
    id TEXT PRIMARY KEY,
    festival_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('do', 'dont')),
    instruction TEXT NOT NULL,
    FOREIGN KEY (festival_id) REFERENCES festivals(id) ON DELETE CASCADE
);

-- Customs table
CREATE TABLE IF NOT EXISTS customs (
    id TEXT PRIMARY KEY,
    region TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    significance TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Custom dos and don'ts table
CREATE TABLE IF NOT EXISTS custom_dos_donts (
    id TEXT PRIMARY KEY,
    custom_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('do', 'dont')),
    instruction TEXT NOT NULL,
    FOREIGN KEY (custom_id) REFERENCES customs(id) ON DELETE CASCADE
);

-- Etiquette rules table
CREATE TABLE IF NOT EXISTS etiquette_rules (
    id TEXT PRIMARY KEY,
    context TEXT NOT NULL,
    rule TEXT NOT NULL,
    importance TEXT NOT NULL CHECK (importance IN ('high', 'medium', 'low')),
    region TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Transportation info table
CREATE TABLE IF NOT EXISTS transportation_info (
    id TEXT PRIMARY KEY,
    region TEXT NOT NULL,
    transport_type TEXT NOT NULL,
    description TEXT NOT NULL,
    tips TEXT,
    cost_min INTEGER CHECK (cost_min >= 0),
    cost_max INTEGER CHECK (cost_max >= cost_min),
    currency TEXT DEFAULT 'INR',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bargaining tips table
CREATE TABLE IF NOT EXISTS bargaining_tips (
    id TEXT PRIMARY KEY,
    context TEXT NOT NULL,
    tip TEXT NOT NULL,
    expected_discount TEXT,
    region TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Cultural notes table
CREATE TABLE IF NOT EXISTS cultural_notes (
    id TEXT PRIMARY KEY,
    bargaining_tip_id TEXT NOT NULL,
    note TEXT NOT NULL,
    FOREIGN KEY (bargaining_tip_id) REFERENCES bargaining_tips(id) ON DELETE CASCADE
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    language_preference TEXT NOT NULL DEFAULT 'english',
    spice_preference TEXT NOT NULL DEFAULT 'medium' CHECK (spice_preference IN ('mild', 'medium', 'hot', 'very-hot')),
    budget_min INTEGER CHECK (budget_min >= 0),
    budget_max INTEGER CHECK (budget_max >= budget_min),
    budget_currency TEXT DEFAULT 'INR',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- User dietary restrictions table
CREATE TABLE IF NOT EXISTS user_dietary_restrictions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    restriction TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User preferred regions table
CREATE TABLE IF NOT EXISTS user_preferred_regions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    region TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('slang', 'food', 'cultural')),
    item_id TEXT NOT NULL,
    notes TEXT,
    date_added DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Recommendation history table
CREATE TABLE IF NOT EXISTS recommendation_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('slang', 'food', 'cultural')),
    query TEXT NOT NULL,
    results_json TEXT NOT NULL, -- JSON string of results
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_slang_terms_term ON slang_terms(term);
CREATE INDEX IF NOT EXISTS idx_slang_terms_language ON slang_terms(language);
CREATE INDEX IF NOT EXISTS idx_slang_terms_region ON slang_terms(region);
CREATE INDEX IF NOT EXISTS idx_slang_terms_popularity ON slang_terms(popularity DESC);

CREATE INDEX IF NOT EXISTS idx_slang_translations_term_id ON slang_translations(slang_term_id);
CREATE INDEX IF NOT EXISTS idx_slang_translations_target_lang ON slang_translations(target_language);

CREATE INDEX IF NOT EXISTS idx_food_items_name ON food_items(name);
CREATE INDEX IF NOT EXISTS idx_food_items_category ON food_items(category);
CREATE INDEX IF NOT EXISTS idx_food_items_region ON food_items(region);
CREATE INDEX IF NOT EXISTS idx_food_items_dietary ON food_items(is_vegetarian, is_vegan, is_gluten_free);

CREATE INDEX IF NOT EXISTS idx_food_vendors_location ON food_vendors(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_food_vendors_city ON food_vendors(city);

CREATE INDEX IF NOT EXISTS idx_safety_ratings_vendor ON safety_ratings(vendor_id);
CREATE INDEX IF NOT EXISTS idx_safety_ratings_overall ON safety_ratings(overall_rating DESC);

CREATE INDEX IF NOT EXISTS idx_festivals_name ON festivals(name);
CREATE INDEX IF NOT EXISTS idx_festivals_date ON festivals(date_pattern);

CREATE INDEX IF NOT EXISTS idx_customs_region ON customs(region);
CREATE INDEX IF NOT EXISTS idx_etiquette_context ON etiquette_rules(context);
CREATE INDEX IF NOT EXISTS idx_etiquette_importance ON etiquette_rules(importance);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_type ON user_favorites(item_type);

CREATE INDEX IF NOT EXISTS idx_recommendation_history_user ON recommendation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_history_type ON recommendation_history(type);
CREATE INDEX IF NOT EXISTS idx_recommendation_history_timestamp ON recommendation_history(timestamp DESC);