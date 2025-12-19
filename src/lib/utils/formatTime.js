/**
 * Format a timestamp as a relative time string
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} - Relative time string like "2 hours ago", "Yesterday", "Dec 15"
 */
export function formatRelativeTime(timestamp) {
	const now = Date.now();
	const diff = now - timestamp;
	
	const seconds = Math.floor(diff / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);
	
	if (seconds < 60) {
		return 'Just now';
	}
	
	if (minutes < 60) {
		return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
	}
	
	if (hours < 24) {
		return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
	}
	
	if (days === 1) {
		return 'Yesterday';
	}
	
	if (days < 7) {
		return `${days} days ago`;
	}
	
	// For older dates, show the date
	const date = new Date(timestamp);
	const options = { month: 'short', day: 'numeric' };
	
	// Add year if not current year
	if (date.getFullYear() !== new Date().getFullYear()) {
		options.year = 'numeric';
	}
	
	return date.toLocaleDateString('en-US', options);
}

/**
 * Get a preview text from content (first 100 chars, truncated)
 * @param {string} content - Full content string
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} - Truncated preview with ellipsis if needed
 */
export function getPreviewText(content, maxLength = 100) {
	if (!content) return '';
	
	// Remove markdown formatting for cleaner preview
	const cleaned = content
		.replace(/[#*_`~\[\]]/g, '')
		.replace(/\n+/g, ' ')
		.trim();
	
	if (cleaned.length <= maxLength) {
		return cleaned;
	}
	
	return cleaned.substring(0, maxLength).trim() + '...';
}

/**
 * Get a title from chat messages (first user message, truncated)
 * @param {array} messages - Array of chat messages
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} - Title derived from first user message
 */
export function getChatTitle(messages, maxLength = 80) {
	if (!messages || messages.length === 0) return 'Untitled Chat';
	
	const firstUserMessage = messages.find(m => m.role === 'user');
	if (!firstUserMessage) return 'Untitled Chat';
	
	const content = firstUserMessage.content;
	if (content.length <= maxLength) {
		return content;
	}
	
	return content.substring(0, maxLength).trim() + '...';
}

/**
 * Get body preview from chat messages (first assistant response)
 * @param {array} messages - Array of chat messages
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} - Preview of first assistant response
 */
export function getChatPreview(messages, maxLength = 100) {
	if (!messages || messages.length === 0) return '';
	
	const firstAssistantMessage = messages.find(m => m.role === 'assistant');
	if (!firstAssistantMessage) return '';
	
	return getPreviewText(firstAssistantMessage.content, maxLength);
}
