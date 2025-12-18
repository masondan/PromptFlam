<script>
	import { createEventDispatcher } from 'svelte';
	import { Icon } from '$lib/components';
	import { marked } from 'marked';

	export let content = '';
	export let sources = [];
	export let isStreaming = false;

	const dispatch = createEventDispatcher();

	marked.setOptions({
		breaks: true,
		gfm: true
	});

	function handleRewrite() {
		dispatch('rewrite');
	}

	function handleSources() {
		dispatch('openSources', { sources });
	}

	function handleShare() {
		dispatch('share');
	}

	function handleCopy() {
		dispatch('copy');
	}

	function handleCitationClick(index) {
		// Open drawer with ONLY the clicked source
		const singleSource = sources[index];
		if (singleSource) {
			dispatch('openSources', { sources: [singleSource], highlightIndex: -1, isSingleSource: true });
		}
	}

	function renderContentWithCitations(text, citationSources) {
		// First parse markdown to HTML
		let result = marked.parse(text || '');
		
		// Then replace citation markers with clickable buttons
		if (citationSources && citationSources.length > 0) {
			citationSources.forEach((source, index) => {
				const citationNum = index + 1;
				const pattern = new RegExp(`\\[${citationNum}\\]`, 'g');
				result = result.replace(pattern, `<button class="citation" data-index="${index}">${citationNum}</button>`);
			});
		}
		
		return result;
	}

	$: renderedContent = renderContentWithCitations(content, sources);

	function handleContentClick(e) {
		if (e.target.classList.contains('citation')) {
			const index = parseInt(e.target.dataset.index, 10);
			handleCitationClick(index);
		}
	}
</script>

<div class="message">
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div 
		class="message-content"
		on:click={handleContentClick}
		on:keydown={(e) => e.key === 'Enter' && handleContentClick(e)}
		role="article"
	>
		{@html renderedContent}
		{#if isStreaming}
			<span class="cursor">|</span>
		{/if}
	</div>
	
	{#if !isStreaming}
		<div class="message-actions">
			<button class="action-button" on:click={handleRewrite} aria-label="Rewrite response">
				<Icon name="rewrite" size={18} />
			</button>
			<button class="action-button" on:click={handleSources} aria-label="View sources">
				<Icon name="sources" size={18} />
			</button>
			<button class="action-button" on:click={handleShare} aria-label="Share response">
				<Icon name="share" size={18} />
			</button>
			<button class="action-button" on:click={handleCopy} aria-label="Copy response">
				<Icon name="copy" size={18} />
			</button>
		</div>
	{/if}
</div>

<style>
	.message {
		padding: var(--spacing-md) 0;
	}

	.message-content {
		font-size: var(--font-size-base);
		line-height: 1.7;
		color: var(--color-text);
	}

	.message-content :global(h1),
	.message-content :global(h2),
	.message-content :global(h3) {
		font-weight: 700;
		margin-top: var(--spacing-xl);
		margin-bottom: var(--spacing-sm);
		color: var(--color-text);
		line-height: 1.3;
	}

	.message-content :global(h1) {
		font-size: 1.5rem;
	}

	.message-content :global(h2) {
		font-size: 1.25rem;
		margin-top: var(--spacing-lg);
	}

	.message-content :global(h3) {
		font-size: 1.125rem;
		margin-top: var(--spacing-md);
	}

	.message-content :global(p) {
		margin-bottom: var(--spacing-md);
	}

	.message-content :global(p:first-child) {
		margin-top: 0;
	}

	.message-content :global(strong) {
		font-weight: 600;
		color: var(--color-text);
	}

	.message-content :global(ul),
	.message-content :global(ol) {
		margin-bottom: var(--spacing-md);
		padding-left: var(--spacing-lg);
	}

	.message-content :global(li) {
		margin-bottom: var(--spacing-sm);
	}

	.message-content :global(li > p) {
		margin-bottom: var(--spacing-xs);
	}

	.message-content :global(blockquote) {
		border-left: 3px solid var(--color-primary);
		padding-left: var(--spacing-md);
		margin: var(--spacing-md) 0;
		color: var(--color-text-secondary);
	}

	.message-content :global(.citation) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 18px;
		height: 18px;
		padding: 0 4px;
		margin: 0 2px;
		background: var(--color-surface-dark);
		color: var(--color-icon-active);
		font-size: 11px;
		font-weight: 600;
		border-radius: var(--radius-sm);
		cursor: pointer;
		border: none;
		vertical-align: middle;
		transition: background-color 0.15s;
	}

	.message-content :global(.citation:hover) {
		background: var(--color-border);
	}

	.cursor {
		display: inline-block;
		animation: blink 1s step-end infinite;
		color: var(--color-primary);
	}

	@keyframes blink {
		50% {
			opacity: 0;
		}
	}

	.message-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--spacing-sm);
		margin-top: var(--spacing-md);
		padding-top: var(--spacing-sm);
	}

	.action-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		color: var(--color-icon-default);
		transition: color 0.15s;
	}

	.action-button:hover {
		color: var(--color-icon-active);
	}
</style>
