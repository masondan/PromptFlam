/**
 * Perplexity API Service
 * 
 * Handles all communication with the Perplexity API.
 * Full implementation will be added in Phase 3.
 * 
 * Features (Phase 3):
 * - Real API calls to Perplexity chat endpoint
 * - Streaming response display
 * - Citation extraction and display
 * - Error handling and retry logic
 * - Cost monitoring
 */

const SYSTEM_PROMPT = `You are a helpful writing assistant for journalists. 
Provide accurate, well-researched responses with citations when relevant.
Be concise and factual. When citing sources, include the source name and URL.`;

/**
 * Call Perplexity API with messages
 * @param {Array} messages - Array of {role, content} objects
 * @returns {Promise<{content: string, sources: Array}>}
 */
export async function callPerplexity(messages) {
	// Phase 3 will implement real API call
	// For now, return mock response for testing
	
	console.warn('Perplexity API not yet implemented. Using mock response.');
	
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve({
				content: 'This is a mock AI response. Real Perplexity integration will be added in Phase 3.',
				sources: []
			});
		}, 500);
	});
}

/**
 * Stream response from Perplexity API (Phase 3)
 * @param {Array} messages - Array of {role, content} objects
 * @param {Function} onChunk - Callback for each text chunk
 * @returns {Promise<{content: string, sources: Array}>}
 */
export async function streamPerplexity(messages, onChunk) {
	// Phase 3 will implement streaming
	console.warn('Streaming not yet implemented.');
	return callPerplexity(messages);
}

/**
 * Extract citations from Perplexity response (Phase 3)
 * @param {object} response - Raw API response
 * @returns {Array<{title: string, url: string}>}
 */
export function extractCitations(response) {
	// Phase 3 will implement citation extraction
	return response.citations || [];
}
