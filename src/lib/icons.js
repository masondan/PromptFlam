/**
 * Icon Barrel Export
 * 
 * Central export for all SVG icons from static/icons/
 * Icons are loaded as img tags and rendered via Icon.svelte component.
 * 
 * Naming convention: icon-{name}.svg and icon-{name}-fill.svg for variants
 * 
 * Usage:
 *   import { Icon } from '$lib/components';
 *   <Icon name="send" size={24} />
 *   <Icon name="create" filled={true} size={24} />
 */

// Icon paths - these map to files in /static/icons/
// SvelteKit serves static/ from root, so path is /icons/...
export const iconPaths = {
	// Navigation icons (header)
	create: '/icons/icon-create.svg',
	'create-fill': '/icons/icon-create-fill.svg',
	prompts: '/icons/icon-prompts.svg',
	'prompts-fill': '/icons/icon-prompts-fill.svg',
	edit: '/icons/icon-edit.svg',
	'edit-fill': '/icons/icon-edit-fill.svg',
	notepad: '/icons/icon-notepad.svg',
	'notepad-fill': '/icons/icon-notepad-fill.svg',
	archive: '/icons/icon-archive.svg',
	'archive-fill': '/icons/icon-archive-fill.svg',
	
	// Chat/Create page icons
	send: '/icons/icon-send.svg',
	'send-fill': '/icons/icon-send-fill.svg',
	close: '/icons/icon-close.svg',
	newchat: '/icons/icon-newchat.svg',
	'busy-fill': '/icons/icon-busy-fill.svg',
	
	// Prompt card icons
	expand: '/icons/icon-expand.svg',
	collapse: '/icons/icon-collapse.svg',
	copy: '/icons/icon-copy.svg',
	
	// Response action icons
	rewrite: '/icons/icon-rewrite.svg',
	sources: '/icons/icon-sources.svg',
	share: '/icons/icon-share.svg',
	info: '/icons/icon-info.svg',
	
	// Prompt library icons
	heart: '/icons/icon-heart.svg',
	'heart-fill': '/icons/icon-heart-fill.svg',
	'arrow-up': '/icons/icon-arrow-up.svg',
	search: '/icons/icon-search.svg'
};

// List of all available icon names
export const iconNames = Object.keys(iconPaths);

/**
 * Get the path for an icon
 * @param {string} name - Icon name (e.g., 'send', 'create')
 * @param {boolean} filled - Whether to use filled variant
 * @returns {string} Path to SVG file
 */
export function getIconPath(name, filled = false) {
	const key = filled ? `${name}-fill` : name;
	return iconPaths[key] || iconPaths[name] || null;
}
