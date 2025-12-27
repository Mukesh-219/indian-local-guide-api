<div align="center">

# 🇮🇳 Indian Local Guide API

### *Your AI-Powered Gateway to India's Cultural Diversity*

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)](https://expressjs.com/)
[![AWS](https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![Kiro AI](https://img.shields.io/badge/Kiro_AI-6B4FBB?style=for-the-badge&logo=ai&logoColor=white)](https://kiro.dev/)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![GitHub Deployments](https://img.shields.io/github/deployments/Mukesh-219/indian-local-guide-api/production?style=flat-square&label=deployment)](https://github.com/Mukesh-219/indian-local-guide-api/deployments)
[![Made with Love](https://img.shields.io/badge/Made%20with-❤️-red.svg?style=flat-square)](https://github.com/Mukesh-219)

**[📖 Read Blog Post](https://builder.aws.com/post/37RIe1yFh5RRW5nsdzy8YtaFuW7_p/building-an-ai-powered-indian-local-guide-api-with-kiro-and-amazon-bedrock)** • **[🌐 Live Demo](https://mukesh-219.github.io/indian-local-guide-api/)** • **[📚 API Docs](#-api-endpoints)**

---

*An intelligent REST API that helps travelers and locals navigate India's rich cultural diversity, decode regional slang, discover authentic street food, and understand local customs.*

**Built for [AI For Bharat Hackathon](https://vision.hack2skill.com/event/ai-for-bharat) - Kiro Week 5 Challenge 🏆**

</div>

---

## ✨ Features

🗣️ **Slang Translator** - Decode Hindi slang and regional expressions across India  
🍛 **Food Recommender** - Discover authentic local cuisine with safety ratings  
🎭 **Cultural Guide** - Learn regional customs, festivals, and etiquette  
🧠 **Kiro AI Powered** - Built with AI-native development using Kiro's product steering  
⚡ **Fast & Scalable** - Production-ready with comprehensive error handling  
🔒 **Secure** - Rate limiting, CORS, input validation, and security headers  

---

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

---

## 🤖 Kiro AI Integration

This project leverages **Kiro AI** for AI-native development:

- **`.kiro/steering/product.md`** - Defines AI personality and Indian cultural context
- **AI-First Architecture** - Kiro accelerates development with context-aware assistance
- **Product Steering** - Clear AI guidance for authentic Indian recommendations

The `.kiro` directory teaches Kiro about India's cultural nuances, enabling it to provide culturally appropriate suggestions throughout development.

---

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
- `POST /api/food/recommendations` - Get personalized food recommendations
- `GET /api/food/category/:category` - Get food by category
- `GET /api/food/hubs/:city` - Get popular food hubs in a city

#### Search & Safety
- `GET /api/food/search?q=query` - Search for food items
- `GET /api/food/safety/:vendorId` - Get safety rating for a vendor

### Cultural Information Endpoints

#### Demo Data
- `GET /api/culture/demo` - View sample cultural information

#### Regional Information
- `GET /api/culture/region/:region` - Get cultural information for a region
- `GET /api/culture/festival/:festival` - Get information about a festival
- `GET /api/culture/etiquette/:context` - Get etiquette rules for a context

#### Location-Based Tips
- `GET /api/culture/bargaining` - Get bargaining tips for a location
- `GET /api/culture/search?q=query` - Search cultural content

---

## 🔧 API Usage Examples

### Translate Hindi to English
```bash
curl -X POST http://localhost:3000/api/translate/to-english \\
  -H "Content-Type: application/json" \\
  -d '{"text": "jugaad", "region": "delhi"}'
```

### Get Food Recommendations
```bash
curl -X POST http://localhost:3000/api/food/recommendations \\
  -H "Content-Type: application/json" \\
  -d '{
    "location": {
      "latitude": 19.0760,
      "longitude": 72.8777,
      "city": "Mumbai"
    },
    "preferences": {
      "dietaryRestrictions": ["vegetarian"],
      "spiceLevel": "medium"
    }
  }'
```

### Get Cultural Information
```bash
curl http://localhost:3000/api/culture/region/mumbai
```

---

## 🌟 Sample Data

### Translation Examples

| Hindi | English | Region | Context | Example |
|-------|---------|--------|---------|--------|
| jugaad | innovative solution | Delhi | casual | "This is a jugaad solution" |
| timepass | killing time | Mumbai | casual | "Just doing timepass" |
| fundoo | awesome | Delhi | slang | "That movie was fundoo!" |
| bindaas | awesome/carefree | Mumbai | slang | "Live bindaas, don't worry" |

### Popular Street Food

| Food | Description | Region | Price | Dietary |
|------|-------------|--------|-------|---------|
| Vada Pav | Spiced potato fritter in bun | Mumbai | ₹15-25 | Vegetarian |
| Chole Bhature | Spicy chickpea curry with bread | Delhi | ₹80-150 | Vegetarian |
| Dosa | Crispy South Indian crepe | Bangalore | ₹40-80 | Vegan |

---

## 🏗️ Tech Stack

```text
🔹 Backend       → Node.js + Express.js + TypeScript
🔹 Database      → SQLite (production-ready)
🔹 Validation    → Zod schemas
🔹 Logging       → Winston
🔹 Testing       → Property-based testing (fast-check)
🔹 Security      → Helmet, CORS, Rate limiting
🔹 AI Dev        → Kiro AI for context-aware development
```

---

## 📂 Project Structure

```
src/
├── .kiro/              # Kiro AI context and product steering
│   └── steering/
│       └── product.md  # Indian cultural context for AI
├── routes/             # API route handlers
├── services/           # Business logic services
├── database/           # Database models and repositories
├── validation/         # Input validation schemas
├── config/             # Configuration management
└── types/              # TypeScript type definitions
```

---

## 🌍 Regional Coverage

The API covers slang and cultural information from:

- **North India**: Delhi NCR, Punjab, Rajasthan
- **South India**: Bangalore, Chennai, Kerala
- **West India**: Mumbai, Gujarat, Goa
- **East India**: Kolkata, Northeast states

---

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

---

## 🚀 Deployment

The app is production-ready with:

✅ Security headers (Helmet)  
✅ CORS configuration  
✅ Rate limiting  
✅ Request logging  
✅ Error handling  
✅ Health monitoring  
✅ Graceful shutdown  

Deploy to any Node.js hosting platform:
- ✨ Vercel
- ✨ Railway
- ✨ Heroku
- ✨ DigitalOcean
- ✨ AWS Elastic Beanstalk

---

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

<div align="center">

### **Mukesh Kumar Bauri**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Mukesh-219)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/mukesh-kumar-bauri)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:mukeshbauri419@gmail.com)

*Full-Stack Developer | AI Enthusiast | Building AI-native applications*

**Project Links:**
- 📖 [Technical Blog Post on AWS Builder Center](https://builder.aws.com/post/37RIe1yFh5RRW5nsdzy8YtaFuW7_p/building-an-ai-powered-indian-local-guide-api-with-kiro-and-amazon-bedrock)
- 🏆 [AI For Bharat Hackathon](https://vision.hack2skill.com/event/ai-for-bharat)
- 🌐 [Live Demo](https://mukesh-219.github.io/indian-local-guide-api/)

</div>

---

## 🙏 Acknowledgments

- **[AI For Bharat](https://vision.hack2skill.com/event/ai-for-bharat)** - For organizing this amazing hackathon
- **[Kiro AI](https://kiro.dev/)** - For revolutionizing AI-native development
- **[AWS](https://aws.amazon.com/)** - For providing cloud infrastructure insights
- **India's Diverse Culture** - The inspiration behind this project

---

<div align="center">

**Made with ❤️ for exploring India's rich cultural diversity**

*Star ⭐ this repository if you found it helpful!*

</div>
