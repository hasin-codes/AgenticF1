import { getApiUrl, getCurrentApiConfig } from './zai-api-config'

export interface Message {
	id: number
	role: 'user' | 'ai' | 'system'
	content: string
	timestamp: string
	hasAction?: boolean
}

export interface ChatRequest {
	messages: Array<{
		role: 'user' | 'assistant' | 'system'
		content: string
	}>
	model?: string
	stream?: boolean
}

export const sendStreamingChatMessage = async (
	messages: ChatRequest['messages'],
	model = 'glm-4.6',  // Use the working model by default
	onChunk: (chunk: string) => void
): Promise<void> => {
	try {
		// Validate messages before sending
		if (!messages || messages.length === 0) {
			throw new Error('Messages array is required and cannot be empty');
		}

		// Log client-side request
		const apiUrl = getApiUrl()
		const apiConfig = getCurrentApiConfig()
		
		console.log('=== Client Request to API ===');
		console.log('API Configuration:', apiConfig);
		console.log('Sending messages:', JSON.stringify(messages, null, 2));
		console.log('Model:', model);
		console.log('Request URL:', apiUrl);

		const res = await fetch(apiUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ messages }),
		});

		console.log('API Response status:', res.status);
		console.log('API Response headers:', Object.fromEntries(res.headers.entries()));

		if (!res.ok) {
			const errorText = await res.text();
			console.error('API Error Response:', errorText);
			throw new Error(`HTTP error! status: ${res.status}. Body: ${errorText}`);
		}

		const reader = res.body?.getReader();
		if (!reader) {
			throw new Error('No response body reader available');
		}

		const decoder = new TextDecoder();
		let buffer = '';
		let assistantMessage = '';
		let chunkCount = 0;

		console.log('=== Client-Side Streaming Started ===');

		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				console.log('=== Client-Side Streaming Complete ===');
				console.log('Total chunks received:', chunkCount);
				console.log('Full assistant message:', assistantMessage);
				break;
			}

			buffer += decoder.decode(value, { stream: true });
			chunkCount++;
			
			console.log(`Raw chunk ${chunkCount}:`, buffer);
			
			// Process SSE chunks with robust parsing
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
							assistantMessage += delta;
							console.log('Delta content:', delta);
							onChunk(delta);
						}
					} catch (parseErr) {
						console.warn('Failed to parse chunk:', dataStr, parseErr);
						// Skip bad chunk instead of crashing
					}
				}
			}
		}
	} catch (error) {
		console.error('Z.AI Streaming API Error:', error);
		throw new Error('Failed to get streaming response from AI service');
	}
}