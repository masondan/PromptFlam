/**
 * Text processing utilities
 */

/**
 * Strips citation markers from text
 * Removes patterns like [1], [2], [3] etc. - does NOT modify whitespace
 * @param {string} text - The text to clean
 * @returns {string} - Text with citations removed
 */
export function stripCitations(text) {
	return text.replace(/\[\d+\]/g, '');
}

/**
 * Normalizes line breaks while preserving paragraph structure
 * Collapses excessive blank lines to max 2, trims trailing whitespace per line
 * @param {string} text - The text to normalize
 * @returns {string} - Text with normalized line breaks
 */
export function normalizeLineBreaks(text) {
	return text
		.split('\n')
		.map(line => line.trimEnd())
		.join('\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

/**
 * Strips markdown formatting to produce plain text
 * Removes **bold**, *italic*, __underline__, etc.
 * Converts numbered lists to dashes
 * @param {string} text - The markdown text to clean
 * @returns {string} - Plain text without markdown formatting
 */
export function stripMarkdownFormatting(text) {
	return text
		// Remove bold/italic: **text**, *text*, __text__, _text_
		.replace(/\*\*(.+?)\*\*/g, '$1')
		.replace(/\*(.+?)\*/g, '$1')
		.replace(/__(.+?)__/g, '$1')
		.replace(/_(.+?)_/g, '$1')
		// Remove strikethrough: ~~text~~
		.replace(/~~(.+?)~~/g, '$1')
		// Remove inline code: `code`
		.replace(/`(.+?)`/g, '$1')
		// Convert numbered lists to dashes (e.g., "1. item" -> "- item")
		.replace(/^\d+\.\s+/gm, '- ')
		// Remove markdown headers (keep the text)
		.replace(/^#{1,6}\s+/gm, '');
}

/**
 * Formats markdown content for copying - strips citations, markdown formatting, and normalizes whitespace
 * Use this for full message copy operations
 * @param {string} text - The markdown text to format
 * @returns {string} - Clean plain text ready for clipboard
 */
export function formatMarkdownForCopy(text) {
	let result = stripCitations(text);
	result = stripMarkdownFormatting(result);
	result = normalizeLineBreaks(result);
	return result;
}

/**
 * Extracts clean text from a DOM selection, skipping citation buttons
 * Preserves block structure with newlines
 * @param {Selection} selection - The window selection object
 * @returns {string} - Clean extracted text
 */
export function extractSelectionText(selection) {
	if (!selection || selection.rangeCount === 0) return '';
	
	const range = selection.getRangeAt(0);
	const fragment = range.cloneContents();
	
	function extractText(node, isFirst = true) {
		let text = '';
		
		for (const child of node.childNodes) {
			if (child.nodeType === Node.TEXT_NODE) {
				text += child.textContent;
			} else if (child.nodeType === Node.ELEMENT_NODE) {
				const tagName = child.tagName.toLowerCase();
				
				// Skip citation buttons entirely
				if (child.classList?.contains('citation')) {
					continue;
				}
				
				// Block elements get newlines
				const blockElements = ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote', 'br'];
				const isBlock = blockElements.includes(tagName);
				
				// Add prefix for headings
				if (tagName.match(/^h[1-6]$/)) {
					text += '\n\n';
				} else if (tagName === 'li') {
					text += '\n- ';
				} else if (tagName === 'p' && text.length > 0) {
					text += '\n\n';
				} else if (tagName === 'br') {
					text += '\n';
				}
				
				// Recurse into children
				text += extractText(child, false);
				
				// Add trailing newline for certain blocks
				if (tagName === 'blockquote') {
					text += '\n';
				}
			}
		}
		
		return text;
	}
	
	let result = extractText(fragment);
	result = normalizeLineBreaks(result);
	
	return result;
}
