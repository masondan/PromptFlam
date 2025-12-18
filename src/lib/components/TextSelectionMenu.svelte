<script>
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';

	export let containerRef = null;
	export let messages = [];

	const dispatch = createEventDispatcher();

	let isVisible = false;
	let selectedText = '';
	let position = { x: 0, y: 0 };
	let selectedMessageIndex = -1;

	function handleSelectionChange() {
		const selection = window.getSelection();
		const text = selection?.toString().trim();

		if (text && text.length > 0 && containerRef) {
			const range = selection.getRangeAt(0);
			const containerRect = containerRef.getBoundingClientRect();
			const rangeRect = range.getBoundingClientRect();

			if (
				rangeRect.top >= containerRect.top &&
				rangeRect.bottom <= containerRect.bottom
			) {
				selectedText = text;
				position = {
					x: rangeRect.left + rangeRect.width / 2,
					y: rangeRect.top - 8
				};
				
				// Find which message the selection is in
				const messageElements = containerRef.querySelectorAll('.message-content');
				selectedMessageIndex = -1;
				for (let i = 0; i < messageElements.length; i++) {
					if (messageElements[i].contains(range.commonAncestorContainer)) {
						// Map to actual message index (assistant messages only)
						let assistantCount = 0;
						for (let j = 0; j < messages.length; j++) {
							if (messages[j].role === 'assistant') {
								if (assistantCount === i) {
									selectedMessageIndex = j;
									break;
								}
								assistantCount++;
							}
						}
						break;
					}
				}
				
				isVisible = true;
			} else {
				isVisible = false;
			}
		} else {
			isVisible = false;
		}
	}

	function handleMouseUp() {
		setTimeout(handleSelectionChange, 10);
	}

	function handleClick(e) {
		if (!e.target.closest('.selection-menu')) {
			isVisible = false;
		}
	}

	function handleRewrite() {
		dispatch('rewrite', { 
			text: selectedText, 
			messageIndex: selectedMessageIndex 
		});
		clearSelection();
	}

	function handleSource() {
		// Get sources from the selected message
		const message = messages[selectedMessageIndex];
		const allSources = message?.sources || [];
		
		// Extract citation numbers - could be [1] format or just standalone numbers (from rendered buttons)
		// Match: [1], [2] OR standalone single/double digit numbers that appear after punctuation or whitespace
		const bracketMatches = selectedText.match(/\[(\d+)\]/g) || [];
		const bracketIndices = bracketMatches.map(m => parseInt(m.slice(1, -1), 10) - 1);
		
		// Also match standalone numbers (1-2 digits) that are likely citation buttons
		// These appear as just "1" or "12" in the selected text
		const standaloneMatches = selectedText.match(/(?:^|[\s.!?,;:])(\d{1,2})(?=[\s.!?,;:]|$)/g) || [];
		const standaloneIndices = standaloneMatches
			.map(m => parseInt(m.trim().replace(/[^\d]/g, ''), 10) - 1)
			.filter(i => i >= 0 && i < allSources.length); // Only valid source indices
		
		const citationIndices = [...new Set([...bracketIndices, ...standaloneIndices])];
		
		// Filter to only sources referenced in selection
		let filteredSources = allSources;
		if (citationIndices.length > 0) {
			filteredSources = citationIndices
				.filter(i => i >= 0 && i < allSources.length)
				.map(i => allSources[i]);
		}
		
		dispatch('source', { 
			text: selectedText, 
			sources: filteredSources.length > 0 ? filteredSources : allSources,
			messageIndex: selectedMessageIndex 
		});
		clearSelection();
	}

	function handleCopy() {
		navigator.clipboard.writeText(selectedText);
		dispatch('copy', { text: selectedText });
		clearSelection();
	}

	function clearSelection() {
		window.getSelection()?.removeAllRanges();
		isVisible = false;
		selectedText = '';
	}

	onMount(() => {
		document.addEventListener('mouseup', handleMouseUp);
		document.addEventListener('touchend', handleMouseUp);
		document.addEventListener('click', handleClick);
	});

	onDestroy(() => {
		document.removeEventListener('mouseup', handleMouseUp);
		document.removeEventListener('touchend', handleMouseUp);
		document.removeEventListener('click', handleClick);
	});
</script>

{#if isVisible}
	<div
		class="selection-menu"
		style="left: {position.x}px; top: {position.y}px;"
		role="toolbar"
		aria-label="Text selection actions"
	>
		<button class="menu-button" on:click={handleRewrite}>REWRITE</button>
		<button class="menu-button" on:click={handleSource}>SOURCE</button>
		<button class="menu-button" on:click={handleCopy}>COPY</button>
	</div>
{/if}

<style>
	.selection-menu {
		position: fixed;
		display: flex;
		align-items: center;
		background: var(--color-surface-dark);
		border-radius: var(--radius-full);
		padding: var(--spacing-xs) var(--spacing-sm);
		box-shadow: var(--shadow-md);
		transform: translate(-50%, -100%);
		z-index: var(--z-selection-menu);
		gap: var(--spacing-xs);
	}

	.menu-button {
		padding: var(--spacing-xs) var(--spacing-sm);
		font-size: 12px;
		font-weight: 700;
		text-transform: uppercase;
		color: var(--color-text-muted);
		background: transparent;
		border-radius: var(--radius-sm);
		transition: color 0.15s;
		white-space: nowrap;
	}

	.menu-button:hover {
		color: var(--color-text);
	}
</style>
