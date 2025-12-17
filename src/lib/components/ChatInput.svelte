<script>
	import { Icon } from '$lib/components';
	import { createEventDispatcher } from 'svelte';

	export let value = '';
	export let isLoading = false;
	export let placeholder = 'Tap ☆ to add a library prompt';

	const dispatch = createEventDispatcher();

	let textareaEl;

	$: hasContent = value.trim().length > 0;
	$: canSend = hasContent && !isLoading;

	function handleInput(e) {
		value = e.target.value;
		autoResize();
	}

	function autoResize() {
		if (!textareaEl) return;
		textareaEl.style.height = 'auto';
		const maxHeight = window.innerHeight * 0.4;
		textareaEl.style.height = Math.min(textareaEl.scrollHeight, maxHeight) + 'px';
	}

	function handleSend() {
		if (!canSend) return;
		dispatch('send', { message: value.trim() });
		value = '';
		if (textareaEl) {
			textareaEl.style.height = 'auto';
		}
	}

	function handleKeydown(e) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	}

	function handlePromptDrawer() {
		dispatch('openPromptDrawer');
	}

	function handleStop() {
		dispatch('stop');
	}
</script>

<div class="input-drawer">
	<div class="input-container">
		<button
			class="prompt-button"
			on:click={handlePromptDrawer}
			aria-label="Open prompt library"
			type="button"
		>
			<Icon name="prompts" size={22} />
		</button>
		
		<textarea
			bind:this={textareaEl}
			{value}
			{placeholder}
			on:input={handleInput}
			on:keydown={handleKeydown}
			rows="1"
			aria-label="Message input"
		></textarea>
		
		{#if isLoading}
			<button
				class="send-button busy"
				on:click={handleStop}
				aria-label="Stop generating"
				type="button"
			>
				<Icon name="busy-fill" size={22} />
			</button>
		{:else}
			<button
				class="send-button"
				class:active={canSend}
				on:click={handleSend}
				disabled={!canSend}
				aria-label="Send message"
				type="button"
			>
				<Icon name={canSend ? 'send-fill' : 'send'} size={22} />
			</button>
		{/if}
	</div>
</div>

<style>
	.input-drawer {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: var(--color-bg);
		padding: var(--spacing-md);
		padding-bottom: calc(var(--spacing-md) + env(safe-area-inset-bottom, 0px));
		z-index: var(--z-input-drawer);
	}

	.input-container {
		display: flex;
		align-items: flex-end;
		gap: var(--spacing-sm);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--spacing-sm) var(--spacing-md);
		box-shadow: var(--shadow-input);
	}

	.prompt-button {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		color: var(--color-icon-default);
		transition: color 0.15s;
	}

	.prompt-button:hover {
		color: var(--color-icon-active);
	}

	textarea {
		flex: 1;
		min-height: 24px;
		max-height: 40vh;
		line-height: 1.5;
		padding: 6px 0;
		overflow-y: auto;
	}

	textarea::placeholder {
		color: var(--color-border);
	}

	.send-button {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		color: var(--color-icon-default);
		transition: color 0.15s;
	}

	.send-button.active {
		color: var(--color-icon-active);
	}

	.send-button.busy {
		color: var(--color-icon-active);
	}

	.send-button:hover:not(:disabled) {
		color: var(--color-icon-active);
	}
</style>
