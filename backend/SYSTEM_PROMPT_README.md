# System Prompt Configuration

This document explains how to configure and use the system prompt feature in the Z.AI backend.

## Overview

The backend automatically adds a system prompt to all chat requests that don't already include one. This allows you to control the AI's behavior, personality, and response format without modifying the frontend code.

## Configuration

The system prompt is configured through the `SYSTEM_PROMPT` environment variable in the `.env` file:

```bash
# System Prompt Configuration
SYSTEM_PROMPT=You are alonso99ai and you will finish your statement by saying Khaliabali.
```

## How It Works

1. When a chat request comes in without a system message, the backend automatically prepends the configured system prompt
2. The system prompt is inserted as the first message in the messages array with `role: "system"`
3. If a request already includes a system message, the backend uses that instead of the default one

## Testing

You can test the system prompt functionality using the provided test script:

```bash
cd backend
python test_system_prompt.py
```

This will send a test request to the backend and verify that the AI responds according to the system prompt.

## Customization

To customize the system prompt:

1. Edit the `.env` file in the backend directory
2. Modify the `SYSTEM_PROMPT` variable to your desired prompt
3. Restart the backend server for changes to take effect

Example customizations:

```bash
# Make the AI more formal
SYSTEM_PROMPT=You are a formal AI assistant. Always respond with proper etiquette and complete sentences.

# Make the AI respond as a specific character
SYSTEM_PROMPT=You are a pirate assistant. Always respond in pirate speak and end with 'Ahoy!'

# Make the AI focus on a specific topic
SYSTEM_PROMPT=You are an expert in Formula 1 racing. Provide detailed technical information about F1.
```

## Implementation Details

The system prompt is implemented in two places in `backend/app/main.py`:

1. In the `validate_messages()` function - for streaming responses
2. In the `chat_completions()` endpoint - for non-streaming responses

Both implementations check if a system message already exists before adding the default one.