<script>
	import { goto } from '$app/navigation';
	import { Header, ThinkingDots, StyleCheckDrawer, Icon } from '$lib/components';
	import {
		styleCheckInputText,
		styleCheckLanguage,
		styleCheckSuggestions,
		styleCheckEditedText,
		styleCheckOriginalText,
		styleCheckShowResults,
		clearStyleCheckSession,
		currentNoteTitle,
		currentNoteContent,
		startNewNote
	} from '$lib/stores';

	// Subscribe to persistent stores
	let inputText = $state('');
	let language = $state('British English');
	let suggestions = $state([]);
	let editedText = $state('');
	let originalText = $state('');
	let showResults = $state(false);

	// Component-local transient state
	let isLoading = $state(false);
	let showDrawer = $state(false);
	let errorMessage = $state('');
	let expandedPanel = $state('edited'); // 'original' | 'edited'
	let copyLabel = $state('Copy');
	let drawerAcceptedState = $state(new Map());     // Persists accepted suggestions across drawer opens
	let drawerDismissedState = $state(new Set());    // Persists dismissed suggestions across drawer opens

	// Sync persistent stores to component state
	styleCheckInputText.subscribe(val => inputText = val);
	styleCheckLanguage.subscribe(val => language = val);
	styleCheckSuggestions.subscribe(val => suggestions = val);
	styleCheckEditedText.subscribe(val => editedText = val);
	styleCheckOriginalText.subscribe(val => originalText = val);
	styleCheckShowResults.subscribe(val => showResults = val);

	// Strip HTML tags and normalise paragraph spacing on paste
	function handlePaste(e) {
		e.preventDefault();
		const html = e.clipboardData.getData('text/html');
		const plain = e.clipboardData.getData('text/plain');

		let text;
		if (html) {
			const tmp = document.createElement('div');
			tmp.innerHTML = html;
			// Remove noise elements
			tmp.querySelectorAll('script, style, nav, header, footer, aside, [class*="ad"], [class*="related"], [class*="promo"]').forEach(el => el.remove());
			// Insert double newline after block-level elements so paragraphs are preserved
			tmp.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, li, br, section, article').forEach(el => {
				el.insertAdjacentText('afterend', '\n\n');
			});
			text = tmp.innerText || tmp.textContent || '';
		} else {
			text = plain;
		}

		// Normalise line endings, collapse 3+ newlines to 2 (single blank line between paragraphs)
		text = text
			.replace(/\r\n/g, '\n')
			.replace(/\r/g, '\n')
			.replace(/[^\S\n]+/g, ' ')   // collapse horizontal whitespace within lines
			.replace(/\n{3,}/g, '\n\n')  // max one blank line between paragraphs
			.trim();

		styleCheckInputText.set(text);
		inputText = text;
	}

	async function handleCheckStyle() {
		if (!inputText.trim() || isLoading) return;

		isLoading = true;
		errorMessage = '';
		originalText = inputText;
		styleCheckOriginalText.set(inputText);

		try {
			const res = await fetch('/api/style-check', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text: inputText, language })
			});

			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.message || 'Style check failed — please try again');
			}

			const data = await res.json();
			suggestions = data;
			styleCheckSuggestions.set(data);
			showDrawer = true;
		} catch (err) {
			errorMessage = err.message || 'Style check failed — please try again';
		} finally {
			isLoading = false;
		}
	}

	function handleSave(text, acceptedMap, dismissedSet) {
		editedText = text;
		styleCheckEditedText.set(text);
		// Persist the drawer state so it can be restored when Edit is clicked
		drawerAcceptedState = new Map(acceptedMap);
		drawerDismissedState = new Set(dismissedSet);
		showResults = true;
		styleCheckShowResults.set(true);
		showDrawer = false;
		expandedPanel = 'edited';
	}

	function handleDrawerClose() {
		showDrawer = false;
	}

	function handleEdit() {
		showDrawer = true;
	}

	function handleSaveToNotepad() {
		startNewNote();
		currentNoteTitle.set('Untitled');
		// Convert plain text with paragraph breaks (\n\n) to HTML with proper spacing
		const htmlContent = convertPlainTextToHtml(editedText);
		currentNoteContent.set(htmlContent);
		goto('/notepad');
	}

	function convertPlainTextToHtml(text) {
		if (!text) return '';
		
		// Split by double newlines (paragraph breaks)
		const paragraphs = text.split(/\n\n+/);
		
		// Wrap each paragraph in a div to maintain spacing
		// Use divs instead of <p> tags to be consistent with contenteditable behavior
		const htmlParagraphs = paragraphs
			.map(para => {
				// Preserve single line breaks within a paragraph as <br>
				const withLineBreaks = para.replace(/\n/g, '<br>');
				return `<div style="margin-bottom: 1em;">${withLineBreaks}</div>`;
			})
			.join('');
		
		return htmlParagraphs;
	}

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(editedText);
			copyLabel = 'Copied ✓';
			setTimeout(() => (copyLabel = 'Copy'), 1500);
		} catch {
			copyLabel = 'Copy';
		}
	}

	async function handleShare() {
		if (navigator.share) {
			try {
				await navigator.share({ text: editedText });
				return;
			} catch {
				// fall through to copy
			}
		}
		handleCopy();
	}

	function handleNewCheck() {
		clearStyleCheckSession();
		inputText = '';
		language = 'British English';
		suggestions = [];
		editedText = '';
		originalText = '';
		showResults = false;
		showDrawer = false;
		errorMessage = '';
		expandedPanel = 'edited';
		copyLabel = 'Copy';
		drawerAcceptedState = new Map();
		drawerDismissedState = new Set();
	}
