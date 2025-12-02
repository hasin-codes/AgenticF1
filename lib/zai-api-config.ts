/**
 * Z.AI API Configuration
 * 
 * This file allows easy switching between the original Next.js API route
 * and the new Python FastAPI backend with zai-sdk.
 */

// Configuration for different environments
export const API_CONFIG = {
  // Original Next.js API route (direct HTTPS to Z.AI)
  NEXTJS_API: {
    baseUrl: '',
    endpoint: '/api/chat',
    description: 'Original Next.js API route with direct HTTPS calls'
  },
  
  // Python FastAPI backend with zai-sdk
  PYTHON_BACKEND: {
    baseUrl: 'http://localhost:8000',
    endpoint: '/api/chat',
    description: 'Python FastAPI backend using zai-sdk'
  }
}

// Current active configuration
// Change this to switch between implementations
export const CURRENT_API = API_CONFIG.PYTHON_BACKEND

// Helper function to get the full API URL
export const getApiUrl = (): string => {
  return `${CURRENT_API.baseUrl}${CURRENT_API.endpoint}`
}

// Export current configuration for debugging
export const getCurrentApiConfig = () => {
  return {
    ...CURRENT_API,
    fullUrl: getApiUrl()
  }
}