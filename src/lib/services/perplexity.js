/**
 * Perplexity API Service
 * 
 * Communicates with our server-side proxy to keep API key secure.
 * Supports streaming for real-time response display.
 */

/**
 * Call Perplexity API with streaming support
 * @param {Array} messages - Array of {role, content} objects
 * @param {Function} onChunk - Callback for each text chunk (for streaming)
 * @returns {Promise<{content: string, sources: Array}>}
 */
export async function callPerplexity(messages, onChunk = null) {
	const response = await fetch('/api/chat', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ messages })
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ error: 'Request failed' }));
		throw new Error(error.error || `API error: ${response.status}`);
	}

	// Handle streaming response
	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	
	let fullContent = '';
	let citations = [];

	try {
		while (true) {
			const { done, value } = await reader.read();
			
			if (done) break;

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
						
						// Handle content chunks
						if (parsed.content) {
							fullContent += parsed.content;
							if (onChunk) {
								onChunk(parsed.content, fullContent);
							}
						}
						
						// Handle citations (sent at end)
						if (parsed.citations) {
							citations = parsed.citations;
						}
					} catch {
						// Skip malformed JSON
					}
				}
			}
		}
	} catch (error) {
		console.error('Stream reading error:', error);
		throw error;
	}

	// Transform citations to our source format
	const sources = formatCitations(citations);

	return {
		content: fullContent,
		sources
	};
}

/**
 * Format Perplexity citations to our source format
 * @param {Array} citations - Raw citations from API
 * @returns {Array<{title: string, url: string, excerpt: string, domain: string}>}
 */
function formatCitations(citations) {
	if (!citations || !Array.isArray(citations)) {
		return [];
	}

	return citations.map((citation, index) => {
		// Perplexity returns citations as URLs or objects
		if (typeof citation === 'string') {
			const domain = extractDomain(citation);
			return {
				title: null, // Will be enriched by metadata fetch or use domain fallback
				url: citation,
				excerpt: '',
				domain
			};
		}

		return {
			title: citation.title || null,
			url: citation.url || citation,
			excerpt: citation.snippet || citation.excerpt || '',
			domain: extractDomain(citation.url || citation)
		};
	});
}

/**
 * Extract domain from URL
 * @param {string} url 
 * @returns {string}
 */
function extractDomain(url) {
	try {
		const urlObj = new URL(url);
		return urlObj.hostname.replace('www.', '');
	} catch {
		return url;
	}
}
