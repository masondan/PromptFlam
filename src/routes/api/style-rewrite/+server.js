/**
 * Server-side API proxy for Claude — Style Rewrite
 *
 * Accepts POST { original: string, language: string }
 * Returns { rewrites: string[] } — three alternative rewrites.
 */

import { env } from '$env/dynamic/private';

const REWRITE_SYSTEM_PROMPT =
	'You are a professional sub-editor working to BBC/Reuters standards. ' +
	'Respond with ONLY a valid JSON array of strings. No preamble, no markdown fences.';

export async function POST({ request }) {
	try {
		const body = await request.json();
		const { original, language } = body;

		if (!original || !original.trim()) {
			return new Response(JSON.stringify({ error: 'No sentence provided' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const apiKey = env.ANTHROPIC_API_KEY;

		if (!apiKey) {
			return new Response(JSON.stringify({ error: 'API key not configured' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const selectedLanguage = language || 'British English';
		const userMessage =
			`Provide 3 alternative rewrites for the following sentence to conform to BBC/Reuters style in ${selectedLanguage}. ` +
			`Return as a JSON array of strings only: ["option1", "option2", "option3"]. ` +
			`Sentence: ${original}`;

		const response = await fetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			headers: {
				'x-api-key': apiKey,
				'anthropic-version': '2023-06-01',
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				model: 'claude-sonnet-4-6',
				max_tokens: 1000,
				system: REWRITE_SYSTEM_PROMPT,
				messages: [{ role: 'user', content: userMessage }]
			})
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			const errorMessage = errorData.error?.message || `API error: ${response.status}`;
			console.error('[style-rewrite] Claude API error:', errorMessage);
			return new Response(JSON.stringify({ error: errorMessage }), {
				status: response.status,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const data = await response.json();
		let rawContent = data.content?.[0]?.text || '';

		// Strip markdown code fences if present
		rawContent = rawContent
			.trim()
			.replace(/^```(?:json)?\s*\n?/, '')
			.replace(/\n?```\s*$/, '');

		let rewrites;
		try {
			rewrites = JSON.parse(rawContent);
			if (!Array.isArray(rewrites)) throw new Error('Not an array');
		} catch {
			console.error('[style-rewrite] Failed to parse Claude response:', rawContent);
			return new Response(
				JSON.stringify({ error: 'Rewrite failed — please try again' }),
				{ status: 500, headers: { 'Content-Type': 'application/json' } }
			);
		}

		return new Response(JSON.stringify({ rewrites }), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('[style-rewrite] Internal error:', error);
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}
