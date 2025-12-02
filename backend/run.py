#!/usr/bin/env python3
"""
Startup script for Z.AI FastAPI Backend

This script starts the FastAPI server with proper configuration.
"""

import os
import sys
import uvicorn
from app.config import settings

def main():
    """Main function to start the server"""
    
    # Check if ZAI_API_KEY is set
    if not settings.ZAI_API_KEY:
        print("ERROR: ZAI_API_KEY environment variable is required!")
        print("Please set up your .env file with your Z.AI API key.")
        print("Copy .env.example to .env and fill in your API key.")
        sys.exit(1)
    
    print(f"Starting Z.AI FastAPI Backend...")
    print(f"Host: {settings.HOST}")
    print(f"Port: {settings.PORT}")
    print(f"Default Model: {settings.DEFAULT_MODEL}")
    print(f"API Key: {'*' * 10}{settings.ZAI_API_KEY[-10:] if len(settings.ZAI_API_KEY) > 10 else 'INVALID'}")
    
    # Start the server
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
        log_level="info"
    )

if __name__ == "__main__":
    main()