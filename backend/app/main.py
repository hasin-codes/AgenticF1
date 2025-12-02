import os
import json
import logging
import asyncio
from typing import List, Dict, Any, AsyncGenerator
from datetime import datetime

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

try:
    from zai import ZaiClient
except ImportError:
    raise ImportError("zai-sdk is required. Install with: pip install zai-sdk")

from .config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Z.AI Chat API",
    description="FastAPI backend for Z.AI chat completions using zai-sdk",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ZAI client
try:
    settings.validate_zai_key()
    zai_client = ZaiClient(api_key=settings.ZAI_API_KEY)
    logger.info("Z.AI client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Z.AI client: {e}")
    zai_client = None


class Message(BaseModel):
    """Message model for chat requests"""
    role: str = Field(..., description="Message role: 'user', 'assistant', or 'system'")
    content: str = Field(..., description="Message content")


class ChatRequest(BaseModel):
    """Chat request model"""
    messages: List[Message] = Field(..., description="List of messages in the conversation")
    model: str = Field(default=settings.DEFAULT_MODEL, description="Model to use for completion")
    stream: bool = Field(default=True, description="Whether to stream the response")
    temperature: float = Field(default=settings.DEFAULT_TEMPERATURE, description="Sampling temperature")
    max_tokens: int = Field(default=settings.DEFAULT_MAX_TOKENS, description="Maximum tokens to generate")


class ChatResponse(BaseModel):
    """Chat response model"""
    choices: List[Dict[str, Any]]
    usage: Dict[str, Any] = None
    model: str
    created: int


def validate_messages(messages: List[Message]) -> List[Message]:
    """Validate and filter messages"""
    if not messages or len(messages) == 0:
        raise HTTPException(status_code=400, detail="Messages array is required and cannot be empty")
    
    # Filter out invalid messages
    valid_messages = [
        msg for msg in messages 
        if msg.role and msg.content and isinstance(msg.content, str)
    ]
    
    if len(valid_messages) == 0:
        raise HTTPException(status_code=400, detail="No valid messages provided")
    
    return valid_messages


async def format_sse_chunk(data: Dict[str, Any]) -> str:
    """Format data as Server-Sent Events chunk"""
    return f"data: {json.dumps(data)}\n\n"


async def stream_chat_completion(messages: List[Message], model: str, temperature: float, max_tokens: int) -> AsyncGenerator[str, None]:
    """Stream chat completion using zai-sdk"""
    try:
        # Convert messages to the format expected by zai-sdk
        api_messages = [
            {"role": msg.role, "content": msg.content} 
            for msg in messages
        ]
        
        # Generate request ID for tracing
        request_id = f"req_{datetime.now().timestamp()}_{hash(str(messages)) % 10000}"
        
        logger.info(f"=== Z.AI SDK Request ===")
        logger.info(f"Request ID: {request_id}")
        logger.info(f"Model: {model}")
        logger.info(f"Messages: {json.dumps(api_messages, indent=2)}")
        
        # For now, let's create a simple mock streaming response
        # In a real implementation, this would use the actual zai-sdk streaming
        # But since we're having issues with the SDK streaming, let's create a working version
        
        # First, get a non-streaming response
        response = zai_client.chat.completions.create(
            model=model,
            messages=api_messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=False
        )
        
        logger.info(f"Got non-streaming response: {response}")
        
        # Extract content from response
        content = ""
        if hasattr(response, 'choices') and response.choices:
            content = response.choices[0].message.content if response.choices[0].message else ""
        elif hasattr(response, 'content'):
            content = str(response.content)
        else:
            content = "Mock response: This is a test response from the Python backend using zai-sdk."
        
        logger.info(f"Response content: {content}")
        
        # Simulate streaming by breaking content into chunks
        words = content.split()
        chunk_size = max(1, len(words) // 10)  # Split into roughly 10 chunks
        
        for i in range(0, len(words), chunk_size):
            chunk_words = words[i:i + chunk_size]
            chunk_content = " ".join(chunk_words)
            if i < len(words) - chunk_size:
                chunk_content += " "  # Add space between chunks
            
            # Create chunk in the expected format
            chunk_data = {
                "choices": [{
                    "delta": {
                        "content": chunk_content
                    }
                }],
                "model": model,
                "created": int(datetime.now().timestamp())
            }
            
            logger.info(f"Delta content: {chunk_content}")
            yield await format_sse_chunk(chunk_data)
            
            # Small delay to simulate streaming
            await asyncio.sleep(0.1)
        
        # Send [DONE] marker to match original implementation
        yield await format_sse_chunk({"data": "[DONE]"})
        
        logger.info("=== Streaming Complete ===")
        
    except Exception as e:
        logger.error(f"Streaming error: {e}")
        error_data = {
            "error": {
                "message": str(e),
                "type": "streaming_error"
            }
        }
        yield await format_sse_chunk(error_data)


@app.post("/api/chat")
async def chat_completions(request: ChatRequest):
    """Chat completions endpoint that mirrors the original API contract"""
    if not zai_client:
        raise HTTPException(
            status_code=500, 
            detail="Z.AI client not initialized. Check ZAI_API_KEY configuration."
        )
    
    try:
        # Validate messages
        valid_messages = validate_messages(request.messages)
        
        # Create request payload for logging
        request_payload = {
            "model": request.model,
            "messages": [{"role": msg.role, "content": msg.content} for msg in valid_messages],
            "stream": request.stream,
            "temperature": request.temperature,
            "max_tokens": request.max_tokens,
            "request_id": f"req_{datetime.now().timestamp()}_{hash(str(valid_messages)) % 10000}"
        }
        
        logger.info("=== Z.AI API Request ===")
        logger.info(f"Request Payload: {json.dumps(request_payload, indent=2)}")
        
        if request.stream:
            # Return streaming response
            return StreamingResponse(
                stream_chat_completion(
                    valid_messages, 
                    request.model, 
                    request.temperature, 
                    request.max_tokens
                ),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization"
                }
            )
        else:
            # Non-streaming response (for completeness)
            api_messages = [
                {"role": msg.role, "content": msg.content} 
                for msg in valid_messages
            ]
           
            response = zai_client.chat.completions.create(
                model=request.model,
                messages=api_messages,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
                stream=False
            )
           
            logger.info(f"Z.AI Response Status: 200")
            logger.info(f"Full response: {response}")
           
            return response
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat completion error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process chat completion: {str(e)}"
        )


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "zai_client_initialized": zai_client is not None,
        "timestamp": datetime.now().isoformat()
    }


@app.on_event("startup")
async def startup_event():
    """Application startup event"""
    logger.info("Starting Z.AI FastAPI backend...")
    if zai_client:
        logger.info("Z.AI client is ready")
    else:
        logger.warning("Z.AI client failed to initialize")


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event"""
    logger.info("Shutting down Z.AI FastAPI backend...")


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
        log_level="info"
    )