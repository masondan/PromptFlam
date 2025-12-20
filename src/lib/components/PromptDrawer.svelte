<script>
	import { createEventDispatcher } from 'svelte';
	import { Icon, PromptLibrary } from '$lib/components';
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

	function handleInsertPrompt(e) {
		dispatch('insert', { prompt: e.detail.prompt });
		close();
	}

	function handleCopy(e) {
		// Optional: show feedback
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
				<PromptLibrary 
					mode="drawer" 
					on:insert={handleInsertPrompt}
					on:copy={handleCopy}
				/>
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
		background: var(--bg-main);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.drawer-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-md);
		border-bottom: 1px solid var(--color-border);
		flex-shrink: 0;
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
		font-size: var(--font-size-h3);
		font-weight: 600;
		margin: 0;
	}

	.drawer-content {
		flex: 1;
		overflow-y: auto;
		padding: var(--spacing-md);
	}
</style>
