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
				<button class="close-btn" on:click={close} aria-label="Close">
					<Icon name="close" size={24} />
				</button>
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
		background: var(--bg-main);
		z-index: var(--z-overlay);
	}

	@media (min-width: 768px) {
		.overlay {
			left: 50%;
			right: auto;
			transform: translateX(-50%);
			width: 100%;
			max-width: var(--app-max-width);
		}
	}

	.drawer {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: var(--bg-main);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		padding: var(--spacing-md);
	}

	.drawer-header {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-xs);
		color: #777777;
		transition: color 0.15s, transform 0.15s;
	}

	.close-btn:hover {
		color: var(--color-icon-active);
		transform: scale(1.1);
	}

	.drawer-content {
		flex: 1;
		overflow-y: auto;
		padding-top: var(--spacing-md);
	}
</style>
