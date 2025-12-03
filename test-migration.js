/**
 * Test script to verify Z.AI migration from HTTPS to Python SDK
 * 
 * This script tests both the original Next.js API route and the new Python backend
 * to ensure they return compatible responses.
 */

const API_ENDPOINTS = {
  NEXTJS: 'http://localhost:3000/api/chat',
  PYTHON: 'http://localhost:8000/api/chat'
}

const TEST_MESSAGE = {
  messages: [
    {
      role: 'user',
      content: 'Hello! This is a test message for migration verification.'
    }
  ]
}

async function testEndpoint(name, url) {
  console.log(`\n=== Testing ${name} Endpoint ===`)
  console.log(`URL: ${url}`)
  console.log(`Request: ${JSON.stringify(TEST_MESSAGE, null, 2)}`)
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(TEST_MESSAGE)
    })
    
    console.log(`Status: ${response.status}`)
    console.log(`Headers:`, Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error Response: ${errorText}`)
      return { success: false, error: errorText }
    }
    
    // Test streaming response
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let chunks = []
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6)
          if (dataStr === '[DONE]') continue
          
          try {
            const data = JSON.parse(dataStr)
            const delta = data.choices?.[0]?.delta?.content || ''
            if (delta) {
              chunks.push(delta)
              process.stdout.write(delta)
            }
          } catch (e) {
            console.warn(`Failed to parse chunk: ${dataStr}`)
          }
        }
      }
    }
    
    console.log('\n=== Streaming Complete ===')
    console.log(`Total chunks: ${chunks.length}`)
    console.log(`Full response: ${chunks.join('')}`)
    
    return { 
      success: true, 
      chunks: chunks.length,
      response: chunks.join(''),
      headers: Object.fromEntries(response.headers.entries())
    }
    
  } catch (error) {
    console.error(`Request failed: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function runTests() {
  console.log('Z.AI Migration Test Suite')
  console.log('========================')
  
  const results = {}
  
  // Test Next.js endpoint (if available)
  try {
    results.nextjs = await testEndpoint('Next.js API', API_ENDPOINTS.NEXTJS)
  } catch (error) {
    console.log('\n⚠️  Next.js endpoint not available (server not running?)')
    results.nextjs = { success: false, error: 'Server not available' }
  }
  
  // Test Python backend
  try {
    results.python = await testEndpoint('Python Backend', API_ENDPOINTS.PYTHON)
  } catch (error) {
    console.log('\n⚠️  Python backend not available (server not running?)')
    results.python = { success: false, error: 'Server not available' }
  }
  
  // Compare results
  console.log('\n\n=== Test Results Comparison ===')
  
  if (results.nextjs.success && results.python.success) {
    console.log('✅ Both endpoints are working!')
    
    // Compare response patterns
    const nextjsHeaders = JSON.stringify(results.nextjs.headers, null, 2)
    const pythonHeaders = JSON.stringify(results.python.headers, null, 2)
    
    console.log('\nNext.js Headers:', nextjsHeaders)
    console.log('\nPython Headers:', pythonHeaders)
    
    // Check if both have streaming responses
    const nextjsStreaming = results.nextjs.chunks > 0
    const pythonStreaming = results.python.chunks > 0
    
    if (nextjsStreaming && pythonStreaming) {
      console.log('\n✅ Both endpoints support streaming!')
      console.log(`Next.js chunks: ${results.nextjs.chunks}`)
      console.log(`Python chunks: ${results.python.chunks}`)
    } else {
      console.log('\n⚠️  Streaming behavior differs between endpoints')
    }
    
  } else {
    console.log('\n❌ One or both endpoints failed:')
    if (!results.nextjs.success) {
      console.log(`  Next.js: ${results.nextjs.error}`)
    }
    if (!results.python.success) {
      console.log(`  Python: ${results.python.error}`)
    }
  }
  
  console.log('\n=== Migration Status ===')
  if (results.python.success) {
    console.log('✅ Python backend is ready for migration!')
    console.log('\nTo complete migration:')
    console.log('1. Update lib/zai-api-config.ts to use API_CONFIG.PYTHON_BACKEND')
    console.log('2. Ensure Python backend is running in production')
    console.log('3. Test with the actual Next.js frontend')
  } else {
    console.log('❌ Python backend needs attention before migration')
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error)
}

module.exports = { testEndpoint, runTests }