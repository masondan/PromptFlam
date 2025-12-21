<script>
	import { Icon } from '$lib/components';
	import { createEventDispatcher, afterUpdate } from 'svelte';

	export let value = '';
	export let isLoading = false;
	export let placeholder = 'Tap ☆ to add a library prompt';

	const dispatch = createEventDispatcher();

	let textareaEl;

	$: hasContent = value.trim().length > 0;
	$: canSend = hasContent && !isLoading;
	
	afterUpdate(() => {
		if (textareaEl) {
			autoResize();
		}
	});

	function findBracketBoundaries(text, cursorPos) {
		let openBracket = -1;
		let closeBracket = -1;

		for (let i = cursorPos - 1; i >= 0; i--) {
			if (text[i] === '[') {
				openBracket = i;
				break;
			}
			if (text[i] === ']') {
				break;
			}
		}

		if (openBracket === -1) return null;

		for (let i = cursorPos; i < text.length; i++) {
			if (text[i] === ']') {
				closeBracket = i;
				break;
			}
			if (text[i] === '[') {
				break;
			}
		}

		if (closeBracket === -1) return null;

		return { start: openBracket, end: closeBracket + 1 };
	}

	function handleClick(e) {
		if (!textareaEl) return;
		
		setTimeout(() => {
			const cursorPos = textareaEl.selectionStart;
			const boundaries = findBracketBoundaries(value, cursorPos);
			
			if (boundaries) {
				textareaEl.setSelectionRange(boundaries.start, boundaries.end);
			}
		}, 0);
	}

	function handleInput(e) {
		value = e.target.value;
		autoResize();
	}

	function autoResize() {
		if (!textareaEl) return;
		textareaEl.style.height = 'auto';
		const headerHeight = 80;
		const buttonRowHeight = 52;
		const padding = 32;
		const maxHeight = window.innerHeight - headerHeight - buttonRowHeight - padding;
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
		<textarea
			bind:this={textareaEl}
			{value}
			{placeholder}
			on:input={handleInput}
			on:keydown={handleKeydown}
			on:click={handleClick}
			rows="1"
			aria-label="Message input"
		></textarea>
		
		<div class="button-row">
			<button
				class="prompt-button"
				on:click={handlePromptDrawer}
				aria-label="Open prompt library"
				type="button"
			>
				<Icon name="prompts" size={20} />
			</button>
			
			{#if isLoading}
				<button
					class="action-button stop"
					on:click={handleStop}
					aria-label="Stop generating"
					type="button"
				>
					<Icon name="stop-fill" size={20} />
				</button>
			{:else}
				<button
					class="action-button send"
					class:active={canSend}
					on:click={handleSend}
					disabled={!canSend}
					aria-label="Send message"
					type="button"
				>
					<Icon name={canSend ? 'send-fill' : 'send'} size={20} />
				</button>
			{/if}
		</div>
	</div>
</div>

<style>
	.input-drawer {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: var(--z-input-drawer);
		transform: translateZ(0);
		-webkit-transform: translateZ(0);
	}

	@media (min-width: 768px) {
		.input-drawer {
			left: 50%;
			right: auto;
			transform: translateX(-50%);
			width: 100%;
			max-width: var(--app-max-width);
		}
	}

	.input-container {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		background: var(--bg-main);
		border-top-left-radius: var(--radius-lg);
		border-top-right-radius: var(--radius-lg);
		padding: var(--spacing-md);
		padding-bottom: calc(var(--spacing-md) + env(safe-area-inset-bottom, 0px));
		box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.08);
	}

	textarea {
		width: 100%;
		min-height: 24px;
		max-height: 40vh;
		line-height: 1.5;
		padding: 0;
		overflow-y: auto;
		font-size: var(--font-size-base);
	}

	textarea::placeholder {
		color: #999999;
	}

	.button-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-left: -8px;
		margin-right: -8px;
	}

	.prompt-button {
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

	.action-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		transition: all 0.15s;
	}

	.action-button.send {
		color: #777777;
		opacity: 1;
	}

	.action-button.send:disabled {
		opacity: 1;
		cursor: default;
	}

	.action-button.send.active {
		color: var(--color-icon-active);
	}

	.action-button.send:hover:not(:disabled) {
		color: var(--color-icon-active);
	}

	.action-button.stop {
		color: var(--accent-brand);
	}
</style>
