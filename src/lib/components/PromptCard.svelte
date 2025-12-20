<script>
	import { Icon } from '$lib/components';

	export let content = '';
	export const timestamp = null;
	
	let isExpanded = false;
	let isCopied = false;

	const MAX_LINES = 3;

	$: needsTruncation = content.split('\n').length > MAX_LINES || content.length > 200;
	$: displayContent = isExpanded ? content : truncateContent(content);

	function truncateContent(text) {
		const lines = text.split('\n');
		if (lines.length > MAX_LINES) {
			return lines.slice(0, MAX_LINES).join('\n') + '...';
		}
		if (text.length > 200) {
			return text.slice(0, 200) + '...';
		}
		return text;
	}

	function toggleExpand() {
		isExpanded = !isExpanded;
	}

	function handleClickOutside(e) {
		if (isExpanded && !e.target.closest('.prompt-card')) {
			isExpanded = false;
		}
	}

	async function copyPrompt() {
		try {
			await navigator.clipboard.writeText(content);
			isCopied = true;
			setTimeout(() => {
				isCopied = false;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}
</script>

<svelte:window on:click={handleClickOutside} />

<div class="prompt-wrapper">
	<button
		class="copy-button"
		on:click={copyPrompt}
		aria-label={isCopied ? 'Copied!' : 'Copy prompt'}
		type="button"
	>
		<Icon name="copy" size={18} />
	</button>
	
	<div class="prompt-card" class:expanded={isExpanded}>
		<p class="prompt-text">{displayContent}</p>
		
		{#if needsTruncation}
			<button
				class="expand-button"
				on:click={toggleExpand}
				aria-label={isExpanded ? 'Collapse' : 'Expand'}
				type="button"
			>
				<Icon name={isExpanded ? 'collapse' : 'expand'} size={16} />
			</button>
		{/if}
	</div>
</div>

<style>
	.prompt-wrapper {
		display: flex;
		align-items: flex-start;
		justify-content: flex-end;
		gap: var(--spacing-sm);
		padding-left: var(--spacing-xl);
	}

	.copy-button {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		color: var(--color-icon-default);
		margin-top: var(--spacing-xs);
		transition: color 0.15s, transform 0.15s;
	}

	.copy-button:hover {
		color: var(--color-icon-active);
		transform: scale(1.1);
	}

	.prompt-card {
		position: relative;
		background: var(--bg-surface);
		border-radius: var(--radius);
		padding: var(--spacing-sm) var(--spacing-md);
		padding-right: calc(var(--spacing-md) + 24px);
		max-width: 100%;
	}

	.prompt-card.expanded {
		max-height: calc(100vh - var(--header-height) - var(--input-drawer-min-height) - 100px);
		overflow-y: auto;
	}

	.prompt-text {
		font-size: var(--font-size-base);
		line-height: var(--line-height);
		white-space: pre-wrap;
		word-wrap: break-word;
		margin: 0;
	}

	.expand-button {
		position: absolute;
		top: var(--spacing-sm);
		right: var(--spacing-sm);
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		color: var(--text-secondary);
		transition: color 0.15s;
	}

	.expand-button:hover {
		color: var(--color-icon-active);
	}
</style>