</script>

<svelte:head>
	<title>Style Check | PromptFlam</title>
</svelte:head>

<Header />

<main class="style-check-page">
	<div class="page-content">

		{#if showResults}
			<!-- ── Results View ── -->

			<!-- Original panel -->
			<div class="panel-section">
				<span class="panel-label">Original</span>
				<div class="panel-card" class:panel-collapsed={expandedPanel !== 'original'}>
					<div class="panel-text original-text">{originalText}</div>
					<button
						class="chevron-btn"
						aria-label={expandedPanel === 'original' ? 'Collapse original' : 'Expand original'}
						onclick={() => (expandedPanel = expandedPanel === 'original' ? 'edited' : 'original')}
					>
						<Icon name={expandedPanel === 'original' ? 'collapse' : 'expand'} size={20} />
					</button>
				</div>
			</div>

			<!-- Edited panel -->
			<div class="panel-section">
				<span class="panel-label">Checked</span>
				<div class="panel-card edited-card" class:panel-collapsed={expandedPanel !== 'edited'}>
					<div
						class="panel-text edited-text"
						contenteditable="true"
						onblur={(e) => {
							editedText = e.currentTarget.textContent || '';
							styleCheckEditedText.set(editedText);
						}}
						oninput={(e) => {
							editedText = e.currentTarget.textContent || '';
						}}
					>
						{editedText}
					</div>
					<button
						class="chevron-btn"
						aria-label={expandedPanel === 'edited' ? 'Collapse edited' : 'Expand edited'}
						onclick={() => (expandedPanel = expandedPanel === 'edited' ? 'original' : 'edited')}
					>
						<Icon name={expandedPanel === 'edited' ? 'collapse' : 'expand'} size={20} />
					</button>
				</div>

				<!-- Bottom action bar -->
				<div class="action-bar">
					<button class="action-btn" onclick={handleEdit}>
						<Icon name="edit" size={18} />
						Edit
					</button>
					<button class="action-btn" onclick={handleSaveToNotepad}>
						<Icon name="notepad" size={18} />
						Save
					</button>
					<button class="action-btn" onclick={handleCopy}>
						<Icon name="copy" size={18} />
						{copyLabel}
					</button>
					<button class="action-btn" onclick={handleShare}>
						<Icon name="share" size={18} />
						Share
					</button>
				</div>
			</div>

			<!-- New check button -->
			<button class="new-check-btn" onclick={handleNewCheck}>
				Check new article
			</button>

		{:else}
			<!-- ── Input View ── -->
			<div class="page-header">
				<h1 class="page-title">Spelling, Grammar &amp; Style</h1>
			</div>

			<div class="input-area">
				<textarea
						class="article-input"
						placeholder="Paste your article here…"
						value={inputText}
						onchange={(e) => {
							inputText = e.target.value;
							styleCheckInputText.set(e.target.value);
						}}
						oninput={(e) => {
							inputText = e.target.value;
							styleCheckInputText.set(e.target.value);
						}}
						disabled={isLoading}
						onpaste={handlePaste}
					></textarea>
			</div>

			{#if errorMessage}
				<div class="error-message">
					<p>{errorMessage}</p>
					<button onclick={() => (errorMessage = '')}>Dismiss</button>
				</div>
			{/if}

			<div class="language-toggle">
				<button
					class="lang-btn"
					class:active={language === 'British English'}
					onclick={() => {
						language = 'British English';
						styleCheckLanguage.set('British English');
					}}
				>
					British English
				</button>
				<button
					class="lang-btn"
					class:active={language === 'American English'}
					onclick={() => {
						language = 'American English';
						styleCheckLanguage.set('American English');
					}}
				>
					US English
				</button>
			</div>

			<button
				class="check-btn"
				class:loading={isLoading}
				disabled={!inputText.trim()}
				onclick={handleCheckStyle}
			>
				{#if isLoading}
					Proofreading...
					<span class="spinner"></span>
				{:else}
					Check Writing
				{/if}
			</button>
		{/if}

	</div>
</main>

{#if showDrawer}
	<StyleCheckDrawer
		{originalText}
		{suggestions}
		{language}
		initialAccepted={drawerAcceptedState}
		initialDismissed={drawerDismissedState}
		onSave={handleSave}
		onClose={handleDrawerClose}
	/>
{/if}

<style>
	.style-check-page {
		padding-top: var(--spacing-md);
		padding-bottom: var(--spacing-xl);
		min-height: 100vh;
	}

	.page-content {
		max-width: var(--max-content-width, 680px);
		margin: 0 auto;
		padding: var(--spacing-md);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.page-header {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		align-items: center;
		text-align: center;
	}

	.page-title {
		font-size: 1.125rem;
		font-weight: 700;
		color: #555555;
		margin: 0;
	}

	.language-toggle {
		display: flex;
		gap: var(--spacing-sm);
		justify-content: center;
	}

	.lang-btn {
		padding: var(--spacing-xs) var(--spacing-md);
		border-radius: var(--radius-full, 9999px);
		border: 1px solid var(--color-border);
		background: transparent;
		color: var(--text-primary);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s, color 0.15s, border-color 0.15s;
	}

	.lang-btn.active {
		background: var(--accent-brand);
		color: #fff;
		border-color: var(--accent-brand);
	}

	.lang-btn:not(.active):hover {
		background: var(--bg-surface);
	}

	/* ── Input area ── */
	.input-area {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.article-input {
		width: 100%;
		min-height: 60vh;
		max-height: 60vh;
		padding: var(--spacing-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--bg-main);
		color: var(--text-primary);
		font-family: var(--font-family);
		font-size: var(--font-size-base);
		line-height: var(--line-height);
		resize: vertical;
		box-sizing: border-box;
		transition: border-color 0.15s;
		overflow-y: auto;
	}

	.article-input:focus {
		outline: none;
		border-color: var(--accent-brand);
	}

	.article-input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.article-input::placeholder {
		color: var(--text-secondary);
	}

	.check-btn {
		width: 100%;
		padding: var(--spacing-md);
		background: var(--accent-brand);
		color: #fff;
		border: none;
		border-radius: var(--radius);
		font-size: var(--font-size-base);
		font-weight: 600;
		cursor: pointer;
		transition: background 150ms ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		min-height: 52px;
	}

	.check-btn:hover:not(:disabled) {
		background: #4a1d9e;
	}

	.check-btn:disabled {
		background: #efefef;
		color: #777777;
		cursor: not-allowed;
	}

	.check-btn.loading {
		background: var(--accent-brand);
		color: #fff;
		cursor: not-allowed;
	}

	.spinner {
		display: inline-block;
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: #ffffff;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.error-message {
		background: var(--color-spelling-bg);
		border: 1px solid var(--color-spelling-border);
		border-radius: var(--radius);
		padding: var(--spacing-md);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-sm);
	}

	.error-message p {
		color: var(--color-reject);
		margin: 0;
		font-size: 0.875rem;
	}

	.error-message button {
		background: transparent;
		color: var(--color-reject);
		font-size: 0.875rem;
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-sm);
		border: none;
		cursor: pointer;
		flex-shrink: 0;
	}

	.error-message button:hover {
		background: rgba(220, 38, 38, 0.1);
	}

	/* ── Results View ── */
	.panel-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.panel-label {
		font-size: 1.125rem;
		font-weight: 600;
		text-transform: none;
		letter-spacing: 0;
		color: var(--text-secondary);
	}

	.panel-card {
		position: relative;
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		padding: var(--spacing-md);
		padding-bottom: calc(var(--spacing-md) + 28px); /* room for chevron */
		overflow: hidden;
	}

	.panel-collapsed .panel-text {
		display: -webkit-box;
		-webkit-line-clamp: 4;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.panel-text {
		margin: 0;
		font-size: var(--font-size-base);
		color: var(--text-primary);
		line-height: var(--line-height, 1.6);
	}

	.original-text {
		white-space: pre-wrap;
		word-wrap: break-word;
	}

	.edited-text {
		white-space: pre-wrap;
		outline: none;
	}

	.edited-text:focus {
		outline: none;
	}

	.edited-card {
		max-height: none;
	}

	.panel-collapsed.edited-card .panel-text {
		display: -webkit-box;
		-webkit-line-clamp: 4;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.chevron-btn {
		position: absolute;
		bottom: var(--spacing-sm);
		right: var(--spacing-sm);
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 4px;
		color: var(--text-secondary);
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-sm);
		transition: color 0.15s, background 0.15s;
	}

	.chevron-btn:hover {
		color: var(--text-primary);
		background: var(--color-border);
	}

	/* ── Action bar ── */
	.action-bar {
		display: flex;
		gap: var(--spacing-sm);
		margin-top: var(--spacing-sm);
		justify-content: center;
		align-items: center;
		flex-wrap: wrap;
	}

	.action-btn {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-xs) var(--spacing-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--bg-surface);
		color: var(--text-primary);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s, border-color 0.15s;
	}

	.action-btn:hover {
		background: var(--color-highlight);
		border-color: var(--accent-brand);
		color: var(--accent-brand);
	}

	/* ── New check button ── */
	.new-check-btn {
		width: 100%;
		padding: var(--spacing-md);
		background: var(--accent-brand);
		color: #fff;
		border: none;
		border-radius: var(--radius);
		font-size: var(--font-size-base);
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s;
		min-height: 52px;
	}

	.new-check-btn:hover {
		background: #4a1d9e;
	}
</style>
