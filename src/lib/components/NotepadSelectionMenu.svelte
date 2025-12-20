<script>
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	export let editorRef = null;

	const dispatch = createEventDispatcher();

	let isVisible = false;
	let menuMode = 'selection'; // 'selection' = BOLD/CUT/COPY/SELECT ALL, 'paste' = PASTE/SELECT ALL
	let selectedText = '';
	let position = { x: 0, y: 0 };
	let boldTapped = false;
	let cutTapped = false;
	let copyTapped = false;
	let selectAllTapped = false;
	let pasteTapped = false;

	function handleSelectionChange() {
		if (!editorRef) return;
		
		// Don't hide if we're showing paste menu
		if (menuMode === 'paste' && isVisible) return;
		
		const selection = window.getSelection();
		const text = selection?.toString().trim();

		if (text && text.length > 0) {
			const range = selection.getRangeAt(0);
			const editorRect = editorRef.getBoundingClientRect();
			const rangeRect = range.getBoundingClientRect();

			if (editorRef.contains(range.commonAncestorContainer)) {
				selectedText = text;
				menuMode = 'selection';

				const yPos = rangeRect.top < 64 ? rangeRect.top + rangeRect.height + 8 : rangeRect.top - 8;
				position = {
					x: rangeRect.left + rangeRect.width / 2,
					y: yPos
				};
				resetTappedStates();
				isVisible = true;
			} else {
				isVisible = false;
			}
		} else if (menuMode !== 'paste') {
			isVisible = false;
		}
	}

	function handleLongPress(e) {
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
			resetTappedStates();
			isVisible = true;
		}
	}

	function handleMouseUp() {
		setTimeout(handleSelectionChange, 10);
	}

	function handleClick(e) {
		if (!e.target.closest('.notepad-selection-menu')) {
			isVisible = false;
		}
	}

	function handleBold() {
		boldTapped = true;
		setTimeout(() => {
			document.execCommand('bold');
			editorRef?.focus();
			clearSelection();
		}, 150);
	}

	function handleCut() {
		cutTapped = true;
		setTimeout(() => {
			if (selectedText) {
				navigator.clipboard.writeText(selectedText);
				document.execCommand('delete');
				dispatch('cut', { text: selectedText });
			}
			clearSelection();
		}, 150);
	}

	function handleCopy() {
		copyTapped = true;
		setTimeout(() => {
			if (selectedText) {
				navigator.clipboard.writeText(selectedText);
				dispatch('copy', { text: selectedText });
			}
			clearSelection();
		}, 150);
	}

	function handleSelectAll() {
		selectAllTapped = true;
		setTimeout(() => {
			if (editorRef) {
				const range = document.createRange();
				range.selectNodeContents(editorRef);
				const selection = window.getSelection();
				selection.removeAllRanges();
				selection.addRange(range);
				selectedText = selection.toString();
				menuMode = 'selection';
				
				const rangeRect = range.getBoundingClientRect();
				const viewportWidth = window.innerWidth;
				
				const xPos = rangeRect.width > viewportWidth 
					? viewportWidth / 2
					: rangeRect.left + rangeRect.width / 2;

				position = {
					x: xPos,
					y: Math.max(rangeRect.top, 80)
				};
			}
		}, 150);
	}

	async function handlePaste() {
		pasteTapped = true;
		setTimeout(async () => {
			try {
				const html = await navigator.clipboard.read?.();
				if (html && html[0]?.types?.includes('text/html')) {
					const blob = await html[0].getType('text/html');
					const htmlText = await blob.text();
					insertFormattedPaste(htmlText);
				} else {
					// Fallback to plain text
					const text = await navigator.clipboard.readText();
					if (text) {
						insertFormattedPaste(text);
					}
				}
				dispatch('paste');
			} catch (err) {
				console.error('Paste failed:', err);
			}
			clearSelection();
		}, 150);
	}

	function insertFormattedPaste(content) {
		if (!editorRef) return;

		// Simple HTML to formatted text conversion
		let formattedHtml = content
			// Convert h1-h3 to bold with line breaks
			.replace(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/gi, '<div><strong>$1</strong></div>')
			// Preserve line breaks and paragraphs
			.replace(/<p[^>]*>([^<]*)<\/p>/gi, '<div>$1</div>')
			// Keep strong/bold
			.replace(/<strong[^>]*>([^<]+)<\/strong>/gi, '<strong>$1</strong>')
			.replace(/<b[^>]*>([^<]+)<\/b>/gi, '<strong>$1</strong>')
			// Convert lists to markdown dashes
			.replace(/<(?:ul|ol)[^>]*>([\s\S]*?)<\/(?:ul|ol)>/gi, (match, content) => {
				const items = content.match(/<li[^>]*>([^<]*)<\/li>/gi) || [];
				return items
					.map(item => item.replace(/<li[^>]*>([^<]*)<\/li>/i, '- $1'))
					.join('\n');
			})
			// Remove citation patterns [1], [2], etc.
			.replace(/\[\d+\]/g, '')
			// Remove other HTML tags
			.replace(/<[^>]+>/g, '\n')
			// Clean up multiple line breaks
			.replace(/\n\n+/g, '\n\n');

		document.execCommand('insertHTML', false, formattedHtml);
	}

	function resetTappedStates() {
		boldTapped = false;
		cutTapped = false;
		copyTapped = false;
		selectAllTapped = false;
		pasteTapped = false;
	}

	function clearSelection() {
		window.getSelection()?.removeAllRanges();
		isVisible = false;
		selectedText = '';
		resetTappedStates();
	}

	let touchStartTime = 0;
	let touchStartX = 0;
	let touchStartY = 0;

	function handleTouchStart(e) {
		touchStartTime = Date.now();
		touchStartX = e.touches[0].clientX;
		touchStartY = e.touches[0].clientY;
	}

	function handleTouchEnd(e) {
		const touchDuration = Date.now() - touchStartTime;
		const touchDistance = Math.sqrt(
			Math.pow(e.changedTouches[0].clientX - touchStartX, 2) +
			Math.pow(e.changedTouches[0].clientY - touchStartY, 2)
		);

		// Long press: 500ms+ and minimal movement
		if (touchDuration >= 500 && touchDistance < 10) {
			handleLongPress({
				preventDefault: () => {},
				target: e.target,
				clientX: e.changedTouches[0].clientX,
				clientY: e.changedTouches[0].clientY
			});
		}
	}

	onMount(() => {
		if (browser) {
			document.addEventListener('mouseup', handleMouseUp);
			document.addEventListener('touchend', handleMouseUp);
			document.addEventListener('click', handleClick);
			document.addEventListener('contextmenu', handleLongPress);
			editorRef?.addEventListener('touchstart', handleTouchStart);
			editorRef?.addEventListener('touchend', handleTouchEnd);
		}
	});

	onDestroy(() => {
		if (browser) {
			document.removeEventListener('mouseup', handleMouseUp);
			document.removeEventListener('touchend', handleMouseUp);
			document.removeEventListener('click', handleClick);
			document.removeEventListener('contextmenu', handleLongPress);
			editorRef?.removeEventListener('touchstart', handleTouchStart);
			editorRef?.removeEventListener('touchend', handleTouchEnd);
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
			<button 
				class="menu-button" 
				class:tapped={boldTapped}
				on:click={handleBold}
				aria-label="Bold"
			>Bold</button>
			<span class="separator"></span>
			<button 
				class="menu-button" 
				class:tapped={cutTapped}
				on:click={handleCut}
				aria-label="Cut"
			>Cut</button>
			<span class="separator"></span>
			<button 
				class="menu-button" 
				class:tapped={copyTapped}
				on:click={handleCopy}
				aria-label="Copy"
			>Copy</button>
			<span class="separator"></span>
			<button 
				class="menu-button" 
				class:tapped={selectAllTapped}
				on:click={handleSelectAll}
				aria-label="Select all"
			>Select all</button>
		{:else}
			<button 
				class="menu-button" 
				class:tapped={pasteTapped}
				on:click={handlePaste}
				aria-label="Paste"
			>Paste</button>
		{/if}
	</div>
{/if}

<style>
	.notepad-selection-menu {
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
		animation: slideUpFade 0.2s ease-out;
	}

	@keyframes slideUpFade {
		from {
			opacity: 0;
			transform: translate(-50%, -90%);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -100%);
		}
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
