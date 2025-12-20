<script>
	import { createEventDispatcher } from 'svelte';
	import { Icon } from '$lib/components';
	import { marked } from 'marked';

	export let content = '';
	export let sources = [];
	export let isStreaming = false;
	export let showSourcesLink = false;
	export let index = 0;

	const dispatch = createEventDispatcher();

	$: wordCount = content ? content.trim().split(/\s+/).filter(w => w.length > 0).length : 0;

	marked.setOptions({
		breaks: true,
		gfm: true
	});

	function handleRewrite() {
		dispatch('rewrite', { index });
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
	{#if isStreaming}
		<div class="streaming-indicator">
			<span class="dot"></span>
			<span class="dot"></span>
			<span class="dot"></span>
		</div>
	{:else if showSourcesLink && sources.length > 0}
		<button class="sources-link" on:click={handleSources}>
			{sources.length} sources
			<Icon name="sources" size={14} />
		</button>
	{/if}
	
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
			<span class="word-count">{wordCount} words</span>
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

	.sources-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		color: var(--text-secondary);
		font-size: 0.875rem; /* Equivalent to old --font-size-sm */
		font-weight: 400;
		background: transparent;
		border: none;
		padding: 0;
		margin-bottom: var(--spacing-sm);
		cursor: pointer;
		transition: color 0.15s, transform 0.15s;
	}

	.sources-link:hover {
		color: var(--color-icon-active);
		transform: scale(1.05);
	}

	.streaming-indicator {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 0;
		margin-bottom: var(--spacing-sm);
		height: 18px;
	}

	.streaming-indicator .dot {
		width: 6px;
		height: 6px;
		background-color: var(--text-secondary);
		border-radius: 50%;
		animation: pulse 1.4s ease-in-out infinite;
	}

	.streaming-indicator .dot:nth-child(1) {
		animation-delay: 0s;
	}

	.streaming-indicator .dot:nth-child(2) {
		animation-delay: 0.2s;
	}

	.streaming-indicator .dot:nth-child(3) {
		animation-delay: 0.4s;
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 0.3;
			transform: scale(0.8);
		}
		50% {
			opacity: 1;
			transform: scale(1);
		}
	}

	.message-content {
		font-size: var(--font-size-base);
		line-height: var(--line-height);
		color: var(--text-primary);
	}

	.message-content :global(h1),
	.message-content :global(h2),
	.message-content :global(h3) {
		font-weight: 700;
		font-size: var(--font-size-h3);
		margin-top: var(--spacing-lg);
		margin-bottom: var(--spacing-sm);
		color: var(--text-primary);
		line-height: 1.3;
	}

	.message-content :global(p) {
		margin-bottom: var(--spacing-sm);
	}

	.message-content :global(p:first-child) {
		margin-top: 0;
	}

	.message-content :global(strong) {
		font-weight: 600;
		color: var(--text-primary);
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
		border-left: 3px solid var(--accent-brand);
		padding-left: var(--spacing-md);
		margin: var(--spacing-md) 0;
		color: var(--text-secondary);
	}

	.message-content :global(.citation) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 18px;
		height: 18px;
		padding: 0 4px;
		margin: 0 2px;
		background: var(--bg-surface-dark);
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
		background: var(--bg-surface-dark);
	}

	.cursor {
		display: inline-block;
		animation: blink 1s step-end infinite;
		color: var(--accent-brand);
	}

	@keyframes blink {
		50% {
			opacity: 0;
		}
	}

	.message-actions {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		margin-top: var(--spacing-md);
		padding-top: var(--spacing-sm);
	}

	.word-count {
		font-size: 0.875rem; /* Equivalent to old --font-size-sm */
		font-weight: 700;
		color: var(--text-secondary);
		margin-right: auto;
	}

	.action-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		color: var(--color-icon-default);
		transition: color 0.15s, transform 0.15s;
	}

	.action-button:hover {
		color: var(--color-icon-active);
		transform: scale(1.1);
	}
</style>
