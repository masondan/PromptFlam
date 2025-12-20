/**
 * Icon Barrel Export
 * 
 * Central export for all SVG icons from static/icons/
 * Icons are loaded as raw SVG strings and rendered inline via Icon.svelte component.
 * 
 * Naming convention: icon-{name}.svg and icon-{name}-fill.svg for variants
 * 
 * Usage:
 *   import { Icon } from '$lib/components';
 *   <Icon name="send" size={24} />
 *   <Icon name="create" filled={true} size={24} />
 */

// Icon SVGs - imported as raw strings for inline rendering
import IconCreate from '../../static/icons/icon-create.svg?raw';
import IconPrompts from '../../static/icons/icon-prompts.svg?raw';
import IconEdit from '../../static/icons/icon-edit.svg?raw';
import IconNotepad from '../../static/icons/icon-notepad.svg?raw';
import IconArchive from '../../static/icons/icon-archive.svg?raw';
import IconSend from '../../static/icons/icon-send.svg?raw';
import IconSendFill from '../../static/icons/icon-send-fill.svg?raw';
import IconClose from '../../static/icons/icon-close.svg?raw';
import IconNewchat from '../../static/icons/icon-newchat.svg?raw';
import IconBusyFill from '../../static/icons/icon-busy-fill.svg?raw';
import IconStopFill from '../../static/icons/icon-stop-fill.svg?raw';
import IconExpand from '../../static/icons/icon-expand.svg?raw';
import IconCollapse from '../../static/icons/icon-collapse.svg?raw';
import IconCopy from '../../static/icons/icon-copy.svg?raw';
import IconRewrite from '../../static/icons/icon-rewrite.svg?raw';
import IconSources from '../../static/icons/icon-sources.svg?raw';
import IconShare from '../../static/icons/icon-share.svg?raw';
import IconInfo from '../../static/icons/icon-info.svg?raw';
import IconHeart from '../../static/icons/icon-heart.svg?raw';
import IconHeartFill from '../../static/icons/icon-heart-fill.svg?raw';
import IconArrowUp from '../../static/icons/icon-arrow-up.svg?raw';
import IconSearch from '../../static/icons/icon-search.svg?raw';

// Icon map - maps icon names to their SVG strings
export const iconMap = {
	// Navigation icons (header)
	create: IconCreate,
	prompts: IconPrompts,
	edit: IconEdit,
	notepad: IconNotepad,
	archive: IconArchive,
	
	// Chat/Create page icons
	send: IconSend,
	'send-fill': IconSendFill,
	close: IconClose,
	newchat: IconNewchat,
	'busy-fill': IconBusyFill,
	'stop-fill': IconStopFill,
	
	// Prompt card icons
	expand: IconExpand,
	collapse: IconCollapse,
	copy: IconCopy,
	
	// Response action icons
	rewrite: IconRewrite,
	sources: IconSources,
	share: IconShare,
	info: IconInfo,
	
	// Prompt library icons
	heart: IconHeart,
	'heart-fill': IconHeartFill,
	'arrow-up': IconArrowUp,
	search: IconSearch
};

// List of all available icon names
export const iconNames = Object.keys(iconMap);

/**
 * Get the SVG string for an icon
 * @param {string} name - Icon name (e.g., 'send', 'create')
 * @param {boolean} filled - Whether to use filled variant
 * @returns {string|null} SVG string
 */
export function getIcon(name, filled = false) {
	const key = filled ? `${name}-fill` : name;
	return iconMap[key] || iconMap[name] || null;
}
