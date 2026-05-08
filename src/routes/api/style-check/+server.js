/**
 * Server-side API proxy for Claude — Style Check
 *
 * Accepts POST { text: string, language: string }
 * Returns a JSON array of suggestion objects.
 */

import { env } from '$env/dynamic/private';
import systemPromptRaw from '../../../../static/style-check-system-prompt.md?raw';

const OUTPUT_FORMAT_SUFFIX = `
---
## OUTPUT FORMAT

You must respond with ONLY a valid JSON array. No preamble, no explanation, no markdown fences.

Each item in the array represents one suggestion and must follow this schema exactly:
{
  "id": string,          // unique id: "s1", "s2", "g1", "g2", "st1" etc
  "type": "spelling" | "grammar" | "style",
  "original": string,    // the exact text from the article that needs changing — for missing punctuation, include the full sentence without the punctuation
  "suggested": string,   // the corrected replacement — for missing punctuation, the same sentence with punctuation added
  "reason": string|null, // one sentence only. null for spelling corrections.
  "sentenceIndex": number // 0-based index of the sentence in the article
}

Category guidance:
- "spelling": misspelled words only. reason must be null.
- "grammar": subject-verb agreement, tense, punctuation errors, missing punctuation, sentence fragments, comma splices, quotation mark style violations.
- "style": intro length, passive/active voice, attribution verb judgment, clichés, evaluative adjectives, redundancy, famous-name intro rule, unsupported claims, missing attribution.

If there are no suggestions, return an empty array: []
`;

// Few-shot examples: two article/response pairs that demonstrate
// the judgment calls most likely to be missed by general training.
// These are passed as prior turns before the real article.

const FEW_SHOT_MESSAGES = [
	{
		role: 'user',
		content: `David Beckham has announced he is to retire from football at the end of the season, bringing the curtain down on a glittering 20-year career that took in stints at Manchester United, Real Madrid, LA Galaxy and Paris Saint-Germain, and during which he won numerous trophies and became one of the most recognisable sportsmen on the planet, with his wife Victoria, formerly of the Spice Girls, by his side throughout.`
	},
	{
		role: 'assistant',
		content: `[
  {
    "id": "st1",
    "type": "style",
    "original": "David Beckham has announced he is to retire from football at the end of the season, bringing the curtain down on a glittering 20-year career that took in stints at Manchester United, Real Madrid, LA Galaxy and Paris Saint-Germain, and during which he won numerous trophies and became one of the most recognisable sportsmen on the planet, with his wife Victoria, formerly of the Spice Girls, by his side throughout.",
    "suggested": "David Beckham is to retire from football at the end of the season after a 20-year career spanning Manchester United, Real Madrid, LA Galaxy and Paris Saint-Germain. His wife Victoria, formerly of the Spice Girls, has been by his side throughout.",
    "reason": "Intro exceeds 30 words and contains multiple subsidiary clauses. Split into two clean sentences: the first carries the news, the second the background detail.",
    "sentenceIndex": 0
  },
  {
    "id": "st2",
    "type": "style",
    "original": "glittering",
    "suggested": null,
    "reason": "Evaluative adjective — remove. Let the facts characterise the career.",
    "sentenceIndex": 0
  }
]`
	},
	{
		role: 'user',
		content: `The city was thrown into chaos yesterday when a gunman opened fire in the central market, killing three people. There were no other injuries.
'It was like something from a horror movie' exclaimed one witness, who claimed she saw crowds running to escape the shots.
It is understood a man has been arrested.`
	},
	{
		role: 'assistant',
		content: `[
  {
    "id": "st1",
    "type": "style",
    "original": "The city was thrown into chaos yesterday when a gunman opened fire in the central market, killing three people.",
    "suggested": "Three people died when a gunman opened fire in the central market yesterday.",
    "reason": "Lead with the most important fact. 'Thrown into chaos' is editorialising.",
    "sentenceIndex": 0
  },
  {
    "id": "st2",
    "type": "style",
    "original": "There were no other injuries.",
    "suggested": "There were no other injuries, according to emergency services.",
    "reason": "Attribute facts to a source.",
    "sentenceIndex": 1
  },
  {
    "id": "g1",
    "type": "grammar",
    "original": "'It was like something from a horror movie'",
    "suggested": "\"It was like something from a horror movie\"",
    "reason": "Use double quotation marks for direct speech in both British and American English.",
    "sentenceIndex": 2
  },
  {
    "id": "st3",
    "type": "style",
    "original": "'It was like something from a horror movie' exclaimed one witness, who claimed she saw crowds running to escape the shots.",
    "suggested": "One witness described the scene as \"like something from a horror movie\" as people fled the market.",
    "reason": "'Exclaimed' sensationalises. 'Claimed' implies doubt without basis. Put subject first and simplify.",
    "sentenceIndex": 2
  },
  {
    "id": "st4",
    "type": "style",
    "original": "It is understood a man has been arrested.",
    "suggested": null,
    "reason": "Remove unattributed speculation. Use only if attributed — '[Organisation] understands' or named source.",
    "sentenceIndex": 3
  }
]`
	}
];

export async function POST({ request }) {
	try {
		let body;
		try {
			body = await request.json();
		} catch (parseErr) {
			console.error('[style-check] Failed to parse request body:', parseErr.message);
			return new Response(JSON.stringify({ error: 'Invalid request body', message: parseErr.message }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}
		const { text, language } = body;

		console.log('[style-check] Received POST. Body:', { textLength: text?.length, language, textPreview: text?.substring(0, 50) });

		if (!text || !text.trim()) {
			console.log('[style-check] Rejecting: empty or missing text field');
			return new Response(JSON.stringify({ error: 'No article text provided' }), {
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
		const systemPrompt =
			systemPromptRaw.replace('{{LANGUAGE}}', selectedLanguage) + OUTPUT_FORMAT_SUFFIX;

		// Build messages: few-shot examples first, then the real article
		const messages = [
			...FEW_SHOT_MESSAGES,
			{ role: 'user', content: text }
		];

		const response = await fetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			headers: {
				'x-api-key': apiKey,
				'anthropic-version': '2023-06-01',
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				model: 'claude-sonnet-4-6',
				max_tokens: 4000,
				temperature: 0.3,
				system: systemPrompt,
				messages
			})
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			const errorMessage = errorData.error?.message || `API error: ${response.status}`;
			console.error('[style-check] Claude API error:', errorMessage);
			return new Response(JSON.stringify({ error: errorMessage }), {
				status: response.status,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const data = await response.json();
		let rawContent = data.content?.[0]?.text || '';

		console.log('[style-check] Raw Claude response:', rawContent);

		// Strip markdown code fences if present
		rawContent = rawContent
			.trim()
			.replace(/^```(?:json)?\s*\n?/, '')
			.replace(/\n?```\s*$/, '');

		let suggestions;
		try {
			suggestions = JSON.parse(rawContent);
		} catch {
			console.error('[style-check] Failed to parse Claude response. Raw content:', rawContent);
			console.error('[style-check] Full Claude response object:', JSON.stringify(data, null, 2));
			return new Response(
				JSON.stringify({ error: 'Style check failed — please try again' }),
				{ status: 500, headers: { 'Content-Type': 'application/json' } }
			);
		}

		return new Response(JSON.stringify(suggestions), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('[style-check] Internal error:', error);
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}
