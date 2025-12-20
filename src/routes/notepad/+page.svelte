<script>
	import { onMount } from 'svelte';
	import { Header, NotepadToolbar, NotepadSelectionMenu } from '$lib/components';
	import { 
		currentNoteTitle, 
		currentNoteContent, 
		autoSaveNote,
		startNewNote
	} from '$lib/stores';

	let editorRef;
	let titleRef;
	let saveTimeout;
	let toolbarExpanded = false;
	let fontSizeState = 0; // 0 = default, 1 = medium, 2 = large
	let isBoldActive = false;
	let isItalicActive = false;
	let showToast = false;
	let toastMessage = '';
	let hasContent = false;

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
			updateFormattingState();
			debouncedSave();
		}
	}

	function updateFormattingState() {
		if (typeof document !== 'undefined') {
			isBoldActive = document.queryCommandState('bold');
			isItalicActive = document.queryCommandState('italic');
		}
	}

	function debouncedSave() {
		clearTimeout(saveTimeout);
		saveTimeout = setTimeout(() => {
			autoSaveNote();
		}, 2000);
	}

	function handleStartOver() {
		if (hasContent) {
			if (confirm('Start a new note? Current note is auto-saved.')) {
				startNewNote();
				if (editorRef) editorRef.innerHTML = '';
				if (titleRef) titleRef.textContent = '';
				fontSizeState = 0;
				updateEditorFontSize();
			}
		}
	}

	function handleDownload() {
		const plainText = editorRef ? editorRef.innerText : content;
		const noteTitle = title || 'Untitled note';
		const text = `${noteTitle}\n\n${plainText}`;
		const filename = `${noteTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`;
		
		const blob = new Blob([text], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
		
		showToastMessage('Downloaded');
	}

	async function handleCopy() {
		const plainText = editorRef ? editorRef.innerText : content;
		const noteTitle = title || 'Untitled note';
		const text = `${noteTitle}\n\n${plainText}`;
		
		try {
			await navigator.clipboard.writeText(text);
			showToastMessage('Copied to clipboard');
		} catch (err) {
			console.error('Copy failed:', err);
			showToastMessage('Failed to copy');
		}
	}

	async function handleShare() {
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
			await handleCopy();
		}
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

<Header />

<main class="notepad-page">
	<div class="notepad-header">
		<button 
			class="startover-btn" 
			on:click={handleStartOver}
			aria-label="Start over"
			disabled={!hasContent}
		>
			<img src="/icons/icon-startover.svg" alt="" class="startover-icon" />
		</button>
	</div>

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
			data-placeholder="Write or paste"
			on:input={handleContentInput}
			on:keyup={updateFormattingState}
			on:mouseup={updateFormattingState}
		></div>
	</div>

	{#if hasContent}
		<div class="content-footer">
			<span class="word-count">{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
			<div class="action-buttons">
				<button class="action-btn" on:click={handleShare} aria-label="Share">
					<img src="/icons/icon-share.svg" alt="" class="action-icon" />
				</button>
				<button class="action-btn" on:click={handleDownload} aria-label="Download">
					<img src="/icons/icon-download.svg" alt="" class="action-icon" />
				</button>
				<button class="action-btn" on:click={handleCopy} aria-label="Copy">
					<img src="/icons/icon-copy.svg" alt="" class="action-icon" />
				</button>
			</div>
		</div>
	{/if}
</main>

<NotepadToolbar
	bind:isExpanded={toolbarExpanded}
	{fontSizeState}
	{isBoldActive}
	{isItalicActive}
	on:toggle={handleToolbarToggle}
	on:fontsize={handleFontSize}
	on:undo={handleUndo}
	on:redo={handleRedo}
	on:list={handleList}
	on:italic={handleItalic}
	on:bold={handleBold}
/>

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
		padding-bottom: 80px;
	}

	.notepad-header {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		padding: var(--spacing-sm) var(--spacing-md);
	}

	.startover-btn {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-sm);
		transition: opacity 0.15s ease;
	}

	.startover-btn:disabled {
		opacity: 0.3;
	}

	.startover-btn:not(:disabled):hover {
		background-color: var(--bg-surface-dark);
	}

	.startover-icon {
		width: 20px;
		height: 20px;
		opacity: 0.6;
	}

	.editor-container {
		flex: 1;
		padding: 0 var(--spacing-md);
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
		transition: background-color 0.15s ease;
	}

	.action-btn:hover {
		background-color: var(--bg-surface-dark);
	}

	.action-icon {
		width: 20px;
		height: 20px;
		filter: brightness(0) saturate(100%) invert(33%);
	}

	.toast {
		position: fixed;
		bottom: 80px;
		left: 50%;
		transform: translateX(-50%);
		background: var(--text-primary);
		color: var(--bg-main);
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-full);
		font-size: 0.875rem;
		font-weight: 500;
		box-shadow: var(--shadow-lg);
		animation: fadeInUp 0.2s ease-out;
		z-index: var(--z-overlay);
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
