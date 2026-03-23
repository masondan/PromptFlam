<script>
	import { createEventDispatcher } from 'svelte';
	import { goto } from '$app/navigation';
	import { Icon } from '$lib/components';
	import { fade, fly } from 'svelte/transition';
	import { marked } from 'marked';
	import { pendingChatInput, favorites, toggleFavorite, isFavorite } from '$lib/stores.js';

	export let isOpen = false;
	export let text = '';
	export let prompt = null;

	const dispatch = createEventDispatcher();

	let editorEl;
	let editedText = '';
	let copied = false;
	let initialized = false;
	let showStyleGuideDrawer = false;
	let styleGuideContent = '';

	function textToHtml(text) {
		return text.split('\n')
			.map(line => {
				const escaped = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
				return `<p>${escaped || '<br>'}</p>`;
			})
			.join('');
	}

	function syncFromEditor() {
		if (!editorEl) return;
		const paragraphs = editorEl.querySelectorAll('p');
		if (paragraphs.length > 0) {
			editedText = Array.from(paragraphs).map(p => p.textContent || '').join('\n');
		} else {
			editedText = editorEl.innerText || '';
		}
	}

	$: if (isOpen && text && !initialized) {
		editedText = text;
		initialized = true;
		
		setTimeout(() => {
			if (editorEl) {
				editorEl.innerHTML = textToHtml(editedText);
				editorEl.focus();
			}
		}, 300);
	}

	$: if (!isOpen) {
		initialized = false;
		showStyleGuideDrawer = false;
	}

	$: isFavorited = prompt ? isFavorite(prompt.category, prompt.subCategory, $favorites) : false;

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
		const textToCopy = generateExportText(editedText);
		await navigator.clipboard.writeText(textToCopy);
		copied = true;
		setTimeout(() => copied = false, 2000);
	}

	async function handleShare() {
		const textToShare = generateExportText(editedText);
		
		if (navigator.share) {
			try {
				await navigator.share({
					text: textToShare,
					title: 'PromptFlam Prompt'
				});
			} catch (err) {
				if (err.name !== 'AbortError') {
					navigator.clipboard.writeText(textToShare);
					copied = true;
					setTimeout(() => copied = false, 2000);
				}
			}
		} else {
			navigator.clipboard.writeText(textToShare);
			copied = true;
			setTimeout(() => copied = false, 2000);
		}
	}

	function generateExportText(text) {
		let result = text;
		
		if (prompt?.styleGuideIncluded) {
			result += '\n\nBefore responding, read and apply the editorial style guide at: ' + window.location.origin + '/style-guide';
		}
		
		return result;
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

	function handleEditorClick() {
		if (!editorEl) return;
		
		setTimeout(() => {
			const sel = window.getSelection();
			if (!sel.rangeCount) return;
			
			const range = sel.getRangeAt(0);
			const textNode = range.startContainer;
			if (textNode.nodeType !== Node.TEXT_NODE) return;
			
			const paraText = textNode.textContent;
			const offset = range.startOffset;
			
			const bracket = findBracketAtPosition(paraText, offset);
			if (bracket) {
				const newRange = document.createRange();
				newRange.setStart(textNode, bracket.start);
				newRange.setEnd(textNode, bracket.end);
				sel.removeAllRanges();
				sel.addRange(newRange);
			}
		}, 0);
	}

	function handleEditorInput() {
		syncFromEditor();
	}

	function handleAddToChat() {
		pendingChatInput.set(editedText);
		close();
		goto('/create');
	}

	function toggleFav() {
		if (prompt) {
			toggleFavorite(prompt.category, prompt.subCategory);
		}
	}

	async function openStyleGuide() {
		showStyleGuideDrawer = true;
		if (!styleGuideContent) {
			try {
				const response = await fetch('/style-guide.md');
				styleGuideContent = await response.text();
			} catch (err) {
				styleGuideContent = 'Error loading style guide';
			}
		}
	}

	function closeStyleGuideDrawer() {
		showStyleGuideDrawer = false;
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<!-- Main Edit Drawer -->
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
			
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<div class="content-area">
				<div
					bind:this={editorEl}
					contenteditable="true"
					on:click={handleEditorClick}
					on:input={handleEditorInput}
					class="edit-textarea"
					role="textbox"
					aria-multiline="true"
				></div>
			</div>

			<div class="drawer-footer">
				<div class="action-buttons">
					<button class="action-btn add-to-chat-btn" on:click={handleAddToChat} aria-label="Add to chat">
						<Icon name="create" size={24} />
					</button>
					<button class="action-btn" on:click={handleShare} aria-label="Share">
						<Icon name="share" size={24} />
					</button>
					<button
						class="action-btn"
						class:copied
						on:click={handleCopy}
						aria-label="Copy"
					>
						<Icon name="copy" size={24} />
					</button>
					<button
						class="action-btn favorite-btn"
						class:active={isFavorited}
						on:click={toggleFav}
						aria-label="Toggle favorite"
					>
						<Icon name={isFavorited ? 'heart-fill' : 'heart'} size={24} />
					</button>
				</div>
				
				{#if prompt?.styleGuideIncluded}
					<button class="style-guide-link" on:click={openStyleGuide}>
						Style guide added to prompt
					</button>
				{/if}
			</div>
		</div>
	</div>

	<!-- Style Guide Drawer -->
	{#if showStyleGuideDrawer}
		<div class="style-guide-drawer" transition:fly={{ y: '100%', duration: 250 }}>
			<div class="guide-header">
				<button class="close-btn" on:click={closeStyleGuideDrawer} aria-label="Close">
					<Icon name="close" size={24} />
				</button>
				<h3>Editorial Style Guide</h3>
			</div>
			<div class="guide-content">
				{@html marked(styleGuideContent)}
			</div>
		</div>
	{/if}
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
		background: none;
		border: none;
		cursor: pointer;
		transition: color 0.15s, transform 0.15s;
	}

	.close-btn:hover {
		color: var(--color-icon-active);
		transform: scale(1.1);
	}

	.content-area {
		flex: 1;
		overflow-y: auto;
		padding-top: var(--spacing-md);
		min-height: 0;
	}

	.drawer-footer {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
		padding-top: var(--spacing-xs);
		position: relative;
	}

	.edit-textarea {
		width: 100%;
		min-height: 200px;
		padding: 0;
		font-size: var(--font-size-base);
		line-height: 1.6;
		font-family: inherit;
		color: var(--text-primary);
		background: var(--bg-main);
		border: none;
		outline: none;
		white-space: pre-wrap;
		word-wrap: break-word;
	}

	.edit-textarea :global(p) {
		margin: 0 0 6px 0;
	}

	.edit-textarea ::selection {
		background-color: var(--color-highlight);
	}

	.style-guide-link {
		display: block;
		width: 100%;
		padding: 0;
		margin-top: var(--spacing-xs);
		background: none;
		border: none;
		color: #aaaaaa;
		font-size: 0.9rem;
		font-weight: 400;
		cursor: pointer;
		text-decoration: underline;
		text-align: center;
	}

	.style-guide-link:hover {
		color: #888888;
	}

	.action-buttons {
		display: flex;
		justify-content: center;
		gap: var(--spacing-lg);
		padding: var(--spacing-xs) 0;
		flex-shrink: 0;
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-sm);
		color: #777777;
		background: none;
		border: none;
		cursor: pointer;
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

	.action-btn.favorite-btn.active {
		color: var(--accent-brand);
	}

	@keyframes pulse {
		0% { transform: scale(1); }
		50% { transform: scale(1.2); }
		100% { transform: scale(1); }
	}

	/* Style Guide Drawer */
	.style-guide-drawer {
		position: fixed;
		inset: 0;
		background: var(--bg-main);
		z-index: calc(var(--z-overlay) + 1);
		display: flex;
		flex-direction: column;
		padding: var(--spacing-md);
	}

	@media (min-width: 768px) {
		.style-guide-drawer {
			left: 50%;
			right: auto;
			transform: translateX(-50%);
			width: 100%;
			max-width: var(--app-max-width);
		}
	}

	.guide-header {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.guide-header h3 {
		flex: 1;
		margin: 0;
		font-size: 1.1rem;
		color: var(--accent-brand);
		text-align: center;
		padding-right: 32px;
	}

	.guide-content {
		flex: 1;
		overflow-y: auto;
		padding-top: var(--spacing-md);
		font-size: 0.9rem;
		line-height: 1.6;
		color: var(--text-primary);
	}

	.guide-content :global(h1),
	.guide-content :global(h2),
	.guide-content :global(h3) {
		color: var(--accent-brand);
		margin: 1.2em 0 0.4em;
	}

	.guide-content :global(h1) { font-size: 1.2rem; }
	.guide-content :global(h2) { font-size: 1.1rem; }
	.guide-content :global(h3) { font-size: 1rem; }

	.guide-content :global(ul),
	.guide-content :global(ol) {
		padding-left: 1.2em;
		margin: 0.4em 0;
	}

	.guide-content :global(li) {
		margin-bottom: 0.3em;
	}

	.guide-content :global(p) {
		margin: 0 0 0.6em;
	}

	.guide-content :global(strong) {
		font-weight: 600;
	}
</style>
