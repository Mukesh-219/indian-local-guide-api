# Indian Local Guide API

An AI-powered assistant that helps people navigate and understand India's rich cultural diversity, local slang, street food, and regional nuances.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation & Running

```bash
# Install dependencies
npm install

# Development mode (with auto-reload)
npm run dev

# Production build and run
npm run build
npm start
```

The server will start on `http://localhost:3000`

## 📡 API Endpoints

### Health & Status
- `GET /health` - Server health check
- `GET /api` - API documentation and endpoint list
- `GET /api/status/database` - Database connection status

### Translation Endpoints

#### Demo Data
- `GET /api/translate/demo` - View sample Hindi slang translations

#### Translate Text
- `POST /api/translate/to-english` - Translate Hindi slang to English
- `POST /api/translate/to-hindi` - Translate English to Hindi slang

#### Search & Explore
- `GET /api/translate/variations/:term` - Get regional variations of a term
- `GET /api/translate/search?q=term` - Search for similar slang terms

#### Manage Terms
- `POST /api/translate/terms` - Add new slang term

### Food Recommendation Endpoints

#### Demo Data
- `GET /api/food/demo` - View sample food recommendations

#### Get Recommendations
- `POST /api/food/recommendations` - Get personalized food recommendations based on location and preferences
- `GET /api/food/category/:category` - Get food by category (e.g., "street food", "south indian")
- `GET /api/food/hubs/:city` - Get popular food hubs in a city

#### Search & Safety
- `GET /api/food/search?q=query&lat=...&lng=...&city=...&state=...&country=...` - Search for food items
- `GET /api/food/safety/:vendorId` - Get safety rating for a vendor

### Cultural Information Endpoints

#### Demo Data
- `GET /api/culture/demo` - View sample cultural information

#### Regional Information
- `GET /api/culture/region/:region` - Get cultural information for a region
- `GET /api/culture/festival/:festival` - Get information about a festival
- `GET /api/culture/etiquette/:context` - Get etiquette rules for a context (e.g., "dining", "religious")

#### Location-Based Tips
- `GET /api/culture/bargaining?lat=...&lng=...&city=...&state=...&country=...` - Get bargaining tips for a location
- `GET /api/culture/search?q=query&region=...` - Search cultural content

## 🔧 API Usage Examples

### Translation Examples

#### 1. Get Demo Translations
```bash
curl http://localhost:3000/api/translate/demo
```

#### 2. Translate Hindi to English
```bash
curl -X POST http://localhost:3000/api/translate/to-english \
  -H "Content-Type: application/json" \
  -d '{"text": "jugaad", "region": "delhi"}'
```

#### 3. Translate English to Hindi
```bash
curl -X POST http://localhost:3000/api/translate/to-hindi \
  -H "Content-Type: application/json" \
  -d '{"text": "awesome", "targetRegion": "mumbai"}'
```

#### 4. Search for Terms
```bash
curl "http://localhost:3000/api/translate/search?q=awesome"
```

#### 5. Get Regional Variations
```bash
curl http://localhost:3000/api/translate/variations/awesome
```

#### 6. Add New Slang Term
```bash
curl -X POST http://localhost:3000/api/translate/terms \
  -H "Content-Type: application/json" \
  -d '{
    "term": "bindaas",
    "language": "hindi",
    "region": "mumbai",
    "context": "casual",
    "popularity": 80,
    "translations": [{
      "text": "awesome",
      "targetLanguage": "english",
      "context": "casual",
      "confidence": 0.9
    }],
    "usageExamples": ["That movie was bindaas!"]
  }'
```

### Food Recommendation Examples

#### 7. Get Demo Food Recommendations
```bash
curl http://localhost:3000/api/food/demo
```

#### 8. Get Personalized Food Recommendations
```bash
curl -X POST http://localhost:3000/api/food/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "location": {
      "latitude": 19.0760,
      "longitude": 72.8777,
      "city": "Mumbai",
      "state": "Maharashtra",
      "country": "India"
    },
    "preferences": {
      "dietaryRestrictions": ["vegetarian"],
      "spiceLevel": "medium",
      "radius": 5
    }
  }'
```

#### 9. Get Food by Category
```bash
curl "http://localhost:3000/api/food/category/street%20food?lat=19.0760&lng=72.8777&city=Mumbai&state=Maharashtra&country=India"
```

#### 10. Get Popular Food Hubs
```bash
curl http://localhost:3000/api/food/hubs/Mumbai
```

#### 11. Search for Food
```bash
curl "http://localhost:3000/api/food/search?q=vada%20pav&lat=19.0760&lng=72.8777&city=Mumbai&state=Maharashtra&country=India"
```

### Cultural Information Examples

#### 12. Get Demo Cultural Information
```bash
curl http://localhost:3000/api/culture/demo
```

