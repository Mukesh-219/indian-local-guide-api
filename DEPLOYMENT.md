# 🚀 Deployment Guide - Indian Local Guide API

This guide covers multiple deployment options for the Indian Local Guide API.

## 📋 Pre-Deployment Checklist

- ✅ Application builds successfully (`npm run build`)
- ✅ All tests pass (`npm test`)
- ✅ Environment variables configured
- ✅ Database schema and migrations ready
- ✅ Security headers and rate limiting configured

## 🌐 Deployment Options

### 1. Railway (Recommended - Free Tier Available)

Railway offers excellent Node.js support with automatic deployments.

#### Steps:
1. **Sign up** at [railway.app](https://railway.app)
2. **Connect GitHub** repository
3. **Deploy** - Railway will automatically detect the `railway.json` config
4. **Set Environment Variables** (optional, defaults are configured):
   ```
   NODE_ENV=production
   DATABASE_PATH=./data/indian-local-guide.db
   CORS_ORIGIN=*
   ```

#### Features:
- ✅ Free tier with 500 hours/month
- ✅ Automatic HTTPS
- ✅ Custom domains
- ✅ Automatic deployments from Git

**Live URL**: `https://your-app-name.up.railway.app`

---

### 2. Render (Free Tier Available)

Render provides reliable hosting with good performance.

#### Steps:
1. **Sign up** at [render.com](https://render.com)
2. **Create Web Service** from GitHub repository
3. **Configure** using the included `render.yaml`
4. **Deploy** automatically

#### Features:
- ✅ Free tier available
- ✅ Automatic SSL certificates
- ✅ Custom domains
- ✅ Health checks included

**Live URL**: `https://your-app-name.onrender.com`

---

### 3. Heroku

Classic platform with extensive documentation.

#### Steps:
1. **Install** Heroku CLI
2. **Login**: `heroku login`
3. **Create app**: `heroku create your-app-name`
4. **Deploy**: 
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

#### Features:
- ✅ Mature platform
- ✅ Extensive add-ons
- ✅ Easy scaling

**Note**: Heroku removed free tier, paid plans start at $7/month.

---

### 4. Vercel (Serverless)

Great for serverless deployment, though may have cold start delays.

#### Steps:
1. **Install** Vercel CLI: `npm i -g vercel`
2. **Login**: `vercel login`
3. **Deploy**: `vercel --prod`

#### Features:
- ✅ Generous free tier
- ✅ Global CDN
- ✅ Automatic HTTPS

**Note**: Serverless functions may have cold starts affecting performance.

---

### 5. DigitalOcean App Platform

Reliable cloud platform with competitive pricing.

#### Steps:
1. **Sign up** at [digitalocean.com](https://digitalocean.com)
2. **Create App** from GitHub repository
3. **Configure** build and run commands:
   - Build: `npm install && npm run build`
   - Run: `npm start`

#### Features:
- ✅ $5/month starter plan
- ✅ Automatic scaling
- ✅ Built-in monitoring

---

### 6. Docker Deployment

For custom server deployment using Docker.

#### Steps:
1. **Build image**: `docker build -t indian-local-guide .`
2. **Run container**: 
   ```bash
   docker run -d \
     --name indian-local-guide \
     -p 3000:3000 \
     -v $(pwd)/data:/app/data \
     indian-local-guide
   ```

#### With Docker Compose:
```bash
docker-compose up -d
```

#### Features:
- ✅ Consistent environment
- ✅ Easy scaling
- ✅ Works on any Docker host

---

## 🔧 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Node environment |
| `PORT` | `3000` | Server port |
| `DATABASE_PATH` | `./data/indian-local-guide.db` | SQLite database path |
| `CORS_ORIGIN` | `*` | CORS allowed origins |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |

## 🏥 Health Monitoring

All deployment configurations include health checks:

- **Endpoint**: `/health`
- **Expected Response**: `200 OK`
- **Timeout**: 30 seconds
- **Interval**: 30 seconds

## 📊 Performance Optimization

### Database
- SQLite database with optimized queries
- Connection pooling configured
- Automatic database initialization

### Caching
- In-memory caching for frequently accessed data
- Gzip compression enabled
- Static asset optimization

### Security
- Helmet.js security headers
- Rate limiting (100 requests/15 minutes)
- Input validation and sanitization
- CORS configuration

## 🔍 Monitoring & Logging

### Built-in Logging
- Winston logger with structured logging
- Request/response logging
- Error tracking with stack traces
- Performance metrics

### Recommended Monitoring
- **Uptime**: UptimeRobot, Pingdom
- **Performance**: New Relic, DataDog
- **Errors**: Sentry, Bugsnag

## 🚀 Quick Deploy Commands

### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway up
```

### Render
```bash
# Just push to GitHub, Render will auto-deploy
git push origin main
```

### Vercel
```bash
# Install and deploy
npm i -g vercel
vercel --prod
```

## 🧪 Testing Deployment

After deployment, test these endpoints:

1. **Health Check**: `GET /health`
2. **API Info**: `GET /api`
3. **Translation Demo**: `GET /api/translate/demo`
4. **Food Demo**: `GET /api/food/demo`
5. **Culture Demo**: `GET /api/culture/demo`

### Example Test Commands:
```bash
# Replace YOUR_DOMAIN with your deployed URL
curl https://YOUR_DOMAIN/health
curl https://YOUR_DOMAIN/api/translate/demo
curl https://YOUR_DOMAIN/api/food/demo
curl https://YOUR_DOMAIN/api/culture/demo
```

## 🎯 Recommended Deployment: Railway

For the best balance of features, ease of use, and cost:

1. **Push code** to GitHub
2. **Connect** Railway to your repository
3. **Deploy** automatically with zero configuration
4. **Scale** as needed

**Estimated Cost**: Free for development, ~$5-10/month for production

---

## 🆘 Troubleshooting

### Common Issues:

1. **Build Failures**: Check Node.js version (requires 18+)
2. **Database Errors**: Ensure data directory is writable
3. **Port Issues**: Verify PORT environment variable
4. **CORS Errors**: Configure CORS_ORIGIN for your domain

### Support:
- Check deployment platform documentation
- Review application logs
- Test locally first: `npm run build && npm start`

---

**🎉 Your Indian Local Guide API is ready for the world!**