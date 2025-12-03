# Development Setup Guide

## Quick Start

### Start Everything (Recommended)
```bash
npm run dev
```

This single command will start:
- ✅ **Python FastAPI Backend** (Port 8000) - Color-coded in **blue**
- ✅ **Next.js Frontend** (Port 3000) - Color-coded in **magenta**

Both services will run concurrently in the same terminal with beautiful color-coded output!

### Start Individual Services

If you need to run services separately for debugging:

**Frontend Only:**
```bash
npm run dev:frontend
```

**Backend Only:**
```bash
npm run dev:backend
```

## Prerequisites

### First Time Setup

If you haven't set up the backend yet, run these commands once:

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (if not already created)
python -m venv venv

# Activate virtual environment
venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Create .env file (copy from .env.example and add your ZAI_API_KEY)
copy .env.example .env
# Edit .env and add your ZAI_API_KEY

# Deactivate and return to root
deactivate
cd ..
```

### Environment Variables

Make sure you have a `.env` file in the `backend` directory with:
```
ZAI_API_KEY=your_api_key_here
HOST=0.0.0.0
PORT=8000
```

## How It Works

The `npm run dev` command uses **concurrently** to:
1. Start the Python backend by activating the venv and running `run.py`
2. Start the Next.js development server
3. Display both outputs in the same terminal with color-coded prefixes
4. Handle Ctrl+C gracefully to stop both services

## Troubleshooting

### Backend doesn't start
- Verify Python virtual environment exists: `Test-Path backend\venv\Scripts\python.exe`
- Check that `ZAI_API_KEY` is set in `backend\.env`
- Try running `npm run dev:backend` separately to see specific errors

### Port conflicts
- Backend uses port 8000. Change in `backend\.env` if needed
- Frontend uses port 3000. Next.js will auto-increment if port is busy

### Dependencies missing
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
venv\Scripts\activate
pip install -r requirements.txt
deactivate
cd ..
```

## Production

For production builds:
```bash
# Build frontend
npm run build

# Start frontend in production mode
npm start

# Backend production (use gunicorn or similar)
cd backend
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```