#### 13. Get Regional Information
```bash
curl http://localhost:3000/api/culture/region/mumbai
```

#### 14. Get Festival Information
```bash
curl http://localhost:3000/api/culture/festival/diwali
```

#### 15. Get Etiquette Rules
```bash
curl http://localhost:3000/api/culture/etiquette/dining
```

#### 16. Get Bargaining Tips
```bash
curl "http://localhost:3000/api/culture/bargaining?lat=28.6139&lng=77.2090&city=Delhi&state=Delhi&country=India"
```

#### 17. Search Cultural Content
```bash
curl "http://localhost:3000/api/culture/search?q=namaste&region=delhi"
```

## 🌟 Sample Data

### Translation Examples
The API includes these popular Hindi slang terms:

| Hindi | English | Region | Context | Example |
|-------|---------|--------|---------|---------|
| jugaad | innovative solution | Delhi | casual | "This is a jugaad solution" |
| timepass | killing time | Mumbai | casual | "Just doing timepass" |
| fundoo | awesome | Delhi | slang | "That movie was fundoo!" |
| bindaas | awesome/carefree | Mumbai | slang | "Live bindaas, don't worry" |
| bas yaar | enough man | Delhi | casual | "Bas yaar, let's go home" |
| acha | okay/I see | Mumbai | casual | "Acha, I understand" |

### Food Recommendations
Popular street food items available:

| Food | Description | Region | Price Range | Dietary |
|------|-------------|--------|-------------|---------|
| Vada Pav | Spiced potato fritter in bun | Mumbai | ₹15-25 | Vegetarian |
| Chole Bhature | Spicy chickpea curry with bread | Delhi | ₹80-150 | Vegetarian |
| Dosa | Crispy South Indian crepe | Bangalore | ₹40-80 | Vegan |
| Pav Bhaji | Spiced vegetable mash with bread | Mumbai | ₹60-120 | Vegetarian |
| Biryani | Fragrant rice with meat/vegetables | Hyderabad | ₹150-300 | Non-Veg/Veg |

### Cultural Information
Regional customs and etiquette:

| Topic | Region | Key Points |
|-------|--------|------------|
| Namaste Greeting | All India | Press palms together, bow head slightly |
| Dining Etiquette | All India | Use right hand, don't waste food |
| Local Train Rules | Mumbai | Let people exit first, stand left on escalators |
| Bargaining Tips | Delhi | Start at 30-40% of quoted price |
| Festival Celebrations | All India | Diwali, Holi, regional festivals |

## 🏗️ Current Status

### ✅ Completed Features
- **Server Infrastructure**: Express.js with security, logging, rate limiting
- **Translation API**: Full REST API for slang translation with demo data
- **Food Recommendation API**: Location-based food suggestions with safety ratings
- **Cultural Information API**: Regional customs, festivals, etiquette, and bargaining tips
- **Database Integration**: SQLite with repositories and sample data seeding
- **Input Validation**: Request validation with Zod schemas
- **Error Handling**: Comprehensive error responses
- **Health Monitoring**: Server and database status endpoints

### 🎯 API Endpoints Available
- **Translation**: 6 endpoints (demo, translate, search, variations, add terms)
- **Food**: 5 endpoints (demo, recommendations, category, hubs, search, safety)
- **Culture**: 5 endpoints (demo, regional info, festivals, etiquette, bargaining, search)
- **System**: 3 endpoints (health, API info, database status)

### 🔧 Technical Features
- TypeScript throughout for type safety
- Property-based testing with fast-check
- Comprehensive logging with Winston
- Database migrations and seeding
- CORS and security headers
- Rate limiting and input sanitization

## 🛠️ Development

### Scripts
- `npm run dev` - Development server with auto-reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run production server
- `npm test` - Run test suite
- `npm run lint` - Check code style

### Project Structure
```
src/
├── routes/          # API route handlers
├── services/        # Business logic services
├── database/        # Database models and repositories
├── validation/      # Input validation schemas
├── config/          # Configuration management
└── types/           # TypeScript type definitions
```

## 🌍 Regional Focus

The API covers slang and cultural information from:

- **North India**: Delhi NCR, Punjab, Rajasthan
- **South India**: Bangalore, Chennai, Kerala  
- **West India**: Mumbai, Gujarat, Goa
- **East India**: Kolkata, Northeast states

## 📝 Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

## 🚀 Ready for Hosting!

The app is **production-ready** with:
- ✅ Security headers (Helmet)
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Request logging
- ✅ Error handling
- ✅ Health monitoring
- ✅ Graceful shutdown

Deploy to any Node.js hosting platform (Heroku, Railway, DigitalOcean, etc.)

---

**Made with ❤️ for exploring India's rich cultural diversity**