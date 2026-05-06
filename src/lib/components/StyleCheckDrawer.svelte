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

	// Ordered list of navigable (non-dismissed) suggestions, respecting activeFilter
	let navigableSuggestions = $derived(
		suggestions.filter(s => {
			if (dismissed.has(s.id) && !accepted.has(s.id)) return false;
			if (activeFilter !== 'none' && s.type !== activeFilter) return false;
			return true;
		})
	);


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

	// Count pending (not dismissed) suggestions per type
	function blockCount(type) {
		return suggestions.filter(s => !dismissed.has(s.id) && s.type === type).length;
	}

	// Build annotated segments for a sentence
	// Returns array of { text, suggestion | null }
	// Finds ALL matches in the sentence, not just the first one
	function annotate(sentence) {
		const normSentence = normalise(sentence);
		const active = visibleSuggestions(activeFilter);

		// Find all matches in this sentence with their positions
		const matches = [];
		for (const s of active) {
			const normOriginal = normalise(s.original);
			let searchPos = 0;
			while (true) {
				const idx = normSentence.indexOf(normOriginal, searchPos);
				if (idx === -1) break;
				matches.push({
					suggestion: s,
					start: idx,
					end: idx + normOriginal.length,
					text: normOriginal
				});
				searchPos = idx + 1; // Move past this match to find overlapping ones
			}
		}

		// Return empty array if no matches
		if (matches.length === 0) {
			return [{ text: normSentence, suggestion: null }];
		}

		// Sort matches by start position
		matches.sort((a, b) => a.start - b.start);

		// Build segments by walking through the sentence
		const segments = [];
		let pos = 0;
		for (const match of matches) {
			// Add text before this match
			if (match.start > pos) {
				segments.push({ text: normSentence.slice(pos, match.start), suggestion: null });
			}
			// Add the matched text (with replacement if accepted)
			const displayText = accepted.has(match.suggestion.id) ? accepted.get(match.suggestion.id) : match.text;
			segments.push({ text: displayText, suggestion: match.suggestion });
			pos = match.end;
		}

		// Add remaining text after last match
		if (pos < normSentence.length) {
			segments.push({ text: normSentence.slice(pos), suggestion: null });
		}

		return segments;
	}

	// Category filter toggle
	function toggleFilter(type) {
		activeFilter = activeFilter === type ? 'none' : type;
		// Close modal if open when user changes filters
		if (activeSuggestion) {
			activeSuggestion = null;
		}
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

		// Find current suggestion's position in full suggestions array
		const currentPos = suggestions.findIndex(sug => sug.id === s.id);
		
		// Find next navigable suggestion after current position
		for (let i = currentPos + 1; i < suggestions.length; i++) {
			const candidate = suggestions[i];
			if (!newDismissed.has(candidate.id)) {
				if (activeFilter === 'none' || candidate.type === activeFilter) {
					activeSuggestion = candidate;
					return;
				}
			}
		}
		
		// No next suggestion found, close modal
		activeSuggestion = null;
	}

	// Reject a suggestion
	function rejectSuggestion(s) {
		const newDismissed = new Set(dismissed);
		newDismissed.add(s.id);
		dismissed = newDismissed;

		// Find current suggestion's position in full suggestions array
		const currentPos = suggestions.findIndex(sug => sug.id === s.id);
		
		// Find next navigable suggestion after current position
		for (let i = currentPos + 1; i < suggestions.length; i++) {
			const candidate = suggestions[i];
			if (!newDismissed.has(candidate.id)) {
				if (activeFilter === 'none' || candidate.type === activeFilter) {
					activeSuggestion = candidate;
					return;
				}
			}
		}
		
		// No next suggestion found, close modal
		activeSuggestion = null;
	}

	// Revert an accepted suggestion back to pending state
	function revertSuggestion(s) {
		const newAccepted = new Map(accepted);
		newAccepted.delete(s.id);
		accepted = newAccepted;

		const newDismissed = new Set(dismissed);
		newDismissed.delete(s.id);
		dismissed = newDismissed;

		// Keep modal open with suggestion in pending state
		activeSuggestion = s;
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
		<button class="save-btn" onclick={handleSave}>Done</button>
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
									{@const isActive = activeSuggestion?.id === s.id}
									{#if isAccepted(s)}
										<!-- Accepted: green underline -->
										<mark
											class="highlight accepted"
											class:active-highlight={isActive}
											onclick={() => (activeSuggestion = s)}
											role="button"
											tabindex="0"
											onkeydown={(e) => e.key === 'Enter' && (activeSuggestion = s)}
										>{seg.text}</mark>
									{:else}
										<!-- Pending highlight: outline only on active suggestion -->
										<mark
											class="highlight"
											class:active-highlight={isActive}
											style:background={colors.bg}
											style:box-shadow={isActive ? `inset 0 0 0 1px ${colors.border}` : 'none'}
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
	{@const isAcceptedState = isAccepted(s)}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="modal-backdrop"
		role="presentation"
		onclick={handleModalBackdrop}
		onkeydown={() => {}}
	>
		<div class="modal-sheet">
			<!-- Modal header: [close button] -->
			<div class="modal-header">
				<button
					class="modal-close-btn"
					onclick={() => (activeSuggestion = null)}
					aria-label="Close modal"
				>
					<Icon name="close" size={20} />
				</button>
			</div>

			<!-- Two-deck format for accepted suggestions -->
			{#if isAcceptedState}
				<div class="modal-body">
					<div class="two-deck">
						<div class="deck original-deck">
							<p class="deck-label">Original</p>
							<p class="deck-text strikethrough">{s.original}</p>
						</div>
						<div class="deck accepted-deck">
							<p class="deck-label">Accepted</p>
							<p class="deck-text">{accepted.get(s.id)}</p>
						</div>
					</div>
				</div>
			{:else}
				<!-- Suggested text / rewrite for pending suggestions -->
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
			{/if}

			<!-- Action row -->
			<div class="modal-actions">
				<!-- Revert button (only for accepted, left-aligned) or Rewrite button (style type only) -->
				{#if isAcceptedState}
					<button
						class="revert-btn"
						onclick={() => revertSuggestion(s)}
						aria-label="Revert this change"
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M3 7v6h6"></path>
							<path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"></path>
						</svg>
						Revert
					</button>
				{:else if s.type === 'style'}
					<button
						class="rewrite-btn"
						onclick={() => fetchRewrites(s)}
						disabled={rewriteLoading}
					>Rewrite</button>
				{:else}
					<span></span>
				{/if}
	
				<!-- Change / Ignore (disabled when accepted) -->
				<div class="action-btns">
					<button
						class="action-btn ignore-btn"
						onclick={() => rejectSuggestion(s)}
						disabled={isAcceptedState}
						aria-label="Ignore this suggestion"
					>Ignore</button>
					<button
						class="action-btn change-btn"
						onclick={() => acceptSuggestion(s)}
						disabled={isAcceptedState}
						aria-label="Change and accept"
					>
						Change
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
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
		padding: var(--spacing-lg) var(--spacing-md) var(--spacing-sm) var(--spacing-md);
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
		padding: 1px var(--spacing-xs);
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


	/* Modal backdrop — no overlay so article text stays readable */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: calc(var(--z-drawer) + 10);
		background: transparent;
		display: flex;
		align-items: flex-end;
		pointer-events: none;
	}

	.modal-backdrop > .modal-sheet {
		pointer-events: all;
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
		box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1), var(--shadow-lg);
		padding: var(--spacing-md);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	/* Close button in modal header */
	.modal-close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-xs);
		color: var(--text-primary);
		background: transparent;
		border: none;
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition: background 0.15s;
	}

	.modal-close-btn:hover {
		background: var(--bg-surface);
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

	/* Two-deck format for accepted suggestions */
	.two-deck {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.deck {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.deck-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-secondary);
		margin: 0;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.deck-text {
		font-size: var(--font-size-base);
		color: var(--text-primary);
		margin: 0;
		line-height: 1.5;
		padding: var(--spacing-sm);
		background: var(--bg-surface);
		border-radius: var(--radius-sm);
		max-height: 120px;
		overflow-y: auto;
	}

	.original-deck .deck-text {
		color: var(--text-secondary);
	}

	.deck-text.strikethrough {
		text-decoration: line-through;
		text-decoration-color: var(--text-secondary);
	}

	/* Action row */
	.modal-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-bottom: var(--spacing-sm);
	}

	.revert-btn {
		padding: var(--spacing-xs) var(--spacing-md);
		border: 1px solid #dc2626;
		border-radius: var(--radius-sm);
		background: transparent;
		color: #dc2626;
		font-size: 0.9375rem;
		font-weight: 500;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 6px;
		transition: background 0.15s;
	}

	.revert-btn:hover {
		background: rgba(220, 38, 38, 0.1);
	}

	.revert-btn svg {
		width: 16px;
		height: 16px;
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

	.action-btn {
		padding: var(--spacing-xs) var(--spacing-sm);
		border: 1px solid currentColor;
		border-radius: var(--radius-sm);
		background: transparent;
		font-size: 0.9375rem;
		font-weight: 500;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 6px;
		transition: background 0.15s;
		line-height: 1.4;
	}

	.action-btn:hover:not(:disabled) {
		opacity: 0.85;
	}

	.action-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.ignore-btn {
		color: var(--color-reject);
	}

	.change-btn {
		color: var(--color-accept);
		gap: 6px;
	}

	.change-btn svg {
		width: 16px;
		height: 16px;
	}
</style>
