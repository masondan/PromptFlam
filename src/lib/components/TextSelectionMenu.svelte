<script>
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';

	export let containerRef = null;

	const dispatch = createEventDispatcher();

	let isVisible = false;
	let selectedText = '';
	let position = { x: 0, y: 0 };

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
		dispatch('rewrite', { text: selectedText });
		clearSelection();
	}

	function handleSource() {
		dispatch('source', { text: selectedText });
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
		border-radius: var(--radius-sm);
		transition: background-color 0.15s, color 0.15s;
		white-space: nowrap;
	}

	.menu-button:hover {
		background: var(--color-border);
		color: var(--color-icon-active);
	}

	.menu-button:first-child {
		background: rgba(0, 0, 0, 0.05);
	}
</style>
