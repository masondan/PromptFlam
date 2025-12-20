<script>
	import { createEventDispatcher } from 'svelte';
	import { Icon } from '$lib/components';
	import { fade, fly } from 'svelte/transition';

	export let isOpen = false;
	export let text = '';

	const dispatch = createEventDispatcher();

	let textareaEl;
	let editedText = '';
	let copied = false;

	$: if (isOpen && text) {
		editedText = text;
	}

	$: if (isOpen && textareaEl) {
		setTimeout(() => {
			textareaEl?.focus();
			textareaEl?.setSelectionRange(editedText.length, editedText.length);
		}, 300);
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

	async function handleCopy() {
		await navigator.clipboard.writeText(editedText);
		copied = true;
		setTimeout(() => copied = false, 2000);
	}

	async function handleShare() {
		if (navigator.share) {
			try {
				await navigator.share({
					text: editedText,
					title: 'PromptFlam Prompt'
				});
			} catch (err) {
				if (err.name !== 'AbortError') {
					handleCopy();
				}
			}
		} else {
			handleCopy();
		}
	}

	function findBracketAtPosition(textContent, cursorPos) {
		const bracketRegex = /\[([^\]]+)\]/g;
		let match;
		
		while ((match = bracketRegex.exec(textContent)) !== null) {
			const start = match.index;
			const end = start + match[0].length;
			
			if (cursorPos >= start && cursorPos <= end) {
				return { start, end, text: match[0] };
			}
		}
		return null;
	}

	function handleTextareaClick() {
		if (!textareaEl) return;
		
		setTimeout(() => {
			const cursorPos = textareaEl.selectionStart;
			const bracket = findBracketAtPosition(editedText, cursorPos);
			
			if (bracket) {
				textareaEl.setSelectionRange(bracket.start, bracket.end);
			}
		}, 0);
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
		aria-label="Edit Prompt"
		tabindex="0"
		transition:fade={{ duration: 150 }}
	>
		<div class="drawer" transition:fly={{ y: '100%', duration: 250 }}>
			<div class="drawer-header">
				<button class="close-btn" on:click={close} aria-label="Close">
					<Icon name="close" size={24} />
				</button>
			</div>
			
			<div class="content-area">
				<textarea
					bind:this={textareaEl}
					bind:value={editedText}
					on:click={handleTextareaClick}
					class="edit-textarea"
					placeholder="Edit your prompt..."
				></textarea>

				<div class="action-buttons">
					<button class="action-btn" on:click={handleShare} aria-label="Share">
						<Icon name="share" size={20} />
					</button>
					<button 
						class="action-btn" 
						class:copied 
						on:click={handleCopy} 
						aria-label="Copy"
					>
						<Icon name="copy" size={20} />
					</button>
				</div>
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

	.drawer {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: var(--bg-main);
		display: flex;
		flex-direction: column;
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

	.content-area {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		padding-top: var(--spacing-md);
	}

	.edit-textarea {
		width: 100%;
		min-height: 200px;
		padding: 0;
		font-size: var(--font-size-base);
		line-height: var(--line-height);
		font-family: inherit;
		color: var(--text-primary);
		background: var(--bg-main);
		border: none;
		resize: none;
		field-sizing: content;
	}

	.edit-textarea:focus {
		outline: none;
	}

	.edit-textarea::selection {
		background-color: var(--color-highlight);
	}

	.action-buttons {
		display: flex;
		justify-content: center;
		gap: var(--spacing-md);
		padding-top: var(--spacing-md);
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-xs);
		color: #777777;
		transition: color 0.15s, transform 0.15s;
	}

	.action-btn:hover {
		color: var(--color-icon-active);
		transform: scale(1.1);
	}

	.action-btn.copied {
		color: var(--accent-brand);
		animation: pulse 0.4s ease-in-out;
	}

	@keyframes pulse {
		0% { transform: scale(1); }
		50% { transform: scale(1.2); }
		100% { transform: scale(1); }
	}
</style>
