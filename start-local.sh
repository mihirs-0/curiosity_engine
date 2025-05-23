#!/bin/bash

echo "🚀 Starting Curiosity Engine locally..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check requirements
echo -e "${YELLOW}Checking requirements...${NC}"

if ! command_exists python3; then
    echo -e "${RED}❌ Python 3 is not installed${NC}"
    exit 1
fi

if ! command_exists pnpm; then
    echo -e "${RED}❌ pnpm is not installed${NC}"
    echo "Install it with: npm install -g pnpm"
    exit 1
fi

# Setup environment files if they don't exist
echo -e "${YELLOW}Setting up environment files...${NC}"

# Backend .env
if [ ! -f "packages/backend/.env" ]; then
    echo -e "${YELLOW}Creating backend .env file...${NC}"
    cat > packages/backend/.env << 'EOF'
# Supabase Configuration (temporarily commented out for local development)
# SUPABASE_URL=your_supabase_project_url
# SUPABASE_ANON_KEY=your_supabase_anon_key
# SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Perplexity Sonar API (optional for now)
# PERPLEXITY_API_KEY=your_perplexity_api_key

# Frontend Configuration
FRONTEND_URL=http://localhost:3000

# Environment
ENVIRONMENT=development
EOF
fi

# Frontend .env.local
if [ ! -f "apps/web/.env.local" ]; then
    echo -e "${YELLOW}Creating frontend .env.local file...${NC}"
    cat > apps/web/.env.local << 'EOF'
# Backend API Configuration
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Environment
NEXT_PUBLIC_ENVIRONMENT=development

# Supabase Configuration (optional for local development)
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url  
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EOF
fi

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"

# Install Python dependencies
if [ ! -d "packages/backend/venv" ]; then
    echo "Creating Python virtual environment..."
    cd packages/backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ../..
else
    echo "Python virtual environment already exists"
fi

# Install Node dependencies
echo "Installing Node.js dependencies..."
pnpm install

# Start services
echo -e "${GREEN}🎯 Starting services...${NC}"

# Start backend in background
echo -e "${YELLOW}Starting FastAPI backend on http://localhost:8000${NC}"
cd packages/backend
source venv/bin/activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ../..

# Wait a moment for backend to start
sleep 3

# Start frontend
echo -e "${YELLOW}Starting Next.js frontend on http://localhost:3000${NC}"
cd apps/web
pnpm dev &
FRONTEND_PID=$!
cd ../..

echo -e "${GREEN}✅ Services started!${NC}"
echo ""
echo -e "${GREEN}🌐 Frontend: http://localhost:3000${NC}"
echo -e "${GREEN}🔧 Backend API: http://localhost:8000${NC}"
echo -e "${GREEN}🧪 Test Page: http://localhost:3000/test${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Function to cleanup processes
cleanup() {
    echo -e "\n${YELLOW}Stopping services...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}✅ Services stopped${NC}"
    exit 0
}

# Trap Ctrl+C
trap cleanup INT

# Wait for processes
wait 