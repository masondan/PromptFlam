/**
 * Icon Barrel Export
 * 
 * Central export for all SVG icons from public/icons/
 * Icons are loaded as raw SVG strings and rendered via Icon.svelte component.
 * 
 * Naming convention: icon-{name}.svg and icon-{name}-fill.svg for variants
 * 
 * Usage:
 *   import { Icon } from '$lib/components';
 *   <Icon name="send" size={24} />
 *   <Icon name="create" filled={true} size={24} />
 */

// Icon paths - these map to files in /public/icons/
export const iconPaths = {
	// Navigation icons
	create: '/icons/icon-create.svg',
	'create-fill': '/icons/icon-create-fill.svg',
	prompts: '/icons/icon-prompts.svg',
	'prompts-fill': '/icons/icon-prompts-fill.svg',
	edit: '/icons/icon-edit.svg',
	'edit-fill': '/icons/icon-edit-fill.svg',
	archive: '/icons/icon-archive.svg',
	'archive-fill': '/icons/icon-archive-fill.svg',
	
	// Chat/Create page icons
	send: '/icons/icon-send.svg',
	close: '/icons/icon-close.svg',
	newchat: '/icons/icon-newchat.svg',
	
	// Response action icons
	rewrite: '/icons/icon-rewrite.svg',
	sources: '/icons/icon-sources.svg',
	info: '/icons/icon-info.svg'
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
