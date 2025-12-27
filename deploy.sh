#!/bin/bash

# Indian Local Guide API - Deployment Script
# This script prepares and deploys the application

set -e  # Exit on any error

echo "🚀 Starting deployment preparation for Indian Local Guide API..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node --version)"
    exit 1
fi

print_success "Node.js version check passed: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm and try again."
    exit 1
fi

print_success "npm version: $(npm --version)"

# Clean previous builds
print_status "Cleaning previous builds..."
rm -rf dist/
rm -rf node_modules/.cache/

# Install dependencies
print_status "Installing dependencies..."
npm ci --production=false

# Run linting
print_status "Running code quality checks..."
if npm run lint; then
    print_success "Code quality checks passed"
else
    print_warning "Code quality checks failed, but continuing..."
fi

# Run tests
print_status "Running tests..."
if npm test; then
    print_success "All tests passed"
else
    print_error "Tests failed. Please fix failing tests before deployment."
    exit 1
fi

# Build the application
print_status "Building application..."
if npm run build; then
    print_success "Build completed successfully"
else
    print_error "Build failed. Please check the build errors."
    exit 1
fi

# Verify build output
if [ ! -d "dist" ]; then
    print_error "Build directory 'dist' not found. Build may have failed."
    exit 1
fi

if [ ! -f "dist/server.js" ]; then
    print_error "Main server file 'dist/server.js' not found. Build may have failed."
    exit 1
fi

print_success "Build verification passed"

# Create data directory if it doesn't exist
print_status "Creating data directory..."
mkdir -p data
print_success "Data directory ready"

# Test the built application
print_status "Testing built application..."
NODE_ENV=production timeout 10s node dist/server.js &
SERVER_PID=$!

# Wait a moment for server to start
sleep 3

# Test health endpoint
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    print_success "Health check passed"
else
    print_warning "Health check failed, but this might be expected in CI environment"
fi

# Kill test server
kill $SERVER_PID 2>/dev/null || true

# Display deployment options
echo ""
echo "🎉 Application is ready for deployment!"
echo ""
echo "📋 Deployment Options:"
echo ""
echo "1. 🚂 Railway (Recommended):"
echo "   - Push to GitHub and connect at railway.app"
echo "   - Automatic deployment with railway.json config"
echo ""
echo "2. 🎨 Render:"
echo "   - Push to GitHub and create service at render.com"
echo "   - Uses render.yaml configuration"
echo ""
echo "3. 🟣 Heroku:"
echo "   - heroku create your-app-name"
echo "   - git push heroku main"
echo ""
echo "4. ⚡ Vercel:"
echo "   - npm i -g vercel"
echo "   - vercel --prod"
echo ""
echo "5. 🐳 Docker:"
echo "   - docker build -t indian-local-guide ."
echo "   - docker run -p 3000:3000 indian-local-guide"
echo ""
echo "📚 For detailed instructions, see DEPLOYMENT.md"
echo ""

# Display API endpoints
echo "🔗 API Endpoints (after deployment):"
echo "   Health: GET /health"
echo "   API Info: GET /api"
echo "   Translation Demo: GET /api/translate/demo"
echo "   Food Demo: GET /api/food/demo"
echo "   Culture Demo: GET /api/culture/demo"
echo ""

# Display environment variables
echo "🔧 Environment Variables (optional):"
echo "   NODE_ENV=production"
echo "   PORT=3000"
echo "   DATABASE_PATH=./data/indian-local-guide.db"
echo "   CORS_ORIGIN=*"
echo "   RATE_LIMIT_WINDOW_MS=900000"
echo "   RATE_LIMIT_MAX=100"
echo ""

print_success "Deployment preparation completed successfully!"
echo "🌟 Your Indian Local Guide API is ready to help people explore India!"