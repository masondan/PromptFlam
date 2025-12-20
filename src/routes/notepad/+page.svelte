<script>
	import { onMount } from 'svelte';
	import { Header, NotepadSelectionMenu } from '$lib/components';
	import { 
		currentNoteTitle, 
		currentNoteContent, 
		autoSaveNote,
		startNewNote
	} from '$lib/stores';

	let editorRef;
	let titleRef;
	let saveTimeout;
	let showToast = false;
	let toastMessage = '';
	let hasContent = false;
	let shareTapped = false;
	let downloadTapped = false;
	let copyTapped = false;

	$: title = $currentNoteTitle;
	$: content = $currentNoteContent;
	$: wordCount = getWordCount(content);
	$: hasContent = content.trim().length > 0 || title.trim().length > 0;

	function getWordCount(text) {
		if (!text || !text.trim()) return 0;
		return text.trim().split(/\s+/).filter(w => w).length;
	}

	function handleTitleInput(e) {
		currentNoteTitle.set(e.target.textContent || '');
		debouncedSave();
	}

	function handleTitleKeydown(e) {
		if (e.key === 'Enter') {
			e.preventDefault();
			editorRef?.focus();
		}
	}

	function handleContentInput() {
		if (editorRef) {
			currentNoteContent.set(editorRef.innerHTML || '');
			debouncedSave();
		}
	}

	function debouncedSave() {
		clearTimeout(saveTimeout);
		saveTimeout = setTimeout(() => {
			autoSaveNote();
		}, 2000);
	}

	function handleStartOver() {
		if (!hasContent) {
			showToastMessage('Hang on. First\ncreate a note');
			return;
		}
		startNewNote();
		if (editorRef) editorRef.innerHTML = '';
		if (titleRef) titleRef.textContent = '';
	}

	function htmlToMarkdown(html) {
		let markdown = html;
		
		// Convert strong/bold tags to markdown
		markdown = markdown.replace(/<strong[^>]*>([^<]+)<\/strong>/gi, '**$1**');
		markdown = markdown.replace(/<b[^>]*>([^<]+)<\/b>/gi, '**$1**');
		
		// Preserve line breaks from divs/ps
		markdown = markdown.replace(/<\/?div[^>]*>/gi, '\n');
		markdown = markdown.replace(/<br\s*\/?>/gi, '\n');
		markdown = markdown.replace(/<p[^>]*>/gi, '');
		markdown = markdown.replace(/<\/p>/gi, '\n');
		
		// Remove other HTML tags
		markdown = markdown.replace(/<[^>]+>/g, '');
		
		// Clean up excessive whitespace
		markdown = markdown.replace(/\n\n+/g, '\n\n').trim();
		
		return markdown;
	}

	function handleDownload() {
		downloadTapped = true;
		setTimeout(() => {
			const noteTitle = title || 'Untitled note';
			const markdownContent = htmlToMarkdown(editorRef ? editorRef.innerHTML : content);
			const text = `${noteTitle}\n\n${markdownContent}`;
			const filename = `${noteTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`;
			
			const blob = new Blob([text], { type: 'text/plain' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			a.click();
			URL.revokeObjectURL(url);
			
			showToastMessage('Downloaded');
			downloadTapped = false;
		}, 150);
	}

	async function handleCopy() {
		copyTapped = true;
		setTimeout(async () => {
			const noteTitle = title || 'Untitled note';
			const markdownContent = htmlToMarkdown(editorRef ? editorRef.innerHTML : content);
			const text = `${noteTitle}\n\n${markdownContent}`;
			
			try {
				await navigator.clipboard.writeText(text);
				showToastMessage('Copied to clipboard');
			} catch (err) {
				console.error('Copy failed:', err);
				showToastMessage('Failed to copy');
			}
			copyTapped = false;
		}, 150);
	}

	async function handleShare() {
		shareTapped = true;
		setTimeout(async () => {
			const plainText = editorRef ? editorRef.innerText : content;
			const noteTitle = title || 'Untitled note';
			const text = `${noteTitle}\n\n${plainText}`;
			
			if (navigator.share) {
				try {
					await navigator.share({
						title: noteTitle,
						text: text
					});
				} catch (err) {
					if (err.name !== 'AbortError') {
						console.error('Share failed:', err);
					}
				}
			} else {
				await navigator.clipboard.writeText(text);
				showToastMessage('Copied to clipboard');
			}
			shareTapped = false;
		}, 150);
	}

	function showToastMessage(msg) {
		toastMessage = msg;
		showToast = true;
		setTimeout(() => {
			showToast = false;
		}, 2000);
	}

	// Toolbar handlers
	function handleFontSize() {
		fontSizeState = (fontSizeState + 1) % 3;
		updateEditorFontSize();
	}

	function updateEditorFontSize() {
		if (editorRef) {
			const sizes = ['1rem', '1.125rem', '1.25rem'];
			editorRef.style.fontSize = sizes[fontSizeState];
		}
	}

	function handleUndo() {
		document.execCommand('undo');
		editorRef?.focus();
	}

	function handleRedo() {
		document.execCommand('redo');
		editorRef?.focus();
	}

	function handleList() {
		document.execCommand('insertUnorderedList');
		editorRef?.focus();
		handleContentInput();
	}

	function handleItalic() {
		document.execCommand('italic');
		editorRef?.focus();
		updateFormattingState();
		handleContentInput();
	}

	function handleBold() {
		document.execCommand('bold');
		editorRef?.focus();
		updateFormattingState();
		handleContentInput();
	}

	function handleToolbarToggle(e) {
		toolbarExpanded = e.detail.expanded;
	}

	onMount(() => {
		if (editorRef && content) {
			editorRef.innerHTML = content;
		}
		if (titleRef && title) {
			titleRef.textContent = title;
		}
	});
</script>

<svelte:head>
	<title>Notepad | PromptFlam</title>
</svelte:head>

<Header showNewNote={true} onNewNote={handleStartOver} />

<main class="notepad-page">
	<div class="editor-container">
		<div
			bind:this={titleRef}
			class="title-editor"
			contenteditable="true"
			role="textbox"
			tabindex="0"
			aria-label="Note title"
			data-placeholder="Title"
			on:input={handleTitleInput}
			on:keydown={handleTitleKeydown}
		></div>

		<div
			bind:this={editorRef}
			class="content-editor"
			contenteditable="true"
			role="textbox"
			tabindex="0"
			aria-label="Note content"
			aria-multiline="true"
			data-placeholder="Start writing or paste text. Your notes are saved automatically in the archive."
			on:input={handleContentInput}
			on:keyup={updateFormattingState}
			on:mouseup={updateFormattingState}
		></div>
	</div>

	{#if hasContent}
		<div class="content-footer">
			<span class="word-count">{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
			<div class="action-buttons">
				<button class="action-btn" class:tapped={shareTapped} on:click={handleShare} aria-label="Share">
					<img src="/icons/icon-share.svg" alt="" class="action-icon" />
				</button>
				<button class="action-btn" class:tapped={downloadTapped} on:click={handleDownload} aria-label="Download">
					<img src="/icons/icon-download.svg" alt="" class="action-icon" />
				</button>
				<button class="action-btn" class:tapped={copyTapped} on:click={handleCopy} aria-label="Copy">
					<img src="/icons/icon-copy.svg" alt="" class="action-icon" />
				</button>
			</div>
		</div>
	{/if}
</main>

<NotepadSelectionMenu {editorRef} />

{#if showToast}
	<div class="toast">{toastMessage}</div>
{/if}

<style>
	.notepad-page {
		min-height: 100vh;
		padding-top: var(--header-height);
		display: flex;
		flex-direction: column;
		max-width: var(--max-content-width);
		margin: 0 auto;
		padding-bottom: var(--spacing-lg);
	}

	.editor-container {
		flex: 1;
		padding: var(--spacing-lg) var(--spacing-md) 0;
		display: flex;
		flex-direction: column;
	}

	.title-editor {
		font-size: var(--font-size-h2);
		font-weight: 600;
		line-height: 1.4;
		outline: none;
		min-height: 1.4em;
		margin-bottom: var(--spacing-md);
	}

	.title-editor:empty::before {
		content: attr(data-placeholder);
		color: var(--color-icon-default);
		pointer-events: none;
	}

	.content-editor {
		flex: 1;
		font-size: var(--font-size-base);
		line-height: 1.6;
		outline: none;
		min-height: 300px;
	}

	.content-editor:empty::before {
		content: attr(data-placeholder);
		color: var(--color-icon-default);
		pointer-events: none;
	}

	.content-editor :global(ul) {
		margin-left: var(--spacing-lg);
		list-style-type: disc;
	}

	.content-editor :global(li) {
		margin-bottom: var(--spacing-xs);
	}

	.content-editor::selection,
	.content-editor :global(::selection) {
		background-color: #ece4ff;
	}

	.content-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-sm) var(--spacing-md);
		margin-top: var(--spacing-md);
	}

	.word-count {
		font-size: 0.875rem;
		color: var(--color-icon-default);
	}

	.action-buttons {
		display: flex;
		gap: var(--spacing-sm);
	}

	.action-btn {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-sm);
		transition: background-color 0.15s ease, transform 0.15s ease;
	}

	.action-btn:hover {
		background-color: var(--bg-surface-dark);
	}

	.action-btn.tapped {
		transform: scale(1.15);
	}

	.action-icon {
		width: 20px;
		height: 20px;
		filter: brightness(0) saturate(100%) invert(33%);
	}

	.toast {
		position: fixed;
		top: calc(var(--header-height) + var(--spacing-md));
		right: var(--spacing-md);
		background: #efefef;
		color: var(--text-primary);
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius);
		font-size: 0.875rem;
		font-weight: 400;
		box-shadow: var(--shadow-lg);
		animation: fadeInUp 0.2s ease-out;
		z-index: var(--z-overlay);
		text-align: center;
		white-space: pre-line;
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}
</style>
