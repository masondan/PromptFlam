<script>
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';

	export let containerRef = null;
	export let messages = [];

	const dispatch = createEventDispatcher();

	let isVisible = false;
	let selectedText = '';
	let position = { x: 0, y: 0 };
	let selectedMessageIndex = -1;
	let copyTapped = false;
	let selectAllTapped = false;
	let isSelectAllMode = false;
	let fullMessageText = '';
	let currentMessageElement = null;

	function stripCitations(text) {
		return text.replace(/\[\d+\]/g, '').replace(/\s+/g, ' ').trim();
	}

	function handleSelectionChange() {
		if (isSelectAllMode) return;
		
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
				selectedText = stripCitations(text);
				const yPos = rangeRect.top < 64 ? rangeRect.top + rangeRect.height + 8 : rangeRect.top - 8;
				position = {
					x: rangeRect.left + rangeRect.width / 2,
					y: yPos,
				};
				
				const messageElements = containerRef.querySelectorAll('.message-content');
				selectedMessageIndex = -1;
				currentMessageElement = null;
				for (let i = 0; i < messageElements.length; i++) {
					if (messageElements[i].contains(range.commonAncestorContainer)) {
						currentMessageElement = messageElements[i];
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
			if (isSelectAllMode) {
				clearSelection();
			} else {
				isVisible = false;
			}
		}
	}

	function handleSelectAll() {
		const message = messages[selectedMessageIndex];
		if (message && message.role === 'assistant' && currentMessageElement) {
			fullMessageText = stripCitations(message.content || '');
			
			selectAllTapped = true;
			setTimeout(() => {
				selectAllTapped = false;
				
				const range = document.createRange();
				range.selectNodeContents(currentMessageElement);
				const selection = window.getSelection();
				selection.removeAllRanges();
				selection.addRange(range);
				
				const rangeRect = range.getBoundingClientRect();
				const viewportWidth = window.innerWidth;
				
				const xPos = rangeRect.width > viewportWidth 
					? viewportWidth / 2
					: rangeRect.left + rangeRect.width / 2;

				position = {
					x: xPos,
					y: Math.max(rangeRect.top, 80)
				};
				
				isSelectAllMode = true;
			}, 150);
			return;
		}
		clearSelection();
	}

	function handleCopy() {
		copyTapped = true;
		setTimeout(() => {
			const textToCopy = isSelectAllMode ? fullMessageText : selectedText;
			navigator.clipboard.writeText(textToCopy);
			dispatch('copy', { text: textToCopy });
			clearSelection();
		}, 150);
	}

	function clearSelection() {
		window.getSelection()?.removeAllRanges();
		isVisible = false;
		selectedText = '';
		fullMessageText = '';
		copyTapped = false;
		selectAllTapped = false;
		isSelectAllMode = false;
		currentMessageElement = null;
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
		<button 
			class="menu-button" 
			class:tapped={copyTapped}
			on:click={handleCopy}
		>Copy</button>
		{#if !isSelectAllMode}
			<span class="separator"></span>
			<button 
				class="menu-button" 
				class:tapped={selectAllTapped}
				on:click={handleSelectAll}
			>Select all</button>
		{/if}
	</div>
{/if}

<style>
	.selection-menu {
		position: fixed;
		display: flex;
		align-items: center;
		background: var(--accent-brand);
		border-radius: var(--radius-full);
		padding: var(--spacing-xs) var(--spacing-sm);
		box-shadow: var(--shadow-md);
		transform: translate(-50%, -100%);
		z-index: var(--z-selection-menu);
		gap: 0;
	}

	.menu-button {
		padding: var(--spacing-xs) var(--spacing-sm);
		font-size: 14px;
		font-weight: 400;
		color: #ffffff;
		background: transparent;
		border-radius: var(--radius-sm);
		transition: transform 0.15s ease;
		white-space: nowrap;
	}

	.menu-button.tapped {
		transform: scale(1.15);
	}

	.separator {
		width: 1px;
		height: 16px;
		background: rgba(255, 255, 255, 0.4);
	}
</style>
