<script>
	import { Header } from '$lib/components';
	import { 
		currentNoteTitle, 
		currentNoteContent, 
		autoSaveNote,
		startNewNote
	} from '$lib/stores';

	let saveTimeout;

	$: title = $currentNoteTitle;
	$: content = $currentNoteContent;

	function handleTitleChange(e) {
		currentNoteTitle.set(e.target.value);
		debouncedSave();
	}

	function handleContentChange(e) {
		currentNoteContent.set(e.target.value);
		debouncedSave();
	}

	function debouncedSave() {
		clearTimeout(saveTimeout);
		saveTimeout = setTimeout(() => {
			autoSaveNote();
		}, 2000);
	}

	function handleNewNote() {
		startNewNote();
	}

	function handleDownload() {
		const text = `${title}\n\n${content}`;
		const filename = `${(title || 'note').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`;
		
		const blob = new Blob([text], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<svelte:head>
	<title>Notepad | PromptFlam</title>
</svelte:head>

<Header />

<main class="notepad-page">
	<div class="notepad-header">
		<input
			type="text"
			class="title-input"
			placeholder="Note title..."
			value={title}
			on:input={handleTitleChange}
		/>
		<div class="notepad-actions">
			<button class="action-btn" on:click={handleNewNote} aria-label="New note">
				<img src="/icons/icon-newchat.svg" alt="" class="action-icon" />
			</button>
			<button class="action-btn" on:click={handleDownload} aria-label="Download">
				<img src="/icons/icon-download.svg" alt="" class="action-icon" />
			</button>
		</div>
	</div>

	<textarea
		class="content-textarea"
		placeholder="Start writing..."
		value={content}
		on:input={handleContentChange}
	></textarea>

	<p class="save-indicator">Auto-saved</p>
</main>

<style>
	.notepad-page {
		min-height: 100vh;
		padding-top: var(--header-height);
		display: flex;
		flex-direction: column;
		max-width: var(--max-content-width);
		margin: 0 auto;
	}

	.notepad-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-md);
		border-bottom: 1px solid var(--color-border-light);
	}

	.title-input {
		flex: 1;
		font-size: var(--font-size-lg);
		font-weight: 600;
		border: none;
		outline: none;
		background: transparent;
	}

	.title-input::placeholder {
		color: var(--color-icon-default);
	}

	.notepad-actions {
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
		background-color: var(--color-surface-dark);
	}

	.action-icon {
		width: 20px;
		height: 20px;
		opacity: 0.6;
	}

	.action-btn:hover .action-icon {
		opacity: 1;
	}

	.content-textarea {
		flex: 1;
		padding: var(--spacing-md);
		font-size: var(--font-size-base);
		line-height: 1.6;
		border: none;
		outline: none;
		resize: none;
		min-height: 400px;
	}

	.content-textarea::placeholder {
		color: var(--color-icon-default);
	}

	.save-indicator {
		padding: var(--spacing-sm) var(--spacing-md);
		font-size: var(--font-size-sm);
		color: var(--color-icon-default);
		text-align: center;
		border-top: 1px solid var(--color-border-light);
	}
</style>
