<script>
	import { createEventDispatcher } from 'svelte';
	import { Icon } from '$lib/components';
	import { fade, fly } from 'svelte/transition';

	export let isOpen = false;
	export let sources = [];
	export let highlightIndex = -1;

	const dispatch = createEventDispatcher();

	let enrichedSources = [];
	let isLoading = false;
	let hasAttemptedFetch = false;

	// Watch for drawer opening and fetch metadata
	$: if (isOpen && sources.length > 0 && !hasAttemptedFetch) {
		fetchMetadata();
	}

	// Reset when sources change
	$: if (sources) {
		enrichedSources = sources.map(s => ({ ...s }));
		hasAttemptedFetch = false;
	}

	async function fetchMetadata() {
		if (isLoading) return;
		
		isLoading = true;
		hasAttemptedFetch = true;

		try {
			const urls = sources.map(s => s.url).filter(Boolean);
			if (urls.length === 0) {
				isLoading = false;
				return;
			}

			const response = await fetch('/api/metadata', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ urls })
			});

			if (response.ok) {
				const { metadata } = await response.json();
				
				// Enrich sources with fetched metadata
				enrichedSources = sources.map(source => {
					const meta = metadata[source.url];
					if (meta) {
						return {
							...source,
							title: meta.title || source.title,
							excerpt: meta.excerpt || source.excerpt
						};
					}
					return source;
				});
			}
		} catch (error) {
			console.error('Failed to fetch metadata:', error);
		} finally {
			isLoading = false;
		}
	}

	function close() {
		dispatch('close');
	}

	function handleOverlayClick(e) {
		if (e.target === e.currentTarget) {
			close();
		}
	}

	function handleKeydown(e) {
		if (e.key === 'Escape') {
			close();
		}
	}

	function openSource(url) {
		if (url) {
			window.open(url, '_blank', 'noopener,noreferrer');
		}
	}

	function formatWebsiteName(domain) {
		if (!domain) return 'Link';
		// Remove TLD and format: "premiumtimes.ng" → "Premium Times"
		const parts = domain.split('.');
		const name = parts[0];
		// Split on common separators and capitalize
		return name
			.replace(/[-_]/g, ' ')
			.replace(/([a-z])([A-Z])/g, '$1 $2')
			.split(' ')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(' ');
	}

	function getDisplayTitle(source) {
		// If we have a real title (not "Source X"), use it
		if (source.title && !source.title.startsWith('Source ')) {
			return source.title;
		}
		// Otherwise use formatted website name
		return formatWebsiteName(source.domain);
	}

	function hasRichContent(source) {
		return source.title && !source.title.startsWith('Source ') && source.excerpt;
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div 
		class="overlay" 
		on:click={handleOverlayClick}
		on:keydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		aria-label="Sources"
		tabindex="0"
		transition:fade={{ duration: 150 }}
	>
		<div class="drawer" transition:fly={{ y: 300, duration: 200 }}>
			<div class="drawer-header">
				<button class="close-button" on:click={close} aria-label="Close">
					<Icon name="close" size={20} />
				</button>
				<h2 class="drawer-title">Sources</h2>
				{#if isLoading}
					<span class="loading-indicator"></span>
				{/if}
			</div>
			
			<div class="sources-list">
				{#each enrichedSources as source, index}
					<button 
						class="source-card"
						class:highlighted={index === highlightIndex}
						on:click={() => openSource(source.url)}
						type="button"
					>
						<div class="source-number">{index + 1}.</div>
						<div class="source-content">
							<h3 class="source-title">{getDisplayTitle(source)}</h3>
							{#if hasRichContent(source)}
								<p class="source-excerpt">{source.excerpt}</p>
							{/if}
							<span class="source-domain">{source.domain || 'Link'}</span>
						</div>
					</button>
					{#if index < enrichedSources.length - 1}
						<div class="separator"></div>
					{/if}
				{/each}
			</div>
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: var(--color-overlay);
		z-index: var(--z-overlay);
		display: flex;
		align-items: flex-end;
	}

	.drawer {
		width: 100%;
		max-height: calc(100vh - var(--header-height) - 20px);
		background: var(--color-bg);
		border-top-left-radius: var(--radius-lg);
		border-top-right-radius: var(--radius-lg);
		border-top: 1px solid var(--color-border);
		box-shadow: var(--shadow-lg);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.drawer-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-md);
		background: var(--color-bg);
		position: sticky;
		top: 0;
		z-index: 1;
	}

	.close-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		color: var(--color-icon-default);
		transition: color 0.15s;
	}

	.close-button:hover {
		color: var(--color-icon-active);
	}

	.drawer-title {
		font-size: var(--font-size-lg);
		font-weight: 600;
	}

	.loading-indicator {
		width: 16px;
		height: 16px;
		border: 2px solid var(--color-border);
		border-top-color: var(--color-primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.sources-list {
		flex: 1;
		overflow-y: auto;
		padding: 0 var(--spacing-md) var(--spacing-md);
	}

	.source-card {
		display: flex;
		gap: var(--spacing-md);
		width: 100%;
		padding: var(--spacing-md) var(--spacing-sm);
		text-align: left;
		background: transparent;
		cursor: pointer;
		transition: background-color 0.15s;
		border-radius: var(--radius-sm);
	}

	.source-card:hover {
		background: var(--color-surface);
	}

	.source-card.highlighted {
		background: var(--color-highlight);
	}

	.source-number {
		flex-shrink: 0;
		font-weight: 600;
		font-size: var(--font-size-base);
		color: var(--color-text-secondary);
		min-width: 20px;
	}

	.source-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.source-title {
		font-size: var(--font-size-base);
		font-weight: 600;
		color: var(--color-primary);
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.source-excerpt {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		line-height: 1.5;
		margin: 0;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.source-domain {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	.separator {
		height: 1px;
		background: var(--color-border);
		margin: 0 var(--spacing-sm);
	}
</style>
