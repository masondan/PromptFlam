<script>
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	export let editorRef = null;

	const dispatch = createEventDispatcher();

	let isVisible = false;
	let menuMode = 'selection'; // 'selection' = CUT/COPY/SELECT ALL, 'paste' = PASTE/SELECT ALL
	let selectedText = '';
	let position = { x: 0, y: 0 };
	let copyConfirmed = false;

	function handleSelectionChange() {
		if (!editorRef) return;
		
		const selection = window.getSelection();
		const text = selection?.toString().trim();

		if (text && text.length > 0) {
			const range = selection.getRangeAt(0);
			const editorRect = editorRef.getBoundingClientRect();
			const rangeRect = range.getBoundingClientRect();

			if (editorRef.contains(range.commonAncestorContainer)) {
				selectedText = text;
				menuMode = 'selection';
				position = {
					x: rangeRect.left + rangeRect.width / 2,
					y: rangeRect.top - 8
				};
				copyConfirmed = false;
				isVisible = true;
			} else {
				isVisible = false;
			}
		} else {
			isVisible = false;
		}
	}

	function handleContextMenu(e) {
		if (!editorRef || !editorRef.contains(e.target)) return;
		
		e.preventDefault();
		
		const selection = window.getSelection();
		const text = selection?.toString().trim();
		
		if (!text || text.length === 0) {
			menuMode = 'paste';
			position = {
				x: e.clientX,
				y: e.clientY - 8
			};
			copyConfirmed = false;
			isVisible = true;
		}
	}

	function handleMouseUp() {
		setTimeout(handleSelectionChange, 10);
	}

	function handleClick(e) {
		if (!e.target.closest('.notepad-selection-menu')) {
			isVisible = false;
			copyConfirmed = false;
		}
	}

	function handleCut() {
		if (selectedText) {
			navigator.clipboard.writeText(selectedText);
			document.execCommand('delete');
			dispatch('cut', { text: selectedText });
		}
		clearSelection();
	}

	function handleCopy() {
		if (selectedText) {
			navigator.clipboard.writeText(selectedText);
			copyConfirmed = true;
			dispatch('copy', { text: selectedText });
			setTimeout(() => {
				clearSelection();
			}, 1000);
		}
	}

	function handleSelectAll() {
		if (editorRef) {
			const range = document.createRange();
			range.selectNodeContents(editorRef);
			const selection = window.getSelection();
			selection.removeAllRanges();
			selection.addRange(range);
			selectedText = selection.toString();
			menuMode = 'selection';
			
			const rangeRect = range.getBoundingClientRect();
			position = {
				x: rangeRect.left + rangeRect.width / 2,
				y: rangeRect.top - 8
			};
		}
	}

	async function handlePaste() {
		try {
			const text = await navigator.clipboard.readText();
			if (text) {
				document.execCommand('insertText', false, text);
				dispatch('paste', { text });
			}
		} catch (err) {
			console.error('Paste failed:', err);
		}
		clearSelection();
	}

	function clearSelection() {
		window.getSelection()?.removeAllRanges();
		isVisible = false;
		selectedText = '';
		copyConfirmed = false;
	}

	onMount(() => {
		if (browser) {
			document.addEventListener('mouseup', handleMouseUp);
			document.addEventListener('touchend', handleMouseUp);
			document.addEventListener('click', handleClick);
			document.addEventListener('contextmenu', handleContextMenu);
		}
	});

	onDestroy(() => {
		if (browser) {
			document.removeEventListener('mouseup', handleMouseUp);
			document.removeEventListener('touchend', handleMouseUp);
			document.removeEventListener('click', handleClick);
			document.removeEventListener('contextmenu', handleContextMenu);
		}
	});
</script>

{#if isVisible}
	<div
		class="notepad-selection-menu"
		style="left: {position.x}px; top: {position.y}px;"
		role="toolbar"
		aria-label="Text actions"
	>
		{#if menuMode === 'selection'}
			<button class="menu-button" on:click={handleCut}>CUT</button>
			<span class="divider"></span>
			{#if copyConfirmed}
				<span class="copied-badge">COPIED</span>
			{:else}
				<button class="menu-button" on:click={handleCopy}>COPY</button>
			{/if}
			<span class="divider"></span>
			<button class="menu-button" on:click={handleSelectAll}>SELECT ALL</button>
		{:else}
			<button class="menu-button" on:click={handlePaste}>PASTE</button>
			<span class="divider"></span>
			<button class="menu-button" on:click={handleSelectAll}>SELECT ALL</button>
		{/if}
	</div>
{/if}

<style>
	.notepad-selection-menu {
		position: fixed;
		display: flex;
		align-items: center;
		background: #555555;
		border-radius: var(--radius);
		padding: var(--spacing-xs) var(--spacing-sm);
		box-shadow: var(--shadow-md);
		transform: translate(-50%, -100%);
		z-index: var(--z-selection-menu);
		gap: var(--spacing-xs);
	}

	.menu-button {
		padding: var(--spacing-xs) var(--spacing-sm);
		font-size: 12px;
		font-weight: 600;
		text-transform: uppercase;
		color: #ffffff;
		background: transparent;
		border-radius: var(--radius-sm);
		transition: opacity 0.15s;
		white-space: nowrap;
	}

	.menu-button:hover {
		opacity: 0.8;
	}

	.divider {
		width: 1px;
		height: 16px;
		background: rgba(255, 255, 255, 0.3);
	}

	.copied-badge {
		padding: var(--spacing-xs) var(--spacing-sm);
		font-size: 12px;
		font-weight: 600;
		text-transform: uppercase;
		color: #ffffff;
		background: var(--accent-brand);
		border-radius: var(--radius-full);
		white-space: nowrap;
	}
</style>
