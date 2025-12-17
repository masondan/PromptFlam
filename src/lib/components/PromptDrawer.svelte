<script>
	import { createEventDispatcher } from 'svelte';
	import { Icon } from '$lib/components';
	import { fade, fly } from 'svelte/transition';

	export let isOpen = false;

	const dispatch = createEventDispatcher();

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

	function handleInsertPrompt(promptText) {
		dispatch('insert', { prompt: promptText });
		close();
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
		aria-label="Prompt Library"
		tabindex="0"
		transition:fade={{ duration: 150 }}
	>
		<div class="drawer" transition:fly={{ y: '100%', duration: 250 }}>
			<div class="drawer-header">
				<button class="close-button" on:click={close} aria-label="Close">
					<Icon name="close" size={20} />
				</button>
				<h2 class="drawer-title">Prompt Library</h2>
			</div>
			
			<div class="drawer-content">
				<p class="placeholder-text">
					Prompt library will be fully implemented in Phase 4.
				</p>
				<p class="placeholder-text">
					This drawer will include:
				</p>
				<ul class="feature-list">
					<li>Category & subcategory filters</li>
					<li>Search functionality</li>
					<li>Favorites system</li>
					<li>"Insert Prompt" button</li>
				</ul>
				
				<button 
					class="demo-button"
					on:click={() => handleInsertPrompt('Write a compelling headline for an article about [topic]. The headline should be clear, engaging, and suitable for [audience].')}
				>
					Insert Demo Prompt
				</button>
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
	}

	.drawer {
		position: absolute;
		top: var(--header-height);
		left: 0;
		right: 0;
		bottom: 0;
		background: var(--color-bg);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.drawer-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-md);
		border-bottom: 1px solid var(--color-border-light);
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

	.drawer-content {
		flex: 1;
		overflow-y: auto;
		padding: var(--spacing-lg);
	}

	.placeholder-text {
		color: var(--color-text-muted);
		margin-bottom: var(--spacing-md);
	}

	.feature-list {
		color: var(--color-text-muted);
		margin-bottom: var(--spacing-lg);
		padding-left: var(--spacing-lg);
	}

	.feature-list li {
		margin-bottom: var(--spacing-xs);
	}

	.demo-button {
		display: block;
		width: 100%;
		padding: var(--spacing-md);
		background: var(--color-surface);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
		font-weight: 500;
		color: var(--color-text-secondary);
		transition: background-color 0.15s, border-color 0.15s;
	}

	.demo-button:hover {
		background: var(--color-surface-dark);
		border-color: var(--color-border);
	}
</style>
