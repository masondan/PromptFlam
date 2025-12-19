<script>
	/**
	 * Icon Component
	 * 
	 * Renders SVG icons from static/icons/ folder inline.
	 * Supports outline and filled variants, custom sizing, and dynamic colors.
	 * 
	 * Icons are rendered inline, allowing CSS color to apply via currentColor.
	 * 
	 * Usage:
	 *   <Icon name="send" />
	 *   <Icon name="create" filled={true} size={32} />
	 *   <Icon name="archive" color="#ff0000" />
	 * 
	 * Props:
	 *   name (required): Icon name without prefix (e.g., 'send', 'create')
	 *   size: Icon size in pixels (default: 24)
	 *   filled: Use filled variant if available (default: false)
	 *   color: Override icon color (default: currentColor)
	 *   label: Accessibility label (default: icon name)
	 */

	import { getIcon } from '$lib/icons.js';

	export let name;
	export let size = 24;
	export let filled = false;
	export let color = 'currentColor';
	export let label = '';

	$: svgString = getIcon(name, filled);
	$: ariaLabel = label || name;
</script>

{#if svgString}
	<span
		class="icon"
		style="--icon-size: {size}px; --icon-color: {color};"
		role="img"
		aria-label={ariaLabel}
	>
		{@html svgString}
	</span>
{:else}
	<span class="icon icon--missing" style="--icon-size: {size}px;">
		?
	</span>
{/if}

<style>
	.icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: var(--icon-size);
		height: var(--icon-size);
		flex-shrink: 0;
		color: var(--icon-color);
	}

	:global(.icon svg) {
		width: 100%;
		height: 100%;
	}

	.icon--missing {
		background: #f0f0f0;
		border-radius: 4px;
		font-size: 12px;
		color: #999;
	}
</style>
