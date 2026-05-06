<script>
	import { Icon, ThinkingDots } from '$lib/components';

	let {
		originalText = '',
		suggestions = [],
		language = 'British English',
		onSave,
		onClose
	} = $props();

	// Internal state
	let activeFilter = $state('none');      // 'none' | 'spelling' | 'grammar' | 'style'
	let dismissed = $state(new Set());      // ids of rejected suggestions
	let accepted = $state(new Map());       // id → accepted replacement text
	let activeSuggestion = $state(null);    // suggestion object currently in modal
	let rewrites = $state(new Map());       // id → array of rewrite strings
	let rewriteLoading = $state(false);
	let rewriteIndex = $state(new Map());   // id → current rewrite index shown

	// Normalise whitespace within a single line/sentence (not across paragraphs)
	function normalise(str) {
		return str.replace(/[ \t]+/g, ' ').trim();
	}

	// Split a single paragraph into sentences on . ! ? followed by whitespace or end
	function splitSentences(para) {
		const normalised = normalise(para);
		const parts = [];
		const regex = /[^.!?]*[.!?]+(?:\s|$)|[^.!?]+$/g;
		let match;
		while ((match = regex.exec(normalised)) !== null) {
			const s = match[0].trim();
			if (s) parts.push(s);
		}
		return parts.length > 0 ? parts : (normalised ? [normalised] : []);
	}

	// Split full text into paragraphs (on blank lines), then sentences within each
	function splitParagraphs(text) {
		return text
			.split(/\n\s*\n/)
			.map(p => p.replace(/\n/g, ' ').trim())
			.filter(p => p.length > 0);
	}

	// Derived: array of paragraphs, each containing array of sentences
	let paragraphs = $derived(
		splitParagraphs(originalText).map(para => splitSentences(para))
	);

	// Visible suggestions: accepted ones still show (green underline), only rejected are hidden
	function visibleSuggestions(type = null) {
		return suggestions.filter(s => {
			// Rejected (dismissed but not accepted) are hidden
			if (dismissed.has(s.id) && !accepted.has(s.id)) return false;
			if (type === 'none') return false;
			if (type && s.type !== type) return false;
			return true;
		});
	}

	// Count pending (not dismissed at all) per type
	function pendingCount(type) {
		return suggestions.filter(s => !dismissed.has(s.id) && s.type === type).length;
	}

	// Count actual visible blocks (sentences) with rendered highlights
	// Since annotate() only renders ONE highlight per sentence, we count sentences
	function blockCount(type) {
		const active = suggestions.filter(s => !dismissed.has(s.id) && (type === 'none' ? false : s.type === type));
		const blockSet = new Set();
		
		for (const para of paragraphs) {
			for (const sentence of para) {
				const normSentence = normalise(sentence);
				for (const s of active) {
					const normOriginal = normalise(s.original);
					if (normSentence.indexOf(normOriginal) !== -1) {
						blockSet.add(sentence); // unique sentence = unique block
						break; // only one match per sentence
					}
				}
			}
		}
		return blockSet.size;
	}

	// Build annotated segments for a sentence
	// Returns array of { text, suggestion | null }
	function annotate(sentence) {
		const normSentence = normalise(sentence);
		const active = visibleSuggestions(activeFilter);

		// Find first matching suggestion in this sentence
		for (const s of active) {
			const normOriginal = normalise(s.original);
			const idx = normSentence.indexOf(normOriginal);
			if (idx !== -1) {
				const before = normSentence.slice(0, idx);
				const after = normSentence.slice(idx + normOriginal.length);
				const segments = [];
				if (before) segments.push({ text: before, suggestion: null });
				
				// If accepted, show the replacement text; otherwise show original
				const displayText = accepted.has(s.id) ? accepted.get(s.id) : normOriginal;
				segments.push({ text: displayText, suggestion: s });
				
				if (after) segments.push({ text: after, suggestion: null });
				return segments;
			}
		}
		return [{ text: normSentence, suggestion: null }];
	}

	// Category filter toggle
	function toggleFilter(type) {
		activeFilter = activeFilter === type ? 'none' : type;
	}

	// Accept a suggestion
	function acceptSuggestion(s) {
		// Use current rewrite if one is selected, otherwise use suggested
		const rewriteArr = rewrites.get(s.id);
		const idx = rewriteIndex.get(s.id) ?? 0;
		const text = rewriteArr ? rewriteArr[idx] : s.suggested;

		const newAccepted = new Map(accepted);
		newAccepted.set(s.id, text);
		accepted = newAccepted;

		const newDismissed = new Set(dismissed);
		newDismissed.add(s.id);
		dismissed = newDismissed;

		activeSuggestion = null;
	}

	// Reject a suggestion
	function rejectSuggestion(s) {
		const newDismissed = new Set(dismissed);
		newDismissed.add(s.id);
		dismissed = newDismissed;
		activeSuggestion = null;
	}

	// Fetch rewrites
	async function fetchRewrites(s) {
		rewriteLoading = true;
		try {
			const res = await fetch('/api/style-rewrite', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ original: s.original, language })
			});
			if (!res.ok) throw new Error('Rewrite failed');
			const data = await res.json();
			const arr = data.rewrites || [];
			const newRewrites = new Map(rewrites);
			newRewrites.set(s.id, arr);
			rewrites = newRewrites;
			const newIndex = new Map(rewriteIndex);
			newIndex.set(s.id, 0);
			rewriteIndex = newIndex;
		} catch (err) {
			console.error('Rewrite error:', err);
		} finally {
			rewriteLoading = false;
		}
	}

	// Navigate rewrite options
	function prevRewrite(s) {
		const idx = rewriteIndex.get(s.id) ?? 0;
		if (idx > 0) {
			const newIndex = new Map(rewriteIndex);
			newIndex.set(s.id, idx - 1);
			rewriteIndex = newIndex;
		}
	}

	function nextRewrite(s) {
		const arr = rewrites.get(s.id) || [];
		const idx = rewriteIndex.get(s.id) ?? 0;
		if (idx < arr.length - 1) {
			const newIndex = new Map(rewriteIndex);
			newIndex.set(s.id, idx + 1);
			rewriteIndex = newIndex;
		}
	}

	// Save: apply all accepted replacements
	function handleSave() {
		let result = originalText;
		// Apply in order of suggestions array to be deterministic
		// Sort by position in text (reverse order) to avoid index shifting
		const acceptedSuggestions = suggestions
			.filter(s => accepted.has(s.id))
			.map(s => ({
				...s,
				// Find position of original text in result
				pos: result.indexOf(s.original)
			}))
			.filter(s => s.pos !== -1)
			.sort((a, b) => b.pos - a.pos); // Reverse order
		
		// Apply replacements from end to start to preserve positions
		for (const s of acceptedSuggestions) {
			const replacement = accepted.get(s.id);
			const pos = result.indexOf(s.original);
			if (pos !== -1) {
				result = result.slice(0, pos) + replacement + result.slice(pos + s.original.length);
			}
		}
		onSave?.(result);
		onClose?.();
	}

	// Colour helpers
	const typeColors = {
		spelling: { bg: 'var(--color-spelling-bg)', border: 'var(--color-spelling-border)', label: 'Spelling', emoji: '🔴' },
		grammar:  { bg: 'var(--color-grammar-bg)',  border: 'var(--color-grammar-border)',  label: 'Grammar',  emoji: '🟡' },
		style:    { bg: 'var(--color-style-bg)',    border: 'var(--color-style-border)',    label: 'Style',    emoji: '🔵' }
	};

	// Current rewrite text for modal display
	function currentRewriteText(s) {
		const arr = rewrites.get(s.id);
		if (!arr || arr.length === 0) return s.suggested;
		return arr[rewriteIndex.get(s.id) ?? 0];
	}

	// Is suggestion accepted (green underline state)
	function isAccepted(s) {
		return accepted.has(s.id);
	}

	// Close modal on backdrop click
	function handleModalBackdrop(e) {
		if (e.target === e.currentTarget) {
			activeSuggestion = null;
		}
	}

	// Keyboard: Escape closes modal or drawer
	function handleKeydown(e) {
		if (e.key === 'Escape') {
			if (activeSuggestion) {
				activeSuggestion = null;
			} else {
				onClose?.();
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="drawer-overlay" role="dialog" aria-modal="true" aria-label="Style Check">
	<!-- Fixed header -->
	<div class="drawer-header">
		<button class="close-btn" onclick={onClose} aria-label="Close">
			<Icon name="close" size={24} />
		</button>
		<span class="drawer-title">Style Check</span>
		<button class="save-btn" onclick={handleSave}>Save</button>
	</div>

	<!-- Category filter bar -->
	<div class="filter-bar">
		{#each ['spelling', 'grammar', 'style'] as type}
			{@const count = blockCount(type)}
			{@const colors = typeColors[type]}
			{@const isActive = activeFilter === type}
			<button
				class="filter-btn"
				class:active={isActive}
				style:--filter-bg={colors.bg}
				style:--filter-border={colors.border}
				onclick={() => toggleFilter(type)}
			>
				{colors.label}
				<span
					class="filter-badge"
					style:background={colors.border}
				>{count}</span>
			</button>
		{/each}
	</div>

	<!-- Scrollable article body -->
	<div class="article-body">
		{#each paragraphs as sentences, pi}
			<p class="article-para">
				{#each sentences as sentence}
					<span class="sentence">
							{#each annotate(sentence) as seg}
								{#if seg.suggestion}
									{@const s = seg.suggestion}
									{@const colors = typeColors[s.type]}
									{#if isAccepted(s)}
										<!-- Accepted: green underline -->
										<mark
											class="highlight accepted"
											onclick={() => (activeSuggestion = s)}
											role="button"
											tabindex="0"
											onkeydown={(e) => e.key === 'Enter' && (activeSuggestion = s)}
										>{seg.text}</mark>
									{:else}
										<!-- Pending highlight -->
										<mark
											class="highlight"
											style:background={colors.bg}
											style:outline={`1px solid ${colors.border}`}
											onclick={() => (activeSuggestion = s)}
											role="button"
											tabindex="0"
											onkeydown={(e) => e.key === 'Enter' && (activeSuggestion = s)}
										>{seg.text}</mark>
									{/if}
								{:else}
									{seg.text}
								{/if}
							{/each}
						</span>
				{/each}
			</p>
		{/each}
	</div>
</div>

<!-- Suggestion modal (bottom sheet) -->
{#if activeSuggestion}
	{@const s = activeSuggestion}
	{@const colors = typeColors[s.type]}
	{@const rewriteArr = rewrites.get(s.id)}
	{@const rIdx = rewriteIndex.get(s.id) ?? 0}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="modal-backdrop"
		role="presentation"
		onclick={handleModalBackdrop}
		onkeydown={() => {}}
	>
		<div class="modal-sheet">
			<!-- Modal header -->
			<div class="modal-header">
				<span class="modal-type-label">
					{colors.emoji} {colors.label}
				</span>
			</div>

			<!-- Suggested text / rewrite -->
			<div class="modal-body">
				{#if rewriteLoading}
					<ThinkingDots />
				{:else if rewriteArr && rewriteArr.length > 0}
					<p class="modal-suggested">{rewriteArr[rIdx]}</p>
					<!-- Rewrite navigation -->
					{#if rewriteArr.length > 1}
						<div class="rewrite-nav">
							<button
								class="rewrite-nav-btn"
								disabled={rIdx === 0}
								onclick={() => prevRewrite(s)}
								aria-label="Previous rewrite"
							>‹</button>
							<span class="rewrite-counter">{rIdx + 1} / {rewriteArr.length}</span>
							<button
								class="rewrite-nav-btn"
								disabled={rIdx === rewriteArr.length - 1}
								onclick={() => nextRewrite(s)}
								aria-label="Next rewrite"
							>›</button>
						</div>
					{/if}
				{:else}
					<p class="modal-suggested">{s.suggested}</p>
				{/if}

				{#if s.reason}
					<p class="modal-reason"><strong>Why:</strong> {s.reason}</p>
				{/if}
			</div>

			<!-- Action row -->
			<div class="modal-actions">
				<!-- Rewrite button (style type only, left-aligned) -->
				{#if s.type === 'style'}
					<button
						class="rewrite-btn"
						onclick={() => fetchRewrites(s)}
						disabled={rewriteLoading}
					>Rewrite</button>
				{:else}
					<span></span>
				{/if}

				<!-- Accept / Reject -->
				<div class="action-btns">
					<button
						class="action-circle reject-btn"
						onclick={() => rejectSuggestion(s)}
						aria-label="Reject"
					>
						<Icon name="close" size={18} />
					</button>
					<button
						class="action-circle accept-btn"
						onclick={() => acceptSuggestion(s)}
						aria-label="Accept"
					>
						<!-- Tick SVG inline -->
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
							<polyline points="20 6 9 17 4 12"></polyline>
						</svg>
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Full-screen drawer overlay */
	.drawer-overlay {
		position: fixed;
		inset: 0;
		z-index: var(--z-drawer);
		background: var(--bg-main);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	/* Desktop constraint */
	@media (min-width: 520px) {
		.drawer-overlay {
			left: 50%;
			right: auto;
			width: var(--app-max-width);
			transform: translateX(-50%);
		}
	}

	/* Fixed header */
	.drawer-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-sm) var(--spacing-md);
		border-bottom: 1px solid var(--color-border);
		flex-shrink: 0;
		min-height: var(--header-height);
		background: var(--bg-main);
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-xs);
		color: var(--color-icon-default);
		background: transparent;
		border: none;
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition: color 0.15s;
	}

	.close-btn:hover {
		color: var(--text-primary);
	}

	.drawer-title {
		font-size: var(--font-size-base);
		font-weight: 600;
		color: var(--text-primary);
	}

	.save-btn {
		padding: var(--spacing-xs) var(--spacing-md);
		background: var(--accent-brand);
		color: #fff;
		border: none;
		border-radius: var(--radius-sm);
		font-size: 0.9375rem;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.15s;
	}

	.save-btn:hover {
		opacity: 0.88;
	}

	/* Filter bar */
	.filter-bar {
		display: flex;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm) var(--spacing-md);
		border-bottom: 1px solid var(--color-border);
		flex-shrink: 0;
		overflow-x: auto;
		background: var(--bg-main);
	}

	.filter-btn {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-xs) var(--spacing-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-full);
		background: var(--bg-surface);
		color: var(--text-primary);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
		transition: background 0.15s, border-color 0.15s;
	}

	.filter-btn.active {
		background: var(--filter-bg);
		border-color: var(--filter-border);
	}

	.filter-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 18px;
		height: 18px;
		padding: 0 4px;
		border-radius: var(--radius-full);
		color: #fff;
		font-size: 0.75rem;
		font-weight: 600;
		line-height: 1;
	}

	/* Scrollable article body */
	.article-body {
		flex: 1;
		overflow-y: auto;
		padding: var(--spacing-md);
		font-size: var(--font-size-base);
		line-height: 1.7;
		color: var(--text-primary);
	}

	.article-para {
		margin: 0 0 var(--spacing-md) 0;
	}

	.article-para:last-child {
		margin-bottom: 0;
	}

	.sentence {
		/* inline so sentences flow naturally */
	}

	.sentence::after {
		content: ' ';
	}

	/* Highlight marks */
	.highlight {
		border-radius: 3px;
		cursor: pointer;
		padding: 1px 0;
		transition: opacity 0.15s;
	}

	.highlight:hover {
		opacity: 0.75;
	}

	.highlight.accepted {
		background: transparent;
		outline: none;
		text-decoration: underline;
		text-decoration-color: var(--color-accept);
		text-decoration-style: solid;
		text-decoration-thickness: 2px;
	}

	/* Modal backdrop */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: calc(var(--z-drawer) + 10);
		background: rgba(0, 0, 0, 0.25);
		display: flex;
		align-items: flex-end;
	}

	/* Desktop constraint */
	@media (min-width: 520px) {
		.modal-backdrop {
			left: 50%;
			right: auto;
			width: var(--app-max-width);
			transform: translateX(-50%);
		}
	}

	/* Bottom sheet */
	.modal-sheet {
		width: 100%;
		background: var(--bg-main);
		border-top-left-radius: var(--radius-lg);
		border-top-right-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		padding: var(--spacing-md);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.modal-header {
		display: flex;
		align-items: center;
	}

	.modal-type-label {
		font-size: var(--font-size-base);
		font-weight: 700;
		color: var(--text-primary);
	}

	.modal-body {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.modal-suggested {
		font-size: var(--font-size-base);
		color: var(--text-primary);
		margin: 0;
		line-height: 1.5;
	}

	.modal-reason {
		font-size: 0.9375rem;
		color: var(--text-secondary);
		margin: 0;
		line-height: 1.5;
	}

	/* Rewrite navigation */
	.rewrite-nav {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.rewrite-nav-btn {
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--bg-surface);
		color: var(--text-primary);
		font-size: 1.125rem;
		cursor: pointer;
		transition: opacity 0.15s;
	}

	.rewrite-nav-btn:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.rewrite-counter {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	/* Action row */
	.modal-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-bottom: var(--spacing-sm);
	}

	.rewrite-btn {
		padding: var(--spacing-xs) var(--spacing-md);
		border: 1px solid var(--accent-brand);
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--accent-brand);
		font-size: 0.9375rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s;
	}

	.rewrite-btn:hover:not(:disabled) {
		background: var(--color-highlight);
	}

	.rewrite-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.action-btns {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.action-circle {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: opacity 0.15s;
		flex-shrink: 0;
	}

	.action-circle:hover {
		opacity: 0.85;
	}

	.reject-btn {
		background: var(--color-reject);
		color: #fff;
	}

	.accept-btn {
		background: var(--color-accept);
		color: #fff;
	}
</style>
