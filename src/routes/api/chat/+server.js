/**
 * Server-side API proxy for Perplexity
 * 
 * This keeps the API key hidden from the browser.
 * Supports streaming responses for real-time display.
 */

import { env } from '$env/dynamic/private';

const SYSTEM_PROMPT = `You are a writing assistant for journalists and content creators. Use British English.

FORMATTING — applies to every response, regardless of content type:
- The user's prompt will tell you what structure to use (eg HEADLINES/SUMMARY/DRAFT, Host/Expert, Claim/Fact/Verdict, a table, etc). Follow that structure exactly as instructed.
- Whenever you output a top-level section label (eg HEADLINES, SUMMARY, DRAFT), render it as a markdown heading on its own line: ## Section label
- Whenever an item has its own subheading (eg a numbered listicle item, a Q&A question, a timeline milestone), render the subheading as ### on its own line, followed by a blank line, then the body text starting on a new line below it. Never put a subheading and its body text on the same line.
- Never embed a heading marker mid-sentence or skip the blank line after a heading.
- Keep sentences short — aim for under 35 words. Split longer sentences.
- Cite sources using numbered references like [1], [2], etc.`;

export async function POST({ request }) {
	try {
		const { messages, styleGuide, includeStyleGuide } = await request.json();

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

		// Build system prompt. The style guide is only appended when the
		// active prompt template has styleGuideIncluded: true (decided by
		// the frontend, which knows which prompt was selected) AND the
		// caller actually sent styleGuide content. This preserves the
		// per-prompt opt-in from prompts-1.json (eg Image gen, Logo design
		// and Social Media Campaign never include it).
		let systemPrompt = SYSTEM_PROMPT;

		if (includeStyleGuide && styleGuide) {
			systemPrompt += `\n\nSTYLE GUIDE — follow these editorial standards in addition to the rules above:\n${styleGuide}`;
		}

		const response = await fetch('https://api.perplexity.ai/chat/completions', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${apiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model: 'sonar-pro',
				messages: [
					{ role: 'system', content: systemPrompt },
					...messages.map(m => ({ role: m.role, content: m.content }))
				],
				temperature: 0.7,
				max_tokens: 8000,
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
									
									// Log finish reason for debugging truncation
									const finishReason = parsed.choices?.[0]?.finish_reason;
									if (finishReason) {
										console.log(`[Perplexity] finish_reason: ${finishReason}`);
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