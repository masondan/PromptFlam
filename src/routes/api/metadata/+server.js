/**
 * Server-side API to fetch metadata from URLs
 * 
 * Fetches Open Graph and meta tags from citation URLs
 * to provide rich source display.
 */

export async function POST({ request }) {
	try {
		const { urls } = await request.json();

		if (!urls || !Array.isArray(urls)) {
			return new Response(JSON.stringify({ error: 'URLs array required' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Fetch metadata for all URLs in parallel with timeout
		const metadataPromises = urls.map(url => fetchMetadata(url));
		const results = await Promise.all(metadataPromises);

		// Create a map of URL to metadata
		const metadata = {};
		urls.forEach((url, index) => {
			metadata[url] = results[index];
		});

		return new Response(JSON.stringify({ metadata }), {
			headers: { 'Content-Type': 'application/json' }
		});

	} catch (error) {
		console.error('Metadata API error:', error);
		return new Response(JSON.stringify({ error: 'Failed to fetch metadata' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}

/**
 * Fetch metadata from a single URL with timeout
 */
async function fetchMetadata(url) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 5000);

	try {
		const response = await fetch(url, {
			signal: controller.signal,
			headers: {
				'User-Agent': 'Mozilla/5.0 (compatible; PromptFlam/1.0)',
				'Accept': 'text/html'
			}
		});

		clearTimeout(timeout);

		if (!response.ok) {
			return null;
		}

		// Read only first 50KB to get meta tags
		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let html = '';
		let bytesRead = 0;
		const maxBytes = 50000;

		while (bytesRead < maxBytes) {
			const { done, value } = await reader.read();
			if (done) break;
			
			html += decoder.decode(value, { stream: true });
			bytesRead += value.length;

			// Stop early if we've found closing head tag
			if (html.includes('</head>')) break;
		}

		reader.cancel();

		return parseMetadata(html, url);

	} catch (error) {
		clearTimeout(timeout);
		return null;
	}
}

/**
 * Parse HTML to extract title and description
 */
function parseMetadata(html, url) {
	const metadata = {
		title: null,
		excerpt: null
	};

	// Try Open Graph title first
	const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
						  html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
	if (ogTitleMatch) {
		metadata.title = decodeHtmlEntities(ogTitleMatch[1]);
	}

	// Fallback to regular title tag
	if (!metadata.title) {
		const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
		if (titleMatch) {
			metadata.title = decodeHtmlEntities(titleMatch[1].trim());
		}
	}

	// Try Open Graph description
	const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
						 html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i);
	if (ogDescMatch) {
		metadata.excerpt = decodeHtmlEntities(ogDescMatch[1]);
	}

	// Fallback to meta description
	if (!metadata.excerpt) {
		const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
						   html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
		if (descMatch) {
			metadata.excerpt = decodeHtmlEntities(descMatch[1]);
		}
	}

	return metadata;
}

/**
 * Decode common HTML entities
 */
function decodeHtmlEntities(text) {
	if (!text) return text;
	
	return text
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&nbsp;/g, ' ')
		.replace(/&#x27;/g, "'")
		.replace(/&#x2F;/g, '/')
		.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(num));
}
