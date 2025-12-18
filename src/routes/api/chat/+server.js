/**
 * Server-side API proxy for Perplexity
 * 
 * This keeps the API key hidden from the browser.
 * Supports streaming responses for real-time display.
 */

import { env } from '$env/dynamic/private';

const SYSTEM_PROMPT = `You are a helpful writing assistant for journalists and content creators. 
Provide accurate, well-researched responses with citations when relevant.
Be concise and factual. Always cite your sources using numbered references like [1], [2], etc.`;

export async function POST({ request }) {
	try {
		const { messages } = await request.json();

		if (!messages || !Array.isArray(messages)) {
			return new Response(JSON.stringify({ error: 'Messages array required' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const apiKey = env.PERPLEXITY_API_KEY;
		
		if (!apiKey) {
			return new Response(JSON.stringify({ error: 'API key not configured. Add PERPLEXITY_API_KEY to .env.local' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const response = await fetch('https://api.perplexity.ai/chat/completions', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${apiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model: 'sonar',
				messages: [
					{ role: 'system', content: SYSTEM_PROMPT },
					...messages.map(m => ({ role: m.role, content: m.content }))
				],
				temperature: 0.7,
				max_tokens: 1500,
				stream: true,
				search_recency_filter: 'month'
			})
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			const errorMessage = errorData.error?.message || `API error: ${response.status}`;
			
			return new Response(JSON.stringify({ error: errorMessage }), {
				status: response.status,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Stream the response back to the client
		const reader = response.body.getReader();
		const encoder = new TextEncoder();
		const decoder = new TextDecoder();

		const stream = new ReadableStream({
			async start(controller) {
				let citations = [];
				
				try {
					while (true) {
						const { done, value } = await reader.read();
						
						if (done) {
							// Send citations at the end
							controller.enqueue(encoder.encode(`data: ${JSON.stringify({ citations })}\n\n`));
							controller.enqueue(encoder.encode('data: [DONE]\n\n'));
							controller.close();
							break;
						}

						const chunk = decoder.decode(value, { stream: true });
						const lines = chunk.split('\n');

						for (const line of lines) {
							if (line.startsWith('data: ')) {
								const data = line.slice(6);
								
								if (data === '[DONE]') {
									continue;
								}

								try {
									const parsed = JSON.parse(data);
									
									// Extract citations if present
									if (parsed.citations) {
										citations = parsed.citations;
									}
									
									// Extract content delta
									const content = parsed.choices?.[0]?.delta?.content;
									if (content) {
										controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
									}
								} catch {
									// Skip malformed JSON lines
								}
							}
						}
					}
				} catch (error) {
					controller.error(error);
				}
			}
		});

		return new Response(stream, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				'Connection': 'keep-alive'
			}
		});

	} catch (error) {
		console.error('Chat API error:', error);
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}
