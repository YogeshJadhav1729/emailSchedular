#!/bin/bash

# Email Scheduler - Quick Start Script
# This script helps you get started quickly by checking prerequisites and guiding setup

set -e

echo "📧 Email Scheduler - Quick Start"
echo "================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "🔍 Checking prerequisites..."
echo ""

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} Node.js installed: $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js not found. Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓${NC} npm installed: $NPM_VERSION"
else
    echo -e "${RED}✗${NC} npm not found"
    exit 1
fi

# Check Docker
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✓${NC} Docker installed: $DOCKER_VERSION"
else
    echo -e "${RED}✗${NC} Docker not found. Please install Docker from https://www.docker.com"
    exit 1
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    echo -e "${GREEN}✓${NC} Docker Compose installed: $COMPOSE_VERSION"
else
    echo -e "${RED}✗${NC} Docker Compose not found"
    exit 1
fi

echo ""
echo "✅ All prerequisites met!"
echo ""

# Start Docker services
echo "🐳 Starting Docker services (PostgreSQL & Redis)..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✓${NC} Docker services are running"
else
    echo -e "${RED}✗${NC} Docker services failed to start"
    exit 1
fi

echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "✅ Installation complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1️⃣  Setup Ethereal Email (Test SMTP)"
echo "   → Visit: https://ethereal.email"
echo "   → Click 'Create Ethereal Account'"
echo "   → Save the credentials"
echo ""
echo "2️⃣  Setup Google OAuth"
echo "   → Visit: https://console.cloud.google.com"
echo "   → Create OAuth 2.0 credentials"
echo "   → Add http://localhost:3000 to authorized origins"
echo "   → Save Client ID and Client Secret"
echo ""
echo "3️⃣  Configure Backend"
echo "   → cd backend"
echo "   → cp .env.example .env"
echo "   → Edit .env with your credentials"
echo ""
echo "4️⃣  Configure Frontend"
echo "   → cd frontend"
echo "   → cp .env.local.example .env.local"
echo "   → Edit .env.local with your Google Client ID"
echo ""
echo "5️⃣  Setup Database"
echo "   → cd backend"
echo "   → npx prisma migrate dev"
echo "   → npx prisma generate"
echo ""
echo "6️⃣  Start the Application"
echo "   Terminal 1: cd backend && npm run dev"
echo "   Terminal 2: cd backend && npm run worker"
echo "   Terminal 3: cd frontend && npm run dev"
echo ""
echo "7️⃣  Open http://localhost:3000"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📖 For detailed instructions, see SETUP_GUIDE.md"
echo "🔒 For security information, see SECURITY.md"
echo "📚 For full documentation, see README.md"
echo ""
echo "Need help? Check the troubleshooting section in README.md"
echo ""
