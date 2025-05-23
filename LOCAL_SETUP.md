# 🚀 Local Development Setup

This guide will help you get both the frontend and backend running locally for development, without requiring Supabase configuration.

## 📋 Prerequisites

Before starting, make sure you have:

- **Python 3.8+** installed
- **Node.js 18+** installed  
- **pnpm** package manager installed (`npm install -g pnpm`)

## 🏃‍♂️ Quick Start (Recommended)

We've created a startup script that automatically sets up everything for you:

```bash
./start-local.sh
```

This script will:
- ✅ Check that you have all required dependencies
- ✅ Create environment files if they don't exist
- ✅ Set up Python virtual environment
- ✅ Install all dependencies
- ✅ Start both backend and frontend
- ✅ Show you the URLs to access everything

After running the script, you'll have:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000  
- **API Test Page**: http://localhost:3000/test

## 🔧 Manual Setup (Alternative)

If you prefer to set things up manually:

### 1. Backend Setup

```bash
# Navigate to backend directory
cd packages/backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp env.example .env

# Start the FastAPI server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup

```bash
# Navigate to frontend directory (in a new terminal)
cd apps/web

# Install dependencies
pnpm install

# Create environment file
echo "NEXT_PUBLIC_BACKEND_URL=http://localhost:8000" > .env.local
echo "NEXT_PUBLIC_ENVIRONMENT=development" >> .env.local

# Start the Next.js development server
pnpm dev
```

## 🧪 Testing the Setup

1. **Visit the test page**: http://localhost:3000/test
2. **Click "Test Connection"** - you should see "✅ Connected"
3. **Submit a test query** - try something like "What is AI?"
4. **Check the results** - you should see the query appear with a mock response

## 🔍 What's Different in Local Mode

Since we're running without Supabase initially:

### Backend Changes
- ✅ Queries are stored in memory (will reset when server restarts)
- ✅ No authentication required
- ✅ Mock Perplexity API responses (unless you add a real API key)
- ✅ All CORS configured for localhost

### Frontend Changes  
- ✅ Supabase authentication is disabled
- ✅ API calls work without authentication tokens
- ✅ All components work with mock data

## 🌐 Available Endpoints

### Backend API (http://localhost:8000)
- `GET /` - Health check
- `GET /health` - Detailed health status
- `POST /queries` - Submit a new query
- `GET /queries` - Get all queries
- `GET /queries/{id}` - Get specific query

### Frontend (http://localhost:3000)
- `/` - Main homepage
- `/test` - API testing page (recommended for development)

## 🔧 Configuration Files

The setup creates these configuration files:

### `packages/backend/.env`
```env
# Environment for local development
ENVIRONMENT=development
FRONTEND_URL=http://localhost:3000

# Supabase (commented out for local dev)
# SUPABASE_URL=your_url
# SUPABASE_ANON_KEY=your_key
```

### `apps/web/.env.local`
```env
# Backend API
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_ENVIRONMENT=development

# Supabase (commented out for local dev)  
# NEXT_PUBLIC_SUPABASE_URL=your_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

## 🐛 Troubleshooting

### Port Already in Use
If you get port errors:
```bash
# Kill processes using the ports
lsof -ti:3000 | xargs kill -9
lsof -ti:8000 | xargs kill -9
```

### Python Dependencies Issues
```bash
# Make sure you're in the virtual environment
cd packages/backend
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### Node Dependencies Issues
```bash
# Clear cache and reinstall
pnpm store prune
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### CORS Errors
- Make sure the backend is running on port 8000
- Check that `NEXT_PUBLIC_BACKEND_URL=http://localhost:8000` in `.env.local`
- Verify the frontend is running on port 3000

## 🔄 Next Steps

Once everything is working locally:

1. **Test the API** using the test page at `/test`
2. **Add Perplexity API key** to get real AI responses
3. **Set up Supabase** for authentication and persistent storage
4. **Deploy to production** when ready

## 🆘 Need Help?

If you run into issues:
1. Check the terminal outputs for error messages
2. Ensure all dependencies are installed correctly
3. Verify the ports aren't being used by other applications
4. Check that both frontend and backend environment files exist

The local setup should work without any external dependencies - everything runs in memory for testing! 