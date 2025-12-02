import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

interface Message {
	role: 'user' | 'assistant' | 'system';
	content: string;
}

export async function POST(req: Request) {
	const { messages }: { messages: Message[] } = await req.json();  // Expect { messages: [{ role: 'user', content: '...' }, ...] }

	// Generate JWT
	const apiKey = process.env.ZAI_API_KEY;
	
	if (!apiKey || !apiKey.includes('.')) {
		console.error('Invalid or missing ZAI_API_KEY in environment variables. It should be in id.secret format.');
		return NextResponse.json({
			error: 'Invalid or missing ZAI_API_KEY in environment variables. It should be in id.secret format.'
		}, { status: 500 });
	}

	const [id, secret] = apiKey.split('.');
	const nowMs = Date.now();  // Use milliseconds as Z.AI expects
	
	const payload = {
		api_key: id,
		exp: nowMs + (60 * 60 * 1000),  // 1 hour in milliseconds
		timestamp: nowMs,
	};

	const header = { alg: 'HS256', typ: 'JWT', sign_type: 'SIGN' };  // Required for Z.AI
	
	try {
		const token = jwt.sign(payload, secret, { header });
		
		// Validate messages array
		if (!messages || messages.length === 0) {
			throw new Error('Messages array is required and cannot be empty');
		}
		
		// Filter out any invalid messages
		const validMessages = messages.filter((msg) => msg.role && msg.content && typeof msg.content === 'string');
		if (validMessages.length === 0) {
			throw new Error('No valid messages provided');
		}

		// Create request payload with safety parameters
		const requestPayload = {
			model: 'glm-4.6',  // Use the working model
			messages: validMessages,
			stream: true,
			temperature: 0.7,
			max_tokens: 2048,
			request_id: `req_${Date.now()}_${Math.random().toString(36).slice(2)}`,  // Add request ID for tracing
		};

		// Detailed logging
		console.log('=== Z.AI API Request ===');
		console.log('Request Payload:', JSON.stringify(requestPayload, null, 2));
		console.log('Generated JWT (first 50 chars):', token.slice(0, 50));

		const response = await fetch('https://api.z.ai/api/paas/v4/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`,
			},
			body: JSON.stringify(requestPayload),
		});

		console.log('Z.AI Response Status:', response.status);
		console.log('Z.AI Response Headers:', Object.fromEntries(response.headers.entries()));

		if (!response.ok) {
			const errorText = await response.text();  // Get raw body for better error info
			console.error('Z.AI Error Body:', errorText);
			return NextResponse.json({
				error: `HTTP error! status: ${response.status}. Body: ${errorText}`
			}, { status: response.status });
		}

		// Handle streaming with robust parsing
		const reader = response.body?.getReader();
		if (!reader) {
			throw new Error('No response body reader available');
		}

		const decoder = new TextDecoder();
		let buffer = '';
		let fullResponse = '';
		
		const stream = new ReadableStream({
			async start(controller) {
				console.log('=== Streaming Response Started ===');
				try {
					while (true) {
						const { done, value } = await reader.read();
						if (done) {
							console.log('=== Streaming Complete ===');
							console.log('Full response:', fullResponse);
							break;
						}
						
						const chunk = decoder.decode(value, { stream: true });
						buffer += chunk;
						fullResponse += chunk;
						
						// Process SSE chunks
						const lines = buffer.split('\n');
						buffer = lines.pop() || '';  // Keep last partial line
						
						for (const line of lines) {
							if (line.startsWith('data: ')) {
								const dataStr = line.slice(6);
								if (dataStr === '[DONE]') continue;  // End marker
								
								try {
									const data = JSON.parse(dataStr);
									const delta = data.choices?.[0]?.delta?.content || '';
									if (delta) {
										console.log('Delta content:', delta);
									}
								} catch (parseErr) {
									console.warn('Failed to parse chunk:', dataStr, parseErr);
									// Skip bad chunk instead of crashing
								}
							}
						}
						
						controller.enqueue(value);
					}
				} catch (error) {
					console.error('Streaming error:', error);
					controller.error(error);
				} finally {
					controller.close();
				}
			},
		});

		return new NextResponse(stream, {
			headers: { 'Content-Type': 'text/event-stream' },
		});

	} catch (error) {
		console.error('JWT Generation or API Request Error:', error);
		return NextResponse.json({
			error: 'Failed to generate JWT or make API request',
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
}