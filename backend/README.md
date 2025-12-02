# Z.AI FastAPI Backend

This Python FastAPI backend provides a drop-in replacement for the Next.js API routes, using the official `zai-sdk` instead of direct HTTPS calls to Z.AI services.

## Features

- **API Compatibility**: Maintains the exact same `/api/chat` endpoint contract as the original Next.js implementation
- **Streaming Support**: Full streaming response support with Server-Sent Events (SSE)
- **Authentication**: Uses ZAI_API_KEY environment variable for secure authentication
- **Error Handling**: Comprehensive error handling that matches the original implementation
- **Logging**: Detailed logging for debugging and monitoring

## Quick Start

### 1. Set up Python Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your Z.AI API key
ZAI_API_KEY=your_actual_zai_api_key_here
```

### 3. Run the Server

```bash
# Using the startup script
python run.py

# Or directly with uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The server will start on `http://localhost:8000`

## API Endpoints

### POST /api/chat

Chat completions endpoint that mirrors the original Next.js API route.

**Request Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ],
  "model": "glm-4.6",
  "stream": true,
  "temperature": 0.7,
  "max_tokens": 2048
}
```

**Response (Streaming):**
```
data: {"choices": [{"delta": {"content": "Hello"}}], "model": "glm-4.6", "created": 1234567890}

data: {"choices": [{"delta": {"content": "!"}}], "model": "glm-4.6", "created": 1234567890}

data: {"data": "[DONE]"}
```

### GET /health

Health check endpoint to verify the server is running and Z.AI client is initialized.

**Response:**
```json
{
  "status": "healthy",
  "zai_client_initialized": true,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Integration with Next.js Frontend

### Option 1: Update Frontend API URL (Recommended)

Update `lib/zai-api.ts` to point to the Python backend:

```typescript
// Change this line:
const res = await fetch('/api/chat', {

// To this (if backend runs on port 8000):
const res = await fetch('http://localhost:8000/api/chat', {
```

### Option 2: Proxy Requests

You can also configure Next.js to proxy requests to the Python backend by adding to `next.config.ts`:

```typescript
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ]
  },
}
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ZAI_API_KEY` | Your Z.AI API key in format `id.secret` | - | Yes |
| `HOST` | Server host binding | `0.0.0.0` | No |
| `PORT` | Server port | `8000` | No |

## Logging

The backend provides comprehensive logging that matches the original implementation:

- Request logging with full payload details
- Response status and headers
- Streaming chunk details
- Error information with stack traces

Logs are output to the console and include:

```
=== Z.AI SDK Request ===
Request ID: req_1234567890_1234
Model: glm-4.6
Messages: [{"role": "user", "content": "Hello"}]

=== Streaming Response Started ===
Delta content: Hello
Delta content: !
=== Streaming Complete ===
```

## Error Handling

The backend handles various error scenarios:

1. **Missing API Key**: Returns 500 with clear error message
2. **Invalid Messages**: Returns 400 with validation details
3. **Z.AI API Errors**: Properly maps SDK exceptions to HTTP responses
4. **Streaming Errors**: Includes error details in SSE format

## Development

### Project Structure

```
backend/
├── app/
│   ├── __init__.py      # Package initialization
│   ├── main.py          # FastAPI application and endpoints
│   └── config.py        # Configuration management
├── requirements.txt     # Python dependencies
├── .env.example        # Environment variables template
├── run.py              # Startup script
└── README.md           # This file
```

### Adding New Endpoints

To add new endpoints, modify `app/main.py`:

```python
@app.get("/api/new-endpoint")
async def new_endpoint():
    return {"message": "Hello from new endpoint"}
```

### Testing

You can test the API using curl:

```bash
# Test health endpoint
curl http://localhost:8000/health

# Test chat endpoint
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

## Production Deployment

For production deployment:

1. Set environment variables properly
2. Use a production-grade ASGI server (Gunicorn + Uvicorn workers)
3. Implement proper logging and monitoring
4. Set up reverse proxy (nginx) if needed

Example production command:
```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## Troubleshooting

### Common Issues

1. **"ZAI_API_KEY is required"**
   - Make sure you've created `.env` file with your API key
   - Check that the API key is in the correct format (`id.secret`)

2. **"zai-sdk is required"**
   - Install with `pip install zai-sdk`
   - Make sure you're using the correct Python environment

3. **Port already in use**
   - Change the PORT in `.env` file or use a different port
   - Check if another service is using the same port

4. **CORS errors in frontend**
   - The backend includes CORS headers, but you may need to adjust for your specific setup
   - Consider using the proxy approach in Next.js configuration

### Debug Mode

To enable debug logging, set the log level in `run.py`:

```python
uvicorn.run(
    "app.main:app",
    host=settings.HOST,
    port=settings.PORT,
    reload=True,
    log_level="debug"  # Change to "debug"
)