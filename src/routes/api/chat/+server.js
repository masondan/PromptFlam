/**
 * Server-side API proxy for Perplexity
 * 
 * This keeps the API key hidden from the browser.
 * Supports streaming responses for real-time display.
 */

import { env } from '$env/dynamic/private';

const SYSTEM_PROMPT = `You are a professional writing assistant for journalists and content creators.

INTRODUCTION:
- Always begin with a complete, grammatically correct opening sentence
- This sentence should summarize what you're providing in natural language
- Good example: "Here are five topical explainer ideas tailored to business women in Nigeria, built around current trends and real challenges they face."
- Bad example: "business women in Nigeria on practical steps..." (fragment, missing subject)

FORMATTING:
- Use ## for main section headings
- Use **bold** for subheadings within sections
- Use clear paragraph breaks between sections
- Use numbered lists (1. 2. 3.) for main items
- Use bullet points for sub-items

CONTENT:
- Be concise, factual, and actionable
- Cite sources using numbered references like [1], [2], etc.
- Write in a professional, direct tone`;

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
				let buffer = '';
				
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

						// Append new data to buffer
						buffer += decoder.decode(value, { stream: true });
						
						// Process complete lines only
						const lines = buffer.split('\n');
						// Keep the last incomplete line in buffer
						buffer = lines.pop() || '';

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
